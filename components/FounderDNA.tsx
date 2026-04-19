'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Eye, Shield, Heart, TrendingUp, AlertCircle, MessageSquare, Clock, Zap } from 'lucide-react';

interface AnalyticsData {
  clarity: number;
  resilience: number;
  coachability: number;
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  avgUserLength: number;
  longestStreak: number;
  topicsDiscussed: string[];
  sessionDuration: string;
  engagementLevel: string;
}

function ProgressBar({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-[12px] font-semibold text-[#475569] uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-[12px] font-bold text-[#1E293B]">{value}%</span>
      </div>
      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            color.includes('green') ? 'bg-green-500' :
            color.includes('red') ? 'bg-red-500' :
            color.includes('blue') ? 'bg-blue-500' :
            color.includes('amber') ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function analyzeMessages(messages: any[]): AnalyticsData {
  const userMsgs = messages.filter(m => m.sender === 'user');
  const aiMsgs = messages.filter(m => m.sender === 'ai');

  // Calculate clarity: based on avg message length and detail (longer = more detailed = clearer)
  const avgUserLen = userMsgs.length > 0
    ? userMsgs.reduce((sum, m) => sum + (m.content?.length || 0), 0) / userMsgs.length
    : 0;
  // 0-50 chars = low clarity, 50-200 = medium, 200+ = high
  const clarity = Math.min(100, Math.round(Math.min(avgUserLen / 2.5, 100)));

  // Calculate resilience: based on how many follow-ups after AI challenges
  // If user keeps responding after AI messages, they're resilient
  let consecutiveUserAfterAi = 0;
  let maxStreak = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender === 'user' && messages[i - 1].sender === 'ai') {
      consecutiveUserAfterAi++;
      maxStreak = Math.max(maxStreak, consecutiveUserAfterAi);
    } else if (messages[i].sender === 'ai') {
      consecutiveUserAfterAi = 0;
    }
  }
  const resilience = Math.min(100, Math.round((maxStreak / Math.max(aiMsgs.length, 1)) * 100));

  // Coachability: ratio of user responses to AI prompts — higher means more willing to engage
  const responseRate = aiMsgs.length > 0 ? userMsgs.length / aiMsgs.length : 0;
  const coachability = Math.min(100, Math.round(Math.min(responseRate, 1.5) * 67));

  // Extract topics from messages (look for key business terms)
  const allText = messages.map(m => m.content || '').join(' ').toLowerCase();
  const topicKeywords: Record<string, string> = {
    'market': 'Market Analysis',
    'revenue': 'Revenue Model',
    'team': 'Team Strength',
    'competition': 'Competition',
    'technical': 'Technical Stack',
    'customer': 'Customer Focus',
    'scale': 'Scalability',
    'funding': 'Funding Strategy',
    'risk': 'Risk Assessment',
    'growth': 'Growth Plan',
    'product': 'Product Vision',
    'user': 'User Research',
  };
  const topicsDiscussed = Object.entries(topicKeywords)
    .filter(([keyword]) => allText.includes(keyword))
    .map(([, topic]) => topic)
    .slice(0, 5);

  // Session duration from timestamps
  let sessionDuration = '0m';
  if (messages.length >= 2) {
    const first = new Date(messages[0].timestamp).getTime();
    const last = new Date(messages[messages.length - 1].timestamp).getTime();
    const mins = Math.round((last - first) / 60000);
    sessionDuration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }

  // Engagement level based on message frequency and depth
  const totalScore = (clarity + resilience + coachability) / 3;
  const engagementLevel = totalScore >= 70 ? 'High' : totalScore >= 40 ? 'Medium' : 'Low';

  return {
    clarity,
    resilience,
    coachability,
    totalMessages: messages.length,
    userMessages: userMsgs.length,
    aiMessages: aiMsgs.length,
    avgUserLength: Math.round(avgUserLen),
    longestStreak: maxStreak,
    topicsDiscussed,
    sessionDuration,
    engagementLevel,
  };
}

export default function FounderDNA({ roomId, messageCount = 0 }: { roomId: string; messageCount: number }) {
  const [report, setReport] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [reportRes, messagesRes] = await Promise.all([
        fetch(`/api/rooms/${roomId}/report`),
        fetch(`/api/rooms/${roomId}/messages`)
      ]);
      const [reportData, messagesData] = await Promise.all([
        reportRes.json(),
        messagesRes.json()
      ]);

      if (reportData.success && reportData.report) {
        setReport(reportData.report);
      }
      if (messagesData.success && messagesData.messages?.length > 0) {
        setAnalytics(analyzeMessages(messagesData.messages));
      }
    } catch (err) { /* silent */ }
  }, [roomId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const metrics = analytics || {
    clarity: 0, resilience: 0, coachability: 0,
    totalMessages: 0, userMessages: 0, aiMessages: 0,
    avgUserLength: 0, longestStreak: 0, topicsDiscussed: [],
    sessionDuration: '0m', engagementLevel: 'Waiting',
  };

  const overallScore = analytics
    ? Math.round((metrics.clarity + metrics.resilience + metrics.coachability) / 3)
    : 0;

  const phaseProgress = Math.min(100, Math.round((metrics.totalMessages / 20) * 100));

  return (
    <div className="flex flex-col">
      {/* Session Stats */}
      <div className="mb-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Session Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] font-semibold">Messages</span>
            </div>
            <span className="text-[18px] font-black text-[#1E293B]">{metrics.totalMessages}</span>
          </div>
          <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-green-400" />
              <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] font-semibold">Duration</span>
            </div>
            <span className="text-[18px] font-black text-[#1E293B]">{metrics.sessionDuration}</span>
          </div>
          <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] font-semibold">Avg Length</span>
            </div>
            <span className="text-[18px] font-black text-[#1E293B]">{metrics.avgUserLength}<span className="text-[10px] text-[#94A3B8] font-medium ml-0.5">ch</span></span>
          </div>
          <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-red-400" />
              <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] font-semibold">Engagement</span>
            </div>
            <span className={`text-[14px] font-black ${
              metrics.engagementLevel === 'High' ? 'text-green-600' :
              metrics.engagementLevel === 'Medium' ? 'text-amber-600' :
              metrics.engagementLevel === 'Low' ? 'text-red-600' : 'text-[#CBD5E1]'
            }`}>{metrics.engagementLevel}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(0,0,0,0.06)] mb-5" />

      {/* Founder DNA Metrics */}
      <div className="mb-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-4">Founder DNA</h3>
        <ProgressBar label="Clarity" value={metrics.clarity} color="text-green-500" icon={Eye} />
        <ProgressBar label="Resilience" value={metrics.resilience} color="text-amber-500" icon={Shield} />
        <ProgressBar label="Coachability" value={metrics.coachability} color="text-blue-500" icon={Heart} />
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(0,0,0,0.06)] mb-5" />

      {/* Overall Score */}
      <div className="mb-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Overall Score</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-[36px] font-black text-[#1E293B] tracking-tight leading-none">{overallScore}</span>
          <span className="text-[14px] font-bold text-[#94A3B8]">%</span>
        </div>
        <div className="mt-2 h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              overallScore >= 70 ? 'bg-green-500' : overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(0,0,0,0.06)] mb-5" />

      {/* Phase Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Phase Progress</h3>
          <span className="text-[12px] font-bold text-[#1E293B]">{phaseProgress}%</span>
        </div>
        <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
            style={{ width: `${phaseProgress}%` }}
          />
        </div>
      </div>

      {/* Topics Covered */}
      {metrics.topicsDiscussed.length > 0 && (
        <>
          <div className="h-px bg-[rgba(0,0,0,0.06)] mb-5" />
          <div className="mb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Topics Covered</h3>
            <div className="flex flex-wrap gap-1.5">
              {metrics.topicsDiscussed.map((topic, i) => (
                <span key={i} className="text-[10px] font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Live Assessment */}
      <div className="h-px bg-[rgba(0,0,0,0.06)] mb-5" />
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Live Assessment</h3>
        {report ? (
          <div className="space-y-3">
            {report.decision && (
              <div className={`flex items-center gap-2 text-[13px] font-semibold ${
                report.decision === 'PROCEED' ? 'text-green-600' :
                report.decision === 'PIVOT' ? 'text-amber-600' : 'text-red-600'
              }`}>
                <TrendingUp className="w-4 h-4" />
                Decision: {report.decision}
              </div>
            )}
            {report.summary && (
              <p className="text-[11px] text-[#64748B] leading-relaxed">{report.summary}</p>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2 text-[11px] text-[#94A3B8] italic">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{metrics.totalMessages > 0 ? 'Building your assessment…' : 'Type a message to start your session.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
