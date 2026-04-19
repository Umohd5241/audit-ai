import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Firestore batch limit is 500 operations per commit
const BATCH_SIZE = 450;

async function deleteInBatches(docs: QueryDocumentSnapshot[]): Promise<void> {
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = adminDb!.batch();
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    if (!session?.userId) return new NextResponse('Unauthorized', { status: 401 });

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();
    if (!roomDoc.exists || roomDoc.data()?.userId !== session.userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete all messages — in chunks to respect the 500-op Firestore batch limit
    const messagesSnapshot = await adminDb
      .collection('ideaRooms')
      .doc(roomId)
      .collection('messages')
      .get();

    await deleteInBatches(messagesSnapshot.docs);

    // Delete associated reports
    const reportsSnapshot = await adminDb
      .collection('reports')
      .where('roomId', '==', roomId)
      .get();

    if (!reportsSnapshot.empty) {
      await deleteInBatches(reportsSnapshot.docs);
    }

    return NextResponse.json({ success: true, message: 'Audit Session reset successfully' });
  } catch (error: any) {
    console.error('[reset/route] Reset room error:', error?.message ?? error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
