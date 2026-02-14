import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'InstantWorkerBot';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
  }

  // Verify employee belongs to user
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, name, worker_config')
    .eq('id', employeeId)
    .eq('user_id', user.id)
    .single();

  if (error || !employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const isConnected = !!(employee.worker_config as Record<string, unknown>)?.telegram_chat_id;

  return NextResponse.json({
    connectUrl: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${employeeId}`,
    isConnected,
    botUsername: TELEGRAM_BOT_USERNAME,
  });
}

// Disconnect Telegram
export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
  }

  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, worker_config')
    .eq('id', employeeId)
    .eq('user_id', user.id)
    .single();

  if (error || !employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const config = { ...(employee.worker_config as Record<string, unknown> || {}) };
  delete config.telegram_chat_id;

  await supabase
    .from('employees')
    .update({ worker_config: config })
    .eq('id', employeeId);

  return NextResponse.json({ success: true });
}
