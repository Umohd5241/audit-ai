'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Sparkles, Shield, TrendingUp, X } from 'lucide-react';

const agents = [
  {
    name: 'THE EQUALS',
    role: 'Lead Startup Auditor',
    description: 'The primary AI auditor that stress-tests your startup ideas with tough questions, identifies weaknesses, and provides actionable feedback.',
    icon: Shield,
    color: 'indigo',
    status: 'Active',
  },
  {
    name: 'Investor Lens',
    role: 'VC Perspective Analyst',
    description: 'Evaluates your idea from a venture capitalist\'s perspective — market size, unit economics, and scalability potential.',
    icon: TrendingUp,
    color: 'emerald',
    status: 'Active',
  },
  {
    name: 'Tech Architect',
    role: 'Technical Feasibility Expert',
    description: 'Scrutinizes your technical approach, identifies engineering risks, and evaluates build vs buy decisions.',
    icon: Sparkles,
    color: 'purple',
    status: 'Active',
  },
  {
    name: 'Market Scout',
    role: 'Competitive Intelligence',
    description: 'Analyzes competitive landscape, identifies market gaps, and validates your go-to-market strategy.',
    icon: Rocket,
    color: 'amber',
    status: 'Active',
  },
];

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-100' },
};

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [ideaName, setIdeaName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const router = useRouter();

  const handleLaunchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    setLoading(true);
    setLaunchError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaName, description, agentId: selectedAgent }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedAgent(null);
      router.refresh();
      router.push(`/dashboard/room/${data.roomId}`);
    } catch {
      setLaunchError('Could not start the session. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-[#1E293B]">Audit Agents</h1>
        <p className="text-[14px] text-[#64748B] mt-1">Select an agent to launch a deeply specialized due diligence audit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const colors = colorMap[agent.color];
          
          return (
            <button key={agent.name} onClick={() => setSelectedAgent(agent.name)} className="text-left glass-card rounded-2xl p-6 flex flex-col transition-all duration-300 card-glow hover:-translate-y-1 hover:shadow-lg focus:outline-none">
              <div className="flex items-start justify-between mb-4 w-full">
                <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 shadow-sm flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 pulse-dot align-middle" />
                  {agent.status}
                </span>
              </div>
              <h3 className="text-[17px] font-semibold text-[#1E293B] mb-0.5">{agent.name}</h3>
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">{agent.role}</p>
              <p className="text-[13px] text-[#64748B] leading-relaxed flex-1 w-full pr-4">{agent.description}</p>
            </button>
          );
        })}
      </div>

      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <h2 className="text-[18px] font-bold text-[#1E293B]">Start Audit — <span className="text-indigo-600">{selectedAgent}</span></h2>
                <p className="text-[12px] font-medium text-[#64748B] mt-0.5">Tell the agent about your startup idea.</p>
              </div>
              <button disabled={loading} onClick={() => setSelectedAgent(null)} className="text-[#94A3B8] hover:text-[#1E293B] transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLaunchSession} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#1E293B] mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={ideaName}
                  onChange={(e) => setIdeaName(e.target.value)}
                  className="w-full bg-[#FAFBFC] border border-[rgba(0,0,0,0.06)] shadow-inner rounded-xl px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition placeholder:text-[#94A3B8]"
                  placeholder="The next big thing..."
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#1E293B] mb-1.5">Thesis / Assumptions</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#FAFBFC] border border-[rgba(0,0,0,0.06)] shadow-inner rounded-xl px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition h-28 resize-none placeholder:text-[#94A3B8]"
                  placeholder={`Describe your startup context so the ${selectedAgent} can begin the stress-test...`}
                  required
                />
              </div>
              {launchError && (
                <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{launchError}</p>
              )}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 rounded-xl text-[14px] font-bold transition disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2"
                >
                  {loading ? 'Starting session…' : 'Start Audit →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
