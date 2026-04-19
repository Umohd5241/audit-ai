import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getGroqClient, GROQ_MODEL, formatHistoryForGroq } from '@/lib/ai-client';
import { v4 as uuidv4 } from 'uuid';
import { CHAT_INSTRUCTIONS } from '@/lib/ai-config';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('TELEGRAM WEBHOOK RECEIVED:', JSON.stringify(data, null, 2));

    if (!adminDb) {
        console.error('Firebase Admin SDK is not properly initialized.');
        return new NextResponse('OK', { status: 200 }); // Return OK to Telegram even if system error to stop retries
    }

    const message = data.message;
    if (!message) return new NextResponse('OK', { status: 200 });

    const chatId = message.chat.id;
    const text = message.text?.trim() || '';
    const textUpper = text.toUpperCase();

    // 1. Handle /start command to join a room
    // Telegram sends /start roomId
    if (textUpper.startsWith('/START')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const roomId = parts[1].trim();
        const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();

        if (roomDoc.exists) {
          await adminDb.collection('telegramSessions').doc(chatId.toString()).set({
            roomId,
            userId: roomDoc.data()?.userId,
            chatId: chatId.toString(),
            updatedAt: new Date().toISOString()
          });

          await sendTelegramMessage(chatId, `✅ Successfully linked to: "${roomDoc.data()?.ideaName}"\n\nI am your AI Judge. Pitch me your idea, and I will analyze its viability.`);
          return new NextResponse('OK', { status: 200 });
        } else {
          await sendTelegramMessage(chatId, `❌ Room not found: ${roomId}`);
          return new NextResponse('OK', { status: 200 });
        }
      } else {
        await sendTelegramMessage(chatId, "Welcome! To link a room, click the 'Chat via Telegram' button in your dashboard.");
        return new NextResponse('OK', { status: 200 });
      }
    }

    // 2. Handle standard messages
    const sessionDoc = await adminDb.collection('telegramSessions').doc(chatId.toString()).get();
    if (!sessionDoc.exists) {
        await sendTelegramMessage(chatId, "Please link a room first by using the link from your dashboard.");
        return new NextResponse('OK', { status: 200 });
    }

    const { roomId, userId } = sessionDoc.data()!;

    // Log user message
    const msgId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(msgId).set({
        messageId: msgId,
        roomId,
        userId: userId,
        sender: 'user',
        content: text,
        timestamp: new Date().toISOString()
    });

    let aiText = "";
    try {
        const groq = getGroqClient();
        
        const historySnapshot = await adminDb.collection('ideaRooms').doc(roomId).collection('messages')
            .orderBy('timestamp', 'asc')
            .limit(10)
            .get();
            
        const history = historySnapshot.docs.map(doc => doc.data());

        const messages = [
            { role: 'system', content: CHAT_INSTRUCTIONS },
            ...formatHistoryForGroq(history),
            { role: 'user', content: text }
        ];

        const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: messages as any,
            temperature: 0.2,
        });
        
        aiText = completion.choices[0]?.message?.content || "The Audit Panel is silent.";
    } catch (e: any) {
        console.error("Groq Telegram Error:", e);
        aiText = "The Audit Panel is currently facing technical difficulties. Please retry.";
    }

    // Log AI Message
    const aiMsgId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(aiMsgId).set({
        messageId: aiMsgId,
        roomId,
        userId: userId,
        sender: 'ai',
        content: aiText,
        timestamp: new Date().toISOString()
    });

    // Send back to Telegram
    await sendTelegramMessage(chatId, aiText);

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('TELEGRAM WEBHOOK ERROR:', error);
    return new NextResponse('OK', { status: 200 });
  }
}

async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN missing');
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    console.error('TELEGRAM SEND ERROR:', err);
  }
}
