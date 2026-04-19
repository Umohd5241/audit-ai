'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';

export default function CreateRoomButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [ideaName, setIdeaName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    setError('');
    setIdeaName('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaName, description }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      handleClose();
      router.refresh();
      router.push(`/dashboard/room/${data.roomId}`);
    } catch {
      setError('Could not create the session. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] transition shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
      >
        <Plus className="w-4 h-4" /> New Audit Session
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 flex justify-between items-center border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <h2 className="text-[20px] font-semibold text-[#1E293B]">New Audit Session</h2>
                <p className="text-[13px] text-[#64748B] mt-0.5">Describe your idea and we'll start the evaluation.</p>
              </div>
              <button onClick={handleClose} disabled={loading} className="text-[#94A3B8] hover:text-[#1E293B] transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-[#1E293B] mb-1">
                  Your Idea Name
                </label>
                <input
                  type="text"
                  value={ideaName}
                  onChange={(e) => setIdeaName(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[rgba(0,0,0,0.08)] rounded-lg px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-indigo-500/10 transition placeholder:text-[#94A3B8]"
                  placeholder="e.g. Uber for Pets"
                  required
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#1E293B] mb-1">
                  Short Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[rgba(0,0,0,0.08)] rounded-lg px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-indigo-500/10 transition h-32 resize-none placeholder:text-[#94A3B8]"
                  placeholder="Describe your startup concept, who it's for, and the problem it solves..."
                  required
                />
              </div>
              {error && (
                <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-5 py-2.5 text-[14px] font-semibold text-[#64748B] hover:text-[#1E293B] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold transition disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                >
                  {loading ? 'Starting…' : 'Start Audit Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
