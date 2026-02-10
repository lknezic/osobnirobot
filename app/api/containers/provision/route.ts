import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { sendEmail, welcomeEmail } from '@/lib/email';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3500';
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || '';

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { assistantName, personality, workerType, workerConfig } = await request.json();

    if (!assistantName) {
      return NextResponse.json({ error: 'assistantName is required' }, { status: 400 });
    }

    console.log('PROVISION: calling orchestrator for', user.id?.slice(0, 8), 'workerType:', workerType || 'general');

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
        workerType: workerType || 'general',
        workerConfig: workerConfig || {},
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Orchestrator error:', error);
      return NextResponse.json({ error: 'Failed to provision container' }, { status: 500 });
    }

    const containerInfo = await response.json();
    console.log('PROVISION: container info', JSON.stringify(containerInfo));

    // Save container info to Supabase profile
    const { error: upsertError } = await supabase.from('profiles').update({
      assistant_name: assistantName,
      assistant_personality: personality || '',
      container_status: containerInfo.container.status,
      container_gateway_port: containerInfo.container.gatewayPort,
      container_novnc_port: containerInfo.container.novncPort,
      container_token: containerInfo.container.gatewayToken,
      plan_status: 'trial',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      onboarding_completed: true,
    }).eq('id', user.id);

    if (upsertError) {
      console.error('Profile update error:', upsertError.message);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    // Send welcome email (non-blocking)
    if (user.email) {
      const { subject, html } = welcomeEmail(assistantName);
      sendEmail({ to: user.email, subject, html }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      status: containerInfo.container.status,
    });
  } catch (err: any) {
    console.error('Provision error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
