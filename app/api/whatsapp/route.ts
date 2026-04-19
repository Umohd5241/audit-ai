import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';
import twilio from 'twilio';
import { CHAT_INSTRUCTIONS } from '@/lib/ai-config';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

const SYSTEM_INSTRUCTION = `You are the ultimate AI Startup Mentor panel, modeled after top-tier Y Combinator partners and merciless venture capitalists. You do not sugarcoat things, and you do not give generic encouragement. Your goal is to heavily stress-test the user's startup idea.

You consist of 4 distinct personas:
1. Investor (Focus: Market size, unit economics, customer acquisition cost, defensibility, and ROI)
2. Technical Expert (Focus: Architecture, feasibility, scaling bottlenecks, technical moat)
3. Legal/Compliance (Focus: Regulatory hurdles, liability, IP protection, data privacy)
4. Devil's Advocate (Focus: Fatal flaws, existential risks, "why this will fail in 6 months")

Rules of Engagement:
1. BE BRUTALLY HONEST: Tear the idea apart constructively. Seek failure points immediately (e.g., "Why would anyone pay for this?", "How is this not just a feature of X?").
2. NO GENERIC ADVICE: Do not give boilerplate feedback like "marketing is key." Give specific, actionable, and incisive analysis based strictly on the user's details.
3. BE CONCISE BUT DENSE: Pack maximum insight into short sentences. WhatsApp messages shouldn't be full essays.
4. STAY IN CHARACTER: If the user drifts off-topic, reply ONLY with: "I'm here to validate your business. Let's focus on the startup idea."

Always format your response exactly using these sections, using bolding for emphasis:
*1. Executive Verdict* (1-2 sentences summarizing the viability)
*2. Investor Perspective*
*3. Technical Feasibility*
*4. Legal & Regulatory*
*5. Existential Risks*
*6. Hard Questions to Answer* (List 2-3 specific questions the founder MUST answer)
*7. Readiness Score: [X/10]*

If the user is just starting, demand they clarify their target customer or revenue model.`;

function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const webhookUrl = `${url.origin}/api/whatsapp`;
  return new NextResponse(`WhatsApp Webhook is ACTIVE.

To test, send "PING" to your Twilio number.
Ensure your Twilio Webhook URL is set to EXACTLY this (copy-paste it):
${webhookUrl}

IMPORTANT: Check for a trailing comma (,) in your Twilio Console and REMOVE IT.
The URL should NOT end with a comma.

Method: POST
Status: ${adminDb ? 'Firebase Initialized' : 'Firebase Missing Credentials'}`, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

export async function POST(req: Request) {
  console.log('Incoming WhatsApp Webhook request...');
  try {
    const text = await req.text();
    console.log('Request body received:', text);
    const params = new URLSearchParams(text);
    const fromPhone = params.get('From'); // e.g. "whatsapp:+1234567890"
    const body = params.get('Body')?.trim() || '';
    const bodyUpper = body.toUpperCase();

    console.log('From:', fromPhone, 'Body:', body);

    // 1. PING Command (Zero dependencies)
    if (bodyUpper === 'PING') {
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Message>PONG! Webhook is receiving your messages.</Message></Response>', { 
            status: 200, 
            headers: { 'Content-Type': 'text/xml' } 
        });
    }

    // 2. DEBUG Command (Check environment)
    if (bodyUpper === 'DEBUG') {
        const status = [
            `Firebase: ${adminDb ? 'OK' : 'MISSING'}`,
            `Twilio SID: ${process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING'}`,
            `Gemini Key: ${process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'SET' : 'MISSING'}`,
            `User Found: ${fromPhone ? 'YES' : 'NO'}`
        ].join('\n');
        return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>DEBUG STATUS:\n${escapeXml(status)}</Message></Response>`, { 
            status: 200, 
            headers: { 'Content-Type': 'text/xml' } 
        });
    }

    if (!fromPhone) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error: Missing sender info.</Message></Response>', { 
        status: 200, 
        headers: { 'Content-Type': 'text/xml' } 
      });
    }
    
    // Extract raw phone number out of "whatsapp:+..."
    const cleanPhone = fromPhone.replace('whatsapp:', '').replace(/[^0-9+]/g, '');

    if (!adminDb) {
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Message>System Error: Firebase is not configured. Check FIREBASE_PRIVATE_KEY.</Message></Response>', { 
            status: 200, 
            headers: { 'Content-Type': 'text/xml' } 
        });
    }

    // Attempt to identify the user based on phone
    let userId = null;
    try {
        const userQuery = await adminDb.collection('users').where('phoneNumber', '==', cleanPhone).limit(1).get();
        if (!userQuery.empty) {
            userId = userQuery.docs[0].id;
        }
    } catch (dbErr) {
        console.error('User lookup error:', dbErr);
    }

    // Handle START commands to join rooms (Case insensitive)
    if (body.toUpperCase().startsWith('START_')) {
      const roomId = body.toUpperCase().replace('START_', '').trim();
      
      const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();
      if (!roomDoc.exists) {
          const errorMsg = `Room not found (${roomId}). Please verify the ID and try again.`;
          return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(errorMsg)}</Message></Response>`, { 
            status: 200, 
            headers: { 'Content-Type': 'text/xml' } 
          });
      }
      const room = roomDoc.data()!;

      // Update session
      await adminDb.collection('whatsappSessions').doc(cleanPhone).set({
          phoneNumber: cleanPhone,
          currentRoomId: roomId,
          userId: userId,
          updatedAt: new Date().toISOString()
      }, { merge: true });

      const msg = `Synced! You've joined the Idea Room: "${room.ideaName}".\n\nI'm ready when you are. Tell me more about your idea, your target customer, or your monetization strategy.`;
      
      const messageId = uuidv4();
      await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(messageId).set({
          messageId,
          roomId,
          userId: room.userId,
          sender: 'ai',
          content: msg,
          timestamp: new Date().toISOString()
      });
      
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(msg)}</Message></Response>`, { 
        status: 200, 
        headers: { 'Content-Type': 'text/xml' } 
      });
    }

    // Normal message flow - Check session
    const sessionDoc = await adminDb.collection('whatsappSessions').doc(cleanPhone).get();
    
    if (!sessionDoc.exists || !sessionDoc.data()?.currentRoomId) {
      const inviteMsg = 'You are not in an active Idea Room. Please go to the dashboard and click "Open in WhatsApp" for your idea.';
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(inviteMsg)}</Message></Response>`, { 
        status: 200, 
        headers: { 'Content-Type': 'text/xml' } 
      });
    }

    const roomId = sessionDoc.data()!.currentRoomId;
    const activeUserId = sessionDoc.data()!.userId;
    
    // Save user message to database
    const userMessageId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(userMessageId).set({
        messageId: userMessageId,
        roomId,
        userId: activeUserId || 'unknown',
        sender: 'user',
        content: body,
        timestamp: new Date().toISOString()
    });

    let aiResponseText = "";

    // Check if AI (Gemini) is integrated/configured
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      aiResponseText = `Your message received: ${body}`;
    } else {
      try {
          const messagesSnapshot = await adminDb.collection('ideaRooms').doc(roomId).collection('messages')
              .orderBy('timestamp', 'desc')
              .limit(10)
              .get();

          const history = messagesSnapshot.docs.map(doc => doc.data());
          history.reverse(); 

          const chatContents = history.map(h => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }]
          }));
          
          const model = 'gemini-3-flash-preview';
          const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
          if (!apiKey) throw new Error('GEMINI_API_KEY missing');
          
          const aiInstance = new GoogleGenAI({ apiKey });

          const result = await aiInstance.models.generateContent({
              model,
              contents: chatContents,
              config: {
                  systemInstruction: CHAT_INSTRUCTIONS
              }
          });
          aiResponseText = result.text || "The Audit Panel is currently reviewing your pitch in silence. Please provide more detail.";
      } catch (e) {
          console.error("Gemini Error:", e);
          aiResponseText = "There was an error communicating with the AI panel. Please try again.";
      }
    }

    // Save AI response to database
    const aiMessageId = uuidv4();
    await adminDb.collection('ideaRooms').doc(roomId).collection('messages').doc(aiMessageId).set({
        messageId: aiMessageId,
        roomId,
        userId: activeUserId || 'unknown',
        sender: 'ai',
        content: aiResponseText,
        timestamp: new Date().toISOString()
    });

    // Return the response in TwiML format as requested
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(aiResponseText)}</Message>
</Response>`;

    return new NextResponse(twiml, { 
      status: 200, 
      headers: { 'Content-Type': 'text/xml' } 
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>An internal server error occurred. Please try again later.</Message>
</Response>`;
    return new NextResponse(errorTwiml, { 
      status: 200, 
      headers: { 'Content-Type': 'text/xml' } 
    });
  }
}
