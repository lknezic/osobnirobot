import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

// Admin-only emails that can access the flywheel endpoint
const ADMIN_EMAILS = ['luka@instantworker.ai', 'admin@instantworker.ai'];

/** GET /api/improvements - Harvest improvement suggestions from all running workers */
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only check
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/improvements`, {
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to harvest improvements' },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Improvements error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
