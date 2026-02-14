'use client';

import { useState, useEffect, useCallback } from 'react';

interface ScalingCheck {
  id: string;
  category: string;
  label: string;
  severity: 'ok' | 'warning' | 'critical';
  current: string;
  limit: string;
  percentage: number;
  action: string;
  cadence: string;
}

interface ScalingData {
  overallStatus: 'healthy' | 'warning' | 'critical';
  currentWorkers: number;
  totalContainers: number;
  clients: number;
  nextMilestone: number;
  checks: ScalingCheck[];
  summary: { critical: number; warning: number; ok: number };
  resources: {
    memoryPerContainerGB: number;
    cpuCoresPerContainer: number;
    diskPerContainerGB: number;
    estimatedTotalMemoryGB: number;
    estimatedTotalDiskGB: number;
  };
}

const SEVERITY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  healthy: { bg: '#052e16', color: '#4ade80', border: '#14532d' },
  ok: { bg: '#052e16', color: '#4ade80', border: '#14532d' },
  warning: { bg: '#422006', color: '#facc15', border: '#713f12' },
  critical: { bg: '#450a0a', color: '#ef4444', border: '#7f1d1d' },
};

const CADENCE_LABELS: Record<string, { label: string; color: string }> = {
  instant: { label: 'INSTANT', color: '#ef4444' },
  hourly: { label: 'HOURLY', color: '#fb923c' },
  daily: { label: 'DAILY', color: '#facc15' },
  weekly: { label: 'WEEKLY', color: '#3b82f6' },
  monthly: { label: 'MONTHLY', color: '#888' },
};

const OVERALL_CONFIG = {
  healthy: { label: 'Ready to Scale', color: '#4ade80', icon: '✓' },
  warning: { label: 'Action Needed', color: '#facc15', icon: '⚠' },
  critical: { label: 'Scaling Blocked', color: '#ef4444', icon: '✕' },
};

export default function ScalingPage() {
  const [data, setData] = useState<ScalingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/scaling');
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-[#333] border-t-[#7c6bf0] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-red-400">Failed to load scaling data</div>;
  }

  const overall = OVERALL_CONFIG[data.overallStatus];
  const filtered = filter === 'all' ? data.checks : data.checks.filter(c => c.severity === filter);

  // Sort: critical first, then warning, then ok
  const sorted = [...filtered].sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Scaling Readiness</h1>
          <p className="text-xs mt-1" style={{ color: '#888' }}>
            Real-time infrastructure assessment for scaling to {data.nextMilestone} workers
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl border"
          style={{ background: SEVERITY_COLORS[data.overallStatus].bg, borderColor: SEVERITY_COLORS[data.overallStatus].border }}
        >
          <span className="text-lg">{overall.icon}</span>
          <span className="text-sm font-semibold" style={{ color: overall.color }}>
            {overall.label}
          </span>
        </div>
      </div>

      {/* 4-stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Running Workers" value={data.currentWorkers} color="#fff" />
        <StatCard label="Next Milestone" value={data.nextMilestone} color="#7c6bf0" />
        <StatCard label="Clients" value={data.clients} color="#3b82f6" />
        <StatCard
          label="Checks Passing"
          value={`${data.summary.ok}/${data.checks.length}`}
          color={data.summary.critical > 0 ? '#ef4444' : data.summary.warning > 0 ? '#facc15' : '#4ade80'}
        />
      </div>

      {/* Resource estimate bar */}
      <div
        className="p-4 rounded-2xl border mb-6"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-xs font-semibold mb-3" style={{ color: '#888' }}>
          RESOURCE USAGE AT {data.currentWorkers} WORKERS → {data.nextMilestone} WORKERS
        </h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span style={{ color: '#888' }}>Memory</span>
              <span>{data.resources.estimatedTotalMemoryGB}GB / ~32GB</span>
            </div>
            <ProgressBar value={data.resources.estimatedTotalMemoryGB} max={32} />
            <div className="mt-1" style={{ color: '#555' }}>
              At {data.nextMilestone}: {data.nextMilestone * data.resources.memoryPerContainerGB}GB needed
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span style={{ color: '#888' }}>Disk</span>
              <span>{data.resources.estimatedTotalDiskGB}GB / ~160GB</span>
            </div>
            <ProgressBar value={data.resources.estimatedTotalDiskGB} max={160} />
            <div className="mt-1" style={{ color: '#555' }}>
              At {data.nextMilestone}: {data.nextMilestone * data.resources.diskPerContainerGB}GB needed
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span style={{ color: '#888' }}>Ports</span>
              <span>{data.currentWorkers * 2} / 4000</span>
            </div>
            <ProgressBar value={data.currentWorkers * 2} max={4000} />
            <div className="mt-1" style={{ color: '#555' }}>
              At {data.nextMilestone}: {data.nextMilestone * 2} ports needed
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {(['all', 'critical', 'warning', 'ok'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: filter === f ? 'rgba(124,107,240,0.15)' : 'rgba(255,255,255,0.03)',
              color: filter === f ? '#a78bfa' : '#888',
              border: '1px solid',
              borderColor: filter === f ? 'rgba(124,107,240,0.3)' : 'rgba(255,255,255,0.06)',
            }}
          >
            {f === 'all' ? `All (${data.checks.length})` :
             f === 'critical' ? `Critical (${data.summary.critical})` :
             f === 'warning' ? `Warning (${data.summary.warning})` :
             `OK (${data.summary.ok})`}
          </button>
        ))}
      </div>

      {/* Scaling checks */}
      <div className="flex flex-col gap-3">
        {sorted.map(check => {
          const sev = SEVERITY_COLORS[check.severity];
          const cadence = CADENCE_LABELS[check.cadence] || CADENCE_LABELS.monthly;

          return (
            <div
              key={check.id}
              className="p-4 rounded-2xl border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: sev.color }}
                  />
                  <span className="text-sm font-semibold">{check.label}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                  >
                    {check.severity.toUpperCase()}
                  </span>
                </div>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ color: cadence.color, border: `1px solid ${cadence.color}30` }}
                >
                  CHECK {cadence.label}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: '#888' }}>{check.current}</span>
                  <span style={{ color: '#555' }}>{check.limit}</span>
                </div>
                <ProgressBar value={check.percentage} max={100} color={sev.color} />
              </div>

              {/* Action */}
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', color: '#aaa' }}>
                <span className="font-semibold" style={{ color: '#ccc' }}>Action: </span>
                {check.action}
              </div>
            </div>
          );
        })}
      </div>

      {/* Future: Ops Worker */}
      <div
        className="mt-8 p-5 rounded-2xl border"
        style={{ background: 'rgba(124,107,240,0.04)', borderColor: 'rgba(124,107,240,0.15)' }}
      >
        <h3 className="text-sm font-semibold mb-2" style={{ color: '#a78bfa' }}>
          Coming: Ops Worker (Autonomous Monitoring)
        </h3>
        <p className="text-xs mb-3" style={{ color: '#888' }}>
          A dedicated AI worker will monitor all these checks and take corrective action automatically.
          It will handle instant alerts, hourly health checks, daily reviews, and weekly analysis.
          If it needs your help, it will message or call you.
        </p>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { cadence: 'Instant', count: 8, desc: 'Container crashes, payment failures, account restrictions' },
            { cadence: 'Hourly', count: 4, desc: 'Worker activity, content quality, rate limits' },
            { cadence: 'Daily', count: 10, desc: 'Engagement review, signups, disk/memory, logs' },
            { cadence: 'Weekly', count: 12, desc: 'Performance analysis, flywheel updates, metrics' },
          ].map(t => (
            <div
              key={t.cadence}
              className="p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="font-semibold mb-1">{t.cadence}</div>
              <div style={{ color: '#7c6bf0' }}>{t.count} tasks</div>
              <div className="mt-1" style={{ color: '#555' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      className="p-4 rounded-2xl border"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: '#888' }}>{label}</div>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = color || (pct > 80 ? '#ef4444' : pct > 60 ? '#facc15' : '#4ade80');
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  );
}
