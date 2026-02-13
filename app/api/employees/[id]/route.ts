import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership, updateEmployee, deleteEmployee } from '@/lib/db/employees';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-error';
import { sanitize, sanitizeArray } from '@/lib/validate';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/employees/[id] - get single employee */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    return NextResponse.json(employee);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Get employee error:', message);
    return serverError();
  }
}

/** PUT /api/employees/[id] - update employee config */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = sanitize(body.name, 30);
      if (!name) return badRequest('Name cannot be empty');
      updates.name = name;
    }
    if (body.personality !== undefined) {
      updates.personality = sanitize(body.personality, 200);
    }
    if (body.skills !== undefined) {
      updates.skills = sanitizeArray(body.skills, 15, 50);
    }
    if (body.worker_config !== undefined) {
      updates.worker_config = {
        ...employee.worker_config,
        ...body.worker_config,
      };
    }

    const updated = await updateEmployee(id, updates);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Update employee error:', message);
    return serverError();
  }
}

/** DELETE /api/employees/[id] - fire employee */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    // Stop container if running
    if (employee.container_status === 'running') {
      try {
        await fetch(`${ORCHESTRATOR_URL}/api/containers/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-orchestrator-secret': ORCHESTRATOR_SECRET,
          },
          body: JSON.stringify({ employeeId: employee.id }),
        });
      } catch {
        // Container may already be stopped
      }
    }

    await deleteEmployee(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Fire employee error:', message);
    return serverError();
  }
}
