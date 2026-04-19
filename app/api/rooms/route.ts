import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ideaName, description } = await req.json();

    if (!ideaName || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
    }

    const roomId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).set({
      roomId,
      userId: session.userId,
      ideaName,
      description,
      createdAt: new Date().toISOString()
    });

    const introMsg = `Welcome to your Idea Room for "${ideaName}"! 🚀\nI'm your AI Startup Mentor. I will evaluate your idea from the perspectives of an Investor, a Technical Expert, a Legal Advisor, and a Devil’s Advocate.\n\nSend START_${roomId} to me on WhatsApp to sync this room!`;
    const messageId = uuidv4();
    
    await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(messageId).set({
      messageId,
      roomId,
      userId: session.userId,
      sender: 'ai',
      content: introMsg,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, roomId });
  } catch (error: any) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

