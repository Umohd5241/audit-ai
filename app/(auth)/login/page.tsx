'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Rocket, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (resetMode) {
        if (!email) throw new Error('Please enter your email address.');
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to create server session. Please check Firebase Admin credentials.');
        }

        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Incorrect email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes and try again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Connection failed. Please check your internet connection and try again.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.message === 'configuration-missing') {
        setError('Authentication is not fully configured. Please contact the administrator.');
      } else if (err.message?.includes('server session') || err.message?.includes('Firebase Admin')) {
        setError('Something went wrong on our end. Please try again in a moment.');
      } else {
        setError(err.message || 'Action failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] px-4 font-sans text-[#1E293B]">
      <div className="w-full max-w-md bg-white border border-[rgba(0,0,0,0.06)] p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative">
        
        {resetMode && (
          <button 
            onClick={() => { setResetMode(false); setError(''); setResetSent(false); }}
            className="absolute top-6 left-6 text-[#94A3B8] hover:text-[#1E293B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-[#6366f1] rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center justify-center mb-4">
            {resetSent ? <MailCheck className="text-white w-5 h-5" /> : <Rocket className="text-white w-5 h-5" />}
          </div>
          <h2 className="text-[24px] font-semibold text-[#1E293B]">
            {resetSent ? 'Check Your Email' : resetMode ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p className="text-[#64748B] text-[14px] mt-1 text-center max-w-xs">
            {resetSent 
              ? 'We have sent a secure password reset link to your email address.' 
              : resetMode 
              ? 'Enter your email to receive a secure password reset link.' 
              : 'Log in to your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-[14px] border border-red-100">
            {error}
          </div>
        )}

        {!resetSent ? (
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
            
            {!resetMode && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[14px] font-medium text-[#1E293B]">Password</label>
                  <button 
                    type="button"
                    onClick={() => { setResetMode(true); setError(''); }}
                    className="text-[12px] font-medium text-[#6366f1] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F1F5F9] border border-[rgba(0,0,0,0.08)] rounded-lg px-4 py-2.5 text-[#1E293B] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-indigo-500/10 transition placeholder:text-[#94A3B8]"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold flex justify-center items-center py-3 px-4 rounded-lg text-[14px] transition disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.2)] mt-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : resetMode ? 'Send Reset Link' : 'Log in'}
            </button>
          </form>
        ) : (
          <button
            onClick={() => { setResetMode(false); setResetSent(false); setPassword(''); }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex justify-center items-center py-3 px-4 rounded-lg text-[14px] transition"
          >
            Return to Login
          </button>
        )}

        {!resetMode && !resetSent && (
          <p className="mt-8 text-center text-[14px] text-[#64748B]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#6366f1] hover:underline font-medium">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
