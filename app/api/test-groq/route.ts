import { NextResponse } from 'next/server';
import { getGroqClient, GROQ_MODEL } from '@/lib/ai-client';

export async function GET() {
  try {
    const groq = getGroqClient();
    
    const startTime = performance.now();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: 'Say "Groq is Active"' }],
      max_tokens: 20,
    });
    const endTime = performance.now();

    return NextResponse.json({
      success: true,
      message: completion.choices[0]?.message?.content,
      latency: Math.round(endTime - startTime),
      model: GROQ_MODEL,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown Error',
      hint: 'Ensure GROQ_API_KEY is set in your environment variables.',
    }, { status: 500 });
  }
}
