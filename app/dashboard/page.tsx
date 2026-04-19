import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import { Lightbulb, ArrowRight, MessageSquare, ShieldAlert, FileText, Zap } from 'lucide-react';
import { format } from 'date-fns';
import CreateRoomButton from '@/components/CreateRoomButton';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  
  if (!adminDb) {
    throw new Error('Firebase Admin SDK is not properly initialized.');
  }

  // Single parallel fetch: user + rooms
  const [userDoc, roomsSnapshot] = await Promise.all([
    adminDb.collection('users').doc(session.userId).get(),
    adminDb.collection('ideaRooms').where('userId', '==', session.userId).get()
  ]);
  
  const user = userDoc.data();
  const firstName = user?.email?.split('@')[0] || 'User';

  // Map rooms directly — skip expensive N+1 message count queries
  const rooms = roomsSnapshot.docs
    .map(doc => {
      const data = doc.data() as any;
      return { ...data, messageCount: data.messageCount || 0 };
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[26px] font-bold tracking-tight text-[#1E293B]">Welcome back, {firstName}</h1>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-[14px] text-[#64748B]">
            {rooms.length > 0
              ? `You have ${rooms.length} active Audit Session${rooms.length === 1 ? '' : 's'} being analyzed.`
              : 'Create your first Audit Session to begin the audit process.'}
          </p>
        </div>
        <CreateRoomButton />
      </div>

      {/* Audit Sequence Stepper */}
      {rooms.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-8 hidden lg:block card-glow">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#94A3B8] mb-5">Audit Sequence</p>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-10 right-10 top-1/2 h-px bg-gradient-to-r from-indigo-100 via-green-100 to-purple-100 -z-10" />
            
            {[
              { icon: Lightbulb, label: 'Start Session', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-500' },
              { icon: MessageSquare, label: 'Pitch & Challenge', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-500' },
              { icon: ShieldAlert, label: 'Deep Evaluation', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-500' },
              { icon: FileText, label: 'Full Report', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-500' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 bg-[#F7F8FA] px-3">
                <div className={`w-10 h-10 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center transition-transform duration-300 hover:scale-110`}>
                  <step.icon className={`w-5 h-5 ${step.text}`} />
                </div>
                <span className="text-[11px] font-semibold text-[#475569]">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {rooms.length === 0 ? (
        <div className="glass-card rounded-2xl p-14 text-center flex flex-col items-center card-glow">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5">
            <Lightbulb className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-[20px] font-semibold mb-2 text-[#1E293B]">No Audit Sessions Yet</h3>
          <p className="text-[14px] text-[#64748B] max-w-md mx-auto mb-8 leading-relaxed">
            Create your first session to start evaluating your startup idea with AI. You'll get honest, structured feedback.
          </p>
          <CreateRoomButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
          {rooms.map((room) => {
             const messageCount = room.messageCount || 0;
             return (
              <Link key={room.roomId} href={`/dashboard/room/${room.roomId}`} className="group block h-full">
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-250 card-glow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[#94A3B8] font-semibold">
                      {room.createdAt
                        ? (() => { try { return format(new Date(room.createdAt), 'MMM d, yyyy'); } catch { return '—'; } })()
                        : '—'}
                    </span>
                    {messageCount > 5 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot" />
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-[18px] font-semibold mb-2 text-[#1E293B] group-hover:text-indigo-600 transition-colors duration-200">{room.ideaName}</h3>
                  <p className="text-[13px] text-[#64748B] leading-[1.6] mb-5 flex-1 line-clamp-2">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[rgba(0,0,0,0.04)]">
                    <span className="text-[11px] px-2.5 py-1 bg-[#F1F5F9] rounded-md text-[#64748B] font-medium">
                      {messageCount > 0 ? `${messageCount} message${messageCount === 1 ? '' : 's'}` : 'No messages yet'}
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-500 group-hover:text-indigo-600 text-[12px] font-semibold transition-all duration-200 group-hover:gap-2.5">
                      Open Session <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
             );
          })}
        </div>
      )}
    </>
  );
}
