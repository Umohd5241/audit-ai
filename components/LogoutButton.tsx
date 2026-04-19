'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (auth?.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Firebase Client Signout Error:', err);
    }
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="w-full text-left text-[14px] font-medium text-red-500 hover:text-red-600 flex items-center justify-between transition cursor-pointer">
      Sign Out
      <LogOut className="w-4 h-4 ml-2" />
    </button>
  );
}
