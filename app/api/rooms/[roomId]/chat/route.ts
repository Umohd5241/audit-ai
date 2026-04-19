import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { message, aiResponse } = await req.json();
    if (!message && !aiResponse) return new NextResponse('Data required', { status: 400 });

    if (!adminDb) {
      throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
    }

    const roomRef = adminDb.collection('ideaRooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return new NextResponse('Room not found', { status: 404 });
    
    const roomData = roomDoc.data()!;
    if (roomData.userId !== session.userId) return new NextResponse('Forbidden', { status: 403 });

    // Log message + increment counter in parallel
    const batch = adminDb.batch();

    if (message) {
        const msgId = uuidv4();
        batch.set(roomRef.collection('messages').doc(msgId), {
          messageId: msgId,
          roomId,
          userId: session.userId,
          sender: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });
        // Increment message count on room doc
        const { FieldValue } = await import('firebase-admin/firestore');
        batch.update(roomRef, { messageCount: FieldValue.increment(1) });
    }

    if (aiResponse) {
        const aiMsgId = uuidv4();
        batch.set(roomRef.collection('messages').doc(aiMsgId), {
          messageId: aiMsgId,
          roomId,
          userId: session.userId,
          sender: 'ai',
          content: aiResponse,
          timestamp: new Date().toISOString()
        });
        const { FieldValue } = await import('firebase-admin/firestore');
        batch.update(roomRef, { messageCount: FieldValue.increment(1) });
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LOG CHAT ERROR:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
