import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership } from '@/lib/db/employees';
import { unauthorized, notFound, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/employees/[id]/summary - get summary stats + searchable knowledge */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    // Pass search query if provided
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const queryParam = q ? `?q=${encodeURIComponent(q)}` : '';

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/summary/${employee.id}${queryParam}`, {
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json({
        stats: { commentsToday: 0, repliesReceived: 0, accountsEngaged: 0, postsCreated: 0 },
        issues: { pendingQuestions: 0, improvementCount: 0 },
        knowledge: [],
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Summary error:', message);
    return serverError();
  }
}
