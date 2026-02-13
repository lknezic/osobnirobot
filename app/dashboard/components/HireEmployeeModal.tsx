'use client';

import { useState } from 'react';
import { SKILLS, CHANNELS, WORKER_NAMES, WORKER_PRICE } from '@/lib/constants';

interface HireEmployeeModalProps {
  maxSkills: number;
  onHire: (data: { name: string; skill: string; personality: string }) => Promise<void>;
  onClose: () => void;
}

export function HireEmployeeModal({ onHire, onClose }: HireEmployeeModalProps) {
  const [step, setStep] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState('x-twitter');
  const [name, setName] = useState(() => WORKER_NAMES[Math.floor(Math.random() * WORKER_NAMES.length)]);
  const [hiring, setHiring] = useState(false);
  const [error, setError] = useState('');

  const currentChannel = CHANNELS.find(c => c.id === selectedChannel) || CHANNELS[0];

  const handleHire = async () => {
    if (!name.trim()) { setError('Give your employee a name'); return; }
    setHiring(true);
    setError('');
    try {
      await onHire({ name: name.trim(), skill: currentChannel.skills[0], personality: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to hire';
      setError(message);
      setHiring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-[var(--r)] border border-[var(--border)] mx-4 max-h-[90vh] flex flex-col" style={{ background: '#111' }}>
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <h2 className="text-lg font-bold">
            {step === 1 ? 'Hire a new employee' : 'Name your employee'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white text-lg transition-colors p-1 -mr-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-6 pb-6 pt-2 overflow-y-auto flex-1">
          {/* Step 1: Pick employee type */}
          {step === 1 && (
            <>
              <p className="text-xs text-[var(--dim)] mb-4">Choose a channel for your new team member. ${WORKER_PRICE}/mo per employee.</p>
              <div className="space-y-2 mb-4">
                {CHANNELS.map(ch => {
                  const chSkills = SKILLS.filter(s => ch.skills.includes(s.id));
                  const hasAvailable = chSkills.some(s => s.available);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => hasAvailable && setSelectedChannel(ch.id)}
                      disabled={!hasAvailable}
                      className={`w-full p-3 rounded-[var(--r2)] border text-left transition-all ${
                        selectedChannel === ch.id && hasAvailable
                          ? 'border-[var(--accent)]'
                          : !hasAvailable
                            ? 'border-[var(--border)] opacity-40 cursor-not-allowed'
                            : 'border-[var(--border)] hover:border-[var(--border-h)]'
                      }`}
                      style={{ background: selectedChannel === ch.id && hasAvailable ? 'rgba(124,107,240,0.06)' : 'var(--bg2)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{ch.title} Employee</span>
                        <div className="flex items-center gap-2">
                          {!hasAvailable && <span className="text-[10px] text-[var(--muted)]">Coming Soon</span>}
                          {selectedChannel === ch.id && hasAvailable && <span className="text-[var(--green)] text-xs">✓</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {chSkills.map(s => (
                          <span key={s.id} className="text-[10px] text-[var(--muted)]">{s.emoji} {s.title}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
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
              <div className="p-3 rounded-[var(--r2)] border border-[var(--border)] mb-4" style={{ background: 'var(--bg2)' }}>
                <div className="text-xs text-[var(--dim)]">
                  <span className="font-medium text-[var(--text)]">{name || 'Employee'}</span> — {currentChannel.title} Employee · ${WORKER_PRICE}/mo
                </div>
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
    </div>
  );
}
