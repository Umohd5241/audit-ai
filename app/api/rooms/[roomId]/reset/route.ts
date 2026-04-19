import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    if (!session?.userId) return new NextResponse('Unauthorized', { status: 401 });

    if (!adminDb) {
      throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
    }

    const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();
    if (!roomDoc.exists || roomDoc.data()?.userId !== session.userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete all messages in the room
    const messagesCollection = adminDb.collection('ideaRooms').doc(roomId).collection('messages');
    const snapshot = await messagesCollection.get();
    
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Also delete report if user wants a full reset
    const reportsSnapshot = await adminDb.collection('reports').where('roomId', '==', roomId).get();
    reportsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Room conversation reset successfully' });
  } catch (error: any) {
    console.error('Reset room error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
