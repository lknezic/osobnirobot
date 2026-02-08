import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3500';
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || '';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { assistantName, personality } = await request.json();

    if (!assistantName) {
      return NextResponse.json({ error: 'assistantName is required' }, { status: 400 });
    }

    // Call orchestrator to provision container
    const response = await fetch(`${ORCHESTRATOR_URL}/api/containers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-orchestrator-secret': ORCHESTRATOR_SECRET,
      },
      body: JSON.stringify({
        userId: user.id,
        assistantName,
        personality: personality || '',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Orchestrator error:', error);
      return NextResponse.json({ error: 'Failed to provision container' }, { status: 500 });
    }

    const containerInfo = await response.json();

    // Save container info to Supabase profile
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      assistant_name: assistantName,
      assistant_personality: personality || '',
      container_status: containerInfo.container.status,
      container_gateway_port: containerInfo.container.gatewayPort,
      container_novnc_port: containerInfo.container.novncPort,
      container_token: containerInfo.container.gatewayToken,
      plan: 'trial',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      onboarding_completed: true,
    });

    return NextResponse.json({
      success: true,
      status: containerInfo.container.status,
    });
  } catch (err: any) {
    console.error('Provision error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
