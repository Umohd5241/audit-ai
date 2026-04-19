import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const correctUrl = `${url.origin}/api/whatsapp`;
  
  return new NextResponse(`
Oops! You've reached the API root.

If you are setting up your Twilio Webhook, you used the WRONG URL.
Please update your Twilio Console to use the FULL URL:

CORRECT URL: ${correctUrl}

Make sure there are no commas (,) at the end of the URL.
  `, { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
