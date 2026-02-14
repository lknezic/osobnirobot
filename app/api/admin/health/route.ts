import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-auth';
import { unauthorized, forbidden, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

/** GET /api/admin/health - get container health from orchestrator */
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();
    if (!isAdmin(user.email)) return forbidden();

    // Try to fetch health from orchestrator
    let orchestratorHealth = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${ORCHESTRATOR_URL}/admin/health-all`, {
        headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        orchestratorHealth = await res.json();
      }
    } catch {
      // Orchestrator unreachable — that's ok, we'll show what we know from DB
    }

    // Also get container data from Supabase as fallback
    const { createSupabaseAdmin } = await import('@/lib/supabase-admin');
    const admin = createSupabaseAdmin();
    const { data: employees } = await admin
      .from('employees')
      .select('id, user_id, name, container_status, container_gateway_port, container_novnc_port, updated_at')
      .order('updated_at', { ascending: false });

    const containers = (employees || []).map(e => ({
      employeeId: e.id,
      userId: e.user_id,
      name: e.name,
      status: e.container_status,
      gatewayPort: e.container_gateway_port,
      novncPort: e.container_novnc_port,
      lastUpdated: e.updated_at,
      // Merge with orchestrator data if available
      ...(orchestratorHealth?.containers?.[e.id] || {}),
    }));

    const running = containers.filter(c => c.status === 'running').length;
    const stopped = containers.filter(c => c.status === 'stopped' || c.status === 'none').length;
    const errors = containers.filter(c => c.status === 'error').length;
    const provisioning = containers.filter(c => c.status === 'provisioning').length;

    return NextResponse.json({
      orchestratorReachable: orchestratorHealth !== null,
      summary: { total: containers.length, running, stopped, errors, provisioning },
      containers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Admin health error:', message);
    return serverError();
  }
}
