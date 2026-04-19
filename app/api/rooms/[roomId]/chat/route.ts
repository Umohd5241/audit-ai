import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Configuration Missing: Please set your Gemini API Key in Vercel settings.');

      const genAI = new GoogleGenerativeAI(apiKey);
      
      // LOG FINGERPRINT: Masked key for verification
      const fingerprint = `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
      console.log(`[chat/route] Using API Key Fingerprint: ${fingerprint}`);

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

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        systemInstruction,
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      });

      // Simple prompt for now - history support can be added if needed
      const prompt = message.trim();

      const timeoutMs = 55_000;
      const inferencePromise = model.generateContent(prompt);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI inference timed out after 55 seconds')), timeoutMs)
      );

      const result = await Promise.race([inferencePromise, timeoutPromise]);
      const response = await (result as any).response;
      aiResponse = response.text();

      if (!aiResponse.trim()) {
        throw new Error('AI returned an empty response');
      }

      parsedDecision = parseDecision(aiResponse);

    } catch (aiError: any) {
      inferenceError = true;
      const errorMessage = aiError?.message || aiError?.toString() || 'Unknown AI Error';
      console.error('[chat/route] AI inference error:', errorMessage);
      
      // DURING DEBUG: Return the actual error to the UI so we can see it
      aiResponse = `The audit could not be completed: ${errorMessage}`;
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
      success:    !inferenceError,
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
