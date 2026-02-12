import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3500';
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || '';

export async function PUT(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    const sanitize = (s: string, max: number) =>
      (s || '').replace(/<[^>]*>/g, '').trim().slice(0, max);

    // Build updated worker_config
    const workerConfig: Record<string, unknown> = {};
    if (body.companyUrl !== undefined) workerConfig.companyUrl = sanitize(body.companyUrl, 200);
    if (body.clientDescription !== undefined) workerConfig.clientDescription = sanitize(body.clientDescription, 1000);
    if (Array.isArray(body.competitorUrls)) {
      workerConfig.competitorUrls = body.competitorUrls
        .slice(0, 10)
        .map((u: string) => sanitize(u, 200));
    }

    // Merge with existing config from DB
    const { data: profile } = await supabase.from('profiles')
      .select('worker_config')
      .eq('id', user.id)
      .single();

    const mergedConfig = {
      ...(profile?.worker_config || {}),
      ...workerConfig,
    };

    // Update Supabase profile
    const { error: updateError } = await supabase.from('profiles')
      .update({ worker_config: mergedConfig })
      .eq('id', user.id);

    if (updateError) {
      console.error('Config update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }

    // Restart the container so it picks up new config
    try {
      await fetch(`${ORCHESTRATOR_URL}/api/containers/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-orchestrator-secret': ORCHESTRATOR_SECRET,
        },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch {
      // Container restart is best-effort — config is saved regardless
      console.warn('Container restart failed, config saved to DB');
    }

    return NextResponse.json({ success: true, workerConfig: mergedConfig });
  } catch (err: any) {
    console.error('Config error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
