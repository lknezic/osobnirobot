import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership } from '@/lib/db/employees';
import { unauthorized, notFound, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/employees/[id]/docs - list all editable docs */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/docs/${employee.id.slice(0, 12)}`, {
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
    });

    if (!res.ok) return NextResponse.json([]);

    const docs = await res.json();
    return NextResponse.json(docs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('List docs error:', message);
    return serverError();
  }
}
