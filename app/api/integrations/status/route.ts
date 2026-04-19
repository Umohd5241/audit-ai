import { NextResponse } from 'next/server';

// This endpoint checks if the bot backends are actually configured
// by verifying that the required environment variables are set.
// It does NOT reveal the actual tokens — just whether they exist.
export async function GET() {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramUsername = process.env.TELEGRAM_BOT_USERNAME;
  
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_ID;

  const telegram = {
    configured: !!(telegramToken && telegramToken.trim() !== ''),
    botUsername: telegramUsername || null,
  };

  const whatsapp = {
    // Check both Twilio and Meta Cloud API
    twilio: !!(twilioSid && twilioSid.trim() !== '' && twilioToken && twilioToken.trim() !== ''),
    meta: !!(metaToken && metaToken.trim() !== '' && metaPhoneId && metaPhoneId.trim() !== ''),
    configured: false,
  };
  whatsapp.configured = whatsapp.twilio || whatsapp.meta;

  return NextResponse.json({
    telegram,
    whatsapp,
  });
}
