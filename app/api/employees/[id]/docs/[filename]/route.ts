import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership } from '@/lib/db/employees';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string; filename: string }>;
}

/** GET /api/employees/[id]/docs/[filename] - read single doc */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id, filename } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const res = await fetch(
      `${ORCHESTRATOR_URL}/api/containers/docs/${employee.id.slice(0, 12)}/${encodeURIComponent(filename)}`,
      { headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET } }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Failed to read doc' }));
      return NextResponse.json(errData, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Read doc error:', message);
    return serverError();
  }
}

/** PUT /api/employees/[id]/docs/[filename] - update single doc */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id, filename } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const body = await request.json().catch(() => null);
    if (!body || typeof body.content !== 'string') {
      return badRequest('content (string) is required');
    }

    if (body.content.length > 50 * 1024) {
      return badRequest('Document too large. Max 50KB.');
    }

    const res = await fetch(
      `${ORCHESTRATOR_URL}/api/containers/docs/${employee.id.slice(0, 12)}/${encodeURIComponent(filename)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-orchestrator-secret': ORCHESTRATOR_SECRET,
        },
        body: JSON.stringify({ content: body.content }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Failed to save doc' }));
      return NextResponse.json(errData, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Update doc error:', message);
    return serverError();
  }
}
