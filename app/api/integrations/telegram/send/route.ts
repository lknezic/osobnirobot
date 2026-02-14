import { NextRequest, NextResponse } from 'next/server';
import { ORCHESTRATOR_SECRET } from '@/lib/constants';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

/**
 * Internal endpoint for orchestrator/containers to send Telegram notifications.
 * Authenticated with ORCHESTRATOR_SECRET.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${ORCHESTRATOR_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 503 });
  }

  const { chatId, text } = await request.json();
  if (!chatId || !text) {
    return NextResponse.json({ error: 'Missing chatId or text' }, { status: 400 });
  }

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Telegram API error: ${err}` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
