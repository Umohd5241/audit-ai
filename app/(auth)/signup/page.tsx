'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Rocket, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        body: JSON.stringify({ idToken, email, phoneNumber }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register details to database');
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Your password is too weak. Please use at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/network-request-failed') {
        setError('Connection failed. Please check your internet connection and try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (err.message === 'configuration-missing') {
        setError('Authentication is not fully configured. Please contact the administrator.');
      } else if (err.message?.includes('register') || err.message?.includes('database')) {
        setError('Account created but profile setup failed. Please try logging in.');
      } else if (code === 'auth/configuration-not-found' || code === 'auth/unauthorized-domain') {
        setError('Authentication is not fully configured. Please contact the administrator.');
      } else {
        setError(err.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] px-4 font-sans text-[#1E293B]">
      <div className="w-full max-w-md bg-white border border-[rgba(0,0,0,0.06)] p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-[#6366f1] rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center justify-center mb-4">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <h2 className="text-[24px] font-semibold text-[#1E293B]">Create an Account</h2>
          <p className="text-[#64748B] text-[14px] mt-1">Start validating your ideas</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-[14px] border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[14px] font-medium text-[#1E293B] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F1F5F9] border border-[rgba(0,0,0,0.08)] rounded-lg px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-indigo-500/10 transition placeholder:text-[#94A3B8]"
              required
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#1E293B] mb-2">Phone Number (WhatsApp)</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full bg-[#F1F5F9] border border-[rgba(0,0,0,0.08)] rounded-lg px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-indigo-500/10 transition placeholder:text-[#94A3B8]"
              required
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#1E293B] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F1F5F9] border border-[rgba(0,0,0,0.08)] rounded-lg px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-indigo-500/10 transition placeholder:text-[#94A3B8]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold flex items-center justify-center py-3 px-4 rounded-lg text-[14px] transition disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.2)] mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" />  : 'Sign up'}
          </button>
        </form>

        <p className="mt-8 text-center text-[14px] text-[#64748B]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#6366f1] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
