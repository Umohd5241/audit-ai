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
      throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
    }

    const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();
    if (!roomDoc.exists || roomDoc.data()?.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
    }

    const messagesSnapshot = await adminDb.collection('ideaRooms').doc(roomId).collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
      
    // Reverse to get chronological order for the UI
    const messages = messagesSnapshot.docs.reverse().map(doc => {
      const data = doc.data();
      return {
        id: data.messageId || doc.id,
        sender: data.sender,
        content: data.content,
        timestamp: data.timestamp
      };
    });
    
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
