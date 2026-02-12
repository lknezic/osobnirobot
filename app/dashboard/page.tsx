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
  planStatus?: string;
  selectedPlan?: string;
  trialEndsAt?: string;
  hasSubscription?: boolean;
  workerConfig?: Record<string, unknown>;
}

export default function Dashboard() {
  const [cs, setCs] = useState<ContainerState>({ exists: false, status: 'none' });
  const [tab, setTab] = useState<Tab>('chat');
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [reprovisioning, setReprovisioning] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStage, setSaveStage] = useState('');
  // Editable config fields
  const [editCompanyUrl, setEditCompanyUrl] = useState('');
  const [editClientDesc, setEditClientDesc] = useState('');
  const [editCompetitorUrls, setEditCompetitorUrls] = useState('');
  const [configLoaded, setConfigLoaded] = useState(false);
  const router = useRouter();

  const HOST = process.env.NEXT_PUBLIC_CONTAINER_HOST || 'instantworker.ai';

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/containers/status');
      const data = await res.json();
      setCs(data);
      // Only redirect to onboarding if no container AND no active subscription
      const hasPaid = data.planStatus === 'active' || data.planStatus === 'trial';
      if ((!data.exists || data.status === 'none') && !hasPaid) {
        router.push('/onboarding');
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    // Poll while creating, and also every 30s for running containers (detect crashes)
    const interval = cs.status === 'creating' ? 5000 : 30000;
    const i = setInterval(fetchStatus, interval);
    return () => clearInterval(i);
  }, [fetchStatus, cs.status]);

  // Populate editable config from status
  useEffect(() => {
    if (cs.workerConfig && !configLoaded) {
      const wc = cs.workerConfig as Record<string, unknown>;
      setEditCompanyUrl((wc.companyUrl as string) || '');
      setEditClientDesc((wc.clientDescription as string) || '');
      const urls = Array.isArray(wc.competitorUrls) ? (wc.competitorUrls as string[]).join('\n') : '';
      setEditCompetitorUrls(urls);
      setConfigLoaded(true);
    }
  }, [cs.workerConfig, configLoaded]);

  // Track chat tab views for trial paywall
  useEffect(() => {
    if (tab !== 'chat' || cs.hasSubscription || cs.planStatus !== 'trial') return;
    const key = 'iw_chat_views';
    const views = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, String(views));
    if (views > 3) {
      setShowPaywall(true);
    }
  }, [tab, cs.hasSubscription, cs.planStatus]);

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
    } catch (err) {
      console.error('Restart error:', err);
      setRestarting(false);
    }
  };

  const handleReprovision = async () => {
    setReprovisioning(true);
    try {
      const res = await fetch('/api/containers/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantName: cs.assistantName || 'Worker',
          personality: '',
          workerType: 'general',
          workerConfig: {},
        }),
      });
      if (res.ok) {
        // Poll for status
        setTimeout(() => fetchStatus(), 3000);
      } else {
        const data = await res.json();
        console.error('Reprovision failed:', data.error);
        setReprovisioning(false);
      }
    } catch (err) {
      console.error('Reprovision error:', err);
      setReprovisioning(false);
    }
  };

  const handleBilling = async () => {
    setBillingLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not open billing portal');
      }
    } catch (err) {
      setError('Failed to connect to billing');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveProgress(0);
    setSaveStage('Saving configuration...');
    setError('');

    try {
      // Stage 1: Save config (0-30%)
      const progressTimer = setInterval(() => {
        setSaveProgress(prev => {
          if (prev < 25) return prev + 3;
          if (prev < 50) return prev + 2;
          if (prev < 80) return prev + 1;
          return prev;
        });
      }, 500);

      const res = await fetch('/api/containers/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyUrl: editCompanyUrl.trim(),
          clientDescription: editClientDesc.trim(),
          competitorUrls: editCompetitorUrls.split('\n').map(u => u.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSaveProgress(35);
      setSaveStage('Restarting worker...');

      // Stage 2: Wait for restart (35-85%)
      await new Promise(resolve => setTimeout(resolve, 8000));
      setSaveProgress(70);
      setSaveStage('Almost ready...');

      // Stage 3: Poll for running status
      let attempts = 0;
      while (attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        setSaveProgress(Math.min(70 + attempts * 2, 95));
        try {
          const statusRes = await fetch('/api/containers/status');
          const statusData = await statusRes.json();
          if (statusData.status === 'running') {
            setSaveProgress(100);
            setSaveStage('Ready!');
            setCs(statusData);
            break;
          }
        } catch {
          // Keep polling
        }
      }

      clearInterval(progressTimer);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setSaveProgress(0);
      setSaveStage('');
    }
  };

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(true);
    setError('');
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, planId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      await supabase.auth.signOut();
    } catch {
      // Sign out locally even if API fails
    }
    router.push('/');
  };

  const daysLeft = cs.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(cs.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  // Check if subscription is active or in trial
  const isActive = cs.planStatus === 'active' || cs.planStatus === 'trial';
  const isExpired = cs.planStatus === 'cancelled' || cs.planStatus === 'past_due' ||
    cs.planStatus === 'expired' || (cs.planStatus === 'trial' && daysLeft <= 0);

  const planLabel = cs.selectedPlan
    ? cs.selectedPlan.charAt(0).toUpperCase() + cs.selectedPlan.slice(1)
    : 'Free Trial';

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  if (cs.status === 'creating') {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Setting up your AI employee...</p>
        <p style={styles.loadingSubtext}>This may take up to 30 seconds</p>
      </div>
    );
  }

  // Subscription expired — show upgrade prompt
  if (isExpired) {
    return (
      <div style={styles.loadingScreen}>
        <div style={{ maxWidth: 440, textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            {cs.planStatus === 'past_due' ? 'Payment failed' : 'Your plan has expired'}
          </h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: '1.6' }}>
            {cs.planStatus === 'past_due'
              ? 'Your last payment didn\'t go through. Update your payment method to keep your worker running.'
              : 'Your free trial or subscription has ended. Subscribe to keep your worker running 24/7.'}
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            style={{
              padding: '12px 32px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #7c6bf0, #9b7bf7)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            Choose a plan
          </button>
          <br />
          <button onClick={handleLogout} style={{ ...styles.logoutBtn, marginTop: 8 }}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  // Paid but container missing or stopped — offer reprovision
  const hasPaid = cs.planStatus === 'active' || cs.planStatus === 'trial';
  const containerDown = !cs.exists || cs.status === 'none' || cs.status === 'stopped' || cs.status === 'error';
  if (hasPaid && containerDown && !reprovisioning) {
    return (
      <div style={styles.loadingScreen}>
        <div style={{ maxWidth: 440, textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Worker is offline
          </h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: '1.6' }}>
            Your subscription is active but your worker isn&apos;t running.
            {cs.status === 'error' ? ' It may have encountered an error.' : ''} Click below to restart it.
          </p>
          <button
            onClick={handleReprovision}
            style={{
              padding: '12px 32px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #7c6bf0, #9b7bf7)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            🔄 Restart worker
          </button>
          <br />
          <button onClick={handleLogout} style={{ ...styles.logoutBtn, marginTop: 8 }}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  if (reprovisioning) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Restarting your worker...</p>
        <p style={styles.loadingSubtext}>This may take up to 30 seconds</p>
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
            <h1 style={styles.assistantName}>{cs.assistantName || 'Worker'}</h1>
            <span style={{
              ...styles.statusBadge,
              background: cs.status === 'running' ? '#059669' : '#dc2626',
            }}>
              {cs.status === 'running' ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
        <div style={styles.headerRight}>
          {cs.planStatus === 'trial' && daysLeft > 0 && (
            <span style={styles.trialBadge}>
              Free trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </span>
          )}
          {cs.planStatus === 'active' && (
            <span style={styles.activeBadge}>
              {planLabel} plan
            </span>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabBar}>
        {([
          { id: 'chat' as Tab, label: '💬 Chat', icon: '' },
          { id: 'browser' as Tab, label: '🖥️ Browser', icon: '' },
          { id: 'settings' as Tab, label: '⚙️ Settings', icon: '' },
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
              <>
                <iframe
                  src={chatUrl}
                  style={{
                    ...styles.iframe,
                    ...(showPaywall ? { filter: 'blur(6px)', pointerEvents: 'none' as const } : {}),
                  }}
                  allow="microphone; camera; clipboard-write; clipboard-read"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                />
                {showPaywall && (
                  <div style={styles.paywallOverlay}>
                    <div style={styles.paywallCard}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                        Enjoying {cs.assistantName || 'your worker'}?
                      </h2>
                      <p style={{ fontSize: 14, color: '#999', marginBottom: 24, lineHeight: '1.6' }}>
                        Subscribe to keep chatting and let your AI employee work 24/7.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
                        {[
                          { id: 'simple', title: 'Simple', price: '$99/mo', desc: '1 skill' },
                          { id: 'expert', title: 'Expert', price: '$399/mo', desc: 'Up to 5 skills' },
                          { id: 'legend', title: 'Legend', price: '$499/mo', desc: 'All skills' },
                        ].map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleCheckout(p.id)}
                            disabled={checkoutLoading}
                            style={{
                              padding: '14px 20px',
                              borderRadius: 10,
                              background: p.id === 'simple' ? 'linear-gradient(135deg, #7c6bf0, #9b7bf7)' : '#1a1a1a',
                              border: p.id === 'simple' ? 'none' : '1px solid #333',
                              color: '#fff',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: checkoutLoading ? 'wait' : 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              opacity: checkoutLoading ? 0.6 : 1,
                            }}
                          >
                            <span>{p.title} — {p.desc}</span>
                            <span style={{ fontWeight: 700 }}>{p.price}</span>
                          </button>
                        ))}
                      </div>
                      {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
                      <p style={{ fontSize: 12, color: '#666', marginTop: 16 }}>7-day free trial · Cancel anytime</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={styles.placeholder}>
                <p>⏳ Connecting to your AI employee...</p>
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
                  👁️ Watch your AI employee browse the web in real time.
                  If it needs a password, enter it here.
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
                <p>🖥️ Browser not available</p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div style={styles.settingsPanel}>
            {/* Save progress overlay */}
            {saving && (
              <div style={styles.saveOverlay}>
                <div style={styles.saveCard}>
                  <div style={styles.loadingSpinner} />
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>{saveStage}</p>
                  <div style={{ width: '100%', maxWidth: 280, height: 6, borderRadius: 3, background: '#333', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #7c6bf0, #9b7bf7)',
                      width: `${saveProgress}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                    {saveProgress < 35 ? 'Saving your changes...' :
                     saveProgress < 70 ? 'Worker is restarting (~20s)...' :
                     saveProgress < 95 ? 'Almost there...' : 'Done!'}
                  </p>
                </div>
              </div>
            )}

            <div style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>AI Employee</h2>
              <div style={styles.settingRow}>
                <span style={styles.settingLabel}>Name</span>
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
                  {cs.planStatus === 'trial'
                    ? `Free trial (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`
                    : cs.planStatus === 'active'
                      ? `${planLabel} — Active`
                      : cs.planStatus || '—'}
                </span>
              </div>
            </div>

            <div style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>Worker Configuration</h2>
              <p style={styles.settingHint}>
                Update your business details. Changes will restart the worker (~30 seconds).
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={styles.inputLabel}>Company URL</label>
                <input
                  type="url"
                  value={editCompanyUrl}
                  onChange={e => setEditCompanyUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                  style={styles.input}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={styles.inputLabel}>Target Audience</label>
                <textarea
                  value={editClientDesc}
                  onChange={e => setEditClientDesc(e.target.value)}
                  placeholder="Who is your client?"
                  rows={3}
                  style={styles.textarea}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={styles.inputLabel}>Competitor Websites (one per line)</label>
                <textarea
                  value={editCompetitorUrls}
                  onChange={e => setEditCompetitorUrls(e.target.value)}
                  placeholder={"https://competitor1.com\nhttps://competitor2.com"}
                  rows={3}
                  style={styles.textarea}
                />
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c6bf0, #9b7bf7)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Save &amp; restart worker
              </button>
              {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
            </div>

            <div style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>Billing</h2>
              <p style={styles.settingHint}>
                Manage your subscription, update payment method, or change plans.
              </p>
              <button
                onClick={handleBilling}
                disabled={billingLoading}
                style={{
                  ...styles.restartBtn,
                  opacity: billingLoading ? 0.5 : 1,
                }}
              >
                {billingLoading ? '⏳ Loading...' : '💳 Manage subscription'}
              </button>
            </div>

            <div style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>Management</h2>
              <button
                onClick={handleRestart}
                disabled={restarting}
                style={{
                  ...styles.restartBtn,
                  opacity: restarting ? 0.5 : 1,
                }}
              >
                {restarting ? '⏳ Restarting...' : '🔄 Restart worker'}
              </button>
              <p style={styles.settingHint}>
                Restart will temporarily interrupt the conversation (~30 seconds).
              </p>
            </div>

            <div style={{ ...styles.settingsCard, borderColor: '#dc2626' }}>
              <h2 style={{ ...styles.settingsTitle, color: '#dc2626' }}>Danger zone</h2>
              <button onClick={handleLogout} style={styles.dangerBtn}>
                Log out
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
  activeBadge: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 6,
    background: '#052e16',
    color: '#4ade80',
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

  // Settings inputs
  inputLabel: {
    display: 'block',
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#0a0a0a',
    color: '#e5e5e5',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#0a0a0a',
    color: '#e5e5e5',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },

  // Save overlay
  saveOverlay: {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    zIndex: 100,
  },
  saveCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '40px 32px',
    maxWidth: 360,
    width: '90%',
  },

  // Paywall
  paywallOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    zIndex: 50,
  },
  paywallCard: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 16,
    padding: '40px 32px',
    textAlign: 'center' as const,
    maxWidth: 420,
    width: '90%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
};
