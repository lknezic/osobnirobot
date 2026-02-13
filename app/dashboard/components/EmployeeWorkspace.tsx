'use client';

import { useState, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { restartEmployee } from '@/lib/api/employees';
import { KnowledgeBase } from './KnowledgeBase';

type Tab = 'chat' | 'browser' | 'settings';

interface EmployeeWorkspaceProps {
  employee: Employee;
  onBack: () => void;
  onCheckout: (planId: string) => void;
  planStatus?: string;
  trialEndsAt?: string;
  hasSubscription?: boolean;
}

export function EmployeeWorkspace({ employee, onBack, onCheckout, planStatus, trialEndsAt, hasSubscription }: EmployeeWorkspaceProps) {
  const [tab, setTab] = useState<Tab>('chat');
  const [restarting, setRestarting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  const HOST = process.env.NEXT_PUBLIC_CONTAINER_HOST || 'instantworker.ai';
  const isOnline = employee.container_status === 'running';

  const chatUrl = employee.container_gateway_port && employee.container_token
    ? `https://${employee.container_gateway_port}.gw.${HOST}/?token=${employee.container_token}`
    : '';

  const browserUrl = employee.container_novnc_port
    ? `https://${employee.container_novnc_port}.vnc.${HOST}/vnc.html?autoconnect=true&resize=scale&reconnect=true&reconnect_delay=3000`
    : '';

  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  // Chat tab paywall for trial users
  useEffect(() => {
    if (tab !== 'chat' || hasSubscription || planStatus !== 'trial') return;
    const key = `iw_chat_views_${employee.id}`;
    const views = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, String(views));
    if (views > 3) setShowPaywall(true);
  }, [tab, hasSubscription, planStatus, employee.id]);

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await restartEmployee(employee.id);
      // Wait for restart
      setTimeout(() => setRestarting(false), 5000);
    } catch {
      setRestarting(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(true);
    setError('');
    try {
      onCheckout(planId);
    } catch {
      setError('Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const skillLabel = employee.worker_type === 'x-article-writer' ? 'X Article Writer' :
    employee.worker_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--border)] shrink-0" style={{ background: '#111' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-[var(--dim)] hover:text-[var(--text)] transition-colors px-2 py-1">
            ← Back
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#3b82f6' }}>
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-semibold">{employee.name}</h1>
            <span className="text-[10px]" style={{ color: isOnline ? '#4ade80' : '#ef4444' }}>
              {isOnline ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {planStatus === 'trial' && daysLeft > 0 && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: '#1e3a5f', color: '#93c5fd' }}>
              Trial: {daysLeft}d left
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#1e3a5f', color: '#93c5fd' }}>
            {skillLabel}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-[var(--border)] shrink-0 pl-5" style={{ background: '#111' }}>
        {(['chat', 'browser', 'settings'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-medium border-b-2 transition-all"
            style={{
              color: tab === t ? '#fff' : '#888',
              borderBottomColor: tab === t ? '#3b82f6' : 'transparent',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? '#3b82f6' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {t === 'chat' ? '💬 Chat' : t === 'browser' ? '🖥️ Browser' : '⚙️ Settings'}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative">
        {tab === 'chat' && (
          <div className="w-full h-full flex flex-col">
            {chatUrl ? (
              <>
                <iframe
                  src={chatUrl}
                  className="flex-1 w-full border-none"
                  style={{
                    background: '#111',
                    ...(showPaywall ? { filter: 'blur(6px)', pointerEvents: 'none' as const } : {}),
                  }}
                  allow="microphone; camera; clipboard-write; clipboard-read"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                />
                {showPaywall && (
                  <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                    <div className="text-center p-8 rounded-2xl border border-[var(--border)] max-w-[420px] w-[90%]" style={{ background: '#111' }}>
                      <div className="text-[40px] mb-3">🔒</div>
                      <h2 className="text-xl font-bold mb-2">Enjoying {employee.name}?</h2>
                      <p className="text-sm text-[var(--dim)] mb-6">Subscribe to keep chatting and let your team work 24/7.</p>
                      <div className="flex flex-col gap-2.5 w-full max-w-[320px] mx-auto">
                        {[
                          { id: 'junior', title: 'Junior', price: '$99/mo', desc: '1 employee' },
                          { id: 'medior', title: 'Medior', price: '$399/mo', desc: '5 employees' },
                          { id: 'expert', title: 'Expert', price: '$499/mo', desc: '10 employees' },
                        ].map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleCheckout(p.id)}
                            disabled={checkoutLoading}
                            className="flex justify-between items-center p-3.5 rounded-[10px] text-sm font-semibold text-white"
                            style={{
                              background: p.id === 'junior' ? 'linear-gradient(135deg, #7c6bf0, #9b7bf7)' : '#1a1a1a',
                              border: p.id === 'junior' ? 'none' : '1px solid #333',
                              opacity: checkoutLoading ? 0.6 : 1,
                              cursor: checkoutLoading ? 'wait' : 'pointer',
                            }}
                          >
                            <span>{p.title} - {p.desc}</span>
                            <span className="font-bold">{p.price}</span>
                          </button>
                        ))}
                      </div>
                      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                      <p className="text-xs text-[var(--muted)] mt-4">7-day free trial · Cancel anytime</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--muted)] text-sm">
                Connecting to {employee.name}...
              </div>
            )}
          </div>
        )}

        {tab === 'browser' && (
          <div className="w-full h-full flex flex-col">
            {browserUrl ? (
              <>
                <div className="px-5 py-2 text-xs border-b border-[var(--border)] shrink-0" style={{ background: '#0c1929', color: '#93c5fd' }}>
                  Watch {employee.name} browse the web in real time. If they need a password, enter it here.
                </div>
                <iframe
                  src={browserUrl}
                  className="flex-1 w-full border-none"
                  style={{ background: '#111' }}
                  allow="clipboard-write; clipboard-read"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--muted)] text-sm">
                Browser not available
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="p-6 max-w-[600px] mx-auto overflow-y-auto h-full flex flex-col gap-4">
            <div className="p-5 rounded-[10px] border border-[var(--border)]" style={{ background: '#151515' }}>
              <h2 className="text-sm font-semibold mb-4">Employee Info</h2>
              <div className="flex justify-between py-2 border-b border-[#1a1a1a] text-sm">
                <span className="text-[var(--muted)]">Name</span>
                <span>{employee.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1a1a1a] text-sm">
                <span className="text-[var(--muted)]">Skill</span>
                <span>{skillLabel}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-[var(--muted)]">Status</span>
                <span>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>
              </div>
            </div>

            <KnowledgeBase employee={employee} />

            <div className="p-5 rounded-[10px] border border-[var(--border)]" style={{ background: '#151515' }}>
              <h2 className="text-sm font-semibold mb-3">Management</h2>
              <button
                onClick={handleRestart}
                disabled={restarting}
                className="px-4 py-2.5 rounded-lg text-sm border border-[var(--border)] text-white"
                style={{ background: '#1a1a1a', opacity: restarting ? 0.5 : 1, cursor: restarting ? 'wait' : 'pointer' }}
              >
                {restarting ? 'Restarting...' : '🔄 Restart employee'}
              </button>
              <p className="text-xs text-[var(--muted)] mt-2">Restart will temporarily interrupt the conversation (~30 seconds).</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
