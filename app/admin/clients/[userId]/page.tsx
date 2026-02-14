'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface EmployeeDetail {
  id: string;
  name: string;
  workerType: string;
  skills: string[];
  containerStatus: string;
  gatewayPort: number;
  novncPort: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientDetail {
  userId: string;
  email: string;
  planStatus: string;
  selectedPlan: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  hasSubscription: boolean;
  stripeCustomerId: string | null;
  maxEmployees: number;
  onboardingCompleted: boolean;
  createdAt: string;
  workerCount: number;
  onlineCount: number;
  errorCount: number;
  revenue: number;
  employees: EmployeeDetail[];
}

export default function ClientDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${userId}`);
      if (res.status === 403) { router.push('/admin'); return; }
      if (res.status === 404) { setError('Client not found'); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      setData(await res.json());
      setError('');
    } catch {
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRestart = async (employeeId: string) => {
    setActionLoading(employeeId);
    try {
      await fetch(`/api/employees/${employeeId}/restart`, { method: 'POST' });
      setTimeout(fetchData, 3000);
    } catch { /* ignore */ }
    setActionLoading('');
  };

  const handleExtendTrial = async () => {
    setActionLoading('extend');
    try {
      await fetch(`/api/admin/clients/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend-trial', days: 7 }),
      });
      await fetchData();
    } catch { /* ignore */ }
    setActionLoading('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-400">{error || 'No data'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: '#666' }}
          >
            ← Back
          </button>
          <h1 className="text-sm font-semibold">{data.email}</h1>
        </div>
        <PlanBadge status={data.planStatus} daysLeft={data.trialDaysLeft} />
      </div>

      <main className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Workers" value={data.workerCount} sub={`${data.onlineCount} online`} />
          <StatCard label="Errors" value={data.errorCount} sub={data.errorCount > 0 ? 'Needs attention' : 'All good'} alert={data.errorCount > 0} />
          <StatCard label="Revenue" value={data.revenue > 0 ? `$${data.revenue}/mo` : '$0'} sub={data.hasSubscription ? 'Subscribed' : 'No subscription'} />
          <StatCard
            label="Trial"
            value={data.planStatus === 'trial' ? `${data.trialDaysLeft}d left` : data.planStatus || 'N/A'}
            sub={data.trialEndsAt ? `Ends ${new Date(data.trialEndsAt).toLocaleDateString()}` : 'No trial'}
          />
        </div>

        {/* Profile info */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#999' }}>Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <InfoItem label="Plan" value={data.selectedPlan || 'None'} />
            <InfoItem label="Max Employees" value={String(data.maxEmployees)} />
            <InfoItem label="Onboarding" value={data.onboardingCompleted ? 'Completed' : 'Incomplete'} />
            <InfoItem label="Stripe Customer" value={data.stripeCustomerId ? data.stripeCustomerId.slice(0, 16) + '...' : 'None'} />
            <InfoItem label="Joined" value={new Date(data.createdAt).toLocaleDateString()} />
            <InfoItem label="Subscription" value={data.hasSubscription ? 'Active' : 'None'} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {(data.planStatus === 'trial' || data.planStatus === 'cancelled' || data.planStatus === 'expired') && (
              <button
                onClick={handleExtendTrial}
                disabled={actionLoading === 'extend'}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
              >
                {actionLoading === 'extend' ? 'Extending...' : 'Extend trial +7d'}
              </button>
            )}
          </div>
        </div>

        {/* Workers */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#999' }}>
            Workers ({data.employees.length})
          </h2>
          {data.employees.length === 0 ? (
            <div className="p-8 rounded-2xl text-center text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#555' }}>
              No workers
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.employees.map(emp => (
                <div key={emp.id} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold">{emp.name}</h3>
                      <span className="text-[10px]" style={{ color: '#666' }}>{emp.workerType}</span>
                    </div>
                    <StatusBadge status={emp.containerStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-3" style={{ color: '#888' }}>
                    <div>Gateway: {emp.gatewayPort || 'N/A'}</div>
                    <div>noVNC: {emp.novncPort || 'N/A'}</div>
                    <div>Created: {new Date(emp.createdAt).toLocaleDateString()}</div>
                    <div>Updated: {new Date(emp.updatedAt).toLocaleDateString()}</div>
                  </div>

                  {emp.skills && emp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {emp.skills.map(skill => (
                        <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,107,240,0.1)', color: '#a78bfa' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {(emp.containerStatus === 'error' || emp.containerStatus === 'stopped') && (
                      <button
                        onClick={() => handleRestart(emp.id)}
                        disabled={actionLoading === emp.id}
                        className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}
                      >
                        {actionLoading === emp.id ? 'Restarting...' : 'Restart'}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/admin/workers?employee=${emp.id}`)}
                      className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
                      style={{ background: 'rgba(124,107,240,0.15)', color: '#a78bfa' }}
                    >
                      Open workspace
                    </button>
                  </div>
                </div>
              ))}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] mb-0.5" style={{ color: '#555' }}>{label}</div>
      <div className="text-xs">{value}</div>
    </div>
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
  return <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#555' }}>{status || 'N/A'}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    running: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
    error: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
    stopped: { bg: 'rgba(255,255,255,0.05)', color: '#555' },
    provisioning: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  };
  const s = styles[status] || styles.stopped;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}
