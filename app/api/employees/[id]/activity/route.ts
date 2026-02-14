import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership } from '@/lib/db/employees';
import { unauthorized, notFound, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/employees/[id]/activity - get work log / heartbeat activity */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/activity/${employee.id}`, {
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json({ heartbeatLog: null, dailyEntries: [], engagementStats: null });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Activity error:', message);
    return serverError();
  }
}
