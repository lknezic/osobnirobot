import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3500';
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || '';

export async function GET() {
  try {
    // Auth check with anon key (reads cookies)
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return (cookieStore as any).getAll(); },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                (cookieStore as any).set(name, value, options)
              );
            } catch {}
          }
        },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get container status from orchestrator
    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/containers/status/${user.id}`,
      { headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET } }
    );

    if (!response.ok) {
      return NextResponse.json({ exists: false, status: 'none' });
    }

    const data = await response.json();

    // Profile query with SERVICE ROLE KEY (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
    }

    // Use gateway port/token from profile (DB) as primary source, orchestrator as fallback
    const gatewayPort = profile?.container_gateway_port || data.gatewayPort;
    const novncPort = profile?.container_novnc_port || data.novncPort;

    return NextResponse.json({
      ...data,
      gatewayPort,
      novncPort,
      gatewayToken: profile?.container_token,
      assistantName: profile?.assistant_name,
      planStatus: profile?.plan_status || (profile?.onboarding_completed ? 'trial' : undefined),
      selectedPlan: profile?.selected_plan,
      trialEndsAt: profile?.trial_ends_at,
      hasSubscription: !!profile?.stripe_subscription_id,
      workerConfig: profile?.worker_config,
    });
  } catch (err: any) {
    console.error('Status error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
