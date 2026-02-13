"use client";

import { useState, useEffect } from 'react';
import { SKILLS } from '@/lib/constants';

function DemoAnimation() {
  const [step, setStep] = useState(0);
  const messages = [
    { from: 'user', text: 'Here\'s our website and our main competitor.' },
    { from: 'worker', text: 'Thanks! Studying both sites now...' },
    { from: 'worker', text: 'Found 3 content gaps your competitor misses. Quick questions:\n1. Do you target enterprise or SMB?\n2. What\'s your biggest differentiator?' },
    { from: 'user', text: 'SMB founders. Our edge is speed of setup.' },
    { from: 'worker', text: 'Got it. Updated my knowledge base. First article draft is ready for your review.' },
  ];

  useEffect(() => {
    if (step >= messages.length) return;
    const delay = step === 0 ? 1500 : 2000 + Math.random() * 1000;
    const timer = setTimeout(() => setStep(s => s + 1), delay);
    return () => clearTimeout(timer);
  }, [step, messages.length]);

  useEffect(() => {
    if (step >= messages.length) {
      const reset = setTimeout(() => setStep(0), 6000);
      return () => clearTimeout(reset);
    }
  }, [step, messages.length]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
        {/* Mock header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #222', background: '#0d0d0d' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Axel</div>
            <div style={{ fontSize: 10, color: '#4ade80' }}>● Online</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#1e3a5f', color: '#93c5fd' }}>X Article Writer</div>
        </div>
        {/* Messages */}
        <div style={{ padding: 16, minHeight: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.slice(0, step).map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: 13,
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                background: msg.from === 'user' ? '#7c6bf0' : '#1a1a1a',
                color: msg.from === 'user' ? '#fff' : '#ccc',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {step < messages.length && step > 0 && (
            <div style={{ display: 'flex', gap: 4, paddingLeft: 4 }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#555',
                  animation: `pulse 1s ease-in-out ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}

export default function Home() {
  const skills = SKILLS;

  return (
    <main>
      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-7 py-3.5 border-b border-[var(--border)]" style={{ background: "rgba(9,9,11,.82)", backdropFilter: "blur(24px)" }}>
        <div className="font-bold text-[17px] tracking-tight">
          Instant<span className="text-[var(--accent2)]">Worker</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/auth/login" className="text-sm text-[var(--dim)] hover:text-[var(--text)] transition-colors">Log in</a>
          <a href="/auth/login" className="text-sm font-medium text-white px-4 py-1.5 rounded-full transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>Start free trial</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center pt-[80px] pb-16 px-6 relative">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-60" style={{ background: "radial-gradient(circle, var(--accent-g) 0%, transparent 65%)" }} />
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--green)] border border-[var(--green-b)] mb-6" style={{ background: "var(--green-g)" }}>
          Build your team of 24/7 AI Workers in 1 Click
        </div>
        <h1 className="text-[clamp(34px,5.5vw,62px)] font-extrabold tracking-[-2px] leading-[1.08] mb-5 relative">
          Hire 24/7 AI employees<br />that work on your business.
        </h1>
        <p className="text-[clamp(15px,2.2vw,19px)] text-[var(--dim)] max-w-[540px] mx-auto leading-relaxed relative">
          Each employee researches your company, learns your voice,
          and works 24/7 with its own computer and browser.
        </p>

        <div className="max-w-[440px] mx-auto mt-9 relative">
          <a
            href="/auth/login"
            className="block text-center py-4 rounded-[var(--r2)] font-bold text-base text-white transition-all hover:brightness-110 hover:scale-[1.02] mb-3"
            style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}
          >
            Hire your first worker →
          </a>
          <p className="text-xs text-[var(--muted)] text-center">
            No credit card · 7 days free · Ready in 60 seconds
          </p>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section className="pb-16 px-6">
        <p className="text-center text-xs text-[var(--muted)] mb-6 uppercase tracking-widest">Live demo - this is what your employee looks like</p>
        <DemoAnimation />
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">How it works</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Four steps. Your employee does the rest.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { step: "1", title: "Enter your email", desc: "Sign up in seconds. No credit card needed." },
            { step: "2", title: "Pick skills", desc: "Choose what your employee does. X articles, emails, YouTube scripts." },
            { step: "3", title: "Tell us about your business", desc: "Share your niche, competitors, and audience. Your employee researches everything." },
            { step: "4", title: "They start working", desc: "Your employee starts working, asks questions, learns, and improves with time." },
          ].map((s) => (
            <div key={s.step} className="text-center p-5 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>{s.step}</div>
              <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
              <p className="text-xs text-[var(--dim)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SKILLS — grouped by platform */}
      <section className="max-w-[960px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">15 skills. Expert-level from day one.</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Every skill is pre-trained by our team. Your employee hits the ground running.</p>

        {[
          { name: "X / Twitter", icon: "𝕏" },
          { name: "Email", icon: "@" },
          { name: "YouTube", icon: "▶" },
          { name: "Reddit & Social", icon: "💬" },
          { name: "Content & SEO", icon: "📈" },
        ].map((cat, i) => (
          <div key={cat.name} className={i < 4 ? "mb-8" : ""}>
            <h3 className="text-sm font-semibold text-[var(--accent2)] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ background: "rgba(124,107,240,0.15)" }}>{cat.icon}</span>
              {cat.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {skills.filter(s => s.category === cat.name).map(skill => (
                <div key={skill.id} className="p-5 rounded-[var(--r)] border border-[var(--border)] hover:border-[var(--border-h)] transition-all" style={{ background: "var(--bg2)" }}>
                  <div className="text-2xl mb-2">{skill.emoji}</div>
                  <h4 className="font-bold text-sm mb-1">{skill.title}</h4>
                  <p className="text-xs text-[var(--dim)] leading-relaxed">{skill.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <section className="max-w-[960px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">Simple pricing</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Every plan runs 24/7. No API bills. No surprises.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* JUNIOR */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-1">Junior</h3>
            <p className="text-xs text-[var(--dim)] mb-4">1 AI employee, 1 skill</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$99</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--dim)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>1 AI employee</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>1 skill of your choice</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Learns your business</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat with your employee</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Watch them work live</li>
            </ul>
            <a href="/auth/login" className="block text-center py-2.5 rounded-[var(--r2)] text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] transition-colors">
              Start free trial →
            </a>
          </div>

          {/* MEDIOR */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--accent)] relative" style={{ background: "rgba(124,107,240,0.06)" }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>Best value</span>
            <h3 className="font-bold text-lg mb-1">Medior</h3>
            <p className="text-xs text-[var(--dim)] mb-4">5 AI employees, up to 5 skills each</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$399</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>5 AI employees</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Up to 5 skills each</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Employees share knowledge</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Deep business research on setup</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser each</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat and watch them work</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Priority support</li>
            </ul>
            <a href="/auth/login" className="block text-center py-2.5 rounded-[var(--r2)] text-sm font-bold text-white transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>
              Start free trial →
            </a>
          </div>

          {/* EXPERT */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-1">Expert</h3>
            <p className="text-xs text-[var(--dim)] mb-4">10 AI employees, all skills</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$499</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--dim)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>10 AI employees</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>All 15 skills</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Employees share knowledge</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Deep business research on setup</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Custom skill requests</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser each</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat and watch them work</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Priority support</li>
            </ul>
            <a href="/auth/login" className="block text-center py-2.5 rounded-[var(--r2)] text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] transition-colors">
              Start free trial →
            </a>
          </div>
        </div>
        <p className="text-center text-xs text-[var(--muted)] mt-6">All plans include 7-day free trial. No credit card required. Cancel anytime.</p>
      </section>

      {/* VS FREELANCER */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-10">Why hire an AI team?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-4 text-red-400">Hiring freelancers</h3>
            <ul className="space-y-3 text-sm text-[var(--dim)]">
              <li className="flex gap-2"><span className="text-red-400">✗</span>$500-3,000/month per person</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Work when they feel like it</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Days to hire, train, onboard</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Ghosting, delays, excuses</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Knowledge stays in their head</li>
            </ul>
          </div>
          <div className="p-6 rounded-[var(--r)] border border-[var(--accent)]" style={{ background: "rgba(124,107,240,0.06)" }}>
            <h3 className="font-bold text-lg mb-4 text-[var(--green)]">AI team</h3>
            <ul className="space-y-3 text-sm text-[var(--text)]">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>From $99/month for your first hire</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Works 18 hours/day, rests 6 to stay natural</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Ready in 60 seconds</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Employees share knowledge with each other</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>You can watch them work in real-time</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MEET YOUR WORKERS */}
      <section className="max-w-[960px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">Meet your workers</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Every skill is pre-trained by experts. Your employees hit the ground running.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: "Axel", initial: "A", color: "#3b82f6", skill: "X Article Writer",
              desc: "Researches your niche, studies competitors, and writes thought-leadership articles in your voice. Knows copywriting fundamentals, X algorithm patterns, and engagement hooks.",
              learns: "Company positioning, competitor gaps, audience pain points, trending topics"
            },
            {
              name: "Nova", initial: "N", color: "#f59e0b", skill: "Email Newsletter Writer",
              desc: "Crafts engaging newsletters that keep subscribers hooked. Understands email psychology, subject line patterns, and nurture sequences.",
              learns: "Subscriber segments, content pillars, brand tone, past performance data"
            },
            {
              name: "Scout", initial: "S", color: "#10b981", skill: "Reddit Commenter",
              desc: "Finds relevant threads in your niche subreddits and builds authentic presence through helpful, genuine comments.",
              learns: "Subreddit rules, community tone, product positioning, competitor mentions"
            },
          ].map((worker) => (
            <div key={worker.name} className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: worker.color }}>{worker.initial}</div>
                <div>
                  <div className="font-bold text-sm">{worker.name}</div>
                  <div className="text-xs text-[var(--accent2)]">{worker.skill}</div>
                </div>
              </div>
              <p className="text-xs text-[var(--dim)] leading-relaxed mb-3">{worker.desc}</p>
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">What they learn about you</div>
              <p className="text-xs text-[var(--dim)] leading-relaxed">{worker.learns}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-[var(--muted)] mt-6">Your employees share what they learn. Hire one, the whole team gets smarter.</p>
      </section>

      {/* FAQ */}
      <section className="max-w-[720px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-10">Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            { q: "Will it post garbage on my accounts?", a: "No. Every skill is pre-trained by experts with strict quality standards. Your employee learns your voice first, and you review everything in chat before it goes live." },
            { q: "What if it makes a mistake?", a: "You chat with your employee directly. You can review their work, give feedback, and they adjust. Just like managing a real team member." },
            { q: "How is this different from ChatGPT?", a: "ChatGPT is a chat window. Your AI employee has its own computer, browser, and memory. It works autonomously 24/7, researches online, and remembers everything about your business." },
            { q: "Why do workers sleep 6 hours?", a: "To keep activity patterns looking natural. Accounts that post 24/7 non-stop get flagged. Your employees rest to protect your accounts from suspicious automated behavior." },
            { q: "Do workers share knowledge?", a: "Yes. When one employee learns about your business, competitors, or audience, the whole team benefits instantly. Hire your second employee and they already know everything." },
            { q: "Can I fire a worker?", a: "Yes, anytime from your dashboard. No notice period, no drama." },
            { q: "What happens after the trial?", a: "Your 7-day trial includes full access. After that, choose a plan or your employees pause until you subscribe." },
            { q: "How does the worker learn?", a: "We pre-train each skill with expert-level knowledge. You educate the employee about your specific business. Then they research independently, ask smart questions, and keep learning." },
          ].map((faq) => (
            <details key={faq.q} className="group p-4 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
              <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center">
                {faq.q}
                <span className="text-[var(--muted)] group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <p className="text-sm text-[var(--dim)] mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[520px] mx-auto px-5 py-16">
        <div className="text-center p-8 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
          <h2 className="text-2xl font-bold mb-3">Ready to build your AI team?</h2>
          <p className="text-sm text-[var(--dim)] mb-6">Start with one employee. Scale to ten. 7 days free.</p>
          <a
            href="/auth/login"
            className="inline-block text-center px-8 py-3.5 rounded-[var(--r2)] font-bold text-sm text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}
          >
            Start free trial →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-10 border-t border-[var(--border)] mt-5">
        <p className="text-xs text-[var(--muted)]">
          Built with care · Powered by advanced AI
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">&copy; 2026 InstantWorker</p>
      </footer>
    </main>
  );
}
