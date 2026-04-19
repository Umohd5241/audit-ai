import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    if (!adminDb) {
       return NextResponse.json({ success: false, error: 'DB not initialized' });
    }

    const roomsSnapshot = await adminDb.collection('ideaRooms')
      .where('userId', '==', session.userId)
      .get();

    let totalRequests = 0;
    let totalLatency = 0;
    let totalTokens = 0;
    let roomCount = roomsSnapshot.size;

    roomsSnapshot.forEach(doc => {
      const data = doc.data();
      totalRequests += data.messageCount || 0;
      totalLatency += data.lastLatency || 0;
      totalTokens += data.lastTokens || 0; // This is a simplification; ideally we'd sum all messages
    });

    // Average latency based on rooms that have it
    const avgLatency = roomCount > 0 ? Math.round(totalLatency / roomCount) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        latency: avgLatency,
        tokens: totalTokens,
        requests: totalRequests,
        errorRate: 0.0, // We'll keep this at 0 for now until we have error logging
      }
    });
  } catch (error) {
    console.error('STATS ERROR:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
