import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { CHAT_INSTRUCTIONS } from '@/lib/ai-config';

// Webhook Verification for Meta (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'judge_ai_secret_verify';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('META WEBHOOK VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Verification failed', { status: 403 });
}

// Webhook Message Handling for Meta (POST)
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('META WEBHOOK RECEIVED:', JSON.stringify(data, null, 2));

    if (!adminDb) {
        console.error('Firebase Admin SDK is not properly initialized.');
        return new NextResponse('OK', { status: 200 });
    }

    // Entry point for Meta Cloud API events
    const entry = data.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return new NextResponse('OK', { status: 200 });
    }

    const fromPhone = message.from; // Sender's phone number
    const body = message.text?.body?.trim();
    const bodyUpper = body?.toUpperCase();

    if (!body) return new NextResponse('OK', { status: 200 });

    // Identify user
    let userId = null;
    const userQuery = await adminDb.collection('users').where('phoneNumber', '==', fromPhone).limit(1).get();
    if (!userQuery.empty) {
      userId = userQuery.docs[0].id;
    }

    // Handle START_ command to link session
    if (bodyUpper?.startsWith('START_')) {
      const roomId = bodyUpper.replace('START_', '').trim();
      const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();

      if (roomDoc.exists) {
        await adminDb.collection('whatsappSessions').doc(fromPhone).set({
          roomId,
          userId: userId || roomDoc.data()?.userId,
          updatedAt: new Date().toISOString()
        });

        await sendMetaMessage(fromPhone, "✅ Synced with Meta! Your pitches here will now be judged by the Idea Room panel.");
        return new NextResponse('OK', { status: 200 });
      }
    }

    // Logic for processing pitch messages
    const sessionDoc = await adminDb.collection('whatsappSessions').doc(fromPhone).get();
    if (!sessionDoc.exists) {
       await sendMetaMessage(fromPhone, "Welcome! To start, go to your dashboard and click 'Open in WhatsApp' to link this chat to an Idea Room.");
       return new NextResponse('OK', { status: 200 });
    }

    const { roomId, userId: sessionUserId } = sessionDoc.data()!;
    
    // Log user message
    const msgId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(msgId).set({
        messageId: msgId,
        roomId,
        userId: sessionUserId,
        sender: 'user',
        content: body,
        timestamp: new Date().toISOString()
    });

    // AI Response Logic
    const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();
    const roomData = roomDoc.data();

    // Fetch history
    const historySnapshot = await adminDb.collection('ideaRooms').doc(roomId).collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(10)
        .get();
        
    const history = historySnapshot.docs.map(doc => ({
        role: doc.data().sender === 'user' ? 'user' : 'model',
        parts: [{ text: doc.data().content }]
    }));

    const modelName = 'gemini-2.0-flash';
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('API Configuration Missing.');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: `${CHAT_INSTRUCTIONS}\n\nEvaluating Idea Room: ${roomData?.ideaName}. Description: ${roomData?.description}.`
    });

    const result = await model.generateContent({
        contents: history as any,
    });
    
    const aiText = result.response.text() || "The Audit Panel is currently locked in debate. Please re-submit your assumption.";

    // Log AI Message
    const aiMsgId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(aiMsgId).set({
        messageId: aiMsgId,
        roomId,
        userId: sessionUserId,
        sender: 'ai',
        content: aiText,
        timestamp: new Date().toISOString()
    });

    // Send back to Meta
    await sendMetaMessage(fromPhone, aiText);

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('META WEBHOOK ERROR:', error);
    return new NextResponse('OK', { status: 200 }); // Always return 200 to Meta to avoid retries
  }
}

async function sendMetaMessage(to: string, text: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!accessToken || !phoneId) {
    console.error('META API CREDENTIALS MISSING');
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: text }
      })
    });

    const result = await response.json();
    console.log('META SEND RESULT:', result);
  } catch (err) {
    console.error('META SEND ERROR:', err);
  }
}
