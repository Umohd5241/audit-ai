'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, FileText, CheckCircle2, AlertTriangle, Presentation, TrendingUp, ShieldAlert, BarChart3, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { REPORT_INSTRUCTION } from '@/lib/ai-config';

export default function ReportEngine({ roomId }: { roomId: string }) {
  const [report, setReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/report`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const messagesRes = await fetch(`/api/rooms/${roomId}/messages`);
      const messagesData = await messagesRes.json();
      
      if (!messagesData.success || messagesData.messages.length < 3) {
          throw new Error('You need at least 3 messages in the session before generating a report.');
      }

      const chatContent = messagesData.messages.map((m: any) => `${m.sender.toUpperCase()}: ${m.content}`).join('\n\n');

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Report generation is unavailable. Please contact support.');

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: `Generate due diligence for this Audit Session:\n\n${chatContent}` }] }],
        config: {
            systemInstruction: REPORT_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.1
        }
      });

      const aiText = response.text;
      if (!aiText) throw new Error('Failed to generate report: empty response.');

      // Strip markdown fences the model may wrap around JSON
      const cleaned = aiText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      let reportJson: any;
      try {
        reportJson = JSON.parse(cleaned);
      } catch {
        throw new Error('Report generation failed. Please try again.');
      }

      const saveRes = await fetch(`/api/rooms/${roomId}/report`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportJson })
      });
      
      if (!saveRes.ok) throw new Error('Report was generated but could not be saved. Please try again.');

      setReport(reportJson);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#94A3B8] mb-4">Audit Report</h3>

      {!report ? (
        <div className="text-center py-6">
          <ShieldAlert className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[12px] text-[#94A3B8] leading-relaxed mb-4">
            Chat with the AI panel first, then click below to generate your report.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-4">
          {/* Score */}
          <div className="text-center p-4 bg-[#F8FAFC] rounded-xl border border-[rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">Score</p>
            <span className={`text-[32px] font-black tracking-tight ${
              report.score >= 7 ? 'text-green-500' : report.score >= 4 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {report.score}
            </span>
            <span className="text-[14px] font-bold text-[#CBD5E1]">/10</span>
            <div className="mt-2 h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                report.score >= 7 ? 'bg-green-500' : report.score >= 4 ? 'bg-amber-500' : 'bg-red-500'
              }`} style={{ width: `${report.score * 10}%` }} />
            </div>
          </div>

          {/* Decision */}
          {report.decision && (
            <div className={`p-3 rounded-xl border text-center ${
              report.decision === 'PROCEED' ? 'bg-green-50 border-green-100 text-green-700' :
              report.decision === 'PIVOT' ? 'bg-amber-50 border-amber-100 text-amber-700' :
              'bg-red-50 border-red-100 text-red-700'
            }`}>
              <p className="text-[11px] font-bold uppercase tracking-widest">{report.decision}</p>
            </div>
          )}

          {/* Summary */}
          {report.summary && (
            <p className="text-[12px] text-[#475569] leading-relaxed border-l-2 border-indigo-300 pl-3">
              {report.summary}
            </p>
          )}

          {/* Score Matrix */}
          {(report.scoreMatrix || report.scoreBreakdown) && (
            <div className="space-y-2">
              {Object.entries(report.scoreMatrix || report.scoreBreakdown).map(([key, val]: [string, any]) => (
                <div key={key}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-[#64748B] font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold text-[#1E293B]">{val}/10</span>
                  </div>
                  <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(val as number) * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] p-3 rounded-lg mb-3 text-center">
          {error}
        </div>
      )}
      
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-semibold text-[12px] uppercase tracking-wider transition shadow-[0_4px_12px_rgba(99,102,241,0.15)] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5" />}
        {report ? 'Regenerate Report' : 'Generate Report'}
      </button>
    </div>
  );
}
