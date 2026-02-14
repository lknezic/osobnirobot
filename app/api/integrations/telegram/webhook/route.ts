import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Use service role for writing to DB
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function sendTelegramMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

export async function POST(request: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const message = body.message;
    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // Handle /start command with employee ID
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const employeeId = parts[1];

      if (!employeeId) {
        await sendTelegramMessage(chatId, 'Welcome to InstantWorker! To connect a worker, use the link from your dashboard Settings tab.');
        return NextResponse.json({ ok: true });
      }

      // Validate employee exists
      const supabase = getServiceClient();
      const { data: employee, error } = await supabase
        .from('employees')
        .select('id, name, worker_type, worker_config, user_id')
        .eq('id', employeeId)
        .single();

      if (error || !employee) {
        await sendTelegramMessage(chatId, 'Invalid worker link. Please use the connect link from your dashboard.');
        return NextResponse.json({ ok: true });
      }

      // Save telegram_chat_id in worker_config
      const updatedConfig = { ...(employee.worker_config || {}), telegram_chat_id: chatId };
      await supabase
        .from('employees')
        .update({ worker_config: updatedConfig })
        .eq('id', employeeId);

      // Hot-update container config via orchestrator
      try {
        await fetch(`${ORCHESTRATOR_URL}/config/${employeeId}/channel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ORCHESTRATOR_SECRET}`,
          },
          body: JSON.stringify({ channel: 'telegram', config: { chat_id: chatId, bot_token: TELEGRAM_BOT_TOKEN } }),
        });
      } catch {
        // Container config update is best-effort
      }

      await sendTelegramMessage(
        chatId,
        `Connected! <b>${employee.name}</b> (${employee.worker_type.replace(/-/g, ' ')}) will now send you notifications here.\n\nYou'll get alerts when:\n- Your worker needs your attention\n- Content is ready for approval\n- Important status changes occur`
      );

      return NextResponse.json({ ok: true });
    }

    // Handle /status command
    if (text === '/status') {
      const supabase = getServiceClient();
      // Find employee linked to this chat ID
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name, container_status, worker_type')
        .filter('worker_config->>telegram_chat_id', 'eq', chatId);

      if (!employees || employees.length === 0) {
        await sendTelegramMessage(chatId, 'No workers connected to this chat. Connect a worker from your dashboard first.');
        return NextResponse.json({ ok: true });
      }

      const lines = employees.map(e => {
        const status = e.container_status === 'running' ? '🟢' : e.container_status === 'error' ? '🔴' : '⚪';
        return `${status} <b>${e.name}</b> — ${e.worker_type.replace(/-/g, ' ')}`;
      });

      await sendTelegramMessage(chatId, `Your workers:\n\n${lines.join('\n')}`);
      return NextResponse.json({ ok: true });
    }

    // Handle /disconnect command
    if (text === '/disconnect') {
      const supabase = getServiceClient();
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name, worker_config')
        .filter('worker_config->>telegram_chat_id', 'eq', chatId);

      if (employees && employees.length > 0) {
        for (const emp of employees) {
          const config = { ...(emp.worker_config || {}) };
          delete config.telegram_chat_id;
          await supabase.from('employees').update({ worker_config: config }).eq('id', emp.id);
        }
        await sendTelegramMessage(chatId, `Disconnected ${employees.length} worker(s). You won't receive notifications here anymore.`);
      } else {
        await sendTelegramMessage(chatId, 'No workers connected to this chat.');
      }
      return NextResponse.json({ ok: true });
    }

    // Default response
    await sendTelegramMessage(
      chatId,
      'Available commands:\n/status — Check your workers\n/disconnect — Stop notifications\n\nTo connect a worker, use the link in your dashboard Settings tab.'
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
