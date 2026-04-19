import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    if (!adminDb) {
      throw new Error('Firebase Admin SDK is not properly initialized.');
    }

    await adminDb.collection('users').doc(session.userId).set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    if (error?.message?.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json({ error: 'Database Quota Exceeded. Custom settings cannot be permanently saved.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
