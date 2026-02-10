"use client";

export default function Home() {
  const skills = [
    { id: "x-commenter", emoji: "💬", title: "X Commenter", desc: "Scrolls your feed, finds relevant posts, and leaves smart comments that get you noticed.", category: "X / Twitter" },
    { id: "x-article-writer", emoji: "📰", title: "X Article Writer", desc: "Writes long-form X articles that position you as a thought leader in your niche.", category: "X / Twitter" },
    { id: "x-thread-writer", emoji: "🧵", title: "X Thread Writer", desc: "Crafts viral threads that break down ideas, tell stories, and build your following.", category: "X / Twitter" },
    { id: "email-newsletter", emoji: "📨", title: "Email Newsletter Writer", desc: "Writes engaging newsletters that keep your subscribers hooked and clicking.", category: "Email" },
    { id: "email-flow", emoji: "⚡", title: "Email Flow Writer", desc: "Creates automated email sequences — welcome, nurture, sales, re-engagement.", category: "Email" },
    { id: "email-responder", emoji: "📧", title: "Email Responder", desc: "Reads and replies to emails in your voice. Handles inbox on autopilot.", category: "Email" },
    { id: "yt-shorts-script", emoji: "🎬", title: "YouTube Shorts Script", desc: "Writes punchy, hook-driven scripts for vertical short-form videos.", category: "YouTube" },
    { id: "yt-long-script", emoji: "🎥", title: "YouTube Long Script", desc: "Full-length video scripts with hooks, structure, CTAs, and retention tricks.", category: "YouTube" },
    { id: "yt-community", emoji: "📢", title: "YouTube Community Post", desc: "Writes community tab posts that boost engagement and drive views.", category: "YouTube" },
    { id: "reddit-commenter", emoji: "🤖", title: "Reddit Commenter", desc: "Finds relevant threads in your niche subreddits and leaves helpful, authentic comments.", category: "Reddit & Social" },
    { id: "discord-engagement", emoji: "🎮", title: "Discord Engagement", desc: "Joins your target Discord servers and builds presence through genuine conversations.", category: "Reddit & Social" },
    { id: "facebook-group", emoji: "👥", title: "Facebook Group", desc: "Posts and comments in Facebook groups to build authority and drive traffic.", category: "Reddit & Social" },
    { id: "instagram-content", emoji: "📸", title: "Instagram Content", desc: "Creates captions, Reels scripts, carousel text, and hashtag strategies.", category: "Content & SEO" },
    { id: "tiktok-content", emoji: "🎵", title: "TikTok Content", desc: "Writes viral TikTok scripts, hooks, and trend-based content for your niche.", category: "Content & SEO" },
    { id: "seo-optimization", emoji: "🔍", title: "SEO Optimization", desc: "Runs SEO audits, keyword research, and writes optimized content briefs.", category: "Content & SEO" },
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
          15 Skills Available — 24/7 Workers
        </div>
        <h1 className="text-[clamp(34px,5.5vw,62px)] font-extrabold tracking-[-2px] leading-[1.08] mb-5 relative">
          AI workers that<br />actually do the work.
        </h1>
        <p className="text-[clamp(15px,2.2vw,19px)] text-[var(--dim)] max-w-[540px] mx-auto leading-relaxed relative">
          Pick a skill. Your worker gets its own computer, logs into your accounts,
          and works 24/7 — commenting on X, writing emails, scripting YouTube videos.
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
        <p className="text-center text-[var(--dim)] text-sm mb-10">Four steps. Your worker does the rest.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { step: "1", title: "Pick skills", desc: "Choose what your worker does — X comments, emails, YouTube scripts." },
            { step: "2", title: "Tell us your niche", desc: "Your worker researches your audience, competitors, and pain points." },
            { step: "3", title: "Configure tone", desc: "Set personality, voice, and style. Your worker writes like you." },
            { step: "4", title: "It starts working", desc: "Logs in, scrolls, comments, writes — like a real person, 24/7." },
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
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">15 skills. Real work.</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Each skill is a trained capability — not a chatbot, a worker with a browser.</p>

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
          {/* SIMPLE */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-1">Simple</h3>
            <p className="text-xs text-[var(--dim)] mb-4">24/7 worker, 1 skill</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$99</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--dim)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>1 skill of your choice</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Runs 24/7 non-stop</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat with your worker</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Watch it work live</li>
            </ul>
            <a href="/auth/login" className="block text-center py-2.5 rounded-[var(--r2)] text-sm font-semibold border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] transition-colors">
              Start free trial →
            </a>
          </div>

          {/* EXPERT */}
          <div className="p-6 rounded-[var(--r)] border border-[var(--accent)] relative" style={{ background: "rgba(124,107,240,0.06)" }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>Best value</span>
            <h3 className="font-bold text-lg mb-1">Expert</h3>
            <p className="text-xs text-[var(--dim)] mb-4">24/7 worker, up to 5 skills</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$399</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Up to 5 skills</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Runs 24/7 non-stop</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Deep niche research on setup</li>
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
            <p className="text-xs text-[var(--dim)] mb-4">24/7 worker, all skills</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold">$499</span>
              <span className="text-sm text-[var(--dim)]">/mo</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--dim)] mb-6">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>All 15 skills, unlimited</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Runs 24/7 non-stop</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Own computer + browser</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Deep niche research on setup</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Custom skill requests</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Chat with your worker</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Watch it work live</li>
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
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-10">Why hire an AI worker?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-4 text-red-400">Hiring a freelancer</h3>
            <ul className="space-y-3 text-sm text-[var(--dim)]">
              <li className="flex gap-2"><span className="text-red-400">✗</span>$500–3,000/month per task</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Works when they feel like it</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Days to hire, train, onboard</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Ghosting, delays, excuses</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Inconsistent quality</li>
            </ul>
          </div>
          <div className="p-6 rounded-[var(--r)] border border-[var(--accent)]" style={{ background: "rgba(124,107,240,0.06)" }}>
            <h3 className="font-bold text-lg mb-4 text-[var(--green)]">AI worker</h3>
            <ul className="space-y-3 text-sm text-[var(--text)]">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>From $99/month — flat rate</li>
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
