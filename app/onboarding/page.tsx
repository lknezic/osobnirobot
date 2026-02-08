'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PERSONALITIES = [
  { id: 'friendly', emoji: '😊', label: 'Prijateljski', labelEn: 'Friendly', desc: 'Topao i pristupačan' },
  { id: 'professional', emoji: '💼', label: 'Profesionalan', labelEn: 'Professional', desc: 'Koncizan i efikasan' },
  { id: 'funny', emoji: '😄', label: 'Duhovit', labelEn: 'Funny', desc: 'Zabavan uz posao' },
  { id: 'minimal', emoji: '🎯', label: 'Minimalan', labelEn: 'Minimal', desc: 'Samo bitno, bez muda' },
];

export default function Onboarding() {
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('friendly');
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLaunch = async () => {
    if (!name.trim()) {
      setError('Upiši ime za svog asistenta');
      return;
    }

    setLaunching(true);
    setError('');

    try {
      const res = await fetch('/api/containers/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantName: name.trim(),
          personality: PERSONALITIES.find(p => p.id === personality)?.desc || '',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Greška pri pokretanju');
      }

      // Redirect to dashboard — it will show provisioning status
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLaunching(false);
    }
  };

  // ── Launching screen ──
  if (launching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="text-center max-w-md px-8">
          <div className="w-12 h-12 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">
            Pokrećem {name}...
          </h2>
          <p className="text-gray-500">
            Pripremam tvog osobnog AI asistenta. Samo trenutak.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
      <div className="w-full max-w-md px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🤖</div>
          <h1 className="text-3xl font-bold mb-2">
            Tvoj osobni asistent
          </h1>
          <p className="text-gray-500">
            Daj mu ime i pokreni ga. Traje manje od minute.
          </p>
        </div>

        {/* Name input */}
        <div className="mb-8">
          <label className="block text-sm text-gray-400 mb-2">
            Kako se zove tvoj asistent?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="npr. Marko, Luna, Asistent..."
            maxLength={30}
            autoFocus
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white text-lg focus:border-blue-500 focus:outline-none placeholder-gray-600"
          />
        </div>

        {/* Personality picker */}
        <div className="mb-8">
          <label className="block text-sm text-gray-400 mb-3">
            Kakav stil komunikacije?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonality(p.id)}
                className={`p-4 rounded-lg text-left border transition-all ${
                  personality === p.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-[#1a1a1a] hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="font-medium text-sm">{p.label}</div>
                <div className="text-gray-500 text-xs">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={!name.trim()}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            name.trim()
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          Pokreni {name || 'asistenta'} →
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          Besplatno 7 dana · Nije potrebna kartica
        </p>
      </div>
    </div>
  );
}
