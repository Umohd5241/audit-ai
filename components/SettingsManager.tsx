"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Globe, Grip, User, MessageSquare, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface IntegrationStatus {
  telegram: { configured: boolean; botUsername: string | null };
  whatsapp: { configured: boolean; twilio: boolean; meta: boolean };
}

export default function SettingsManager({ 
  userId, 
  initialSettings 
}: { 
  userId: string; 
  initialSettings: any 
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialSettings?.displayName ?? '');
  const [whatsappNotify, setWhatsappNotify] = useState(initialSettings?.whatsappNotify ?? true);
  const [emailNotify, setEmailNotify] = useState(initialSettings?.emailNotify ?? false);
  const [highContrast, setHighContrast] = useState(initialSettings?.highContrast ?? false);
  const [phoneNumber, setPhoneNumber] = useState(initialSettings?.phoneNumber ?? '');
  const [telegramHandle, setTelegramHandle] = useState(initialSettings?.telegramHandle ?? '');
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  // Real integration status from the backend
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  // Check real backend integration status on mount
  useEffect(() => {
    fetch('/api/integrations/status')
      .then(res => res.json())
      .then(data => {
        setIntegrationStatus(data);
        setLoadingIntegrations(false);
      })
      .catch(() => {
        setLoadingIntegrations(false);
      });
  }, []);

  useEffect(() => {
    if (highContrast) {
      document.body.setAttribute('data-theme', 'high-contrast');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [highContrast]);

  const saveSettings = async (updates: any) => {
    setSaving(true);
    setSaveStatus('idle');
    setSaveError('');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(data.error || `Save failed (HTTP ${res.status})`);
      }
      
      if (!data.confirmed) {
        throw new Error('Data was sent but could not be confirmed in the database.');
      }

      setSaveStatus('success');
      router.refresh();
      
      setTimeout(() => setSaveStatus('idle'), 4000);
      return true;
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveStatus('error');
      setSaveError(err.message || 'Unknown error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const success = await saveSettings({ 
      displayName, 
      phoneNumber, 
      telegramHandle 
    });
    setSavingProfile(false);
    
    if (success) {
      // Force full page reload to update sidebar + profile card from DB
      setTimeout(() => window.location.reload(), 600);
    }
  };

  const toggleSetting = async (key: 'whatsappNotify' | 'emailNotify' | 'highContrast', currentValue: boolean) => {
    const newValue = !currentValue;
    if (key === 'whatsappNotify') setWhatsappNotify(newValue);
    if (key === 'emailNotify') setEmailNotify(newValue);
    if (key === 'highContrast') {
      setHighContrast(newValue);
      if (newValue) {
        document.body.setAttribute('data-theme', 'high-contrast');
      } else {
        document.body.removeAttribute('data-theme');
      }
    }
    
    const success = await saveSettings({ [key]: newValue });
    if (!success) {
      if (key === 'whatsappNotify') setWhatsappNotify(currentValue);
      if (key === 'emailNotify') setEmailNotify(currentValue);
      if (key === 'highContrast') {
        setHighContrast(currentValue);
        if (currentValue) {
          document.body.setAttribute('data-theme', 'high-contrast');
        } else {
          document.body.removeAttribute('data-theme');
        }
      }
    }
  };

  const scrollToField = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  // Determine REAL integration connection status
  const getWhatsAppStatus = () => {
    if (loadingIntegrations) return 'loading';
    if (!integrationStatus?.whatsapp?.configured) return 'not_configured';
    if (!phoneNumber) return 'no_number';
    return 'connected';
  };

  const getTelegramStatus = () => {
    if (loadingIntegrations) return 'loading';
    if (!integrationStatus?.telegram?.configured) return 'not_configured';
    if (!telegramHandle) return 'no_handle';
    return 'connected';
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'loading':
        return (
          <span className="text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded bg-gray-100 text-gray-400 flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Checking
          </span>
        );
      case 'connected':
        return (
          <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-green-500 text-white shadow-sm flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" />
            Connected
          </span>
        );
      case 'not_configured':
        return (
          <span className="text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded bg-red-50 text-red-500 border border-red-100 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" />
            No Bot Token
          </span>
        );
      case 'no_number':
        return (
          <button 
            onClick={() => scrollToField('whatsappInput')}
            className="text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition flex items-center gap-1"
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            Add Number
          </button>
        );
      case 'no_handle':
        return (
          <button 
            onClick={() => scrollToField('telegramInput')}
            className="text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition flex items-center gap-1"
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            Add Handle
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Save Status Banner */}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-red-700">Save Failed</p>
            <p className="text-[11px] text-red-500 mt-0.5">{saveError}</p>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="glass-card rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-500" />
           </div>
           <h2 className="text-[15px] font-semibold text-[#1E293B]">Profile Information</h2>
           {saveStatus === 'success' && (
             <span className="ml-auto text-[11px] text-green-600 font-semibold flex items-center gap-1">
               <CheckCircle className="w-3.5 h-3.5" /> Saved to Database
             </span>
           )}
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Full Name</label>
                <input 
                  id="displayNameInput"
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name" 
                  className="w-full text-[13px] bg-[#FAFBFC] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">WhatsApp Number</label>
                <input 
                  id="whatsappInput"
                  type="tel" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890" 
                  className="w-full text-[13px] bg-[#FAFBFC] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
                />
              </div>
           </div>
           <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Telegram Handle</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[13px]">@</span>
                <input 
                  id="telegramInput"
                  type="text" 
                  value={telegramHandle} 
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  placeholder="username" 
                  className="w-full pl-8 text-[13px] bg-[#FAFBFC] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
                />
              </div>
           </div>
           <div className="pt-2">
              <button 
                disabled={savingProfile || saving}
                type="submit" 
                className={`w-full text-white text-[13px] font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 ${
                  saveStatus === 'success' ? 'bg-green-500' : saveStatus === 'error' ? 'bg-red-500' : 'bg-[#1E293B] hover:bg-black'
                }`}
              >
                 {savingProfile ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> Saving to Database...</>
                 ) : saveStatus === 'success' ? (
                   <><CheckCircle className="w-4 h-4" /> Saved & Synced ✓</>
                 ) : saveStatus === 'error' ? (
                   <><XCircle className="w-4 h-4" /> Save Failed — Try Again</>
                 ) : (
                   'Save to Database & Sync'
                 )}
              </button>
              <p className="text-[10px] text-[#94A3B8] mt-2 text-center">
                Your name, number, and handle are stored permanently in the database.
              </p>
           </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="glass-card rounded-2xl p-6 card-glow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1E293B]">Notifications</h2>
            {saving && <span className="ml-auto text-[11px] text-[#64748B] animate-pulse">Saving...</span>}
          </div>
          <div className="space-y-0 text-left">
            {[
              { key: 'whatsappNotify' as const, label: 'WhatsApp Alerts', current: whatsappNotify },
              { key: 'emailNotify' as const, label: 'Email Alerts', current: emailNotify },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-3.5 ${i === 0 ? 'border-b border-[rgba(0,0,0,0.04)]' : ''}`}>
                <span className="text-[13px] text-[#64748B]" id={`label-${item.key}`}>{item.label}</span>
                <button 
                  disabled={saving}
                  onClick={() => toggleSetting(item.key, item.current)}
                  role="switch"
                  aria-checked={item.current}
                  aria-labelledby={`label-${item.key}`}
                  className={`w-10 h-[22px] rounded-full relative cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-200 ${item.current ? 'bg-indigo-500' : 'bg-[#E2E8F0]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] shadow-sm transition-all duration-200 ${item.current ? 'right-[3px]' : 'left-[3px]'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="glass-card rounded-2xl p-6 card-glow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center">
              <Grip className="w-4 h-4 text-pink-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1E293B]">Accessibility</h2>
          </div>
          <div className="space-y-0 text-left">
            <div className="flex items-center justify-between py-3.5 border-b border-[rgba(0,0,0,0.04)]">
              <div>
                <p className="text-[13px] font-medium text-[#1E293B]" id="label-highContrast">High Contrast Mode</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Stark visibility for better legibility.</p>
              </div>
              <button 
                disabled={saving}
                onClick={() => toggleSetting('highContrast', highContrast)}
                role="switch"
                aria-checked={highContrast}
                aria-labelledby="label-highContrast"
                className={`w-10 h-[22px] rounded-full relative cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors duration-200 ${highContrast ? 'bg-indigo-500' : 'bg-[#E2E8F0]'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] shadow-sm transition-all duration-200 ${highContrast ? 'right-[3px]' : 'left-[3px]'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Integrations — Real Status */}
      <div className="glass-card rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
            <Globe className="w-4 h-4 text-green-500" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#1E293B]">Bot Integrations</h2>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">
            Real-time Status
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* WhatsApp */}
          <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.04)] bg-[#FAFBFC]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1E293B]">WhatsApp Bot</p>
                  <p className="text-[11px] text-[#64748B]">via Twilio</p>
                </div>
              </div>
              {renderStatusBadge(getWhatsAppStatus())}
            </div>
            <div className="text-[10px] text-[#94A3B8] space-y-1 border-t border-[rgba(0,0,0,0.04)] pt-3">
              <p>• Bot Token: {integrationStatus?.whatsapp?.configured ? '✅ Configured' : '❌ Not set in environment'}</p>
              <p>• Your Number: {phoneNumber ? `✅ ${phoneNumber}` : '⚠️ Not provided'}</p>
            </div>
          </div>
          
          {/* Telegram */}
          <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.04)] bg-[#FAFBFC]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1E293B]">Telegram Bot</p>
                  <p className="text-[11px] text-[#64748B]">
                    {integrationStatus?.telegram?.botUsername ? `@${integrationStatus.telegram.botUsername}` : 'Bot API'}
                  </p>
                </div>
              </div>
              {renderStatusBadge(getTelegramStatus())}
            </div>
            <div className="text-[10px] text-[#94A3B8] space-y-1 border-t border-[rgba(0,0,0,0.04)] pt-3">
              <p>• Bot Token: {integrationStatus?.telegram?.configured ? '✅ Configured' : '❌ Not set in environment'}</p>
              <p>• Your Handle: {telegramHandle ? `✅ @${telegramHandle}` : '⚠️ Not provided'}</p>
            </div>
          </div>
        </div>
        
        {/* Setup instructions if not configured */}
        {integrationStatus && (!integrationStatus.telegram.configured || !integrationStatus.whatsapp.configured) && (
          <div className="mt-4 p-3 bg-amber-50/50 rounded-lg border border-amber-100/50">
            <p className="text-[11px] text-amber-700 font-semibold mb-1">⚠️ Setup Required</p>
            <p className="text-[10px] text-amber-600">
              Bot tokens must be added to your server environment variables to enable real messaging. 
              Set <code className="bg-amber-100 px-1 rounded">TELEGRAM_BOT_TOKEN</code> and <code className="bg-amber-100 px-1 rounded">TWILIO_ACCOUNT_SID</code> in your Vercel project settings.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
