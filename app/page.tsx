"use client";

export default function Home() {
  const skills = [
    { id: "x-commenter", emoji: "🐦", title: "X Commenter", desc: "Comments on posts from accounts you choose. Builds your presence on autopilot.", status: "available" },
    { id: "email-writer", emoji: "📧", title: "Email Writer", desc: "Drafts and sends cold emails, follow-ups, and replies.", status: "coming" },
    { id: "researcher", emoji: "📊", title: "Research Analyst", desc: "Monitors competitors, summarizes reports, finds leads.", status: "coming" },
    { id: "content-writer", emoji: "📝", title: "Content Writer", desc: "Blog posts, social media content, newsletters.", status: "coming" },
    { id: "lead-gen", emoji: "🎯", title: "Lead Generator", desc: "Finds prospects, qualifies leads, builds lists.", status: "coming" },
    { id: "bookkeeper", emoji: "💰", title: "Bookkeeper", desc: "Categorizes expenses, generates reports, tracks invoices.", status: "coming" },
  ];

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
          Now Live — X Commenter Available
        </div>
        <h1 className="text-[clamp(34px,5.5vw,62px)] font-extrabold tracking-[-2px] leading-[1.08] mb-5 relative">
          AI workers with<br />real skills.
        </h1>
        <p className="text-[clamp(15px,2.2vw,19px)] text-[var(--dim)] max-w-[520px] mx-auto leading-relaxed relative">
          Each worker has its own computer, browser, and a specific skill.
          It runs 24/7 — commenting on X, writing emails, doing research.
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

      {/* HOW IT WORKS */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">How it works</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Three steps. Under a minute.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Pick a skill", desc: "Choose what your worker does — comment on X, write emails, do research." },
            { step: "2", title: "Configure it", desc: "Set your niche, targets, and tone. Your worker boots up in seconds." },
            { step: "3", title: "It starts working", desc: "Your worker runs 24/7 on its own computer with a real browser." },
          ].map((s) => (
            <div key={s.step} className="text-center p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-white" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>{s.step}</div>
              <h3 className="font-bold text-base mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--dim)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AVAILABLE SKILLS */}
      <section className="max-w-[960px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">Worker skills</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Each skill is a real capability. Not a prompt — a trained worker.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`relative p-6 rounded-[var(--r)] border transition-all ${
                skill.status === "available"
                  ? "border-[var(--accent)]"
                  : "border-[var(--border)] opacity-70"
              }`}
              style={{
                background: skill.status === "available"
                  ? "rgba(124,107,240,0.06)"
                  : "var(--bg2)",
              }}
            >
              {skill.status === "coming" && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "var(--yellow-bg)", color: "var(--yellow)" }}>Coming soon</span>
              )}
              {skill.status === "available" && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-[var(--green)]" style={{ background: "var(--green-g)", border: "1px solid var(--green-b)" }}>Available</span>
              )}
              <div className="text-3xl mb-3">{skill.emoji}</div>
              <h3 className="font-bold text-base mb-1">{skill.title}</h3>
              <p className="text-xs text-[var(--dim)] mb-4 leading-relaxed">{skill.desc}</p>
              {skill.status === "available" ? (
                <a href="/auth/login" className="text-sm font-semibold px-4 py-2 rounded-[var(--r2)] text-white transition-all hover:brightness-110 inline-block" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>
                  Hire now →
                </a>
              ) : (
                <span className="text-xs text-[var(--muted)]">Coming soon</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-[960px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">Simple pricing</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">No surprise bills. No API costs. Just a flat monthly rate.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ONE */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-1">One</h3>
            <p className="text-xs text-[var(--dim)] mb-4">1 skill worker</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$49</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--dim)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>1 specific skill</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Runs on schedule</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat with your worker</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Watch it work live</li>
            </ul>
            <a href="/auth/login" className="block text-center py-2.5 rounded-[var(--r2)] text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] transition-colors">
              Start free trial →
            </a>
          </div>

          {/* MULTI */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--accent)] relative" style={{ background: "rgba(124,107,240,0.06)" }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>Most popular</span>
            <h3 className="font-bold text-lg mb-1">Multi</h3>
            <p className="text-xs text-[var(--dim)] mb-4">Up to 3 skills</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$99</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Up to 3 skills on 1 worker</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>24/7 operation</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat with your worker</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Watch it work live</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Priority support</li>
            </ul>
            <a href="/auth/login" className="block text-center py-2.5 rounded-[var(--r2)] text-sm font-bold text-white transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>
              Start free trial →
            </a>
          </div>

          {/* LEGEND */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-1">Legend</h3>
            <p className="text-xs text-[var(--dim)] mb-4">All skills, 24/7</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$199</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--dim)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>All skills, unlimited</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>24/7 non-stop operation</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat with your worker</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Watch it work live</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Priority support</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Custom skill requests</li>
            </ul>
            <a href="/auth/login" className="block text-center py-2.5 rounded-[var(--r2)] text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] transition-colors">
              Start free trial →
            </a>
          </div>
        </div>
        <p className="text-center text-xs text-[var(--muted)] mt-6">All plans include 7-day free trial. No credit card required. Cancel anytime.</p>
      </section>

      {/* VS HUMAN */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-10">Why hire an AI worker?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-4 text-red-400">Hiring a freelancer</h3>
            <ul className="space-y-3 text-sm text-[var(--dim)]">
              <li className="flex gap-2"><span className="text-red-400">✗</span>$500–2,000/month per task</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Works when they feel like it</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Days to hire, train, onboard</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Ghosting, delays, excuses</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Quality varies wildly</li>
            </ul>
          </div>
          <div className="p-6 rounded-[var(--r)] border border-[var(--accent)]" style={{ background: "rgba(124,107,240,0.06)" }}>
            <h3 className="font-bold text-lg mb-4 text-[var(--green)]">AI worker</h3>
            <ul className="space-y-3 text-sm text-[var(--text)]">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>From $49/month — flat rate</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Works 24/7, never stops</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Ready in 60 seconds</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Always available, always consistent</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>You can watch it work in real-time</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[520px] mx-auto px-5 py-16">
        <div className="text-center p-8 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
          <h2 className="text-2xl font-bold mb-3">Ready to hire your AI worker?</h2>
          <p className="text-sm text-[var(--dim)] mb-6">7 days free. No credit card. Cancel anytime.</p>
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
