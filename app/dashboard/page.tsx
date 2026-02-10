'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

type ContainerStatus = 'none' | 'creating' | 'running' | 'stopped' | 'error';
type Tab = 'chat' | 'browser' | 'settings';

interface ContainerState {
  exists: boolean;
  status: ContainerStatus;
  gatewayPort?: number;
  novncPort?: number;
  gatewayToken?: string;
  assistantName?: string;
  plan?: string;
  trialEndsAt?: string;
}

export default function Dashboard() {
  const [cs, setCs] = useState<ContainerState>({ exists: false, status: 'none' });
  const [tab, setTab] = useState<Tab>('chat');
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const router = useRouter();

  const HOST = process.env.NEXT_PUBLIC_CONTAINER_HOST || 'osobnirobot.com';

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/containers/status');
      const data = await res.json();
      setCs(data);
      if (!data.exists || data.status === 'none') router.push('/onboarding');
    } catch {
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    const i = setInterval(() => {
      if (cs.status === 'creating') fetchStatus();
    }, 5000);
    return () => clearInterval(i);
  }, [fetchStatus, cs.status]);

  const chatUrl = cs.gatewayPort && cs.gatewayToken
    ? `https://${cs.gatewayPort}.gw.${HOST}/?token=${cs.gatewayToken}`
    : '';

  const browserUrl = cs.novncPort
    ? `https://${cs.novncPort}.vnc.${HOST}/vnc.html?autoconnect=true&resize=scale&reconnect=true&reconnect_delay=3000`
    : '';

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await fetch('/api/containers/restart', { method: 'POST' });
      setTimeout(() => {
        fetchStatus();
        setRestarting(false);
      }, 5000);
    } catch {
      setRestarting(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const daysLeft = cs.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(cs.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Učitavanje...</p>
      </div>
    );
  }

  if (cs.status === 'creating') {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Kreiramo tvog asistenta...</p>
        <p style={styles.loadingSubtext}>Ovo može potrajati do 30 sekundi</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>
            {(cs.assistantName || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={styles.assistantName}>{cs.assistantName || 'Asistent'}</h1>
            <span style={{
              ...styles.statusBadge,
              background: cs.status === 'running' ? '#059669' : '#dc2626',
            }}>
              {cs.status === 'running' ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
        <div style={styles.headerRight}>
          {cs.plan === 'trial' && daysLeft > 0 && (
            <span style={styles.trialBadge}>
              Probni period: {daysLeft} dana
            </span>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn}>Odjava</button>
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabBar}>
        {([
          { id: 'chat' as Tab, label: '💬 Razgovor', icon: '' },
          { id: 'browser' as Tab, label: '🖥️ Preglednik', icon: '' },
          { id: 'settings' as Tab, label: '⚙️ Postavke', icon: '' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...styles.tab,
              ...(tab === t.id ? styles.tabActive : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={styles.content}>
        {/* Chat Tab — iframe to OpenClaw WebChat */}
        {tab === 'chat' && (
          <div style={styles.iframeContainer}>
            {chatUrl ? (
              <iframe
                src={chatUrl}
                style={styles.iframe}
                allow="microphone; camera; clipboard-write; clipboard-read"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              />
            ) : (
              <div style={styles.placeholder}>
                <p>⏳ Čekam spajanje na asistenta...</p>
              </div>
            )}
          </div>
        )}

        {/* Browser Tab — noVNC iframe */}
        {tab === 'browser' && (
          <div style={styles.iframeContainer}>
            {browserUrl ? (
              <>
                <div style={styles.browserNotice}>
                  👁️ Ovdje možeš vidjeti što tvoj asistent radi u pregledniku.
                  Ako treba unijeti lozinku, unesi je ovdje.
                </div>
                <iframe
                  src={browserUrl}
                  style={styles.iframe}
                  allow="clipboard-write; clipboard-read"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </>
            ) : (
              <div style={styles.placeholder}>
                <p>🖥️ Preglednik nije dostupan</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div style={styles.settingsPanel}>
            <div style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>Asistent</h2>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Ime</span>
                <span style={styles.settingValue}>{cs.assistantName || '—'}</span>
              </div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Status</span>
                <span style={styles.settingValue}>
                  {cs.status === 'running' ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Plan</span>
                <span style={styles.settingValue}>
                  {cs.plan === 'trial' ? `Probni period (${daysLeft} dana)` : cs.plan || '—'}
                </span>
              </div>
            </div>

            <div style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>Konfiguracija</h2>
              <p style={styles.settingHint}>
                Za napredne postavke (vještine, osobnost, memorija), koristi
                Settings u chat sučelju → tab "⚙️ Postavke" unutar OpenClaw dashboarda.
              </p>
              {chatUrl && (
                <a
                  href={chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkBtn}
                >
                  Otvori puni dashboard ↗
                </a>
              )}
            </div>

            <div style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>Upravljanje</h2>
              <button
                onClick={handleRestart}
                disabled={restarting}
                style={{
                  ...styles.restartBtn,
                  opacity: restarting ? 0.5 : 1,
                }}
              >
                {restarting ? '⏳ Restartiram...' : '🔄 Restart asistenta'}
              </button>
              <p style={styles.settingHint}>
                Restart će privremeno prekinuti razgovor (~30 sekundi).
              </p>
            </div>

            <div style={{ ...styles.settingsCard, borderColor: '#dc2626' }}>
              <h2 style={{ ...styles.settingsTitle, color: '#dc2626' }}>Opasna zona</h2>
              <button onClick={handleLogout} style={styles.dangerBtn}>
                Odjavi se
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  // Loading
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0a0a0a',
    color: '#fff',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '3px solid #333',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ccc',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },

  // Layout
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0a0a0a',
    color: '#e5e5e5',
    overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    background: '#111',
    borderBottom: '1px solid #222',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
  },
  assistantName: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    color: '#fff',
  },
  statusBadge: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    color: '#fff',
    fontWeight: 500,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  trialBadge: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 6,
    background: '#1e3a5f',
    color: '#93c5fd',
    fontWeight: 500,
  },
  logoutBtn: {
    fontSize: 13,
    padding: '6px 12px',
    borderRadius: 6,
    background: 'transparent',
    border: '1px solid #333',
    color: '#999',
    cursor: 'pointer',
  },

  // Tabs
  tabBar: {
    display: 'flex',
    gap: 0,
    background: '#111',
    borderBottom: '1px solid #222',
    flexShrink: 0,
    paddingLeft: 20,
  },
  tab: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    color: '#fff',
    borderBottomColor: '#3b82f6',
  },

  // Content
  content: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  iframeContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  iframe: {
    flex: 1,
    width: '100%',
    border: 'none',
    background: '#111',
  },
  browserNotice: {
    padding: '8px 20px',
    fontSize: 13,
    color: '#93c5fd',
    background: '#0c1929',
    borderBottom: '1px solid #1e3a5f',
    flexShrink: 0,
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    fontSize: 15,
  },

  // Settings
  settingsPanel: {
    padding: 24,
    maxWidth: 600,
    margin: '0 auto',
    overflowY: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  settingsCard: {
    background: '#151515',
    border: '1px solid #222',
    borderRadius: 10,
    padding: 20,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 16,
    color: '#fff',
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #1a1a1a',
  },
  settingLabel: {
    fontSize: 13,
    color: '#888',
  },
  settingValue: {
    fontSize: 14,
    color: '#e5e5e5',
    fontWeight: 500,
  },
  settingHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: '1.5',
    margin: '0 0 12px',
  },
  linkBtn: {
    display: 'inline-block',
    padding: '8px 16px',
    borderRadius: 6,
    background: '#1e3a5f',
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
  },
  restartBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    background: '#1a1a1a',
    border: '1px solid #333',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 8,
  },
  dangerBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    background: '#1a0505',
    border: '1px solid #dc2626',
    color: '#dc2626',
    fontSize: 14,
    cursor: 'pointer',
  },
};
