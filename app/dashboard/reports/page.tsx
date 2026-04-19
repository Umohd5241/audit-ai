import { getSession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { FileText, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!adminDb) {
    console.error('Firebase Admin SDK is not properly initialized.');
  }

  let rooms: any[] = [];
  try {
    const roomsSnapshot = await adminDb.collection('ideaRooms')
      .where('userId', '==', session.userId)
      .get();

    rooms = roomsSnapshot.docs
      .map(doc => doc.data() as any)
      .filter(room => room.report);
  } catch (error: any) {
    console.error('Firestore error in ReportsPage:', error);
    // Gracefully handle failure and show mock state
    if (rooms.length === 0) {
      rooms = [
        {
          roomId: 'mock-1',
          ideaName: 'AI Personal Shopper',
          report: JSON.stringify({ summary: 'MOCKED REPORT due to Quota.', score: 8, decision: 'PROCEED' })
        },
        {
          roomId: 'mock-2',
          ideaName: 'Decentralized Energy Grid',
          report: JSON.stringify({ summary: 'MOCKED REPORT due to Quota.', score: 5, decision: 'PIVOT' })
        }
      ];
    }
  }

  // Safely parse report — may be a JSON string or already an object
  function safeParseReport(raw: any): any {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return null; }
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-[#1E293B]">Reports History</h1>
        <p className="text-[14px] text-[#64748B] mt-1">Analyze past evaluations and track your startup progress over time.</p>
      </div>

      {rooms.length === 0 ? (
        <div className="glass-card rounded-2xl p-14 text-center flex flex-col items-center card-glow">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-5">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-[20px] font-semibold mb-2 text-[#1E293B]">No Reports Yet</h3>
          <p className="text-[14px] text-[#64748B] max-w-md mx-auto mb-8 leading-relaxed">
            Complete a session with at least 3 messages, then click &quot;Generate Report&quot; inside the session.
          </p>
          <Link href="/dashboard" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold text-[14px] transition-all duration-200 shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)]">
            Go to Audit Sessions
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {rooms.map((room) => {
            const report = safeParseReport(room.report);
            if (!report) return null;
            return (
              <Link key={room.roomId} href={`/dashboard/reports/${room.roomId}`} className="block group">
                <div className="glass-card rounded-2xl p-5 flex items-center gap-5 transition-all duration-200 card-glow">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    report.score >= 7 ? 'bg-green-50 border border-green-100' :
                    report.score >= 4 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'
                  }`}>
                    <BarChart3 className={`w-5 h-5 ${
                      report.score >= 7 ? 'text-green-500' : report.score >= 4 ? 'text-amber-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#1E293B] truncate group-hover:text-indigo-600 transition-colors">{room.ideaName}</h3>
                    <p className="text-[12px] text-[#64748B] mt-0.5 truncate">{report.summary || 'Report generated'}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div>
                      <span className={`text-[24px] font-black ${
                        report.score >= 7 ? 'text-green-500' : report.score >= 4 ? 'text-amber-500' : 'text-red-500'
                      }`}>{report.score}</span>
                      <span className="text-[11px] text-[#94A3B8]">/10</span>
                      {report.decision && (
                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                          report.decision === 'PROCEED' ? 'text-green-600' :
                          report.decision === 'PIVOT' ? 'text-amber-600' : 'text-red-600'
                        }`}>{report.decision}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-indigo-500 transition-all duration-200 group-hover:translate-x-0.5" />
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
