'use client';

import type { Employee } from '@/lib/types';

interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const isOnline = employee.container_status === 'running';
  const skillLabel = employee.worker_type === 'x-article-writer' ? 'X Article Writer' :
    employee.worker_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <button
      onClick={onClick}
      className="p-5 rounded-[var(--r)] border border-[var(--border)] hover:border-[var(--border-h)] transition-all text-left w-full"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: '#3b82f6' }}
        >
          {employee.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{employee.name}</div>
          <div className="text-xs text-[var(--accent2)]">{skillLabel}</div>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{
            background: isOnline ? '#052e16' : '#1a0505',
            color: isOnline ? '#4ade80' : '#ef4444',
          }}
        >
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      {employee.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {employee.skills.slice(0, 3).map(skill => (
            <span key={skill} className="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted)]">
              {skill.replace(/-/g, ' ')}
            </span>
          ))}
          {employee.skills.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 text-[var(--muted)]">+{employee.skills.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}
