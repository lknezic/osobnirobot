import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdmin } from '@/lib/admin-auth';
import { unauthorized, forbidden, serverError } from '@/lib/api-error';
import { WORKER_PRICE } from '@/lib/constants';

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();
    if (!isAdmin(user.email)) return forbidden();

    const admin = createSupabaseAdmin();

    // Fetch all profiles and employees in parallel
    const [profilesRes, employeesRes] = await Promise.all([
      admin.from('profiles').select('id, email, plan_status, selected_plan, trial_ends_at, stripe_subscription_id, max_employees, onboarding_completed'),
      admin.from('employees').select('id, user_id, name, worker_type, container_status, created_at'),
    ]);

    if (profilesRes.error) throw new Error(profilesRes.error.message);
    if (employeesRes.error) throw new Error(employeesRes.error.message);

    const profiles = profilesRes.data || [];
    const employees = employeesRes.data || [];

    // Only count clients who completed onboarding
    const clients = profiles.filter(p => p.onboarding_completed);
    const activeClients = clients.filter(p => p.plan_status === 'active');
    const trialClients = clients.filter(p => p.plan_status === 'trial');
    const expiredClients = clients.filter(p => p.plan_status === 'cancelled' || p.plan_status === 'past_due');

    const totalWorkers = employees.length;
    const onlineWorkers = employees.filter(e => e.container_status === 'running').length;
    const errorWorkers = employees.filter(e => e.container_status === 'error').length;

    // Revenue: active subscribers × their worker count × $199
    const activeWorkerCount = employees.filter(e => {
      const profile = activeClients.find(p => p.id === e.user_id);
      return !!profile;
    }).length;
    const mrr = activeWorkerCount * WORKER_PRICE;

    // Trial conversion: how many trials converted to active
    const totalTrialsEver = clients.filter(p => p.plan_status === 'active' || p.plan_status === 'trial' || p.plan_status === 'cancelled').length;
    const conversions = activeClients.length;
    const conversionRate = totalTrialsEver > 0 ? Math.round((conversions / totalTrialsEver) * 100) : 0;

    // Build clients table data
    const clientRows = clients.map(profile => {
      const clientEmployees = employees.filter(e => e.user_id === profile.id);
      const onlineCount = clientEmployees.filter(e => e.container_status === 'running').length;
      const errorCount = clientEmployees.filter(e => e.container_status === 'error').length;
      const workerCount = clientEmployees.length;
      const revenue = profile.plan_status === 'active' ? workerCount * WORKER_PRICE : 0;

      const daysLeft = profile.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
        : 0;

      return {
        userId: profile.id,
        email: profile.email,
        planStatus: profile.plan_status,
        selectedPlan: profile.selected_plan,
        trialDaysLeft: daysLeft,
        hasSubscription: !!profile.stripe_subscription_id,
        workerCount,
        onlineCount,
        errorCount,
        revenue,
        employees: clientEmployees.map(e => ({
          id: e.id,
          name: e.name,
          workerType: e.worker_type,
          containerStatus: e.container_status,
        })),
      };
    });

    // Sort: errors first, then by worker count desc
    clientRows.sort((a, b) => {
      if (a.errorCount > 0 && b.errorCount === 0) return -1;
      if (b.errorCount > 0 && a.errorCount === 0) return 1;
      return b.workerCount - a.workerCount;
    });

    // Generate recommendations
    const recommendations = generateRecommendations(clientRows);

    return NextResponse.json({
      stats: {
        totalClients: clients.length,
        activeClients: activeClients.length,
        trialClients: trialClients.length,
        expiredClients: expiredClients.length,
        totalWorkers,
        onlineWorkers,
        errorWorkers,
        mrr,
        conversionRate,
      },
      clients: clientRows,
      recommendations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Admin overview error:', message);
    return serverError();
  }
}

interface ClientRow {
  userId: string;
  email: string;
  planStatus: string;
  trialDaysLeft: number;
  workerCount: number;
  onlineCount: number;
  errorCount: number;
  employees: { id: string; name: string; containerStatus: string }[];
}

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  effort: 'AUTO' | 'QUICK' | 'MEDIUM';
  actions: { label: string; action: string; params?: Record<string, string> }[];
}

function generateRecommendations(clients: ClientRow[]): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const client of clients) {
    // Container errors
    for (const emp of client.employees) {
      if (emp.containerStatus === 'error') {
        recs.push({
          id: `error-${emp.id}`,
          title: `Restart ${emp.name}'s container`,
          reason: `${client.email}'s worker "${emp.name}" is in error state.`,
          priority: 'CRITICAL',
          effort: 'AUTO',
          actions: [
            { label: 'Restart now', action: 'restart', params: { employeeId: emp.id } },
            { label: 'Dismiss', action: 'dismiss' },
          ],
        });
      }
    }

    // Trial expiring soon with active workers
    if (client.planStatus === 'trial' && client.trialDaysLeft > 0 && client.trialDaysLeft <= 3 && client.onlineCount > 0) {
      recs.push({
        id: `convert-${client.userId}`,
        title: `Convert ${client.email} — trial ending`,
        reason: `Trial expires in ${client.trialDaysLeft} day${client.trialDaysLeft !== 1 ? 's' : ''} with ${client.onlineCount} active worker${client.onlineCount !== 1 ? 's' : ''}. High conversion probability.`,
        priority: 'HIGH',
        effort: 'QUICK',
        actions: [
          { label: 'Send email', action: 'email', params: { userId: client.userId } },
          { label: 'Skip', action: 'dismiss' },
        ],
      });
    }

    // All workers offline (but not in error)
    if (client.workerCount > 0 && client.onlineCount === 0 && client.errorCount === 0) {
      recs.push({
        id: `offline-${client.userId}`,
        title: `${client.email} — all workers offline`,
        reason: `${client.workerCount} worker${client.workerCount !== 1 ? 's' : ''} provisioned but none running.`,
        priority: 'MEDIUM',
        effort: 'MEDIUM',
        actions: [
          { label: 'View details', action: 'view', params: { userId: client.userId } },
          { label: 'Dismiss', action: 'dismiss' },
        ],
      });
    }
  }

  // Sort: CRITICAL first, then HIGH, then MEDIUM
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}
