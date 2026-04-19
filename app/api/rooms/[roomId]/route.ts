import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
    }

    const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();
    if (!roomDoc.exists || roomDoc.data()?.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, room: roomDoc.data() });
  } catch (error: any) {
    console.error('Fetch room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
