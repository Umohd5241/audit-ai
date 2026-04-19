'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, Rocket, Settings } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

const menuItems = [
  { name: 'Idea Rooms', href: '/dashboard', icon: LayoutGrid, desc: 'Create and manage idea rooms' },
  { name: 'Reports History', href: '/dashboard/reports', icon: FileText, desc: 'View past due diligence' },
  { name: 'Mentor Agents', href: '/dashboard/agents', icon: Rocket, desc: 'AI evaluation agents' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, desc: 'Account preferences' },
];

export default function DashboardSidebar({ phoneNumber }: { phoneNumber?: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/room');
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-[260px] h-full bg-white border-r border-[rgba(0,0,0,0.06)] px-5 py-7 hidden md:flex flex-col shadow-[1px_0_8px_rgba(0,0,0,0.02)]">
      <Link href="/dashboard" className="text-[20px] font-bold tracking-[-0.02em] mb-8 flex items-center gap-2.5 transition-opacity hover:opacity-80 px-1">
        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-[0_2px_8px_rgba(99,102,241,0.3)] flex items-center justify-center shrink-0" />
        <span className="text-[#1E293B]">THE EQUALS</span>
      </Link>

      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#B0B8C4] mb-3 px-4">Navigation</p>

      <nav className="flex-1">
        <ul className="space-y-0.5 list-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-[14px] transition-all duration-200 ${
                    active
                      ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                      : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {/* Left border indicator */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${
                    active ? 'h-6 bg-indigo-500' : 'h-0 bg-transparent group-hover:h-4 group-hover:bg-[#CBD5E1]'
                  }`} />
                  <Icon className={`w-[18px] h-[18px] transition-all duration-200 ${
                    active ? 'text-indigo-500' : 'text-[#94A3B8] group-hover:text-[#64748B]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight">{item.name}</span>
                    <span className={`block text-[10px] mt-0.5 transition-colors duration-200 ${
                      active ? 'text-indigo-400' : 'text-[#B0B8C4] group-hover:text-[#94A3B8]'
                    }`}>{item.desc}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="h-px bg-[rgba(0,0,0,0.04)] my-4" />

      <div className="p-4 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-xl border border-[rgba(0,0,0,0.04)]">
        <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wider">WhatsApp</p>
        <p className="text-[13px] font-semibold mt-0.5 text-[#1E293B]">
          {phoneNumber ? (phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`) : '—'}
        </p>
        <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.04)]">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
