'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Employee } from '@/lib/types';
import { TeamGrid } from '@/app/dashboard/components/TeamGrid';
import { EmployeeWorkspace } from '@/app/dashboard/components/EmployeeWorkspace';
import { HireEmployeeModal } from '@/app/dashboard/components/HireEmployeeModal';
import { listEmployees, hireEmployee } from '@/lib/api/employees';

export default function AdminWorkersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [maxEmployees, setMaxEmployees] = useState(99);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const fetchData = useCallback(async () => {
    try {
      const data = await listEmployees();
      setEmployees(data.employees);
      setMaxEmployees(data.maxEmployees);

      const empId = searchParams.get('employee');
      if (empId) {
        const found = data.employees.find(e => e.id === empId);
        if (found) setActiveEmployee(found);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSelectEmployee = (emp: Employee) => {
    setActiveEmployee(emp);
    window.history.replaceState(null, '', `/admin/workers?employee=${emp.id}`);
  };

  const handleBack = () => {
    setActiveEmployee(null);
    window.history.replaceState(null, '', '/admin/workers');
  };

  const handleHire = async (data: { name: string; skill: string; personality: string }) => {
    await hireEmployee({
      name: data.name,
      personality: data.personality,
      skills: [data.skill],
      workerType: data.skill,
      workerConfig: { skills: [data.skill] },
    });
    setShowHireModal(false);
    await fetchData();
  };

  const handleFire = async () => {
    setActiveEmployee(null);
    window.history.replaceState(null, '', '/admin/workers');
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
      </div>
    );
  }

  if (activeEmployee) {
    return (
      <div className="h-full flex flex-col">
        <EmployeeWorkspace
          employee={activeEmployee}
          onBack={handleBack}
          onCheckout={() => {}}
          onFire={handleFire}
          onRefresh={fetchData}
          planStatus="active"
          hasSubscription={false}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="text-sm font-semibold">My Workers</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#555' }}>{employees.length} worker{employees.length !== 1 ? 's' : ''}</span>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(124,107,240,0.15)', color: '#a78bfa' }}>
            FREE
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-lg font-bold mb-2">No workers yet</h2>
            <p className="text-xs mb-6" style={{ color: '#666' }}>
              Add your own workers for free. Same experience as your clients.
            </p>
            <button
              onClick={() => setShowHireModal(true)}
              className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #7c6bf0, #9b7bf7)' }}
            >
              + Add worker
            </button>
          </div>
        ) : (
          <TeamGrid
            employees={employees}
            maxEmployees={maxEmployees}
            onSelect={handleSelectEmployee}
            onHire={() => setShowHireModal(true)}
          />
        )}
      </div>

      {showHireModal && (
        <HireEmployeeModal
          maxSkills={99}
          onHire={handleHire}
          onClose={() => setShowHireModal(false)}
        />
      )}
    </div>
  );
}
