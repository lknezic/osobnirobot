import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { listEmployees, createEmployee, countEmployees, getMaxEmployees, getEmployee } from '@/lib/db/employees';
import { unauthorized, badRequest, planLimitReached, serverError } from '@/lib/api-error';
import { sanitize, sanitizeArray } from '@/lib/validate';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET, PLAN_LIMITS, LEGACY_PLAN_LIMITS, TRIAL_DURATION_DAYS } from '@/lib/constants';
import { updateEmployeeContainer } from '@/lib/db/employees';

/** GET /api/employees - list all employees + plan info for current user */
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const admin = createSupabaseAdmin();
    const [employees, { data: profile }] = await Promise.all([
      listEmployees(user.id),
      admin.from('profiles').select('plan_status, selected_plan, trial_ends_at, stripe_subscription_id, max_employees').eq('id', user.id).single(),
    ]);

    return NextResponse.json({
      employees,
      maxEmployees: profile?.max_employees || 1,
      planStatus: profile?.plan_status || undefined,
      selectedPlan: profile?.selected_plan || undefined,
      trialEndsAt: profile?.trial_ends_at || undefined,
      hasSubscription: !!profile?.stripe_subscription_id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('List employees error:', message);
    return serverError();
  }
}

/** POST /api/employees - hire a new employee */
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const body = await request.json();

    // If this is onboarding (first employee), set up the profile
    const currentCount = await countEmployees(user.id);
    if (currentCount === 0 && body.workerConfig?.plan) {
      const plan = body.workerConfig.plan;
      const limits = PLAN_LIMITS.worker ?? LEGACY_PLAN_LIMITS[plan] ?? PLAN_LIMITS.worker;
      const admin = createSupabaseAdmin();
      const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await admin.from('profiles').update({
        onboarding_completed: true,
        selected_plan: plan,
        max_employees: limits.maxEmployees,
        plan_status: 'trial',
        trial_ends_at: trialEndsAt,
      }).eq('id', user.id);
    }

    // Check plan limits
    const max = await getMaxEmployees(user.id);
    if (currentCount >= max) return planLimitReached();

    const name = sanitize(body.name, 30);
    if (!name) return badRequest('Name is required');

    const personality = sanitize(body.personality, 200);
    const workerType = sanitize(body.workerType, 50) || 'x-article-writer';
    const skills = sanitizeArray(body.skills || [workerType], 15, 50);

    const workerConfig = {
      skills,
      companyUrl: sanitize(body.workerConfig?.companyUrl, 200),
      clientDescription: sanitize(body.workerConfig?.clientDescription, 1000),
      competitorUrls: sanitizeArray(body.workerConfig?.competitorUrls || [], 10, 200),
      timezone: sanitize(body.workerConfig?.timezone, 50),
    };

    // Create employee in DB
    const employee = await createEmployee({
      userId: user.id,
      name,
      personality,
      skills,
      workerType,
      workerConfig,
    });

    // Provision container via orchestrator
    try {
      // Mark as provisioning before calling orchestrator
      await updateEmployeeContainer(employee.id, {
        status: 'provisioning',
        gatewayPort: 0,
        novncPort: 0,
        token: '',
      });

      const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-orchestrator-secret': ORCHESTRATOR_SECRET,
        },
        body: JSON.stringify({
          userId: user.id,
          employeeId: employee.id,
          assistantName: name,
          personality,
          workerType,
          workerConfig,
        }),
      });

      if (res.ok) {
        const containerInfo = await res.json();
        await updateEmployeeContainer(employee.id, {
          status: containerInfo.container.status,
          gatewayPort: containerInfo.container.gatewayPort,
          novncPort: containerInfo.container.novncPort,
          token: containerInfo.container.gatewayToken,
        });
      } else {
        const errText = await res.text();
        console.error('Orchestrator provision failed:', errText);
        await updateEmployeeContainer(employee.id, {
          status: 'error',
          gatewayPort: 0,
          novncPort: 0,
          token: '',
        });
      }
    } catch (orchErr) {
      console.error('Orchestrator unreachable:', orchErr);
      await updateEmployeeContainer(employee.id, {
        status: 'error',
        gatewayPort: 0,
        novncPort: 0,
        token: '',
      });
    }

    // Re-fetch to get updated container status
    const updated = await getEmployee(employee.id);
    return NextResponse.json(updated || employee, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : '';
    console.error('Hire employee error:', message, stack);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
