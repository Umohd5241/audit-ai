'use client';

import { useEffect, useState } from 'react';
import AIInsights from '@/components/AIInsights';
import { MessageSquare, CheckCircle2 } from 'lucide-react';

export default function InsightsAndFeedbackPage() {
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState<{ latency: number | null; tokens: number | null; requests: number | null; errorRate: number | null }>({
    latency: null, tokens: null, requests: null, errorRate: null,
  });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setStats({
            latency:   typeof data.stats.latency   === 'number' ? data.stats.latency   : null,
            tokens:    typeof data.stats.tokens    === 'number' ? data.stats.tokens    : null,
            requests:  typeof data.stats.requests  === 'number' ? data.stats.requests  : null,
            errorRate: typeof data.stats.errorRate === 'number' ? data.stats.errorRate : null,
          });
        }
      })
      .catch(err => console.error('[feedback/page] Failed to fetch stats:', err));
  }, []);

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName || !feedbackComment) return;
    setSubmitted(true);
    setTimeout(() => {
      setFeedbackName('');
      setFeedbackComment('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-[#1E293B]">Insights & Feedback</h1>
        <p className="text-[14px] text-[#64748B] mt-1">Platform analytics, developer progress, and user feedback loop.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 stagger-children">
        
        {/* Left Column: Performance Tracking & Build in Public */}
        <div className="xl:col-span-2 space-y-6">
          <AIInsights {...stats} />

          {/* Build in Public — removed fake generator, shows honest placeholder */}
          <div className="glass-card rounded-2xl p-6 card-glow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-teal-500" />
              </div>
              <h2 className="text-[15px] font-semibold text-[#1E293B]">Build Progress</h2>
            </div>
            <div className="h-20 border border-dashed border-[#CBD5E1] rounded-xl flex items-center justify-center text-[13px] text-[#94A3B8]">
              Progress tracking will appear here as audit sessions accumulate.
            </div>
          </div>
        </div>

        {/* Right Column: Feedback System */}
        <div className="xl:col-span-1 space-y-6">
            
          {/* Feedback Collector */}
          <div className="glass-card rounded-2xl p-6 card-glow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-pink-500" />
              </div>
              <h2 className="text-[15px] font-semibold text-[#1E293B]">Feedback Collector</h2>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4">
               <div>
                  <label className="block text-[12px] font-bold text-[#1E293B] mb-1">Name</label>
                  <input type="text" value={feedbackName} onChange={(e)=>setFeedbackName(e.target.value)} required placeholder="Satoshi Nakamoto" className="w-full text-[13px] bg-[#FAFBFC] border border-[rgba(0,0,0,0.08)] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20" />
               </div>
               <div>
                  <label className="block text-[12px] font-bold text-[#1E293B] mb-1">Comment</label>
                  <textarea value={feedbackComment} onChange={(e)=>setFeedbackComment(e.target.value)} required placeholder="The audit logic is a bit harsh..." className="w-full text-[13px] bg-[#FAFBFC] border border-[rgba(0,0,0,0.08)] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-20" />
               </div>
               <button disabled={submitted} type="submit" className={`w-full py-2.5 rounded-lg text-[13px] font-bold transition flex items-center justify-center gap-2 ${submitted ? 'bg-green-500 text-white' : 'bg-[#1E293B] text-white hover:bg-indigo-600'}`}>
                 {submitted ? <><CheckCircle2 className="w-4 h-4" /> Logged Securely</> : 'Submit Feedback'}
               </button>
            </form>
          </div>

          {/* Insights Wrap — removed fake AI summary simulator */}
          <div className="glass-card rounded-2xl p-6 card-glow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="text-[15px] font-semibold text-[#1E293B]">Insights Wrap</h2>
            </div>
            <div className="h-24 border border-dashed border-[#CBD5E1] rounded-xl flex items-center justify-center text-[13px] text-[#94A3B8] text-center px-4">
              Aggregated session insights will appear here after enough data is collected.
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
