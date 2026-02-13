import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { verifyOwnership } from '@/lib/db/employees';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET, FILE_UPLOAD_MAX_SIZE, FILE_UPLOAD_ALLOWED_TYPES } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/employees/[id]/files - list reference files */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/files/${employee.id.slice(0, 12)}`, {
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
    });

    if (!res.ok) return NextResponse.json([]);

    const files = await res.json();
    return NextResponse.json(files);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('List files error:', message);
    return serverError();
  }
}

/** POST /api/employees/[id]/files - upload reference file */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return badRequest('No file provided');

    if (file.size > FILE_UPLOAD_MAX_SIZE) {
      return badRequest(`File too large. Max ${FILE_UPLOAD_MAX_SIZE / (1024 * 1024)}MB`);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!FILE_UPLOAD_ALLOWED_TYPES.includes(ext)) {
      return badRequest(`File type .${ext} not allowed. Allowed: ${FILE_UPLOAD_ALLOWED_TYPES.join(', ')}`);
    }

    // Forward file to orchestrator
    const orchForm = new FormData();
    orchForm.append('file', file);

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/files/${employee.id.slice(0, 12)}`, {
      method: 'POST',
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
      body: orchForm,
    });

    if (!res.ok) {
      console.error('Upload failed:', await res.text());
      return serverError('Failed to upload file');
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Upload error:', message);
    return serverError();
  }
}

/** DELETE /api/employees/[id]/files - delete reference file */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const employee = await verifyOwnership(id, user.id);
    if (!employee) return notFound('Employee not found');

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    if (!filename) return badRequest('Filename is required');

    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/files/${employee.id.slice(0, 12)}/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
    });

    if (!res.ok) {
      console.error('Delete file failed:', await res.text());
      return serverError('Failed to delete file');
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Delete file error:', message);
    return serverError();
  }
}
