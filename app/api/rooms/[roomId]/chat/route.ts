import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import { FieldValue } from 'firebase-admin/firestore';
import { parseDecision } from '@/lib/decision-parser';

export const maxDuration = 60;

// ─── Persona Instructions ─────────────────────────────────────────────────────

const PERSONA_INSTRUCTIONS: Record<string, string> = {
  'Investor Lens':
    'You are a top-tier Venture Capitalist evaluating a startup pitch. Focus on market size, unit economics, defensibility, scalability, and exit potential. Challenge assumptions about CAC, LTV, and revenue models. Be concise and skeptical.',
  'Tech Architect':
    'You are a Staff Engineer and CTO evaluating technical feasibility. Focus on architecture, infrastructure scaling, tech debt, build-vs-buy decisions, and engineering bottlenecks. Be direct and concise.',
  'Market Scout':
    'You are a Go-To-Market expert and competitive analyst. Focus on market trends, competitor landscape, differentiation, and distribution channels. Challenge the unique value proposition.',
};

const DEFAULT_INSTRUCTION =
  'You are a ruthless, highly analytical due diligence audit engine. Stress-test every assumption.';

// ─── Write Guard ──────────────────────────────────────────────────────────────

function isValidWritePayload(
  response: string,
  latency: number,
  timestamp: string
): boolean {
  return (
    typeof response  === 'string' && response.length > 0 &&
    typeof latency   === 'number' && isFinite(latency) && latency >= 0 &&
    typeof timestamp === 'string' && timestamp.length > 0
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  // Outer error boundary — prevents unhandled rejections crashing the server
  try {
    const { roomId } = await params;

    const session = await getSession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    // Guard: safe JSON body parse
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new NextResponse('Invalid JSON body', { status: 400 });
    }

    const { message, chatHistory = [], agentId, roomContext } = body ?? {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new NextResponse('Message is required', { status: 400 });
    }

    // Cast chatHistory to a safe array in case client sends garbage
    const safeHistory: any[] = Array.isArray(chatHistory) ? chatHistory : [];

    if (!adminDb) {
      console.error('[chat/route] Firebase Admin not initialized');
      return new NextResponse('Service unavailable', { status: 503 });
    }

    // Auth + room ownership
    const roomRef = adminDb.collection('ideaRooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return new NextResponse('Room not found', { status: 404 });
    const roomData = roomDoc.data()!;
    if (roomData.userId !== session.userId) return new NextResponse('Forbidden', { status: 403 });

    // ── AI Inference ────────────────────────────────────────────────────────

    const startTime = performance.now();
    let aiResponse   = '';
    let parsedDecision = 'UNKNOWN';
    let inferenceError = false;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY environment variable not set');

      // @google/genai v1.x correct API: use ai.models.generateContent, NOT getGenerativeModel()
      const genAI = new GoogleGenAI({ apiKey });

      const systemInstruction = `YOU ARE A RUTHLESS, HIGHLY ANALYTICAL DUE DILIGENCE AUDIT ENGINE.
YOUR SOLE PURPOSE IS TO STRESS-TEST STARTUP IDEAS.

YOU MUST FOLLOW THIS EXACT STRUCTURE IN YOUR RESPONSE WITHOUT FAIL.

DECISION:
[PROCEED, PIVOT, or REJECT]

Executive Verdict:
[1-2 sentence core reasoning]

Why This May Fail:
[Key vulnerability analysis]

Key Risks to Address:
[Specific critical points]

What Needs to Change:
[Hard, actionable directives]

${PERSONA_INSTRUCTIONS[agentId] ?? DEFAULT_INSTRUCTION}

EVALUATION CONTEXT:
Idea: ${roomContext?.ideaName ?? 'Unknown'}
Description: ${roomContext?.description ?? 'No description provided'}

Be concise and direct. Responses should be under 200 words.`.trim();

      // Build contents: history + current user message
      const contents = [
        ...safeHistory,
        { role: 'user', parts: [{ text: message.trim() }] },
      ];

      // Hard timeout: AbortController connected to a manual check.
      // Note: @google/genai v1.x does not accept AbortSignal directly,
      // so we race against a timeout promise instead.
      const timeoutMs = 55_000; // 5s buffer before Next.js maxDuration=60s

      const inferencePromise = genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: { systemInstruction },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI inference timed out after 55 seconds')), timeoutMs)
      );

      const result = await Promise.race([inferencePromise, timeoutPromise]);

      // @google/genai v1.x: response text is accessed via result.text (getter)
      aiResponse = (result as any)?.text ?? '';

      if (!aiResponse.trim()) {
        throw new Error('AI returned an empty response');
      }

      parsedDecision = parseDecision(aiResponse);

    } catch (aiError: any) {
      inferenceError = true;
      console.error('[chat/route] AI inference error:', aiError?.message ?? aiError);
      aiResponse =
        'The audit could not be completed due to processing constraints. Please retry.';
      parsedDecision = 'ERROR';
    }

    const endTime  = performance.now();
    const latency  = Math.round(endTime - startTime);
    const tokens   = Math.ceil(aiResponse.length / 4);
    const now      = new Date().toISOString();

    // ── Database Write Safety ───────────────────────────────────────────────

    if (!isValidWritePayload(aiResponse, latency, now)) {
      console.error('[chat/route] Write guard failed — refusing partial write');
      return new NextResponse('Internal data integrity error', { status: 500 });
    }

    const batch     = adminDb.batch();
    const userMsgId = uuidv4();
    const aiMsgId   = uuidv4();

    batch.set(roomRef.collection('messages').doc(userMsgId), {
      messageId: userMsgId,
      roomId,
      userId:    session.userId,
      sender:    'user',
      content:   message.trim(),
      timestamp: now,
    });

    batch.set(roomRef.collection('messages').doc(aiMsgId), {
      messageId: aiMsgId,
      roomId,
      userId:    session.userId,
      sender:    'ai',
      content:   aiResponse,
      latency,
      estimatedTokens: tokens,
      decision:  parsedDecision,
      timestamp: now,
      inferenceError,
    });

    // FieldValue is a top-level import — safe to use synchronously
    batch.update(roomRef, {
      messageCount:  FieldValue.increment(2),
      lastLatency:   latency,
      lastTokens:    tokens,
      lastDecision:  parsedDecision,
      lastTimestamp: now,
    });

    await batch.commit();

    return NextResponse.json({
      success:    true,
      aiResponse,
      latency,
      tokens,
      decision:   parsedDecision,
      aiMsgId,
      inferenceError,
    });

  } catch (error: any) {
    // Outer catch — prevents any unhandled rejection from crashing the process
    console.error('[chat/route] Critical unhandled error:', error?.message ?? error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
