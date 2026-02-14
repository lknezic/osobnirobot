'use client';

import { useState, useEffect } from 'react';
import type { Employee } from '@/lib/types';

interface IntegrationsProps {
  employee: Employee;
}

interface TelegramStatus {
  connectUrl: string;
  isConnected: boolean;
  botUsername: string;
}

interface ChannelCard {
  id: string;
  name: string;
  status: 'connected' | 'not_setup' | 'always_on';
  capabilities: string[];
  statusText: string;
  blocker?: string;
}

export function Integrations({ employee }: IntegrationsProps) {
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchTelegramStatus(employee.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  const fetchTelegramStatus = async (empId: string) => {
    try {
      const res = await fetch(`/api/integrations/telegram/connect?employeeId=${empId}`);
      if (res.ok) {
        setTelegramStatus(await res.json());
      }
    } catch {
      // Telegram not configured
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/integrations/telegram/connect?employeeId=${employee.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTelegramStatus(prev => prev ? { ...prev, isConnected: false } : null);
      }
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  };

  const channels: ChannelCard[] = [
    {
      id: 'telegram',
      name: 'Telegram',
      status: telegramStatus?.isConnected ? 'connected' : 'not_setup',
      capabilities: ['Notifications', 'Alerts', 'Login Help'],
      statusText: telegramStatus?.isConnected ? 'Connected' : 'Not connected',
      blocker: !telegramStatus?.isConnected ? 'Open the connect link below' : undefined,
    },
    {
      id: 'slack',
      name: 'Slack',
      status: 'not_setup',
      capabilities: ['Notifications', 'Threads', 'Alerts'],
      statusText: 'Coming soon',
      blocker: 'Slack integration planned',
    },
    {
      id: 'webchat',
      name: 'Dashboard Chat',
      status: 'always_on',
      capabilities: ['Chat', 'File Sharing', 'Browser'],
      statusText: 'Built-in, always available',
    },
  ];

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    connected: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80', dot: '#4ade80' },
    not_setup: { bg: 'rgba(156,163,175,0.1)', text: '#9ca3af', dot: '#6b7280' },
    always_on: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', dot: '#3b82f6' },
  };

  return (
    <div className="p-5 rounded-[10px] border border-[var(--border)]" style={{ background: '#151515' }}>
      <h2 className="text-sm font-semibold mb-4">Connections</h2>
      <div className="flex flex-col gap-3">
        {channels.map(channel => {
          const colors = statusColors[channel.status];
          return (
            <div
              key={channel.id}
              className="p-4 rounded-xl border"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{channel.name}</span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  <span style={{ fontSize: 6, color: colors.dot }}>●</span>
                  {channel.status === 'connected' ? 'CONNECTED' : channel.status === 'always_on' ? 'ALWAYS ON' : 'NOT SET UP'}
                </span>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {channel.capabilities.map(cap => (
                  <span
                    key={cap}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {/* Status text */}
              <div className="text-xs" style={{ color: '#666' }}>
                {channel.statusText}
              </div>

              {/* Blocker */}
              {channel.blocker && channel.status === 'not_setup' && (
                <div className="mt-1.5 text-[10px] px-2 py-0.5 rounded inline-block" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  {channel.blocker}
                </div>
              )}

              {/* Telegram actions */}
              {channel.id === 'telegram' && !loading && telegramStatus && (
                <div className="mt-3 flex gap-2">
                  {telegramStatus.isConnected ? (
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                      style={{
                        borderColor: 'rgba(239,68,68,0.3)',
                        color: '#f87171',
                        background: 'transparent',
                        opacity: disconnecting ? 0.5 : 1,
                      }}
                    >
                      {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <a
                      href={telegramStatus.connectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg font-medium no-underline inline-block"
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                      }}
                    >
                      Connect Telegram
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
