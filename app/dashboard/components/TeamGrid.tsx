'use client';

import type { Employee } from '@/lib/types';
import { EmployeeCard } from './EmployeeCard';

interface TeamGridProps {
  employees: Employee[];
  maxEmployees: number;
  onSelect: (employee: Employee) => void;
  onHire: () => void;
}

export function TeamGrid({ employees, maxEmployees, onSelect, onHire }: TeamGridProps) {
  const canHire = employees.length < maxEmployees;

  return (
    <div className="p-6 max-w-[960px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Your Team</h1>
          <p className="text-xs text-[var(--muted)] mt-1">{employees.length}/{maxEmployees} employees</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <EmployeeCard key={emp.id} employee={emp} onClick={() => onSelect(emp)} />
        ))}

        {canHire && (
          <button
            onClick={onHire}
            className="p-5 rounded-[var(--r)] border border-dashed border-[var(--border)] hover:border-[var(--accent)] transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
            style={{ background: 'transparent' }}
          >
            <span className="text-2xl text-[var(--muted)]">+</span>
            <span className="text-xs text-[var(--muted)]">Hire new employee</span>
          </button>
        )}
      </div>
    </div>
  );
}
