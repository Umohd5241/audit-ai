'use client';

import { ShieldAlert, Target, TrendingUp, Search, Swords, FileText } from 'lucide-react';

const AUDIT_PHASES = [
  { id: 'init', label: 'Protocol Initialization', icon: Target, minMessages: 0 },
  { id: 'problem', label: 'Problem Identification', icon: Search, minMessages: 3 },
  { id: 'market', label: 'Market Assessment', icon: TrendingUp, minMessages: 6 },
  { id: 'competitive', label: 'Competitive Advantage', icon: Swords, minMessages: 10 },
  { id: 'stress', label: 'Stress Testing', icon: ShieldAlert, minMessages: 15 },
  { id: 'synthesis', label: 'DD Synthesis', icon: FileText, minMessages: 20 },
];

function getActivePhase(messageCount: number): number {
  let activeIdx = 0;
  for (let i = 0; i < AUDIT_PHASES.length; i++) {
    if (messageCount >= AUDIT_PHASES[i].minMessages) {
      activeIdx = i;
    }
  }
  return activeIdx;
}

export default function MentorSidebar({ ideaName, messageCount = 0 }: { ideaName: string; messageCount: number }) {
  const activePhaseIdx = getActivePhase(messageCount);

  return (
    <div className="flex flex-col h-full">
      {/* Mentor Profile */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-[0_4px_16px_rgba(245,158,11,0.2)]">
          <span className="text-[28px] font-black text-white">JA</span>
        </div>
        <h3 className="text-[16px] font-bold text-[#1E293B]">Judge AI</h3>
        <p className="text-[12px] font-semibold text-amber-600 tracking-wider uppercase mt-1">Startup Audit Panel</p>
      </div>

      {/* Phase Tracker */}
      <div className="flex-1 space-y-1">
        {AUDIT_PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isActive = idx === activePhaseIdx;
          const isCompleted = idx < activePhaseIdx;
          const isFuture = idx > activePhaseIdx;

          return (
            <div
              key={phase.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-amber-50 border border-amber-200 shadow-sm'
                  : isCompleted
                  ? 'bg-green-50/60'
                  : 'opacity-50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                isActive ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse' :
                isCompleted ? 'bg-green-500' : 'bg-[#CBD5E1]'
              }`} />
              <Icon className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-amber-600' :
                isCompleted ? 'text-green-600' : 'text-[#94A3B8]'
              }`} />
              <span className={`text-[12px] font-semibold uppercase tracking-wide ${
                isActive ? 'text-amber-800' :
                isCompleted ? 'text-green-700' : 'text-[#94A3B8]'
              }`}>
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Room Info */}
      <div className="mt-6 pt-4 border-t border-[rgba(0,0,0,0.06)]">
        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold mb-1">Evaluating</p>
        <p className="text-[13px] font-semibold text-[#1E293B] line-clamp-2">{ideaName}</p>
      </div>
    </div>
  );
}
