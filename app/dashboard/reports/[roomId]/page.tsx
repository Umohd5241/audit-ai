import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle2, AlertTriangle, Presentation, TrendingUp, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ReportViewPage({ params }: { params: { roomId: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!adminDb) {
    throw new Error('Firebase Admin SDK is not properly initialized.');
  }

  let room: any = null;
  try {
    const roomDoc = await adminDb.collection('ideaRooms').doc(params.roomId).get();
    room = roomDoc.exists ? roomDoc.data() : null;
  } catch (error: any) {
    console.warn('Suppressing Firebase crash in single Report page');
    if (params.roomId.startsWith('mock')) {
       // Support mock routes for demo resilience
       room = {
         userId: session.userId,
         ideaName: params.roomId === 'mock-2' ? 'Decentralized Energy Grid' : 'AI Personal Shopper',
         report: {
           summary: 'This is a mocked due diligence readout because the live Firebase configuration is completely exhausted.',
           score: params.roomId === 'mock-2' ? 5 : 8,
           decision: params.roomId === 'mock-2' ? 'PIVOT' : 'PROCEED',
           strengths: ['Great conceptual architecture', 'Clear target demographic alignment'],
           weaknesses: ['Missing regulatory compliance strategy', 'Vibes over substance in GTM'],
           actionPlan: ['Conduct legal review', 'Focus on unit economics rather than brand']
         }
       };
    }
  }

  if (!room || room.userId !== session.userId) {
    redirect('/dashboard/reports');
  }

  if (!room.report) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-slate-800">No report generated yet.</h2>
        <Link href={`/dashboard/room/${params.roomId}`} className="text-indigo-600 mt-4 underline">
          Go back to the room to complete the audit.
        </Link>
      </div>
    );
  }

  const report = typeof room.report === 'string' ? JSON.parse(room.report) : room.report;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <Link href="/dashboard/reports" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#64748B] hover:text-[#1E293B] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      <div className="glass-card rounded-2xl p-8 mb-6 card-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileText className="w-32 h-32 text-indigo-900" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase">Official Due Diligence</span>
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#1E293B]">{room.ideaName}</h1>
            <p className="text-[15px] font-medium text-[#64748B] mt-2 leading-relaxed max-w-2xl">{report.summary}</p>
          </div>
          <div className="shrink-0 text-center bg-white border border-[rgba(0,0,0,0.06)] rounded-xl p-5 shadow-sm min-w-[140px]">
            <p className="text-[11px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1">Audit Score</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-[42px] font-black leading-none ${
                report.score >= 7 ? 'text-green-500' : report.score >= 4 ? 'text-amber-500' : 'text-red-500'
              }`}>{report.score}</span>
              <span className="text-[18px] font-bold text-[#CBD5E1]">/10</span>
            </div>
            <div className={`mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)] text-[12px] font-bold uppercase tracking-wider ${
                report.decision === 'PROCEED' ? 'text-green-600' :
                report.decision === 'PIVOT' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {report.decision === 'PROCEED' ? 'GO' : report.decision === 'PIVOT' ? 'PIVOT' : 'NO GO'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="text-[15px] font-bold text-[#1E293B]">Key Strengths</h3>
            </div>
            <ul className="space-y-3">
              {(report.strengths || []).map((strength: string, i: number) => (
                <li key={i} className="flex gap-3 text-[14px] text-[#475569] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-2" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-[15px] font-bold text-[#1E293B]">Critical Weaknesses</h3>
            </div>
            <ul className="space-y-3">
              {(report.weaknesses || []).map((weakness: string, i: number) => (
                <li key={i} className="flex gap-3 text-[14px] text-[#475569] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-6 bg-white border border-indigo-100 rounded-xl p-6 shadow-sm relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Presentation className="w-5 h-5 text-indigo-500" />
            <h3 className="text-[15px] font-bold text-[#1E293B]">Action Plan</h3>
          </div>
          <ul className="space-y-4">
            {(report.actionPlan || []).map((action: string, i: number) => (
              <li key={i} className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[12px] font-bold shrink-0 border border-indigo-100">
                  {i + 1}
                </div>
                <p className="text-[14px] text-[#475569] leading-relaxed pt-0.5">{action}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
