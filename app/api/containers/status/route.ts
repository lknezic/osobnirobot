import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3500';
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || '';

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get container status from orchestrator
    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/containers/status/${user.id}`,
      {
        headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ exists: false, status: 'none' });
    }

    const data = await response.json();

    // Also get profile data for gateway token
    const { data: profile } = await supabase
      .from('profiles')
      .select('container_token, container_gateway_port, container_novnc_port, assistant_name, plan, trial_ends_at')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      ...data,
      gatewayToken: profile?.container_token,
      assistantName: profile?.assistant_name,
      plan: profile?.plan,
      trialEndsAt: profile?.trial_ends_at,
    });
  } catch (err: any) {
    console.error('Status error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
