'use client';

import { useState, useEffect } from 'react';
import { Bell, Globe, Grip } from 'lucide-react';

export default function SettingsManager({ 
  userId, 
  initialSettings 
}: { 
  userId: string; 
  initialSettings: any 
}) {
  const [whatsappNotify, setWhatsappNotify] = useState(initialSettings?.whatsappNotify ?? true);
  const [emailNotify, setEmailNotify] = useState(initialSettings?.emailNotify ?? false);
  const [highContrast, setHighContrast] = useState(initialSettings?.highContrast ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (highContrast) {
      document.body.setAttribute('data-theme', 'high-contrast');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [highContrast]);

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
    
    setSaving(true);
    try {
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });
    } catch (err) {
      console.error(err);
      // Revert optimism
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Notifications */}
      <div className="glass-card rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#1E293B]">Notifications</h2>
          {saving && <span className="ml-auto text-[11px] text-[#64748B] animate-pulse">Saving...</span>}
        </div>
        <div className="space-y-0">
          {[
            { key: 'whatsappNotify' as const, label: 'WhatsApp Notifications', current: whatsappNotify },
            { key: 'emailNotify' as const, label: 'Email Notifications', current: emailNotify },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-3.5 ${i === 0 ? 'border-b border-[rgba(0,0,0,0.04)]' : ''}`}>
              <span className="text-[13px] text-[#64748B]" id={`label-${item.key}`}>{item.label}</span>
              <button 
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

      {/* Accessibility (Bonus Hackathon Feature) */}
      <div className="glass-card rounded-2xl p-6 card-glow">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center">
            <Grip className="w-4 h-4 text-pink-500" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#1E293B]">Accessibility</h2>
        </div>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-3.5 border-b border-[rgba(0,0,0,0.04)]">
            <div>
              <p className="text-[13px] font-medium text-[#1E293B]" id="label-highContrast">High Contrast Mode</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Increases legibility with stark black & white themes.</p>
            </div>
            <button 
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
            { name: 'WhatsApp', desc: 'Chat with THE EQUALS via WhatsApp', connected: true },
            { name: 'Telegram', desc: 'Chat with THE EQUALS via Telegram', connected: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-3.5 ${i === 0 ? 'border-b border-[rgba(0,0,0,0.04)]' : ''}`}>
              <div>
                <p className="text-[13px] font-medium text-[#1E293B]">{item.name}</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">{item.desc}</p>
              </div>
              {item.connected ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot" />
                  Connected
                </span>
              ) : (
                <button className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-white border border-[rgba(0,0,0,0.08)] text-[#64748B] hover:text-[#1E293B] hover:border-[#1E293B]/20 transition-all shadow-sm">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
