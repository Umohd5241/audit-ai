/**
 * Shared 3-layer decision parser.
 * Used identically on both client (RoomChat.tsx) and server (chat/route.ts)
 * so verdicts are always consistent.
 *
 * Layer 1 — strict regex: "DECISION: PROCEED/PIVOT/REJECT"
 * Layer 2 — semantic keyword scan (negatives first to avoid false positives)
 * Layer 3 — fallback → "UNKNOWN"
 */
export function parseDecision(text: string): string {
  if (!text || typeof text !== 'string') return 'UNKNOWN';

  // Layer 1 — strict format
  const strict = text.match(/DECISION:\s*(PROCEED|PIVOT|REJECT)/i);
  if (strict) return strict[1].toUpperCase();

  // Layer 2 — semantic (negatives checked FIRST to avoid "proceed" inside "not viable")
  const low = text.toLowerCase();
  if (
    low.includes('not viable') ||
    low.includes('should not be pursued') ||
    low.includes('do not proceed') ||
    low.includes('fundamentally flawed')
  ) return 'REJECT';

  if (
    low.includes('needs changes') ||
    low.includes('pivot') ||
    low.includes('rethink') ||
    low.includes('reconsider')
  ) return 'PIVOT';

  if (
    low.includes('viable') ||
    low.includes('ready to proceed') ||
    low.includes('strong foundation') ||
    low.includes('proceed')
  ) return 'PROCEED';

  // Layer 3 — unknown
  return 'UNKNOWN';
}

/** Strip Markdown code fences from AI JSON responses. */
export function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}
