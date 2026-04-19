import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'adminDb is not initialized. Firebase keys are missing or invalid.' }, { status: 500 });
    }
    
    // Attempt a basic read
    const testDoc = await adminDb.collection('users').limit(1).get();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firestore is fully functional!', 
      docsFound: testDoc.size 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      stack: error.stack 
    }, { status: 500 });
  }
}
