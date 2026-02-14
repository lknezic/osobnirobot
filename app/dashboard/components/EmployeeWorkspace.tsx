'use client';

import { useState } from 'react';
import type { Employee } from '@/lib/types';
import { restartEmployee, provisionEmployee, fireEmployee } from '@/lib/api/employees';
import { KnowledgeBase } from './KnowledgeBase';

type Tab = 'chat' | 'browser' | 'settings';

interface EmployeeWorkspaceProps {
  employee: Employee;
  onBack: () => void;
  onCheckout: (planId: string) => void;
  onFire?: () => void;
  onRefresh?: () => void;
  planStatus?: string;
  trialEndsAt?: string;
  hasSubscription?: boolean;
}

export function EmployeeWorkspace({ employee, onBack, onCheckout, onFire, onRefresh, planStatus, trialEndsAt, hasSubscription }: EmployeeWorkspaceProps) {
  const [tab, setTab] = useState<Tab>('chat');
  const [restarting, setRestarting] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState('');
  const [firing, setFiring] = useState(false);
  const [showFireConfirm, setShowFireConfirm] = useState(false);

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

  const handleProvision = async () => {
    setProvisioning(true);
    setProvisionError('');
    try {
      await provisionEmployee(employee.id);
      // Refresh dashboard data after successful provision
      if (onRefresh) onRefresh();
    } catch (err) {
      setProvisionError(err instanceof Error ? err.message : 'Provisioning failed');
    } finally {
      setProvisioning(false);
    }
  };

  const handleFire = async () => {
    setFiring(true);
    try {
      await fireEmployee(employee.id);
      if (onFire) onFire();
    } catch {
      setFiring(false);
      setShowFireConfirm(false);
    }
  };

  const needsProvision = employee.container_status === 'none' || employee.container_status === 'error';
  const isProvisioning = employee.container_status === 'provisioning' || provisioning;

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
              <iframe
                src={chatUrl}
                className="flex-1 w-full border-none"
                style={{ background: '#111' }}
                allow="microphone; camera; clipboard-write; clipboard-read"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              />
            ) : needsProvision ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
                <div className="text-4xl">{employee.container_status === 'error' ? '⚠️' : '🔌'}</div>
                <div>
                  <h2 className="text-base font-semibold mb-1">
                    {employee.container_status === 'error' ? 'Container failed to start' : 'Container not provisioned'}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {employee.container_status === 'error'
                      ? 'The last provisioning attempt failed. Try again.'
                      : `${employee.name} needs a container to start working.`}
                  </p>
                </div>
                <button
                  onClick={handleProvision}
                  disabled={provisioning}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
                  style={{
                    background: provisioning ? '#333' : 'linear-gradient(135deg, #7c6bf0, #9b7bf7)',
                    opacity: provisioning ? 0.6 : 1,
                    cursor: provisioning ? 'wait' : 'pointer',
                  }}
                >
                  {provisioning ? 'Provisioning...' : 'Start container'}
                </button>
                {provisionError && <p className="text-red-400 text-sm">{provisionError}</p>}
              </div>
            ) : isProvisioning ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
                <div className="w-8 h-8 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
                <p className="text-sm text-[var(--muted)]">Setting up {employee.name}&apos;s workspace...</p>
                <p className="text-xs text-[var(--muted)] max-w-[320px]">
                  {employee.name} will introduce themselves and share what they learned about your business once ready.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
                <div className="w-8 h-8 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
                <p className="text-sm text-[var(--muted)]">Connecting to {employee.name}...</p>
                <p className="text-xs text-[var(--muted)] max-w-[320px]">
                  Once connected, {employee.name} will introduce themselves and start researching your business.
                </p>
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
            ) : needsProvision ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
                <div className="text-4xl">🖥️</div>
                <div>
                  <h2 className="text-base font-semibold mb-1">Browser not available yet</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {employee.name} needs a running container to use the browser. Start their container first.
                  </p>
                </div>
                <button
                  onClick={handleProvision}
                  disabled={provisioning}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white"
                  style={{
                    background: provisioning ? '#333' : 'linear-gradient(135deg, #7c6bf0, #9b7bf7)',
                    opacity: provisioning ? 0.6 : 1,
                    cursor: provisioning ? 'wait' : 'pointer',
                  }}
                >
                  {provisioning ? 'Provisioning...' : 'Start container'}
                </button>
                {provisionError && <p className="text-red-400 text-sm">{provisionError}</p>}
              </div>
            ) : isProvisioning ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-8 h-8 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
                <p className="text-sm text-[var(--muted)]">Setting up {employee.name}&apos;s browser...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
                <div className="text-4xl">🖥️</div>
                <p className="text-sm text-[var(--muted)]">
                  Waiting for {employee.name}&apos;s browser to come online...
                </p>
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
                <span>
                  {isOnline ? '🟢 Online' :
                   isProvisioning ? '🟡 Provisioning...' :
                   employee.container_status === 'error' ? '🔴 Error' :
                   employee.container_status === 'none' ? '⚪ Not provisioned' :
                   '🔴 Offline'}
                </span>
              </div>
            </div>

            <KnowledgeBase employee={employee} />

            <div className="p-5 rounded-[10px] border border-[var(--border)]" style={{ background: '#151515' }}>
              <h2 className="text-sm font-semibold mb-3">Management</h2>
              <div className="flex flex-col gap-2">
                {needsProvision && (
                  <>
                    <button
                      onClick={handleProvision}
                      disabled={provisioning}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                      style={{
                        background: provisioning ? '#333' : 'linear-gradient(135deg, #7c6bf0, #9b7bf7)',
                        opacity: provisioning ? 0.6 : 1,
                        cursor: provisioning ? 'wait' : 'pointer',
                      }}
                    >
                      {provisioning ? 'Provisioning...' : '🚀 Start container'}
                    </button>
                    {provisionError && <p className="text-xs text-red-400">{provisionError}</p>}
                  </>
                )}
                <button
                  onClick={handleRestart}
                  disabled={restarting || needsProvision}
                  className="px-4 py-2.5 rounded-lg text-sm border border-[var(--border)] text-white"
                  style={{ background: '#1a1a1a', opacity: (restarting || needsProvision) ? 0.5 : 1, cursor: (restarting || needsProvision) ? 'not-allowed' : 'pointer' }}
                >
                  {restarting ? 'Restarting...' : '🔄 Restart employee'}
                </button>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                {needsProvision
                  ? 'Container needs to be started before use.'
                  : 'Restart will temporarily interrupt the conversation (~30 seconds).'}
              </p>
            </div>

            {/* Danger zone */}
            <div className="p-5 rounded-[10px] border border-red-900/50" style={{ background: '#151515' }}>
              <h2 className="text-sm font-semibold mb-3 text-red-400">Danger Zone</h2>
              {!showFireConfirm ? (
                <button
                  onClick={() => setShowFireConfirm(true)}
                  className="px-4 py-2.5 rounded-lg text-sm border border-red-900/50 text-red-400 hover:bg-red-950/30 transition-colors"
                  style={{ background: 'transparent' }}
                >
                  🗑️ Fire {employee.name}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-300">Are you sure? This will permanently delete {employee.name} and their container.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleFire}
                      disabled={firing}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: '#dc2626', opacity: firing ? 0.6 : 1 }}
                    >
                      {firing ? 'Firing...' : `Yes, fire ${employee.name}`}
                    </button>
                    <button
                      onClick={() => setShowFireConfirm(false)}
                      className="px-4 py-2 rounded-lg text-sm border border-[var(--border)] text-[var(--muted)]"
                      style={{ background: '#1a1a1a' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
