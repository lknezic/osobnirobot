'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Container {
  employeeId: string;
  userId: string;
  name: string;
  status: string;
  gatewayPort: number | null;
  novncPort: number | null;
  lastUpdated: string;
  cpu?: number;
  memory?: number;
  uptime?: string;
}

interface HealthData {
  orchestratorReachable: boolean;
  summary: {
    total: number;
    running: number;
    stopped: number;
    errors: number;
    provisioning: number;
  };
  containers: Container[];
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [restarting, setRestarting] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/health');
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
      setError('Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRestart = async (employeeId: string) => {
    setRestarting(prev => new Set(prev).add(employeeId));
    try {
      await fetch(`/api/employees/${employeeId}/restart`, { method: 'POST' });
      setTimeout(fetchData, 3000);
    } catch { /* ignore */ }
    setTimeout(() => {
      setRestarting(prev => {
        const next = new Set(prev);
        next.delete(employeeId);
        return next;
      });
    }, 5000);
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

  const { summary, containers, orchestratorReachable } = data;

  const filtered = filter === 'all'
    ? containers
    : containers.filter(c => c.status === filter);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="text-sm font-semibold">Health Monitor</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#666' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: orchestratorReachable ? '#4ade80' : '#f87171' }} />
            {orchestratorReachable ? 'ORCHESTRATOR OK' : 'ORCHESTRATOR DOWN'}
          </div>
          <div className="text-xs" style={{ color: '#555' }}>
            {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={summary.total} sub={`${summary.running + summary.stopped + summary.errors + summary.provisioning} tracked`} />
          <StatCard label="Running" value={summary.running} sub={summary.total > 0 ? `${Math.round((summary.running / summary.total) * 100)}% uptime` : 'none'} />
          <StatCard label="Errors" value={summary.errors} sub={summary.errors > 0 ? 'Needs attention' : 'All clear'} alert={summary.errors > 0} />
          <StatCard label="Provisioning" value={summary.provisioning} sub={summary.stopped > 0 ? `${summary.stopped} stopped` : 'All deployed'} />
        </div>

        {/* Orchestrator Warning */}
        {!orchestratorReachable && (
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
              <span className="text-sm font-semibold" style={{ color: '#f87171' }}>Orchestrator Unreachable</span>
            </div>
            <p className="text-xs" style={{ color: '#888' }}>
              Container data is from Supabase (may be stale). Check orchestrator service on Hetzner.
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {['all', 'running', 'stopped', 'error', 'provisioning', 'none'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: filter === f ? 'rgba(124,107,240,0.15)' : 'rgba(255,255,255,0.03)',
                color: filter === f ? '#a78bfa' : '#666',
                border: `1px solid ${filter === f ? 'rgba(124,107,240,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f === 'all' ? `All (${containers.length})` : `${f} (${containers.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Container Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(container => (
            <ContainerCard
              key={container.employeeId}
              container={container}
              isRestarting={restarting.has(container.employeeId)}
              onRestart={() => handleRestart(container.employeeId)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-xs" style={{ color: '#555' }}>
              No containers match this filter
            </div>
          )}
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

function ContainerCard({ container, isRestarting, onRestart }: { container: Container; isRestarting: boolean; onRestart: () => void }) {
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    running: { bg: 'rgba(34,197,94,0.08)', text: '#4ade80', dot: '#4ade80' },
    stopped: { bg: 'rgba(255,255,255,0.03)', text: '#666', dot: '#555' },
    error: { bg: 'rgba(239,68,68,0.08)', text: '#f87171', dot: '#f87171' },
    provisioning: { bg: 'rgba(59,130,246,0.08)', text: '#60a5fa', dot: '#60a5fa' },
    none: { bg: 'rgba(255,255,255,0.03)', text: '#555', dot: '#444' },
  };

  const colors = statusColors[container.status] || statusColors.none;
  const timeSince = getTimeSince(container.lastUpdated);

  return (
    <div className="p-4 rounded-2xl" style={{ background: colors.bg, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
            <span className="text-sm font-semibold">{container.name}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${colors.text}20`, color: colors.text }}>
            {container.status}
          </span>
        </div>
        {(container.status === 'error' || container.status === 'stopped') && (
          <button
            onClick={onRestart}
            disabled={isRestarting}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: isRestarting ? 'rgba(255,255,255,0.03)' : 'rgba(124,107,240,0.15)',
              color: isRestarting ? '#555' : '#a78bfa',
              cursor: isRestarting ? 'not-allowed' : 'pointer',
            }}
          >
            {isRestarting ? 'Restarting...' : 'Restart'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-y-2 text-xs">
        <div>
          <div className="text-[10px] mb-0.5" style={{ color: '#555' }}>Gateway</div>
          <div style={{ color: '#999' }}>{container.gatewayPort || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] mb-0.5" style={{ color: '#555' }}>noVNC</div>
          <div style={{ color: '#999' }}>{container.novncPort || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] mb-0.5" style={{ color: '#555' }}>Updated</div>
          <div style={{ color: '#999' }}>{timeSince}</div>
        </div>
        <div>
          <div className="text-[10px] mb-0.5" style={{ color: '#555' }}>Employee</div>
          <div style={{ color: '#666' }} className="truncate">{container.employeeId.slice(0, 8)}</div>
        </div>
      </div>

      {(container.cpu !== undefined || container.memory !== undefined) && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {container.cpu !== undefined && (
              <div>
                <div className="text-[10px] mb-1" style={{ color: '#555' }}>CPU</div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(container.cpu, 100)}%`, background: container.cpu > 80 ? '#f87171' : '#4ade80' }} />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: '#666' }}>{container.cpu.toFixed(1)}%</div>
              </div>
            )}
            {container.memory !== undefined && (
              <div>
                <div className="text-[10px] mb-1" style={{ color: '#555' }}>Memory</div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(container.memory, 100)}%`, background: container.memory > 80 ? '#f87171' : '#60a5fa' }} />
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: '#666' }}>{container.memory.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeSince(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (isNaN(diffMs) || diffMs < 0) return '—';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
