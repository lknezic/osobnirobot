'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { SKILLS, CHANNELS, TONES, WORKER_NAMES, WORKER_PRICE } from '@/lib/constants';

function getRandomName(): string {
  return WORKER_NAMES[Math.floor(Math.random() * WORKER_NAMES.length)];
}

const LAUNCH_STEPS = [
  'Setting up workspace...',
  'Researching your company...',
  'Analyzing competitors...',
  'Building knowledge base...',
  'Ready! Entering your office.',
];

function LaunchAnimation({ name }: { name: string }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= LAUNCH_STEPS.length) return;
    const delay = activeStep === 0 ? 2000 : 3000 + Math.random() * 2000;
    const timer = setTimeout(() => setActiveStep(s => s + 1), delay);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md px-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}>
          {name[0]}
        </div>
        <h2 className="text-2xl font-bold mb-6">{name} is getting ready...</h2>
        <div className="space-y-3 text-left max-w-xs mx-auto">
          {LAUNCH_STEPS.map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < activeStep ? (
                <span className="text-[var(--green)] text-sm">✓</span>
              ) : i === activeStep ? (
                <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-[var(--border)]" />
              )}
              <span className={`text-sm ${i <= activeStep ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    }>
      <Onboarding />
    </Suspense>
  );
}

const STORAGE_KEY = 'iw_onboarding';

function loadSavedProgress(): Partial<{
  step: number; selectedChannel: string;
  name: string; companyUrl: string; clientDesc: string;
  competitorUrls: string; tone: string;
}> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState('x-twitter');
  const [name, setName] = useState(getRandomName);
  const [companyUrl, setCompanyUrl] = useState('');
  const [clientDesc, setClientDesc] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [tone, setTone] = useState('witty');
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Restore saved progress on mount
  useEffect(() => {
    const saved = loadSavedProgress();
    if (saved.step) setStep(saved.step);
    if (saved.selectedChannel) setSelectedChannel(saved.selectedChannel);
    if (saved.name) setName(saved.name);
    if (saved.companyUrl) setCompanyUrl(saved.companyUrl);
    if (saved.clientDesc) setClientDesc(saved.clientDesc);
    if (saved.competitorUrls) setCompetitorUrls(saved.competitorUrls);
    if (saved.tone) setTone(saved.tone);
  }, []);

  // Save progress on every change
  useEffect(() => {
    if (launching) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step, selectedChannel, name, companyUrl, clientDesc, competitorUrls, tone,
      }));
    } catch { /* quota exceeded — ignore */ }
  }, [step, selectedChannel, name, companyUrl, clientDesc, competitorUrls, tone, launching]);

  const currentChannel = CHANNELS.find(c => c.id === selectedChannel) || CHANNELS[0];

  const handleLaunch = async () => {
    if (!name.trim()) { setError('Give your employee a name'); return; }

    setLaunching(true);
    setError('');

    try {
      const toneDesc = TONES.find(t => t.id === tone)?.desc || tone;
      const skillIds = currentChannel.skills;

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          personality: toneDesc,
          workerType: skillIds[0] || 'x-article-writer',
          skills: skillIds,
          workerConfig: {
            skills: skillIds,
            plan: 'worker',
            companyUrl: companyUrl.trim(),
            clientDescription: clientDesc.trim(),
            competitorUrls: competitorUrls.split('\n').map(u => u.trim()).filter(Boolean),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to hire employee');
      }

      // Clear saved progress on success
      localStorage.removeItem(STORAGE_KEY);
      // Wait for animation to feel complete, then redirect
      await new Promise(resolve => setTimeout(resolve, 12000));
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setLaunching(false);
    }
  };

  if (launching) {
    return <LaunchAnimation name={name} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Progress — 3 steps */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
          ))}
        </div>

        {/* Step 1: Choose your employee */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Choose your employee</h1>
            <p className="text-[var(--dim)] text-sm mb-6">Each employee specializes in one channel and masters all skills for it. ${WORKER_PRICE}/mo per employee.</p>
            <div className="space-y-3 mb-6">
              {CHANNELS.map(ch => {
                const chSkills = SKILLS.filter(s => ch.skills.includes(s.id));
                const hasAvailable = chSkills.some(s => s.available);
                return (
                  <button
                    key={ch.id}
                    onClick={() => { if (hasAvailable) { setSelectedChannel(ch.id); } }}
                    disabled={!hasAvailable}
                    className={`w-full p-4 rounded-[var(--r2)] border text-left transition-all ${
                      selectedChannel === ch.id
                        ? 'border-[var(--accent)]'
                        : !hasAvailable
                          ? 'border-[var(--border)] opacity-40 cursor-not-allowed'
                          : 'border-[var(--border)] hover:border-[var(--border-h)]'
                    }`}
                    style={{ background: selectedChannel === ch.id ? 'rgba(124,107,240,0.06)' : 'var(--bg2)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{ch.title} Employee</span>
                        {!hasAvailable && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">Coming Soon</span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--dim)]">${WORKER_PRICE}/mo</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {chSkills.map(skill => (
                        <span key={skill.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[var(--border)] text-[var(--dim)]">
                          <span>{skill.emoji}</span> {skill.title}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
              {/* Other channels coming soon */}
              <div className="p-4 rounded-[var(--r2)] border border-[var(--border)] opacity-40" style={{ background: 'var(--bg2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-base">Other Channels</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">Coming Soon</span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Instagram, YouTube, TikTok, LinkedIn, Email, Discord — each as a dedicated employee with all skills for that platform.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
            >
              Next
            </button>
            <p className="text-center text-[var(--muted)] text-xs mt-3">7-day free trial. Cancel anytime.</p>
          </>
        )}

        {/* Step 2: Teach your employee */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Teach your employee</h1>
            <p className="text-[var(--dim)] text-sm mb-6">
              Your employee will deeply research everything from your URL. The more you share, the smarter they start.
            </p>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Employee name</label>
              <div className="flex gap-2">
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="e.g. Axel, Nova, Scout..." maxLength={30} autoFocus
                  className="flex-1 px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                  style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
                <button
                  type="button"
                  onClick={() => setName(getRandomName())}
                  className="px-3 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm text-[var(--dim)] hover:text-[var(--text)] hover:border-[var(--border-h)] transition-colors"
                  style={{ background: 'var(--bg2)' }}
                  title="Random name"
                >
                  🎲
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Your company URL</label>
              <input type="url" value={companyUrl} onChange={e => setCompanyUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
              <p className="text-[10px] text-[var(--muted)] mt-1">Your employee will research your website, products, and positioning automatically.</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">What do you do and who do you help?</label>
              <textarea value={clientDesc} onChange={e => setClientDesc(e.target.value)}
                placeholder="e.g. We build AI tools for SaaS founders who want to scale from $1M to $10M ARR without hiring a marketing team."
                rows={3}
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Writing tone</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)}
                    className={`p-3 rounded-[var(--r2)] text-left border transition-all ${
                      tone === t.id ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--border-h)]'
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

            {/* Optional competitors */}
            {!showCompetitors ? (
              <button
                onClick={() => setShowCompetitors(true)}
                className="text-xs text-[var(--accent2)] hover:underline mb-5 block"
              >
                + Add competitor websites (optional)
              </button>
            ) : (
              <div className="mb-5">
                <label className="block text-sm text-[var(--dim)] mb-2">Competitor websites <span className="text-[var(--muted)]">(optional)</span></label>
                <textarea value={competitorUrls} onChange={e => setCompetitorUrls(e.target.value)}
                  placeholder={"https://competitor1.com\nhttps://competitor2.com"}
                  rows={2}
                  className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
                  style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-[var(--r2)] text-red-400 text-sm border border-red-800/30" style={{ background: 'rgba(239,68,68,0.08)' }}>{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)] hover:text-[var(--text)] transition-colors" style={{ background: 'var(--bg2)' }}>Back</button>
              <button
                onClick={() => { if (!name.trim()) { setError('Give your employee a name'); return; } setError(''); setStep(3); }}
                className="flex-1 py-3.5 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm & Launch */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Ready to hire {name}?</h1>
            <p className="text-[var(--dim)] text-sm mb-6">{name} will research your business and introduce themselves in chat.</p>

            <div className="p-5 rounded-[var(--r)] border border-[var(--border)] mb-4" style={{ background: 'var(--bg2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-lg">{name}</div>
                  <div className="text-xs text-[var(--dim)]">{currentChannel.title} Employee · {TONES.find(t => t.id === tone)?.label} tone</div>
                </div>
                <div className="text-xs text-[var(--dim)]">${WORKER_PRICE}/mo</div>
              </div>
              {companyUrl && (
                <div className="text-xs mb-2"><span className="text-[var(--dim)]">Company:</span> {companyUrl}</div>
              )}
              {clientDesc && (
                <div className="text-xs mb-2"><span className="text-[var(--dim)]">About:</span> {clientDesc.slice(0, 100)}{clientDesc.length > 100 ? '...' : ''}</div>
              )}
              {competitorUrls.trim() && (
                <div className="text-xs"><span className="text-[var(--dim)]">Competitors:</span> {competitorUrls.split('\n').filter(Boolean).length} website{competitorUrls.split('\n').filter(Boolean).length !== 1 ? 's' : ''}</div>
              )}
            </div>

            <div className="p-4 rounded-[var(--r2)] border border-[var(--accent)] mb-4" style={{ background: 'rgba(124,107,240,0.06)' }}>
              <p className="text-sm text-[var(--accent2)]">
                {name} will research your company, competitors, and audience. Their first message will be an introduction with everything they learned.
              </p>
            </div>

            <div className="p-4 rounded-[var(--r2)] border border-[var(--green-b)] mb-4" style={{ background: 'var(--green-g)' }}>
              <p className="text-sm text-[var(--green)]">
                After hiring, open the <strong>Browser tab</strong> on your dashboard and log into {currentChannel.id === 'x-twitter' ? 'X' : currentChannel.title}. Your employee needs access to publish content.
              </p>
            </div>

            <p className="text-xs text-[var(--muted)] mb-4">
              7-day free trial. ${WORKER_PRICE}/mo after trial. Cancel anytime.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-[var(--r2)] text-red-400 text-sm border border-red-800/30" style={{ background: 'rgba(239,68,68,0.08)' }}>{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)] hover:text-[var(--text)] transition-colors" style={{ background: 'var(--bg2)' }}>Back</button>
              <button onClick={handleLaunch}
                className="flex-1 py-3.5 rounded-[var(--r2)] font-bold text-sm text-white transition-all hover:brightness-110 hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
              >
                Start free trial
              </button>
            </div>

            <p className="text-center text-[var(--muted)] text-xs mt-4">
              No credit card required
            </p>
          </>
        )}
      </div>
    </div>
  );
}
