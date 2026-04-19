import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import DashboardSidebar from '@/components/DashboardSidebar';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  
  if (!adminDb) {
    console.error('Firebase Admin SDK is not properly initialized. Check environment variables.');
  }

  let user = null;
  try {
    const userDoc = await adminDb.collection('users').doc(session.userId).get();
    user = userDoc.exists ? userDoc.data() : null;
  } catch (error: any) {
    console.error('Firestore error in DashboardLayout:', error);
    // Generic fallback for any database error to prevent total app crash
    user = { email: session.email, phoneNumber: undefined };
  }

  return (
    <div className="flex h-screen bg-[#F7F8FA] text-[#1E293B] font-sans overflow-hidden w-full">
      <DashboardSidebar phoneNumber={user?.phoneNumber} />

      <main className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-500 rounded font-bold" />
            <h1 className="text-lg font-bold tracking-tight text-[#1E293B]">THE EQUALS</h1>
          </Link>
          <LogoutButton />
        </header>

        {/* Content with page transition */}
        <div className="flex-1 p-8 lg:p-10 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
