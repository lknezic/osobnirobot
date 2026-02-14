import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership, updateEmployeeContainer } from '@/lib/db/employees';
import { unauthorized, notFound, serverError, badRequest } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/employees/[id]/provision - provision or re-provision container */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    // Don't re-provision if already running
    if (employee.container_status === 'running') {
      return badRequest('Container is already running');
    }

    // Set status to provisioning
    await updateEmployeeContainer(id, {
      status: 'provisioning',
      gatewayPort: employee.container_gateway_port || 0,
      novncPort: employee.container_novnc_port || 0,
      token: employee.container_token || '',
    });

    // Call orchestrator
    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-orchestrator-secret': ORCHESTRATOR_SECRET,
      },
      body: JSON.stringify({
        userId: user.id,
        employeeId: employee.id,
        assistantName: employee.name,
        personality: employee.personality,
        workerType: employee.worker_type,
        workerConfig: employee.worker_config,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Provision failed:', errText);
      await updateEmployeeContainer(id, {
        status: 'error',
        gatewayPort: 0,
        novncPort: 0,
        token: '',
      });
      return serverError(`Provisioning failed: ${errText}`);
    }

    const data = await res.json();
    await updateEmployeeContainer(id, {
      status: data.container?.status || 'running',
      gatewayPort: data.container?.gatewayPort || 0,
      novncPort: data.container?.novncPort || 0,
      token: data.container?.gatewayToken || '',
    });

    return NextResponse.json({
      success: true,
      container: {
        status: data.container?.status || 'running',
        gatewayPort: data.container?.gatewayPort,
        novncPort: data.container?.novncPort,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Provision error:', message);
    return serverError();
  }
}
