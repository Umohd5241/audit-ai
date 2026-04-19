import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { User, Phone, Mail, Key, Bell, Globe } from 'lucide-react';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!adminDb) {
    throw new Error('Firebase Admin SDK is not properly initialized.');
  }

  const userDoc = await adminDb.collection('users').doc(session.userId).get();
  const user = userDoc.exists ? userDoc.data() : null;

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

        {/* Notifications */}
        <div className="glass-card rounded-2xl p-6 card-glow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1E293B]">Notifications</h2>
          </div>
          <div className="space-y-0">
            {[
              { label: 'WhatsApp Notifications', on: true },
              { label: 'Email Notifications', on: false },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-3.5 ${i === 0 ? 'border-b border-[rgba(0,0,0,0.04)]' : ''}`}>
                <span className="text-[13px] text-[#64748B]">{item.label}</span>
                <div className={`w-10 h-[22px] rounded-full relative cursor-pointer transition-colors duration-200 ${item.on ? 'bg-indigo-500' : 'bg-[#E2E8F0]'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] shadow-sm transition-all duration-200 ${item.on ? 'right-[3px]' : 'left-[3px]'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="glass-card rounded-2xl p-6 card-glow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-green-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1E293B]">Integrations</h2>
          </div>
          <div className="space-y-0">
            {[
              { name: 'WhatsApp', desc: 'Chat with Judge AI via WhatsApp' },
              { name: 'Telegram', desc: 'Chat with Judge AI via Telegram' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-3.5 ${i === 0 ? 'border-b border-[rgba(0,0,0,0.04)]' : ''}`}>
                <div>
                  <p className="text-[13px] font-medium text-[#1E293B]">{item.name}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{item.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot" />
                  Connected
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
