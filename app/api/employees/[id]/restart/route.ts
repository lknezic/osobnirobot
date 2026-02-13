import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership, updateEmployeeContainer } from '@/lib/db/employees';
import { unauthorized, notFound, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/employees/[id]/restart - restart employee container */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-orchestrator-secret': ORCHESTRATOR_SECRET,
      },
      body: JSON.stringify({ employeeId: employee.id }),
    });

    if (!res.ok) {
      console.error('Restart failed:', await res.text());
      return serverError('Failed to restart container');
    }

    const data = await res.json();
    if (data.container) {
      await updateEmployeeContainer(id, {
        status: data.container.status || 'running',
        gatewayPort: data.container.gatewayPort || employee.container_gateway_port || 0,
        novncPort: data.container.novncPort || employee.container_novnc_port || 0,
        token: data.container.gatewayToken || employee.container_token || '',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Restart error:', message);
    return serverError();
  }
}
