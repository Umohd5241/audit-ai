import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'No idToken provided' }, { status: 400 });
    }
    
    await createSession(idToken);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const { removeSession } = await import('@/lib/auth');
  await removeSession();
  return NextResponse.json({ success: true });
}
