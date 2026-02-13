'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Employee } from '@/lib/types';
import { TeamGrid } from './components/TeamGrid';
import { EmployeeWorkspace } from './components/EmployeeWorkspace';
import { HireEmployeeModal } from './components/HireEmployeeModal';
import { listEmployees, hireEmployee } from '@/lib/api/employees';

interface DashboardState {
  employees: Employee[];
  maxEmployees: number;
  planStatus?: string;
  trialEndsAt?: string;
  hasSubscription?: boolean;
  selectedPlan?: string;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen" style={{ background: '#0a0a0a' }}>
        <div className="w-10 h-10 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
      </div>
    }>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const [state, setState] = useState<DashboardState>({ employees: [], maxEmployees: 1 });
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const data = await listEmployees();

      setState({
        employees: data.employees,
        maxEmployees: data.maxEmployees,
        planStatus: data.planStatus,
        trialEndsAt: data.trialEndsAt,
        hasSubscription: data.hasSubscription,
        selectedPlan: data.selectedPlan,
      });

      // No employees and no plan = redirect to onboarding
      if (data.employees.length === 0 && !data.planStatus) {
        router.push('/onboarding');
        return;
      }

      // Auto-select from URL param
      const empId = searchParams.get('employee');
      if (empId) {
        const found = data.employees.find(e => e.id === empId);
        if (found) setActiveEmployee(found);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [router, searchParams, supabase.auth]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const daysLeft = state.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(state.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  const isExpired = state.planStatus === 'cancelled' || state.planStatus === 'past_due' ||
    (state.planStatus === 'trial' && daysLeft <= 0);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    router.push('/');
  };

  const handleSelectEmployee = (emp: Employee) => {
    setActiveEmployee(emp);
    window.history.replaceState(null, '', `?employee=${emp.id}`);
  };

  const handleBack = () => {
    setActiveEmployee(null);
    window.history.replaceState(null, '', '/dashboard');
  };

  const handleHire = async (data: { name: string; skill: string; personality: string }) => {
    const emp = await hireEmployee({
      name: data.name,
      personality: data.personality,
      skills: [data.skill],
      workerType: data.skill,
      workerConfig: { skills: [data.skill] },
    });
    setShowHireModal(false);
    await fetchData();
    handleSelectEmployee(emp);
  };

  const handleCheckout = async (planId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, planId }),
    });

    if (res.ok) {
      const { url } = await res.json();
      if (url) window.location.href = url;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ background: '#0a0a0a' }}>
        <div className="w-10 h-10 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-6" style={{ background: '#0a0a0a' }}>
        <div className="text-5xl mb-4">⏰</div>
        <h1 className="text-2xl font-bold mb-2">
          {state.planStatus === 'past_due' ? 'Payment failed' : 'Your plan has expired'}
        </h1>
        <p className="text-sm text-[var(--dim)] mb-6 max-w-md">
          {state.planStatus === 'past_due'
            ? 'Your last payment didn\'t go through. Update your payment method to keep your team working.'
            : 'Your free trial has ended. Subscribe to keep your team working 24/7.'}
        </p>
        <button
          onClick={() => router.push('/onboarding')}
          className="px-8 py-3 rounded-lg font-semibold text-sm text-white mb-3"
          style={{ background: 'linear-gradient(135deg, #7c6bf0, #9b7bf7)' }}
        >
          Choose a plan
        </button>
        <button onClick={handleLogout} className="text-sm text-[var(--muted)] hover:text-white transition-colors mt-2">
          Log out
        </button>
      </div>
    );
  }

  if (activeEmployee) {
    return (
      <div className="h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#e5e5e5' }}>
        <EmployeeWorkspace
          employee={activeEmployee}
          onBack={handleBack}
          onCheckout={handleCheckout}
          onRefresh={fetchData}
          planStatus={state.planStatus}
          trialEndsAt={state.trialEndsAt}
          hasSubscription={state.hasSubscription}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0a0a0a', color: '#e5e5e5' }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] shrink-0" style={{ background: '#111' }}>
        <div className="font-bold text-base tracking-tight">
          Instant<span className="text-[var(--accent2)]">Worker</span>
        </div>
        <div className="flex items-center gap-3">
          {state.planStatus === 'trial' && daysLeft > 0 && (
            <span className="text-xs px-2.5 py-1 rounded" style={{ background: '#1e3a5f', color: '#93c5fd' }}>
              Trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </span>
          )}
          {state.planStatus === 'active' && (
            <span className="text-xs px-2.5 py-1 rounded" style={{ background: '#052e16', color: '#4ade80' }}>
              {state.selectedPlan ? state.selectedPlan.charAt(0).toUpperCase() + state.selectedPlan.slice(1) : 'Active'} plan
            </span>
          )}
          <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--muted)] hover:text-white transition-colors" style={{ background: 'transparent' }}>
            Log out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {state.employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-5xl mb-4">🏢</div>
            <h1 className="text-xl font-bold mb-2">Your office is empty</h1>
            <p className="text-sm text-[var(--dim)] mb-6">Hire your first AI employee to get started.</p>
            <button
              onClick={() => setShowHireModal(true)}
              className="px-6 py-3 rounded-lg font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #7c6bf0, #9b7bf7)' }}
            >
              + Hire first employee
            </button>
          </div>
        ) : (
          <TeamGrid
            employees={state.employees}
            maxEmployees={state.maxEmployees}
            onSelect={handleSelectEmployee}
            onHire={() => setShowHireModal(true)}
          />
        )}
      </div>

      {showHireModal && (
        <HireEmployeeModal
          maxSkills={state.selectedPlan === 'expert' ? 15 : state.selectedPlan === 'medior' ? 5 : 1}
          onHire={handleHire}
          onClose={() => setShowHireModal(false)}
        />
      )}
    </div>
  );
}
