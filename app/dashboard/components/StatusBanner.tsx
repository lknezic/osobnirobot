'use client';

import { useEffect, useState } from 'react';

interface StatusDetail {
  status: string;
  isRunning: boolean;
  uptimeHours: number;
  gatewayHealthy: boolean;
  hasQuestions: boolean;
  startedAt: string | null;
  containerState: string;
}

interface StatusBannerProps {
  employeeId: string;
  employeeName: string;
  containerStatus: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  'healthy': { label: 'Working', color: '#4ade80', bg: '#052e16' },
  'needs-attention': { label: 'Needs attention', color: '#fb923c', bg: '#431407' },
  'unhealthy': { label: 'May be stuck', color: '#facc15', bg: '#422006' },
  'offline': { label: 'Offline', color: '#ef4444', bg: '#450a0a' },
  'not-found': { label: 'Not provisioned', color: '#888', bg: '#1a1a1a' },
  'unknown': { label: 'Checking...', color: '#888', bg: '#1a1a1a' },
};

export function StatusBanner({ employeeId, employeeName, containerStatus }: StatusBannerProps) {
  const [detail, setDetail] = useState<StatusDetail | null>(null);

  useEffect(() => {
    if (containerStatus !== 'running') return;

    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/employees/${employeeId}/status-detail`);
        if (res.ok && !cancelled) {
          setDetail(await res.json());
        }
      } catch { /* ignore */ }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [employeeId, containerStatus]);

  // Don't show banner for offline containers (already shown in header)
  if (containerStatus !== 'running') return null;
  if (!detail) return null;

  const config = STATUS_CONFIG[detail.status] || STATUS_CONFIG['unknown'];
  const uptimeLabel = detail.uptimeHours >= 24
    ? `${Math.floor(detail.uptimeHours / 24)}d ${detail.uptimeHours % 24}h`
    : `${detail.uptimeHours}h`;

  // Only show banner for non-healthy states
  if (detail.status === 'healthy') return null;

  return (
    <div
      className="flex items-center justify-between px-5 py-2 text-xs border-b border-[var(--border)] shrink-0"
      style={{ background: config.bg, color: config.color }}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: config.color }} />
        <span className="font-medium">{config.label}</span>
        {detail.hasQuestions && (
          <span>— {employeeName} has questions for you. Check the chat.</span>
        )}
        {detail.status === 'unhealthy' && (
          <span>— Gateway not responding. Try restarting.</span>
        )}
      </div>
      <span style={{ color: '#666' }}>
        Uptime: {uptimeLabel}
      </span>
    </div>
  );
}
