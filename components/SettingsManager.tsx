import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Globe, Grip, User, MessageSquare } from 'lucide-react';

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

  useEffect(() => {
    if (highContrast) {
      document.body.setAttribute('data-theme', 'high-contrast');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [highContrast]);

  const saveSettings = async (updates: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save settings');
      }
      // CRITICAL: Refresh the server components (Sidebar etc)
      router.refresh();
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Settings cannot be permanently saved due to Database Quota Exhaustion. They will revert on refresh.');
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
        alert('Profile updated and synced successfully!');
    }
  };

  const toggleSetting = async (key: 'whatsappNotify' | 'emailNotify' | 'highContrast', currentValue: boolean) => {
    const newValue = !currentValue;
    // Optimistic set
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
      // Revert optimism if failed
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

  return (
    <>
      {/* Profile Section */}
      <div className="glass-card rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-500" />
           </div>
           <h2 className="text-[15px] font-semibold text-[#1E293B]">Profile Information</h2>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1.5 uppercase tracking-wider">Display Name</label>
                <input 
                  id="displayNameInput"
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Satoshi" 
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
                  placeholder="+1234..." 
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
                className="w-full bg-[#1E293B] hover:bg-black text-white text-[13px] font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              >
                 {savingProfile ? 'Syncing...' : 'Update & Sync Profile'}
              </button>
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

      {/* Integrations (Linked to Data) */}
      <div className="glass-card rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
            <Globe className="w-4 h-4 text-green-500" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#1E293B]">Bot Integrations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {[
            { 
              name: 'WhatsApp Bot', 
              id: 'whatsappInput',
              desc: 'Audit via WhatsApp messenger', 
              connected: !!phoneNumber, 
              icon: MessageSquare,
              color: 'text-green-500',
              bg: 'bg-green-50'
            },
            { 
              name: 'Telegram Bot', 
              id: 'telegramInput',
              desc: 'Audit via Telegram messenger', 
              connected: !!telegramHandle, 
              icon: Globe,
              color: 'text-blue-500',
              bg: 'bg-blue-50'
            },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-[rgba(0,0,0,0.04)] bg-[#FAFBFC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1E293B]">{item.name}</p>
                  <p className="text-[11px] text-[#64748B]">{item.desc}</p>
                </div>
              </div>
              {item.connected ? (
                <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-green-500 text-white shadow-sm flex items-center gap-1">
                   <span className="w-1 h-1 rounded-full bg-white pulse-dot" />
                   Live
                </span>
              ) : (
                <button 
                  onClick={() => scrollToField(item.id)}
                  className="text-[9px] font-bold uppercase tracking-tighter px-2 py-1 rounded bg-white hover:bg-black border border-[rgba(0,0,0,0.08)] hover:text-white transition shadow-sm"
                >
                  Link
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
