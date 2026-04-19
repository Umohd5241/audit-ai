import { Activity, Zap, Server } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIInsightsProps {
  latency?:   number | null;
  tokens?:    number | null;
  requests?:  number | null;
  errorRate?: number | null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Returns "N/A" when value is null/undefined/NaN — never renders a fake number */
function fmt(value: number | null | undefined, unit?: string): string {
  if (value == null || !isFinite(value)) return 'N/A';
  const formatted = unit === 'k' ? (value > 1000 ? `~${(value / 1000).toFixed(1)}k` : String(value)) : String(value);
  return formatted;
}

function fmtPercent(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return 'N/A';
  return `${value.toFixed(2)}%`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIInsights({
  latency   = null,
  tokens    = null,
  requests  = null,
  errorRate = null,
}: AIInsightsProps) {
  return (
    <div className="glass-card rounded-2xl p-6 card-glow mb-6 overflow-hidden relative">
      {/* Background accents */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Activity className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#1E293B]">AI Performance Tracking</h2>
          <p className="text-[10px] text-[#94A3B8] italic mt-0.5">
            Latency is real-time measured · Tokens are estimated from response length
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">

        {/* Latency — real measurement */}
        <div className="bg-[#F8FAFC] border border-[rgba(0,0,0,0.06)] rounded-xl p-4 flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 shrink-0">
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Latency</p>
            <p className="text-[18px] font-bold text-[#1E293B]">
              {fmt(latency)}
              {latency != null && <span className="text-[12px] font-medium text-[#64748B] ml-1">ms</span>}
            </p>
            <p className="text-[9px] text-[#94A3B8] italic mt-1">Measured via performance.now()</p>
          </div>
        </div>

        {/* Estimated Token Usage */}
        <div className="bg-[#F8FAFC] border border-[rgba(0,0,0,0.06)] rounded-xl p-4 flex items-start gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 shrink-0">
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
              Estimated Token Usage
            </p>
            <p className="text-[18px] font-bold text-[#1E293B]">{fmt(tokens, 'k')}</p>
            <p className="text-[9px] text-[#94A3B8] italic mt-1">Approx. based on response length</p>
          </div>
        </div>

        {/* Requests */}
        <div className="bg-[#F8FAFC] border border-[rgba(0,0,0,0.06)] rounded-xl p-4 flex items-start gap-3">
          <div className="rounded-lg bg-amber-50 p-2 shrink-0">
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Audit Requests</p>
            <p className="text-[18px] font-bold text-[#1E293B]">{fmt(requests)}</p>
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-[#F8FAFC] border border-[rgba(0,0,0,0.06)] rounded-xl p-4 flex items-start gap-3">
          <div className="rounded-lg bg-pink-50 p-2 shrink-0">
            <Activity className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Error Rate</p>
            <p className="text-[18px] font-bold text-[#1E293B]">{fmtPercent(errorRate)}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
