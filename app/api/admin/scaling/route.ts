import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-auth';
import { unauthorized, forbidden, serverError } from '@/lib/api-error';
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET, PORT_RANGES } from '@/lib/constants';

/** GET /api/admin/scaling - scaling readiness assessment */
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();
    if (!isAdmin(user.email)) return forbidden();

    const { createSupabaseAdmin } = await import('@/lib/supabase-admin');
    const admin = createSupabaseAdmin();

    // Get all employees
    const { data: employees } = await admin
      .from('employees')
      .select('id, container_status, container_gateway_port, container_novnc_port');

    const allEmployees = employees || [];
    const running = allEmployees.filter(e => e.container_status === 'running');
    const total = allEmployees.length;

    // Port usage
    const gatewayPortsUsed = allEmployees.filter(e => e.container_gateway_port).length;
    const novncPortsUsed = allEmployees.filter(e => e.container_novnc_port).length;
    const gatewayPortsTotal = PORT_RANGES.gateway.max - PORT_RANGES.gateway.min + 1;
    const novncPortsTotal = PORT_RANGES.novnc.max - PORT_RANGES.novnc.min + 1;

    // Get profiles count
    const { count: clientCount } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('onboarding_completed', true);

    // Check orchestrator health
    let orchestratorReachable = false;
    let orchestratorLatencyMs = 0;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const start = Date.now();
      const res = await fetch(`${ORCHESTRATOR_URL}/admin/health-all`, {
        headers: { 'x-orchestrator-secret': ORCHESTRATOR_SECRET },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      orchestratorLatencyMs = Date.now() - start;
      orchestratorReachable = res.ok;
    } catch {
      orchestratorReachable = false;
    }

    // Per-container resource assumptions
    const memoryPerContainerGB = 2;
    const cpuCoresPerContainer = 2;
    const diskPerContainerGB = 5; // workspace + shared volume estimate

    // Scaling checks — each returns status + recommendation
    const checks = buildScalingChecks({
      runningContainers: running.length,
      totalContainers: total,
      gatewayPortsUsed,
      gatewayPortsTotal,
      novncPortsUsed,
      novncPortsTotal,
      clientCount: clientCount || 0,
      orchestratorReachable,
      orchestratorLatencyMs,
      memoryPerContainerGB,
      cpuCoresPerContainer,
      diskPerContainerGB,
    });

    // Overall readiness score
    const criticalCount = checks.filter(c => c.severity === 'critical').length;
    const warningCount = checks.filter(c => c.severity === 'warning').length;
    const okCount = checks.filter(c => c.severity === 'ok').length;

    let overallStatus: 'healthy' | 'warning' | 'critical';
    if (criticalCount > 0) overallStatus = 'critical';
    else if (warningCount > 0) overallStatus = 'warning';
    else overallStatus = 'healthy';

    // Next milestone
    const nextMilestone = running.length < 10 ? 10 : running.length < 25 ? 25 : running.length < 50 ? 50 : running.length < 100 ? 100 : 500;

    return NextResponse.json({
      overallStatus,
      currentWorkers: running.length,
      totalContainers: total,
      clients: clientCount || 0,
      nextMilestone,
      checks,
      summary: { critical: criticalCount, warning: warningCount, ok: okCount },
      resources: {
        memoryPerContainerGB,
        cpuCoresPerContainer,
        diskPerContainerGB,
        estimatedTotalMemoryGB: running.length * memoryPerContainerGB,
        estimatedTotalDiskGB: running.length * diskPerContainerGB,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Admin scaling error:', message);
    return serverError();
  }
}

interface CheckParams {
  runningContainers: number;
  totalContainers: number;
  gatewayPortsUsed: number;
  gatewayPortsTotal: number;
  novncPortsUsed: number;
  novncPortsTotal: number;
  clientCount: number;
  orchestratorReachable: boolean;
  orchestratorLatencyMs: number;
  memoryPerContainerGB: number;
  cpuCoresPerContainer: number;
  diskPerContainerGB: number;
}

interface ScalingCheck {
  id: string;
  category: 'ports' | 'memory' | 'orchestrator' | 'database' | 'disk' | 'health' | 'architecture';
  label: string;
  severity: 'ok' | 'warning' | 'critical';
  current: string;
  limit: string;
  percentage: number;
  action: string;
  cadence: 'instant' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

function buildScalingChecks(p: CheckParams): ScalingCheck[] {
  const checks: ScalingCheck[] = [];

  // 1. Gateway port usage
  const gwPct = Math.round((p.gatewayPortsUsed / p.gatewayPortsTotal) * 100);
  checks.push({
    id: 'gateway-ports',
    category: 'ports',
    label: 'Gateway Ports',
    severity: gwPct > 80 ? 'critical' : gwPct > 50 ? 'warning' : 'ok',
    current: `${p.gatewayPortsUsed} used`,
    limit: `${p.gatewayPortsTotal} total`,
    percentage: gwPct,
    action: gwPct > 50
      ? 'Expand GATEWAY_PORT_START/END range on orchestrator env, update Caddy config'
      : 'No action needed',
    cadence: 'weekly',
  });

  // 2. NoVNC port usage
  const vncPct = Math.round((p.novncPortsUsed / p.novncPortsTotal) * 100);
  checks.push({
    id: 'novnc-ports',
    category: 'ports',
    label: 'NoVNC Ports',
    severity: vncPct > 80 ? 'critical' : vncPct > 50 ? 'warning' : 'ok',
    current: `${p.novncPortsUsed} used`,
    limit: `${p.novncPortsTotal} total`,
    percentage: vncPct,
    action: vncPct > 50
      ? 'Expand NOVNC_PORT_START/END range on orchestrator env, update Caddy config'
      : 'No action needed',
    cadence: 'weekly',
  });

  // 3. Memory estimate (assumes 32GB server)
  const serverMemoryGB = 32;
  const usedMemoryGB = p.runningContainers * p.memoryPerContainerGB;
  const memPct = Math.round((usedMemoryGB / serverMemoryGB) * 100);
  checks.push({
    id: 'memory',
    category: 'memory',
    label: 'Server Memory (est.)',
    severity: memPct > 80 ? 'critical' : memPct > 60 ? 'warning' : 'ok',
    current: `${usedMemoryGB}GB used (${p.runningContainers} × ${p.memoryPerContainerGB}GB)`,
    limit: `~${serverMemoryGB}GB server`,
    percentage: Math.min(memPct, 100),
    action: memPct > 60
      ? 'Reduce per-container memory to 1GB (test first), or add a second Hetzner server'
      : 'No action needed',
    cadence: 'daily',
  });

  // 4. Disk estimate (assumes 160GB)
  const serverDiskGB = 160;
  const usedDiskGB = p.runningContainers * p.diskPerContainerGB;
  const diskPct = Math.round((usedDiskGB / serverDiskGB) * 100);
  checks.push({
    id: 'disk',
    category: 'disk',
    label: 'Disk Space (est.)',
    severity: diskPct > 80 ? 'critical' : diskPct > 60 ? 'warning' : 'ok',
    current: `~${usedDiskGB}GB used`,
    limit: `~${serverDiskGB}GB SSD`,
    percentage: Math.min(diskPct, 100),
    action: diskPct > 60
      ? 'Clean temp workspace files: rm -rf /tmp/iw-workspace-*. Prune Docker images. Consider Hetzner storage box.'
      : 'No action needed',
    cadence: 'daily',
  });

  // 5. Orchestrator status
  checks.push({
    id: 'orchestrator',
    category: 'orchestrator',
    label: 'Orchestrator',
    severity: !p.orchestratorReachable ? 'critical' : p.orchestratorLatencyMs > 2000 ? 'warning' : 'ok',
    current: p.orchestratorReachable ? `Reachable (${p.orchestratorLatencyMs}ms)` : 'Unreachable',
    limit: '< 2000ms response',
    percentage: p.orchestratorReachable ? Math.min(100, Math.round((1 - p.orchestratorLatencyMs / 5000) * 100)) : 0,
    action: !p.orchestratorReachable
      ? 'SSH into Hetzner, run: pm2 restart orchestrator'
      : p.orchestratorLatencyMs > 2000
      ? 'Orchestrator slow — check Docker daemon, server load'
      : 'Healthy',
    cadence: 'instant',
  });

  // 6. Health check timing vs container count
  // At 5s timeout per container, serial health check takes running * 5s
  // Cron runs every 5min = 300s. If check takes > 300s, it never completes.
  const healthCheckSeconds = p.runningContainers * 5;
  const healthCronSeconds = 300;
  const healthPct = Math.round((healthCheckSeconds / healthCronSeconds) * 100);
  checks.push({
    id: 'health-timing',
    category: 'health',
    label: 'Health Check Cycle',
    severity: healthPct > 100 ? 'critical' : healthPct > 60 ? 'warning' : 'ok',
    current: `${healthCheckSeconds}s to check ${p.runningContainers} containers`,
    limit: `${healthCronSeconds}s cron interval`,
    percentage: Math.min(healthPct, 100),
    action: healthPct > 60
      ? 'Parallelize health checks in orchestrator (Promise.all instead of serial). Add jitter.'
      : 'No action needed',
    cadence: 'weekly',
  });

  // 7. Port allocation race condition
  checks.push({
    id: 'port-race',
    category: 'architecture',
    label: 'Port Allocation Safety',
    severity: p.runningContainers > 20 ? 'warning' : 'ok',
    current: p.runningContainers > 20 ? 'Race condition risk increases with concurrent provisions' : 'Low risk at current scale',
    limit: 'No mutex on port allocation',
    percentage: p.runningContainers > 20 ? 60 : 100,
    action: p.runningContainers > 20
      ? 'Add mutex/lock to findAvailablePort() in orchestrator. Consider Redis-backed port allocation.'
      : 'OK for now — fix before scaling past 50 workers',
    cadence: 'monthly',
  });

  // 8. Single point of failure
  checks.push({
    id: 'spof',
    category: 'architecture',
    label: 'High Availability',
    severity: p.runningContainers > 10 ? 'warning' : 'ok',
    current: 'Single orchestrator, single Hetzner server',
    limit: 'No redundancy',
    percentage: p.runningContainers > 10 ? 40 : 80,
    action: p.runningContainers > 10
      ? 'Plan for multi-server: second Hetzner box, load balancer, orchestrator clustering'
      : 'Acceptable for launch phase',
    cadence: 'monthly',
  });

  // 9. Database connection pooling
  checks.push({
    id: 'db-pool',
    category: 'database',
    label: 'DB Connection Pooling',
    severity: p.clientCount > 20 ? 'warning' : 'ok',
    current: `${p.clientCount} clients — each page load creates new DB connection`,
    limit: 'Supabase: ~50 concurrent connections',
    percentage: Math.min(Math.round((p.clientCount * 3) / 50 * 100), 100),
    action: p.clientCount > 20
      ? 'Add connection pooling. Add indexes on employees(container_status) and employees(user_id, container_status).'
      : 'OK for now',
    cadence: 'monthly',
  });

  // 10. Temp file cleanup
  checks.push({
    id: 'temp-files',
    category: 'disk',
    label: 'Temp Workspace Cleanup',
    severity: p.totalContainers > 20 ? 'warning' : 'ok',
    current: `${p.totalContainers} provisions — temp files never auto-cleaned`,
    limit: '/tmp fills up at ~1000 provisions',
    percentage: Math.min(Math.round(p.totalContainers / 10), 100),
    action: 'Add cleanup after provision: rm -rf workspaceDir after container.start(). Or add cron: find /tmp/iw-workspace-* -mtime +1 -delete',
    cadence: 'daily',
  });

  return checks;
}
