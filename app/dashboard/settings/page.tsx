import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { User, Phone, Mail, Key } from 'lucide-react';
import SettingsManager from '@/components/SettingsManager';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!adminDb) {
    throw new Error('Firebase Admin SDK is not properly initialized.');
  }

  let user = null;
  try {
    const userDoc = await adminDb.collection('users').doc(session.userId).get();
    user = userDoc.exists ? userDoc.data() : null;
  } catch (error: any) {
    console.warn('Suppressing Firebase Quota Exhausted crash on Settings page');
    user = { email: session.email };
  }


  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-[#1E293B]">Settings</h1>
        <p className="text-[14px] text-[#64748B] mt-1">Manage your account, notifications, and integration preferences.</p>
      </div>

      <div className="space-y-5 max-w-2xl stagger-children">
        {/* Profile */}
        <div className="glass-card rounded-2xl p-6 card-glow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1E293B]">Profile</h2>
          </div>
          <div className="space-y-0">
            {[
              { icon: Mail, label: 'Email', value: user?.email || '—' },
              { icon: Phone, label: 'WhatsApp', value: user?.phoneNumber || '—' },
              { icon: Key, label: 'User ID', value: session.userId.slice(0, 20) + '...' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-3.5 ${i < 2 ? 'border-b border-[rgba(0,0,0,0.04)]' : ''}`}>
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[#B0B8C4]" />
                  <span className="text-[13px] text-[#64748B]">{item.label}</span>
                </div>
                <span className={`text-[13px] font-medium ${item.label === 'User ID' ? 'font-mono text-[#94A3B8] text-[11px]' : 'text-[#1E293B]'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <SettingsManager userId={session.userId} initialSettings={user || {}} />
      </div>
    </>
  );
}
