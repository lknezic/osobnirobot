import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/admin-auth';
import { unauthorized, forbidden, serverError } from '@/lib/api-error';

/** GET /api/admin/clients - list all clients with full details */
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();
    if (!isAdmin(user.email)) return forbidden();

    const admin = createSupabaseAdmin();

    const [profilesRes, employeesRes] = await Promise.all([
      admin.from('profiles').select('*').eq('onboarding_completed', true).order('created_at', { ascending: false }),
      admin.from('employees').select('*').order('created_at', { ascending: false }),
    ]);

    if (profilesRes.error) throw new Error(profilesRes.error.message);
    if (employeesRes.error) throw new Error(employeesRes.error.message);

    const profiles = profilesRes.data || [];
    const employees = employeesRes.data || [];

    const clients = profiles.map(profile => ({
      ...profile,
      employees: employees.filter(e => e.user_id === profile.id),
    }));

    return NextResponse.json({ clients });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Admin clients error:', message);
    return serverError();
  }
}
