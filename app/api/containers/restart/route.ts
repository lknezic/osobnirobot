import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3500';
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || '';

export async function POST() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-orchestrator-secret': ORCHESTRATOR_SECRET,
      },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Orchestrator restart error:', text);
      return NextResponse.json({ error: 'Failed to restart container' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
