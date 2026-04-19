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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { ideaName, description, agentId } = body ?? {};

    if (!ideaName || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const roomId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).set({
      roomId,
      userId: session.userId,
      ideaName,
      description,
      agentId: agentId || 'THE EQUALS',
      createdAt: new Date().toISOString()
    });

    const introMsg = `Welcome to your Audit Session for "${ideaName}".\nThe Audit Panel is ready. Submit your core assumptions to begin the stress-testing sequence.`;
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

