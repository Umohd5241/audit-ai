import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { idToken, email, phoneNumber } = await req.json();

    if (!idToken || !email || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminAuth || !adminDb) {
      throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
    }

    // Verify token to get UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Clean up phone number (remove everything except numbers and '+')
    let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone; // Fallback to assume country code is missing or default
    }

    // Save to Firestore
    await adminDb.collection('users').doc(userId).set({
      userId,
      email,
      phoneNumber: cleanPhone,
      createdAt: new Date().toISOString()
    });

    // Create session cookie
    await createSession(idToken);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Session expired, please register again' }, { status: 401 });
    }
    console.error('Registration API error:', error);
    if (error.message && error.message.includes('Firestore API has not been used')) {
      return NextResponse.json({ error: 'Firestore is disabled in your Firebase project. Please enable "Firestore Database" in the Firebase Console.' }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
