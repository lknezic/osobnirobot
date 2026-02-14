import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership } from '@/lib/db/employees';
import { unauthorized, notFound, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/employees/[id]/status-detail - detailed status for banner */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/status-detail/${employee.id}`, {
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json({
        status: 'unknown',
        isRunning: false,
        uptimeHours: 0,
        gatewayHealthy: false,
        hasQuestions: false,
        startedAt: null,
        containerState: 'unknown',
      });
    }

    const data = await res.json();

    // Self-heal: if orchestrator says container is gone but DB says running, fix the DB
    if (data.status === 'not-found' && employee.container_status === 'running') {
      await supabase
        .from('employees')
        .update({ container_status: 'stopped' })
        .eq('id', employee.id);
      data.dbCorrected = true;
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Status detail error:', message);
    return serverError();
  }
}
