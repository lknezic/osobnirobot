'use client';

import type { Employee } from '@/lib/types';
import { CHANNELS, SKILLS } from '@/lib/constants';

interface TeamGridProps {
  employees: Employee[];
  maxEmployees: number;
  onSelect: (employee: Employee) => void;
  onHire: () => void;
  onBilling?: () => void;
  planStatus?: string;
  trialEndsAt?: string;
  hasSubscription?: boolean;
}

function getWorkerStatus(emp: Employee): { label: string; color: string; dotColor: string; description: string } {
  if (emp.container_status === 'running') {
    return { label: 'Working', color: '#4ade80', dotColor: '#4ade80', description: getActivityDescription(emp) };
  }
  if (emp.container_status === 'provisioning') {
    return { label: 'Starting up', color: '#fbbf24', dotColor: '#fbbf24', description: 'Container is being provisioned...' };
  }
  if (emp.container_status === 'error') {
    return { label: 'Error', color: '#ef4444', dotColor: '#ef4444', description: 'Container failed to start' };
  }
  if (emp.container_status === 'stopped') {
    return { label: 'Stopped', color: '#ef4444', dotColor: '#ef4444', description: 'Container is stopped' };
  }
  return { label: 'Jobless', color: '#ef4444', dotColor: '#ef4444', description: 'Not provisioned — needs setup' };
}

function getActivityDescription(emp: Employee): string {
  const skills = emp.skills || [];
  const channel = CHANNELS.find(ch => ch.skills.some(s => skills.includes(s)));
  if (!channel) return 'Running autonomously';

  const skillNames = SKILLS.filter(s => channel.skills.includes(s.id)).map(s => s.title);
  if (channel.id === 'x-twitter') {
    return `Commenting, writing tweets, threads & articles on X`;
  }
  if (channel.id === 'reddit') {
    return `Commenting and posting on Reddit`;
  }
  return skillNames.join(', ');
}

function getChannelLabel(emp: Employee): string {
  const skills = emp.skills || [];
  const channel = CHANNELS.find(ch => ch.skills.some(s => skills.includes(s)));
  return channel ? channel.title : emp.worker_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getTimeSinceCreated(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
}

export function TeamGrid({ employees, maxEmployees, onSelect, onHire }: TeamGridProps) {
  const canHire = employees.length < maxEmployees;
  const workingCount = employees.filter(e => e.container_status === 'running').length;
  const idleCount = employees.length - workingCount;

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Control Panel Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Control Panel</h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {employees.length} employee{employees.length !== 1 ? 's' : ''} ·{' '}
            <span style={{ color: '#4ade80' }}>{workingCount} working</span>
            {idleCount > 0 && <> · <span style={{ color: '#ef4444' }}>{idleCount} idle</span></>}
          </p>
        </div>
        {canHire && (
          <button
            onClick={onHire}
            className="text-sm font-semibold text-white px-4 py-2 rounded-[var(--r2)] transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
          >
            + Hire employee
          </button>
        )}
      </div>

      {/* Worker List */}
      <div className="rounded-[var(--r)] border border-[var(--border)] overflow-hidden" style={{ background: '#111' }}>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_1fr_100px] gap-4 px-5 py-3 text-[10px] text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]" style={{ background: '#0d0d0d' }}>
          <span>Employee</span>
          <span>Channel</span>
          <span>Activity</span>
          <span className="text-right">Status</span>
        </div>

        {/* Employee rows */}
        {employees.map(emp => {
          const status = getWorkerStatus(emp);
          const channel = getChannelLabel(emp);

          return (
            <button
              key={emp.id}
              onClick={() => onSelect(emp)}
              className="grid grid-cols-[1fr_140px_1fr_100px] gap-4 px-5 py-4 w-full text-left border-b border-[var(--border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              {/* Employee name + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#3b82f6' }}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ background: status.dotColor, borderColor: '#111' }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{emp.name}</div>
                  <div className="text-[10px] text-[var(--muted)]">Hired {getTimeSinceCreated(emp.created_at)}</div>
                </div>
              </div>

              {/* Channel */}
              <div className="flex items-center">
                <span className="text-xs text-[var(--dim)]">{channel}</span>
              </div>

              {/* Activity */}
              <div className="flex items-center min-w-0">
                <span className="text-xs text-[var(--dim)] truncate">{status.description}</span>
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-end">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    color: status.color,
                    background: status.color === '#4ade80' ? '#052e16' :
                      status.color === '#fbbf24' ? '#422006' : '#1a0505',
                  }}
                >
                  {status.label}
                </span>
              </div>
            </button>
          );
        })}

        {/* Empty state / Hire row */}
        {employees.length === 0 && (
          <div className="px-5 py-10 text-center">
            <div className="text-3xl mb-2">🏢</div>
            <p className="text-sm text-[var(--muted)]">No employees yet. Hire your first worker to get started.</p>
          </div>
        )}
      </div>

      {/* Hire card below the table */}
      {canHire && employees.length > 0 && (
        <button
          onClick={onHire}
          className="mt-4 w-full p-4 rounded-[var(--r)] border border-dashed border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center justify-center gap-2"
          style={{ background: 'transparent' }}
        >
          <span className="text-lg text-[var(--muted)]">+</span>
          <span className="text-sm text-[var(--muted)]">Hire another employee</span>
        </button>
      )}
    </div>
  );
}
