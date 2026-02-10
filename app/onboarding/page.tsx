'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const WORKERS = [
  {
    id: 'x-commenter',
    emoji: '🐦',
    title: 'X Commenter',
    desc: 'Comments on X/Twitter posts from accounts you choose. Builds your presence on autopilot.',
    status: 'available',
  },
  {
    id: 'email-writer',
    emoji: '📧',
    title: 'Email Writer',
    desc: 'Drafts and sends emails on your behalf. Cold outreach, follow-ups, replies.',
    status: 'coming',
  },
  {
    id: 'researcher',
    emoji: '📊',
    title: 'Research Analyst',
    desc: 'Monitors competitors, summarizes articles, generates reports.',
    status: 'coming',
  },
  {
    id: 'content-writer',
    emoji: '📝',
    title: 'Content Writer',
    desc: 'Blog posts, social media content, newsletters on autopilot.',
    status: 'coming',
  },
];

const TONES = [
  { id: 'witty', emoji: '😏', label: 'Witty', desc: 'Sharp, clever, a bit edgy' },
  { id: 'professional', emoji: '💼', label: 'Professional', desc: 'Polished and authoritative' },
  { id: 'friendly', emoji: '😊', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'provocative', emoji: '🔥', label: 'Provocative', desc: 'Bold takes, strong opinions' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [workerType, setWorkerType] = useState('x-commenter');
  const [name, setName] = useState('');
  const [tone, setTone] = useState('witty');
  const [targets, setTargets] = useState('');
  const [niche, setNiche] = useState('');
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLaunch = async () => {
    if (!name.trim()) { setError('Give your worker a name'); return; }

    setLaunching(true);
    setError('');

    try {
      const targetList = targets.split('\n').map(t => t.trim()).filter(Boolean);
      const toneDesc = TONES.find(t => t.id === tone)?.desc || tone;

      const res = await fetch('/api/containers/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantName: name.trim(),
          personality: toneDesc,
          workerType,
          workerConfig: {
            targets: targetList,
            niche: niche.trim(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start worker');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLaunching(false);
    }
  };

  if (launching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-8">
          <div className="w-12 h-12 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">Hiring {name}...</h2>
          <p className="text-[var(--dim)]">Setting up your {WORKERS.find(w => w.id === workerType)?.title}. This takes about 30 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
          ))}
        </div>

        {/* Step 1: Pick a skill worker */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Pick your worker</h1>
            <p className="text-[var(--dim)] text-sm mb-6">Choose a skill. You can add more later.</p>
            <div className="space-y-3 mb-6">
              {WORKERS.map(w => (
                <button
                  key={w.id}
                  onClick={() => { if (w.status === 'available') setWorkerType(w.id); }}
                  disabled={w.status === 'coming'}
                  className={`w-full p-4 rounded-[var(--r2)] border text-left transition-all ${
                    workerType === w.id
                      ? 'border-[var(--accent)] bg-[rgba(124,107,240,0.08)]'
                      : w.status === 'coming'
                        ? 'border-[var(--border)] opacity-50 cursor-not-allowed'
                        : 'border-[var(--border)] hover:border-[var(--border-h)] cursor-pointer'
                  }`}
                  style={{ background: workerType === w.id ? 'rgba(124,107,240,0.06)' : 'var(--bg2)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{w.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{w.title}</span>
                        {w.status === 'coming' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>Soon</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--dim)] mt-0.5">{w.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
            >
              Next →
            </button>
          </>
        )}

        {/* Step 2: Configure the worker */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Configure your {WORKERS.find(w => w.id === workerType)?.title}</h1>
            <p className="text-[var(--dim)] text-sm mb-6">Tell it who to engage with and what your niche is.</p>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Worker name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Alex, Scout, Echo..."
                maxLength={30}
                autoFocus
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Your niche / industry</label>
              <input
                type="text"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="e.g. AI startups, SaaS marketing, crypto..."
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">X accounts to engage with (one per line)</label>
              <textarea
                value={targets}
                onChange={e => setTargets(e.target.value)}
                placeholder={"@elonmusk\n@sama\n@paulg"}
                rows={4}
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-[var(--dim)] mb-2">Comment tone</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-3 rounded-[var(--r2)] text-left border transition-all ${
                      tone === t.id
                        ? 'border-[var(--accent)] bg-[rgba(124,107,240,0.08)]'
                        : 'border-[var(--border)] hover:border-[var(--border-h)]'
                    }`}
                    style={{ background: tone === t.id ? 'rgba(124,107,240,0.06)' : 'var(--bg2)' }}
                  >
                    <div className="text-lg mb-0.5">{t.emoji}</div>
                    <div className="font-medium text-xs">{t.label}</div>
                    <div className="text-[var(--muted)] text-[10px]">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-[var(--r2)] text-red-400 text-sm border border-red-800/30" style={{ background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)] hover:text-[var(--text)] transition-colors"
                style={{ background: 'var(--bg2)' }}
              >
                Back
              </button>
              <button
                onClick={() => { if (!name.trim()) { setError('Give your worker a name'); return; } setStep(3); }}
                className="flex-1 py-3.5 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm & Launch */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Ready to hire {name}?</h1>
            <p className="text-[var(--dim)] text-sm mb-6">Review your worker setup and launch.</p>

            <div className="p-5 rounded-[var(--r)] border border-[var(--border)] mb-6" style={{ background: 'var(--bg2)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{WORKERS.find(w => w.id === workerType)?.emoji}</span>
                <div>
                  <div className="font-bold text-lg">{name}</div>
                  <div className="text-xs text-[var(--dim)]">{WORKERS.find(w => w.id === workerType)?.title}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--dim)]">Tone</span>
                  <span>{TONES.find(t => t.id === tone)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--dim)]">Niche</span>
                  <span>{niche || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--dim)]">Targets</span>
                  <span>{targets.split('\n').filter(Boolean).length} accounts</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[var(--r2)] border border-[var(--green-b)] mb-6" style={{ background: 'var(--green-g)' }}>
              <p className="text-sm text-[var(--green)]">
                After hiring, open the <strong>Browser tab</strong> on your dashboard and log into x.com. Your worker will take it from there.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-[var(--r2)] text-red-400 text-sm border border-red-800/30" style={{ background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)] hover:text-[var(--text)] transition-colors"
                style={{ background: 'var(--bg2)' }}
              >
                Back
              </button>
              <button
                onClick={handleLaunch}
                className="flex-1 py-3.5 rounded-[var(--r2)] font-bold text-sm text-white transition-all hover:brightness-110 hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
              >
                Hire {name} →
              </button>
            </div>

            <p className="text-center text-[var(--muted)] text-xs mt-4">
              Free for 7 days · No credit card required
            </p>
          </>
        )}
      </div>
    </div>
  );
}
