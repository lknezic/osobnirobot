import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/admin-auth';
import { unauthorized, forbidden, notFound, serverError } from '@/lib/api-error';
import { WORKER_PRICE } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/** GET /api/admin/clients/[userId] - single client detail */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();
    if (!isAdmin(user.email)) return forbidden();

    const admin = createSupabaseAdmin();

    const [profileRes, employeesRes] = await Promise.all([
      admin.from('profiles').select('*').eq('id', userId).single(),
      admin.from('employees').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    if (profileRes.error || !profileRes.data) return notFound('Client not found');
    if (employeesRes.error) throw new Error(employeesRes.error.message);

    const profile = profileRes.data;
    const employees = employeesRes.data || [];

    const onlineCount = employees.filter((e: { container_status: string }) => e.container_status === 'running').length;
    const errorCount = employees.filter((e: { container_status: string }) => e.container_status === 'error').length;
    const revenue = profile.plan_status === 'active' ? employees.length * WORKER_PRICE : 0;

    const trialDaysLeft = profile.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
      : 0;

    return NextResponse.json({
      userId: profile.id,
      email: profile.email,
      planStatus: profile.plan_status,
      selectedPlan: profile.selected_plan,
      trialEndsAt: profile.trial_ends_at,
      trialDaysLeft,
      hasSubscription: !!profile.stripe_subscription_id,
      stripeCustomerId: profile.stripe_customer_id,
      maxEmployees: profile.max_employees,
      onboardingCompleted: profile.onboarding_completed,
      createdAt: profile.created_at,
      workerCount: employees.length,
      onlineCount,
      errorCount,
      revenue,
      employees: employees.map((e: { id: string; name: string; worker_type: string; skills: string[]; container_status: string; container_gateway_port: number; container_novnc_port: number; created_at: string; updated_at: string }) => ({
        id: e.id,
        name: e.name,
        workerType: e.worker_type,
        skills: e.skills,
        containerStatus: e.container_status,
        gatewayPort: e.container_gateway_port,
        novncPort: e.container_novnc_port,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Admin client detail error:', message);
    return serverError();
  }
}

/** POST /api/admin/clients/[userId] - admin actions on client */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();
    if (!isAdmin(user.email)) return forbidden();

    const body = await request.json();
    const { action } = body;

    const admin = createSupabaseAdmin();

    if (action === 'extend-trial') {
      const days = body.days || 7;
      const newEnd = new Date(Date.now() + days * 86400000).toISOString();
      await admin.from('profiles').update({
        trial_ends_at: newEnd,
        plan_status: 'trial',
      }).eq('id', userId);
      return NextResponse.json({ success: true, trialEndsAt: newEnd });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Admin client action error:', message);
    return serverError();
  }
}
