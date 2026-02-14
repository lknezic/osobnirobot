'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.status === 403) { setClients([]); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setClients(json.clients);
    } catch {
      console.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = filter === 'all' ? clients : clients.filter(c => c.planStatus === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="text-sm font-semibold">Clients</h1>
        <span className="text-xs" style={{ color: '#555' }}>{clients.length} total</span>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {['all', 'active', 'trial', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-[10px] px-3 py-1 rounded-full transition-colors"
              style={{
                background: filter === f ? 'rgba(124,107,240,0.12)' : 'transparent',
                color: filter === f ? '#a78bfa' : '#666',
                border: `1px solid ${filter === f ? 'rgba(124,107,240,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Clients table */}
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
                {filtered.map(client => (
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs" style={{ color: '#555' }}>
                      No clients{filter !== 'all' ? ` with status "${filter}"` : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
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
