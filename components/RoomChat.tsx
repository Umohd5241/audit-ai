'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import { RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { CHAT_INSTRUCTIONS } from '@/lib/ai-config';

export default function RoomChat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [reseting, setReseting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMessagesAndRoom = useCallback(async () => {
    try {
      const [messagesRes, roomRes] = await Promise.all([
        fetch(`/api/rooms/${roomId}/messages`),
        fetch(`/api/rooms/${roomId}`)
      ]);
      
      const messagesData = await messagesRes.json();
      const roomData = await roomRes.json();
      
      if (messagesData.success) {
        setMessages(messagesData.messages);
      }
      if (roomData.success) {
        setRoom(roomData.room);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessagesAndRoom();
    const interval = setInterval(fetchMessagesAndRoom, 10000); 
    return () => clearInterval(interval);
  }, [fetchMessagesAndRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, streamingText]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sending || !room) return;

    const textToSubmit = inputValue.trim();
    setInputValue('');
    setSending(true);
    setStreamingText('');
    setErrorMsg('');

    // Optimistic: add user message immediately
    const optimisticUserMsg = {
      id: `temp-user-${Date.now()}`,
      sender: 'user',
      content: textToSubmit,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      // Fire user message logging in background (don't await)
      const logUserPromise = fetch(`/api/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSubmit })
      });

      // Build context with last 8 messages (lean and fast)
      const chatHistory = messages.slice(-8).map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
      }));
      chatHistory.push({ role: 'user', parts: [{ text: textToSubmit }] });

      // Stream Gemini response
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const response = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: chatHistory,
        config: {
          systemInstruction: `${CHAT_INSTRUCTIONS}\n\nEVALUATION CONTEXT:\nIdea: ${room.ideaName}\nDescription: ${room.description}\nStage: ${room.stage || 'Not Specified'}\n\nIMPORTANT: Be concise and direct. Keep responses under 150 words.`
        }
      });

      let fullText = '';
      for await (const chunk of response) {
        const text = chunk.text ?? '';
        fullText += text;
        setStreamingText(fullText);
      }

      // Wait for user message log to finish
      await logUserPromise;

      // Log AI response in background
      fetch(`/api/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiResponse: fullText })
      });

      // Add AI message to state and clear streaming
      setStreamingText('');
      setMessages(prev => [...prev, {
        id: `temp-ai-${Date.now()}`,
        sender: 'ai',
        content: fullText,
        timestamp: new Date().toISOString()
      }]);

    } catch (err: any) {
      console.error('Interrogation Failure:', err);
      setStreamingText('');
      const msg = err?.message?.includes('429')
        ? 'API quota exceeded. Wait 1 minute and try again.'
        : 'Failed to get response. Please try again.';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 8000);
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to clear the conversation and report? This cannot be undone.')) return;
    setReseting(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/reset`, { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
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

  if (loading) return (
    <div className="flex flex-col flex-1 items-center justify-center bg-[#FAFBFC]">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-[#94A3B8] font-medium uppercase tracking-widest text-[11px]">Initializing Audit Node...</p>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#FAFBFC]">
      {/* Chat Viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-8">
                    <ShieldAlert className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-[22px] font-bold mb-3 tracking-tight text-[#1E293B]">Vetting Session Ready</h3>
                <p className="text-[15px] text-[#64748B] max-w-[360px] leading-relaxed">
                    Submit your core assumptions. The audit committee will begin the stress-testing sequence.
                </p>
                <div className="mt-8 flex flex-col gap-2 w-full max-w-[300px]">
                   <button onClick={() => setInputValue("Here is my pitch: ")} className="text-[13px] bg-white border border-[rgba(0,0,0,0.08)] py-3 rounded-xl text-[#64748B] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition font-medium">
                      &quot;Here is my pitch...&quot;
                   </button>
                   <button onClick={() => setInputValue("Stress-test the technical roadmap of ")} className="text-[13px] bg-white border border-[rgba(0,0,0,0.08)] py-3 rounded-xl text-[#64748B] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition font-medium">
                      &quot;Stress-test roadmap...&quot;
                   </button>
                </div>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
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
                    {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : ''}
                </span>
              </div>
              <div className={`markdown-body text-[14px] leading-[1.7] prose prose-sm max-w-none font-sans ${
                msg.sender === 'user' ? 'prose-invert' : ''
              }`}>
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          </div>
        ))}
        
        {/* Streaming AI response */}
        {streamingText && (
          <div className="flex flex-col items-start">
            <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-white text-[#1E293B] border border-[rgba(0,0,0,0.06)] rounded-bl-sm shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">Audit Panel</span>
                <span className="text-[9px] font-mono text-[#CBD5E1]">just now</span>
              </div>
              <div className="markdown-body text-[14px] leading-[1.7] prose prose-sm max-w-none font-sans">
                <Markdown>{streamingText}</Markdown>
                <span className="inline-block w-1.5 h-4 bg-indigo-400 rounded-sm animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* Thinking indicator (before stream starts) */}
        {sending && !streamingText && (
          <div className="flex flex-col items-start">
             <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-white text-[#1E293B] border border-[rgba(0,0,0,0.06)] rounded-bl-sm shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-[#94A3B8]">Analyzing...</span>
                 </div>
             </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="flex flex-col items-start">
            <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-red-50 text-red-600 border border-red-100 rounded-bl-sm text-[13px] font-medium">
              ⚠️ {errorMsg}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Module */}
      <div className="p-5 bg-white border-t border-[rgba(0,0,0,0.06)]">
        <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your logic with the panel..."
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
