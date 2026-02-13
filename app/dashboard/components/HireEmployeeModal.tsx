'use client';

import { useState } from 'react';
import { SKILLS, WORKER_NAMES } from '@/lib/constants';

interface HireEmployeeModalProps {
  maxSkills: number;
  onHire: (data: { name: string; skill: string; personality: string }) => Promise<void>;
  onClose: () => void;
}

export function HireEmployeeModal({ maxSkills, onHire, onClose }: HireEmployeeModalProps) {
  const [step, setStep] = useState(1);
  const [skill, setSkill] = useState('x-article-writer');
  const [name, setName] = useState(() => WORKER_NAMES[Math.floor(Math.random() * WORKER_NAMES.length)]);
  const [hiring, setHiring] = useState(false);
  const [error, setError] = useState('');

  const handleHire = async () => {
    if (!name.trim()) { setError('Give your employee a name'); return; }
    setHiring(true);
    setError('');
    try {
      await onHire({ name: name.trim(), skill, personality: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to hire';
      setError(message);
      setHiring(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md p-6 rounded-[var(--r)] border border-[var(--border)] mx-4" style={{ background: '#111' }}>
        {/* Step 1: Pick skill */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold mb-1">Hire a new employee</h2>
            <p className="text-xs text-[var(--dim)] mb-4">Pick a skill for your new team member. {maxSkills > 1 ? `Up to ${maxSkills} skills.` : '1 skill.'}</p>
            <div className="space-y-2 mb-4">
              {SKILLS.map(s => (
                <button
                  key={s.id}
                  onClick={() => s.available && setSkill(s.id)}
                  disabled={!s.available}
                  className={`w-full flex items-center gap-3 p-3 rounded-[var(--r2)] border text-left transition-all ${
                    skill === s.id && s.available
                      ? 'border-[var(--accent)]'
                      : !s.available
                        ? 'border-[var(--border)] opacity-40 cursor-not-allowed'
                        : 'border-[var(--border)] hover:border-[var(--border-h)]'
                  }`}
                  style={{ background: skill === s.id && s.available ? 'rgba(124,107,240,0.06)' : 'var(--bg2)' }}
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-sm font-medium">{s.title}</span>
                  {!s.available && <span className="ml-auto text-[10px] text-[var(--muted)]">Coming Soon</span>}
                  {skill === s.id && s.available && <span className="ml-auto text-[var(--green)] text-xs">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)]" style={{ background: 'var(--bg2)' }}>Cancel</button>
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-[var(--r2)] text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)' }}>
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 2: Name & confirm */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-bold mb-1">Name your employee</h2>
            <p className="text-xs text-[var(--dim)] mb-4">Give them a name. They will share knowledge with your existing team.</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Axel, Nova..."
                maxLength={30}
                autoFocus
                className="flex-1 px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none"
                style={{ background: 'var(--bg2)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setName(WORKER_NAMES[Math.floor(Math.random() * WORKER_NAMES.length)])}
                className="px-3 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm text-[var(--dim)]"
                style={{ background: 'var(--bg2)' }}
              >
                🎲
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-[var(--r2)] text-sm border border-[var(--border)] text-[var(--dim)]" style={{ background: 'var(--bg2)' }}>Back</button>
              <button
                onClick={handleHire}
                disabled={hiring}
                className="flex-1 py-2.5 rounded-[var(--r2)] text-sm font-bold text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--accent), #9b7bf7)', opacity: hiring ? 0.6 : 1 }}
              >
                {hiring ? 'Hiring...' : `Hire ${name || 'employee'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
