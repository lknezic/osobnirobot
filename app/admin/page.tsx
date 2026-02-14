'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  expiredClients: number;
  totalWorkers: number;
  onlineWorkers: number;
  errorWorkers: number;
  mrr: number;
  conversionRate: number;
}

interface ClientRow {
  userId: string;
  email: string;
  planStatus: string;
  selectedPlan: string | null;
  trialDaysLeft: number;
  hasSubscription: boolean;
  workerCount: number;
  onlineCount: number;
  errorCount: number;
  revenue: number;
  employees: { id: string; name: string; workerType: string; containerStatus: string }[];
}

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  effort: 'AUTO' | 'QUICK' | 'MEDIUM';
  actions: { label: string; action: string; params?: Record<string, string> }[];
}

interface OverviewData {
  stats: Stats;
  clients: ClientRow[];
  recommendations: Recommendation[];
}

export default function AdminPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.status === 403) {
        router.push('/dashboard');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError('');
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAction = async (action: string, params?: Record<string, string>) => {
    if (action === 'dismiss') return;
    if (action === 'view' && params?.userId) {
      router.push(`/admin/clients/${params.userId}`);
      return;
    }
    if (action === 'restart' && params?.employeeId) {
      try {
        await fetch(`/api/employees/${params.employeeId}/restart`, { method: 'POST' });
        setTimeout(fetchData, 3000);
      } catch { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0a0a0a' }}>
        <div className="w-10 h-10 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0a0a0a', color: '#e5e5e5' }}>
        <p className="text-sm text-red-400">{error || 'No data'}</p>
      </div>
    );
  }

  const { stats, clients, recommendations } = data;
  const activeRecs = recommendations.filter(r => !dismissed.has(r.id));

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="text-sm font-semibold">Overview</h1>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#666' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
          ONLINE {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Stat Cards — 4 primary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Clients" value={stats.totalClients} sub={`${stats.activeClients} active, ${stats.trialClients} trial`} />
          <StatCard label="Workers" value={stats.totalWorkers} sub={`${stats.onlineWorkers} online, ${stats.errorWorkers} errors`} alert={stats.errorWorkers > 0} />
          <StatCard label="MRR" value={`$${stats.mrr.toLocaleString()}`} sub={`${stats.activeClients} paying client${stats.activeClients !== 1 ? 's' : ''}`} />
          <StatCard label="Trial Conversion" value={`${stats.conversionRate}%`} sub={`${stats.activeClients} of ${stats.activeClients + stats.trialClients + stats.expiredClients} converted`} />
        </div>

        {/* Recommendations */}
        {activeRecs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#999' }}>Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeRecs.map(rec => (
                <div key={rec.id} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold">{rec.title}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <PriorityBadge priority={rec.priority} />
                      <EffortBadge effort={rec.effort} />
                    </div>
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#888' }}>{rec.reason}</p>
                  <div className="flex items-center gap-2">
                    {rec.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (action.action === 'dismiss') {
                            setDismissed(prev => new Set(prev).add(rec.id));
                          } else {
                            handleAction(action.action, action.params);
                          }
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                          background: i === 0 ? 'rgba(124,107,240,0.15)' : 'transparent',
                          color: i === 0 ? '#a78bfa' : '#666',
                          border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clients Table */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#999' }}>
            Clients ({clients.length})
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: '#666' }}>Email</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: '#666' }}>Plan</th>
                    <th className="text-center px-4 py-3 font-medium text-xs" style={{ color: '#666' }}>Workers</th>
                    <th className="text-center px-4 py-3 font-medium text-xs" style={{ color: '#666' }}>Status</th>
                    <th className="text-right px-4 py-3 font-medium text-xs" style={{ color: '#666' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr
                      key={client.userId}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onClick={() => router.push(`/admin/clients/${client.userId}`)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs">{client.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <PlanBadge status={client.planStatus} daysLeft={client.trialDaysLeft} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs">{client.workerCount}</td>
                      <td className="px-4 py-3 text-center">
                        <WorkerStatus online={client.onlineCount} total={client.workerCount} errors={client.errorCount} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {client.revenue > 0 ? `$${client.revenue}/mo` : <span style={{ color: '#555' }}>$0</span>}
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs" style={{ color: '#555' }}>
                        No clients yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, alert }: { label: string; value: string | number; sub: string; alert?: boolean }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${alert ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs font-medium mb-0.5" style={{ color: '#999' }}>{label}</div>
      <div className="text-[10px]" style={{ color: '#555' }}>{sub}</div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
    HIGH: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
    MEDIUM: { bg: 'rgba(234,179,8,0.15)', text: '#facc15' },
  };
  const c = colors[priority] || colors.MEDIUM;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: c.bg, color: c.text }}>
      {priority}
    </span>
  );
}

function EffortBadge({ effort }: { effort: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    AUTO: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
    QUICK: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
    MEDIUM: { bg: 'rgba(234,179,8,0.15)', text: '#facc15' },
  };
  const c = colors[effort] || colors.MEDIUM;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: c.bg, color: c.text }}>
      {effort}
    </span>
  );
}

function PlanBadge({ status, daysLeft }: { status: string; daysLeft: number }) {
  if (status === 'active') {
    return <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>Active</span>;
  }
  if (status === 'trial') {
    return <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>Trial ({daysLeft}d)</span>;
  }
  if (status === 'past_due') {
    return <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Past due</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#555' }}>{status}</span>;
}

function WorkerStatus({ online, total, errors }: { online: number; total: number; errors: number }) {
  if (errors > 0) {
    return <span className="text-[10px]" style={{ color: '#f87171' }}>{errors} error{errors !== 1 ? 's' : ''}</span>;
  }
  if (online === total && total > 0) {
    return <span className="text-[10px]" style={{ color: '#4ade80' }}>{online}/{total} ok</span>;
  }
  if (total === 0) {
    return <span className="text-[10px]" style={{ color: '#555' }}>none</span>;
  }
  return <span className="text-[10px]" style={{ color: '#facc15' }}>{online}/{total}</span>;
}
