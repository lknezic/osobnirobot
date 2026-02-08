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
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

  const webchatUrl = cs.gatewayPort
    ? `https://${cs.gatewayPort}.gw.${HOST}/?token=${cs.gatewayToken}`
    : '';
  const novncUrl = cs.novncPort
    ? `https://${cs.novncPort}.vnc.${HOST}/vnc.html?autoconnect=true&resize=scale`
    : '';

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />
          <p className="text-gray-500">Učitavanje...</p>
        </div>
      </div>
    );
  }

  // ── Provisioning ──
  if (cs.status === 'creating') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="text-center max-w-md px-8">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />
          <h2 className="text-2xl font-bold mb-3">
            Postavljam {cs.assistantName || 'asistenta'}...
          </h2>
          <p className="text-gray-500 mb-6">
            Tvoj osobni AI asistent se upravo pokreće. Ovo traje 15-30 sekundi.
          </p>
          <div className="text-left space-y-2 text-sm">
            <div className="text-green-400">✅ Račun kreiran</div>
            <div className="text-green-400">✅ Prostor pripremljen</div>
            <div className="text-yellow-400">⏳ Pokrećem asistenta...</div>
            <div className="text-gray-600">⬜ Preglednik spreman</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Stopped ──
  if (cs.status === 'stopped') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="text-center max-w-md px-8">
          <h2 className="text-2xl font-bold mb-3">
            {cs.assistantName || 'Asistent'} je pauziran
          </h2>
          <p className="text-gray-500 mb-6">
            Tvoje probno razdoblje je isteklo. Nadogradi plan za nastavak.
          </p>
          <a
            href="/api/stripe/checkout"
            className="inline-block px-7 py-3.5 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Nadogradi — od $19/mj
          </a>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (cs.status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="text-center max-w-md px-8">
          <h2 className="text-2xl font-bold mb-3">Nešto je pošlo po krivu</h2>
          <p className="text-gray-500 mb-6">
            Problem s pokretanjem asistenta.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg"
          >
            Osvježi
          </button>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ──
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex justify-between items-center px-5 py-3 border-b border-gray-800 bg-[#111]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <span className="text-lg font-bold">{cs.assistantName || 'Asistent'}</span>
          <span className="text-green-400 text-xs">● Aktivan</span>
        </div>
        <div className="flex items-center gap-3">
          {cs.plan === 'trial' && (
            <span className="px-2.5 py-1 bg-yellow-400 text-black rounded text-xs font-semibold">
              Probno
            </span>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="px-3 py-1.5 text-gray-500 border border-gray-700 rounded text-sm hover:bg-gray-800"
          >
            Odjava
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex border-b border-gray-800 bg-[#111]">
        {([
          ['chat', '💬 Chat'],
          ['browser', '👁 Preglednik'],
          ['settings', '⚙️ Postavke'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              tab === id
                ? 'text-white border-blue-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {tab === 'chat' && (
          <div className="h-full">
            {webchatUrl ? (
              <iframe
                src={webchatUrl}
                className="w-full h-full border-none"
                title="Chat s asistentom"
                allow="microphone"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">
                Povezivanje s asistentom...
              </div>
            )}
          </div>
        )}

        {tab === 'browser' && (
          <div className="h-full flex flex-col">
            <div className="px-5 py-3 bg-[#1a1a2e] border-b border-gray-800">
              <p className="text-gray-400 text-sm">
                🖥️ Ovo je preglednik tvog asistenta. Kad asistent treba da se prijaviš
                na neku stranicu, ovdje možeš upisati lozinku — asistent je nikad ne vidi.
                Chrome će spremiti lozinku za sljedeći put.
              </p>
            </div>
            {novncUrl ? (
              <iframe
                src={novncUrl}
                className="flex-1 w-full border-none"
                title="Preglednik asistenta"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600">
                Preglednik se učitava...
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="p-8 max-w-xl">
            <h2 className="text-xl font-bold mb-6">Postavke</h2>

            <div className="mb-6 pb-5 border-b border-gray-800">
              <h3 className="text-sm text-gray-500 mb-1">Asistent</h3>
              <p className="text-base">{cs.assistantName || 'Asistent'}</p>
            </div>

            <div className="mb-6 pb-5 border-b border-gray-800">
              <h3 className="text-sm text-gray-500 mb-1">Plan</h3>
              <p className="text-base">
                {cs.plan === 'trial' ? 'Probno razdoblje (7 dana)' : cs.plan}
              </p>
              {cs.plan === 'trial' && (
                <a href="/api/stripe/checkout" className="text-blue-500 text-sm mt-1 inline-block">
                  Nadogradi →
                </a>
              )}
            </div>

            <div className="mb-6 pb-5 border-b border-gray-800">
              <h3 className="text-sm text-gray-500 mb-1">Kanali</h3>
              <p className="text-base text-gray-300">✅ Web chat</p>
              <p className="text-base text-gray-500">📱 Telegram — uskoro</p>
              <p className="text-base text-gray-500">💬 WhatsApp — uskoro</p>
            </div>

            <div className="mt-8">
              <button
                onClick={async () => {
                  await fetch('/api/containers/restart', { method: 'POST' });
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700"
              >
                🔄 Ponovno pokreni asistenta
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
