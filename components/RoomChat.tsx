'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import { RefreshCw, Send, ShieldAlert, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getGroqClient, GROQ_MODEL } from '@/lib/ai-client';
import { parseDecision } from '@/lib/decision-parser';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReflectionResult = {
  completed: boolean;
  missing: string;
  confidence: number;
};

type DecisionState = {
  verb: string;   // PROCEED | PIVOT | REJECT | UNKNOWN
  color: string;  // Tailwind colour prefix
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// parseDecision is imported from @/lib/decision-parser (shared with server)

function decisionColor(verb: string): string {
  switch (verb) {
    case 'PROCEED': return 'emerald';
    case 'PIVOT':   return 'amber';
    case 'REJECT':  return 'rose';
    default:        return 'slate';
  }
}

/**
 * Check response completeness.
 * Returns count of missing critical sections.
 */
const REQUIRED_SECTIONS = [
  'DECISION:',
  'Executive Verdict:',
  'Why This May Fail:',
  'Key Risks to Address:',
  'What Needs to Change:',
];

function getMissingSections(text: string): string[] {
  if (!text) return REQUIRED_SECTIONS;
  return REQUIRED_SECTIONS.filter(s => !text.includes(s));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomChat({ roomId }: { roomId: string }) {
  const [messages, setMessages]       = useState<any[]>([]);
  const [room, setRoom]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [inputValue, setInputValue]   = useState('');
  const [sending, setSending]         = useState(false);
  const [reflectionLog, setReflectionLog] = useState<ReflectionResult | null>(null);
  const [reflecting, setReflecting]   = useState(false);
  const [decision, setDecision]       = useState<DecisionState | null>(null);
  const [latency, setLatency]         = useState<number | null>(null);
  const [tokens, setTokens]           = useState<number | null>(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [reseting, setReseting]       = useState(false);
  const [incompleteWarning, setIncompleteWarning] = useState(false);

  // Used to prevent stale reflection results overwriting a newer message
  const activeMessageIdRef = useRef<string | null>(null);
  const messagesEndRef      = useRef<HTMLDivElement>(null);

  // ── Data Fetching ────────────────────────────────────────────────────────

  const fetchMessagesAndRoom = useCallback(async () => {
    try {
      const [messagesRes, roomRes] = await Promise.all([
        fetch(`/api/rooms/${roomId}/messages`),
        fetch(`/api/rooms/${roomId}`),
      ]);

      const [messagesData, roomData] = await Promise.all([
        messagesRes.json(),
        roomRes.json(),
      ]);

      if (messagesData?.success) setMessages(messagesData.messages ?? []);
      if (roomData?.success)     setRoom(roomData.room ?? null);
    } catch (err) {
      console.error('[RoomChat] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessagesAndRoom();
    const interval = setInterval(fetchMessagesAndRoom, 10_000);
    return () => clearInterval(interval);
  }, [fetchMessagesAndRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // ── Send Logic ──────────────────────────────────────────────────────────

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sending || !room) return;

    const textToSubmit = inputValue.trim();
    setInputValue('');
    setSending(true);
    setErrorMsg('');
    setReflectionLog(null);
    setIncompleteWarning(false);

    // Optimistic user message
    const optimisticId = `temp-user-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: optimisticId, sender: 'user', content: textToSubmit, timestamp: new Date().toISOString() },
    ]);

    try {
      // Build lean history (last 8 only)
      const chatHistory = messages.slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content ?? '' }],
      }));

      const res = await fetch(`/api/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSubmit,
          chatHistory,
          agentId: room.agentId ?? 'THE EQUALS',
          roomContext: {
            ideaName:    room.ideaName    ?? '',
            description: room.description ?? '',
          },
        }),
      });

      // Always attempt to parse JSON — even on non-2xx
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Response body was not valid JSON
      }

      if (!res.ok || !data.success) {
        const fallbackMsg =
          data?.aiResponse ||
          'The audit could not be completed due to processing constraints. Please retry.';
        throw new Error(fallbackMsg);
      }

      const fullText: string = data.aiResponse ?? '';
      const msgId: string    = data.aiMsgId    ?? `temp-ai-${Date.now()}`;

      // Metrics
      setLatency(typeof data.latency === 'number' ? data.latency : null);
      setTokens(typeof data.tokens  === 'number' ? data.tokens  : null);

      // Decision — use server result, but re-parse locally as safety fallback
      const verb  = parseDecision(fullText);
      setDecision({ verb, color: decisionColor(verb) });

      // Validate response completeness (do NOT block render)
      const missingSections = getMissingSections(fullText);
      if (missingSections.length >= 2) {
        setIncompleteWarning(true);
      }

      // Render AI message immediately
      setMessages(prev => [
        ...prev,
        { id: msgId, sender: 'ai', content: fullText, timestamp: new Date().toISOString() },
      ]);

      // Async reflection — tied to this messageId
      activeMessageIdRef.current = msgId;
      runReflectionAsync(fullText, msgId);

    } catch (err: any) {
      console.error('[RoomChat] send error:', err);
      const msg = err?.message ?? 'The audit could not be completed due to processing constraints. Please retry.';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 8_000);
    } finally {
      setSending(false);
    }
  };

  // ── Async Reflection ────────────────────────────────────────────────────

  const runReflectionAsync = async (fullText: string, msgId: string) => {
    setReflecting(true);
    try {
      const groq = getGroqClient();

      const prompt = `Analyze the following AI output and verify if it provides these sections: DECISION, Executive Verdict, Why This May Fail, Key Risks to Address, What Needs to Change?
      Output: """${fullText}"""
      Respond ONLY with a raw JSON object: {"completed":true/false,"missing":"sections here","confidence":0-100}`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const raw = completion.choices[0]?.message?.content || '';

      if (activeMessageIdRef.current !== msgId) return;

      try {
        const parsed: ReflectionResult = JSON.parse(raw);
        setReflectionLog(parsed);
      } catch {
        setReflectionLog({ completed: false, missing: 'Structure check failed', confidence: 0 });
      }
    } catch (err) {
      console.warn('[RoomChat] Reflection skipped:', err);
    } finally {
      setReflecting(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = async () => {
    if (!confirm('Clear all Audit Log entries? This cannot be undone.')) return;
    setReseting(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/reset`, { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        window.location.reload();
      }
    } catch (err) {
      console.error('[RoomChat] reset error:', err);
    } finally {
      setReseting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-[#FAFBFC]">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-[#94A3B8] font-medium text-[13px]">
          Loading your session…
        </p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#FAFBFC]">

      {/* ── Status Bar ──────────────────────────────────────────── */}
      <div className="px-6 py-2 bg-white border-b border-[rgba(0,0,0,0.06)] flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${sending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[11px] font-semibold text-[#64748B]">
            {sending ? 'Analyzing your idea…' : 'Audit Panel Ready'}
          </span>
        </div>
        {latency != null && (
          <span className="text-[10px] text-[#B0B8C4] font-mono ml-auto">{latency}ms</span>
        )}
      </div>

      {/* ── Decision Banner — always rendered if decision set ──────────── */}
      {decision && (
        <div
          className={`px-6 py-3 bg-${decision.color}-50 border-b border-${decision.color}-100 flex items-center justify-between transition-all animate-in slide-in-from-top duration-500`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className={`w-5 h-5 text-${decision.color}-500`} />
            <div>
              <p className={`text-[11px] font-bold text-${decision.color}-600 uppercase tracking-widest`}>
                Evaluation Result
              </p>
              <h4 className={`text-[16px] font-black text-${decision.color}-700`}>
                {decision.verb}
              </h4>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Confidence</p>
            <p className={`text-[14px] font-bold ${
              reflectionLog == null
                ? 'text-slate-400'
                : reflectionLog.confidence > 80
                  ? 'text-emerald-600'
                  : 'text-amber-600'
            }`}>
              {reflecting
                ? 'Verifying...'
                : reflectionLog != null
                  ? `${reflectionLog.confidence}%`
                  : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* ── Audit Log ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Empty state */}
        {messages.length === 0 && !sending && (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-8">
              <ShieldAlert className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-[22px] font-bold mb-3 tracking-tight text-[#1E293B]">Ready to Audit Your Idea</h3>
            <p className="text-[15px] text-[#64748B] max-w-[360px] leading-relaxed">
              Describe your startup idea below and the AI will challenge, stress-test, and evaluate it for you.
            </p>
            <div className="mt-8 flex flex-col gap-2 w-full max-w-[300px]">
              <button
                onClick={() => setInputValue('Here is my pitch: ')}
                className="text-[13px] bg-white border border-[rgba(0,0,0,0.08)] py-3 rounded-xl text-[#64748B] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition font-medium"
              >
                &quot;Here is my pitch...&quot;
              </button>
              <button
                onClick={() => setInputValue('Stress-test the technical roadmap of ')}
                className="text-[13px] bg-white border border-[rgba(0,0,0,0.08)] py-3 rounded-xl text-[#64748B] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition font-medium"
              >
                &quot;Stress-test roadmap...&quot;
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, idx) => (
          <div
            key={msg.id ?? idx}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-4 transition-all duration-300 ${
                msg.sender === 'user'
                  ? 'bg-indigo-500 text-white rounded-br-sm shadow-[0_2px_12px_rgba(99,102,241,0.2)]'
                  : 'bg-white text-[#1E293B] border border-[rgba(0,0,0,0.06)] rounded-bl-sm shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className={`text-[10px] font-bold tracking-[0.12em] uppercase ${
                  msg.sender === 'user' ? 'opacity-70' : 'text-[#94A3B8]'
                }`}>
                  {msg.sender === 'user' ? 'Founder' : 'Audit Panel'}
                </span>
                <span className={`text-[9px] font-mono ${
                  msg.sender === 'user' ? 'opacity-40' : 'text-[#CBD5E1]'
                }`}>
                  {msg.timestamp
                    ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })
                    : ''}
                </span>
              </div>
              <div className={`markdown-body text-[14px] leading-[1.7] prose prose-sm max-w-none font-sans ${
                msg.sender === 'user' ? 'prose-invert' : ''
              }`}>
                <Markdown>{msg.content ?? ''}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {sending && (
          <div className="flex flex-col items-start">
            <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-white text-[#1E293B] border border-[rgba(0,0,0,0.06)] rounded-bl-sm shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[12px] font-semibold text-[#94A3B8]">
                  Analyzing your idea…
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quality check in progress — hidden from user, non-blocking */}
        {reflecting && !sending && null}

        {/* Self-Verification Log */}
        {reflectionLog != null && !sending && (
          <div className="flex flex-col items-center mt-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-[80%] rounded-xl px-5 py-4 bg-white border border-[rgba(0,0,0,0.06)] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[13px] font-bold text-[#1E293B] uppercase tracking-widest">
                    Self-Verification Log
                  </span>
                </div>
                <span className="text-[10px] text-[#64748B] italic">AI checks its own output</span>
              </div>

              {/* Confidence bar */}
              <div className="mb-4 bg-[#F8FAFC] border border-[rgba(0,0,0,0.04)] rounded-lg p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Confidence Score
                  </span>
                  <span className="text-[12px] font-black text-[#1E293B]">
                    {reflectionLog.confidence}% — {
                      reflectionLog.confidence < 40 ? 'Low' :
                      reflectionLog.confidence < 80 ? 'Medium' : 'High'
                    }
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      reflectionLog.confidence < 40 ? 'bg-rose-500' :
                      reflectionLog.confidence < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, reflectionLog.confidence))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold mb-1">
                    Constraints Met
                  </p>
                  {reflectionLog.completed ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Incomplete
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold mb-1">
                    Missing Elements
                  </p>
                  <p
                    className="text-[12px] text-[#475569] font-medium truncate"
                    title={reflectionLog.missing ?? ''}
                  >
                    {reflectionLog.missing || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Incomplete response warning */}
        {incompleteWarning && !sending && (
          <div className="flex flex-col items-start mt-1">
            <div className="max-w-[80%] rounded-xl px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              The response may be incomplete — consider asking a follow-up question.
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="flex flex-col items-start">
            <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-red-50 text-red-600 border border-red-100 rounded-bl-sm text-[13px] font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ─────────────────────────────────────────────────── */}
      <div className="p-5 bg-white border-t border-[rgba(0,0,0,0.06)]">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your idea or ask a question…"
              className="w-full bg-[#F1F5F9] border border-[rgba(0,0,0,0.08)] rounded-2xl pl-5 pr-5 py-3.5 text-[14px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 transition text-[#1E293B] placeholder:text-[#94A3B8] resize-none min-h-[48px] max-h-[120px]"
              rows={1}
              disabled={sending || reseting}
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={sending || reseting || !inputValue.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.3)] font-semibold text-[13px]"
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> SEND</>}
          </button>
        </div>
      </div>
    </div>
  );
}
