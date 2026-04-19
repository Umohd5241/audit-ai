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
      return NextResponse.json({ error: 'Firebase Admin SDK is not properly initialized.' }, { status: 500 });
    }

    // Whitelist allowed fields to prevent arbitrary writes
    const allowed: Record<string, any> = {};
    const allowedKeys = ['displayName', 'phoneNumber', 'telegramHandle', 'whatsappNotify', 'emailNotify', 'highContrast'];
    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        allowed[key] = updates[key];
      }
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    allowed.updatedAt = new Date().toISOString();

    await adminDb.collection('users').doc(session.userId).set(allowed, { merge: true });

    // Read back to confirm the write succeeded
    const confirmDoc = await adminDb.collection('users').doc(session.userId).get();
    const savedData = confirmDoc.exists ? confirmDoc.data() : null;

    return NextResponse.json({ 
      success: true, 
      saved: allowed,
      confirmed: !!savedData
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.code === 8) {
      return NextResponse.json({ error: 'Database Quota Exceeded. Your changes were NOT saved. Please try again tomorrow or upgrade the Firebase plan.' }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET: Return current user data to verify persistence
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    const userDoc = await adminDb.collection('users').doc(session.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: userDoc.data() });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
