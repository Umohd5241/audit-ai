import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function createSession(idToken: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth is not properly initialized.');
  }
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  const cookieStore = await cookies();
  cookieStore.set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
}

export async function removeSession() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', { maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  if (!adminAuth) {
    console.error('Firebase Admin Auth is not properly initialized.');
    return null;
  }
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { userId: decodedClaims.uid, email: decodedClaims.email };
  } catch (error) {
    return null;
  }
}

