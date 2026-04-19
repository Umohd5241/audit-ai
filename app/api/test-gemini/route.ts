import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBQ7jTiKhV0qB1xu4byPiVY7vBOHa7Rp1s";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    // const session = await getSession();
    // if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const text = response.text();
    
    return NextResponse.json({ 
      success: true, 
      message: "Gemini API is working correctly", 
      response: text,
      keyUsed: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Unknown error",
      stack: error.stack
    }, { status: 500 });
  }
}
