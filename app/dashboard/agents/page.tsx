import { Rocket, Sparkles, Shield, TrendingUp } from 'lucide-react';

const agents = [
  {
    name: 'Judge AI',
    role: 'Lead Startup Auditor',
    description: 'The primary AI mentor that stress-tests your startup ideas with tough questions, identifies weaknesses, and provides actionable feedback.',
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
    status: 'Coming Soon',
  },
  {
    name: 'Tech Architect',
    role: 'Technical Feasibility Expert',
    description: 'Scrutinizes your technical approach, identifies engineering risks, and evaluates build vs buy decisions.',
    icon: Sparkles,
    color: 'purple',
    status: 'Coming Soon',
  },
  {
    name: 'Market Scout',
    role: 'Competitive Intelligence',
    description: 'Analyzes competitive landscape, identifies market gaps, and validates your go-to-market strategy.',
    icon: Rocket,
    color: 'amber',
    status: 'Coming Soon',
  },
];

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-100' },
};

export default function AgentsPage() {
  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-[#1E293B]">Mentor Agents</h1>
        <p className="text-[14px] text-[#64748B] mt-1">Specialized AI agents that evaluate different aspects of your startup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const colors = colorMap[agent.color];
          const isActive = agent.status === 'Active';
          return (
            <div key={agent.name} className={`glass-card rounded-2xl p-6 flex flex-col transition-all duration-250 card-glow ${!isActive ? 'opacity-75' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isActive
                    ? 'bg-green-50 text-green-600 border border-green-100'
                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                }`}>
                  {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 pulse-dot align-middle" />}
                  {agent.status}
                </span>
              </div>
              <h3 className="text-[17px] font-semibold text-[#1E293B] mb-0.5">{agent.name}</h3>
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">{agent.role}</p>
              <p className="text-[13px] text-[#64748B] leading-relaxed flex-1">{agent.description}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
