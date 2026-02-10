'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SKILLS = [
  { id: 'x-commenter', emoji: '💬', title: 'X Commenter', category: 'X / Twitter' },
  { id: 'x-article-writer', emoji: '📰', title: 'X Article Writer', category: 'X / Twitter' },
  { id: 'x-thread-writer', emoji: '🧵', title: 'X Thread Writer', category: 'X / Twitter' },
  { id: 'email-newsletter', emoji: '📨', title: 'Email Newsletter', category: 'Email' },
  { id: 'email-flow', emoji: '⚡', title: 'Email Flow Writer', category: 'Email' },
  { id: 'email-responder', emoji: '📧', title: 'Email Responder', category: 'Email' },
  { id: 'yt-shorts-script', emoji: '🎬', title: 'YT Shorts Script', category: 'YouTube' },
  { id: 'yt-long-script', emoji: '🎥', title: 'YT Long Script', category: 'YouTube' },
  { id: 'yt-community', emoji: '📢', title: 'YT Community Post', category: 'YouTube' },
];

const PLANS = [
  { id: 'simple', title: 'Simple', price: '$99', desc: '1 skill, 24/7', maxSkills: 1 },
  { id: 'expert', title: 'Expert', price: '$399', desc: 'Up to 5 skills, 24/7', maxSkills: 5 },
  { id: 'legend', title: 'Legend', price: '$499', desc: 'All skills, 24/7', maxSkills: 9 },
];

const TONES = [
  { id: 'witty', emoji: '😏', label: 'Witty', desc: 'Sharp, clever, a bit edgy' },
  { id: 'professional', emoji: '💼', label: 'Professional', desc: 'Polished and authoritative' },
  { id: 'friendly', emoji: '😊', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'provocative', emoji: '🔥', label: 'Provocative', desc: 'Bold takes, strong opinions' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState('simple');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [tone, setTone] = useState('witty');
  const [targets, setTargets] = useState('');
  const [brandDesc, setBrandDesc] = useState('');
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const currentPlan = PLANS.find(p => p.id === plan)!;
  const maxSkills = currentPlan.maxSkills;

  const toggleSkill = (id: string) => {
    if (plan === 'legend') {
      // Legend gets all skills automatically
      return;
    }
    if (selectedSkills.includes(id)) {
      setSelectedSkills(selectedSkills.filter(s => s !== id));
    } else if (selectedSkills.length < maxSkills) {
      setSelectedSkills([...selectedSkills, id]);
    }
  };

  const hasXSkill = selectedSkills.some(s => s.startsWith('x-')) || plan === 'legend';

  const handleLaunch = async () => {
    if (!name.trim()) { setError('Give your worker a name'); return; }

    setLaunching(true);
    setError('');

    try {
      const targetList = targets.split('\n').map(t => t.trim()).filter(Boolean);
      const toneDesc = TONES.find(t => t.id === tone)?.desc || tone;
      const skillIds = plan === 'legend' ? SKILLS.map(s => s.id) : selectedSkills;

      const res = await fetch('/api/containers/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantName: name.trim(),
          personality: toneDesc,
          workerType: skillIds[0] || 'x-commenter',
          workerConfig: {
            skills: skillIds,
            plan,
            targets: targetList,
            niche: niche.trim(),
            brandDescription: brandDesc.trim(),
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
          <p className="text-[var(--dim)] text-sm mb-2">Setting up your worker and researching your niche.</p>
          <p className="text-[var(--muted)] text-xs">This takes about 30 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
          ))}
        </div>

        {/* Step 1: Pick a plan */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Choose your plan</h1>
            <p className="text-[var(--dim)] text-sm mb-6">All plans run 24/7. Pick based on how many skills you need.</p>
            <div className="space-y-3 mb-6">
              {PLANS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPlan(p.id); setSelectedSkills([]); }}
                  className={`w-full p-4 rounded-[var(--r2)] border text-left transition-all ${
                    plan === p.id
                      ? 'border-[var(--accent)]'
                      : 'border-[var(--border)] hover:border-[var(--border-h)]'
                  }`}
                  style={{ background: plan === p.id ? 'rgba(124,107,240,0.06)' : 'var(--bg2)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-base">{p.title}</span>
                      <span className="text-xs text-[var(--dim)] ml-2">{p.desc}</span>
                    </div>
                    <span className="font-extrabold text-lg">{p.price}<span className="text-xs text-[var(--dim)] font-normal">/mo</span></span>
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
            <p className="text-center text-[var(--muted)] text-xs mt-3">7-day free trial on all plans</p>
          </>
        )}

        {/* Step 2: Pick skills */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold mb-2">
              {plan === 'legend' ? 'Your skills (all included)' : `Pick your skill${maxSkills > 1 ? 's' : ''}`}
            </h1>
            <p className="text-[var(--dim)] text-sm mb-6">
              {plan === 'legend'
                ? 'Legend plan includes all 9 skills.'
                : `${currentPlan.title} plan: choose ${maxSkills === 1 ? '1 skill' : `up to ${maxSkills} skills`}. ${selectedSkills.length}/${maxSkills} selected.`}
            </p>

            {['X / Twitter', 'Email', 'YouTube'].map(category => (
              <div key={category} className="mb-5">
                <h3 className="text-xs font-semibold text-[var(--accent2)] mb-2">{category}</h3>
                <div className="grid grid-cols-1 gap-2">
                  {SKILLS.filter(s => s.category === category).map(skill => {
                    const isSelected = plan === 'legend' || selectedSkills.includes(skill.id);
                    const isDisabled = plan !== 'legend' && !isSelected && selectedSkills.length >= maxSkills;
                    return (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        disabled={plan === 'legend' || isDisabled}
                        className={`flex items-center gap-3 p-3 rounded-[var(--r2)] border text-left transition-all ${
                          isSelected
                            ? 'border-[var(--accent)]'
                            : isDisabled
                              ? 'border-[var(--border)] opacity-40 cursor-not-allowed'
                              : 'border-[var(--border)] hover:border-[var(--border-h)] cursor-pointer'
                        }`}
                        style={{ background: isSelected ? 'rgba(124,107,240,0.06)' : 'var(--bg2)' }}
                      >
                        <span className="text-lg">{skill.emoji}</span>
                        <span className="text-sm font-medium">{skill.title}</span>
                        {isSelected && <span className="ml-auto text-[var(--green)] text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {error && (
              <div className="mb-4 p-3 rounded-[var(--r2)] text-red-400 text-sm border border-red-800/30" style={{ background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)} className="px-6 py-3.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)] hover:text-[var(--text)] transition-colors" style={{ background: 'var(--bg2)' }}>Back</button>
              <button
                onClick={() => {
                  if (plan !== 'legend' && selectedSkills.length === 0) { setError('Pick at least one skill'); return; }
                  setError('');
                  setStep(3);
                }}
                className="flex-1 py-3.5 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {/* Step 3: Configure worker */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Configure your worker</h1>
            <p className="text-[var(--dim)] text-sm mb-6">
              Your worker will research your niche to understand your audience deeply.
            </p>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Worker name</label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Alex, Scout, Echo..." maxLength={30} autoFocus
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Your niche / industry</label>
              <input type="text" value={niche} onChange={e => setNiche(e.target.value)}
                placeholder="e.g. AI SaaS, fitness coaching, ecommerce..."
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
            </div>

            <div className="mb-5">
              <label className="block text-sm text-[var(--dim)] mb-2">Tell us about your brand / business (optional)</label>
              <textarea value={brandDesc} onChange={e => setBrandDesc(e.target.value)}
                placeholder="What do you sell? Who's your audience? What makes you different?"
                rows={3}
                className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
            </div>

            {hasXSkill && (
              <div className="mb-5">
                <label className="block text-sm text-[var(--dim)] mb-2">X accounts to engage with (one per line)</label>
                <textarea value={targets} onChange={e => setTargets(e.target.value)}
                  placeholder={"@elonmusk\n@sama\n@paulg"}
                  rows={4}
                  className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
                  style={{ background: 'var(--bg2)', color: 'var(--text)' }} />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm text-[var(--dim)] mb-2">Tone / personality</label>
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

            {error && (
              <div className="mb-4 p-3 rounded-[var(--r2)] text-red-400 text-sm border border-red-800/30" style={{ background: 'rgba(239,68,68,0.08)' }}>{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)] hover:text-[var(--text)] transition-colors" style={{ background: 'var(--bg2)' }}>Back</button>
              <button
                onClick={() => { if (!name.trim()) { setError('Give your worker a name'); return; } setError(''); setStep(4); }}
                className="flex-1 py-3.5 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {/* Step 4: Confirm & Launch */}
        {step === 4 && (
          <>
            <h1 className="text-2xl font-bold mb-2">Ready to hire {name}?</h1>
            <p className="text-[var(--dim)] text-sm mb-6">Your worker will research your niche before starting work.</p>

            <div className="p-5 rounded-[var(--r)] border border-[var(--border)] mb-4" style={{ background: 'var(--bg2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-lg">{name}</div>
                  <div className="text-xs text-[var(--dim)]">{currentPlan.title} plan · {currentPlan.price}/mo</div>
                </div>
                <div className="text-xs text-[var(--dim)]">{TONES.find(t => t.id === tone)?.label} tone</div>
              </div>
              <div className="text-xs text-[var(--dim)] mb-2">Skills:</div>
              <div className="flex flex-wrap gap-1.5">
                {(plan === 'legend' ? SKILLS : SKILLS.filter(s => selectedSkills.includes(s.id))).map(s => (
                  <span key={s.id} className="text-xs px-2 py-1 rounded-full border border-[var(--border)]" style={{ background: 'var(--bg3)' }}>
                    {s.emoji} {s.title}
                  </span>
                ))}
              </div>
              {niche && (
                <div className="mt-3 text-xs"><span className="text-[var(--dim)]">Niche:</span> {niche}</div>
              )}
            </div>

            <div className="p-4 rounded-[var(--r2)] border border-[var(--accent)] mb-4" style={{ background: 'rgba(124,107,240,0.06)' }}>
              <p className="text-sm text-[var(--accent2)]">
                Your worker will first research your niche — checking Reddit, X, and competitor content to understand your audience&apos;s problems, desires, and language. Then it starts working.
              </p>
            </div>

            {hasXSkill && (
              <div className="p-4 rounded-[var(--r2)] border border-[var(--green-b)] mb-4" style={{ background: 'var(--green-g)' }}>
                <p className="text-sm text-[var(--green)]">
                  After hiring, open the <strong>Browser tab</strong> on your dashboard and log into x.com. Your worker needs access to comment.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-[var(--r2)] text-red-400 text-sm border border-red-800/30" style={{ background: 'rgba(239,68,68,0.08)' }}>{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-6 py-3.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)] hover:text-[var(--text)] transition-colors" style={{ background: 'var(--bg2)' }}>Back</button>
              <button onClick={handleLaunch}
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
