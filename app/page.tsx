"use client";

import { useState } from "react";

export default function Home() {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const roles = [
    { id: "general", emoji: "🧠", title: "General Assistant", desc: "Email, research, scheduling, writing — one AI that does it all.", price: "$49", status: "available" },
    { id: "social", emoji: "📱", title: "Social Media Manager", desc: "Posts, comments, engages on X/Instagram/LinkedIn.", price: "$79", status: "coming" },
    { id: "researcher", emoji: "📊", title: "Research Analyst", desc: "Monitors competitors, summarizes reports, finds leads.", price: "$99", status: "coming" },
    { id: "writer", emoji: "📝", title: "Content Writer", desc: "Blog posts, newsletters, SEO content on autopilot.", price: "$79", status: "coming" },
    { id: "assistant", emoji: "📅", title: "Executive Assistant", desc: "Calendar, travel booking, reminders, follow-ups.", price: "$69", status: "coming" },
    { id: "bookkeeper", emoji: "💰", title: "Bookkeeper", desc: "Categorizes expenses, generates reports, tracks invoices.", price: "$89", status: "coming" },
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
          <a href="/auth/login" className="text-sm font-medium text-white px-4 py-1.5 rounded-full transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>Hire your first worker</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center pt-[80px] pb-16 px-6 relative">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-60" style={{ background: "radial-gradient(circle, var(--accent-g) 0%, transparent 65%)" }} />
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--green)] border border-[var(--green-b)] mb-6" style={{ background: "var(--green-g)" }}>
          Now Live — 7 Days Free
        </div>
        <h1 className="text-[clamp(34px,5.5vw,62px)] font-extrabold tracking-[-2px] leading-[1.08] mb-5 relative">
          Hire an AI employee.<br />Ready in 60 seconds.
        </h1>
        <p className="text-[clamp(15px,2.2vw,19px)] text-[var(--dim)] max-w-[560px] mx-auto leading-relaxed relative">
          Your AI worker has its own computer, browser, and brain.
          It writes emails, does research, manages tasks — 24/7, for a fraction
          of a human salary.
        </p>

        <div className="max-w-[440px] mx-auto mt-9 relative">
          <a
            href="/auth/login"
            className="block text-center py-4 rounded-[var(--r2)] font-bold text-base text-white transition-all hover:brightness-110 hover:scale-[1.02] mb-3"
            style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}
          >
            Hire your AI employee →
          </a>
          <p className="text-xs text-[var(--muted)] text-center">
            No credit card · 7 days free · Ready in 60 seconds
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">How it works</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Three steps. Under a minute. No technical skills needed.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Name your worker", desc: "Give it a name and personality. Friendly? Professional? You decide." },
            { step: "2", title: "It boots up instantly", desc: "Your AI employee gets its own computer with a browser, ready to work." },
            { step: "3", title: "Start giving tasks", desc: "Chat with it like a real employee. It researches, writes, browses the web." },
          ].map((s) => (
            <div key={s.step} className="text-center p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-white" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>{s.step}</div>
              <h3 className="font-bold text-base mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--dim)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOUR AI EMPLOYEE CAN DO */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">What your AI employee can do</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">It has a real browser and computer. Not just a chatbot.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { emoji: "🌐", text: "Browse any website" },
            { emoji: "📧", text: "Write & send emails" },
            { emoji: "📊", text: "Research competitors" },
            { emoji: "📄", text: "Read & summarize PDFs" },
            { emoji: "✍️", text: "Write blog posts & copy" },
            { emoji: "📋", text: "Fill out forms" },
            { emoji: "🔍", text: "Search the web" },
            { emoji: "📱", text: "Manage social media" },
            { emoji: "🧮", text: "Analyze data & spreadsheets" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 p-4 rounded-[var(--r2)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm text-[var(--text)]">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI EMPLOYEE ROLES */}
      <section className="max-w-[960px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">Choose your AI employee</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-10">Start with the General Assistant. More specialists coming soon.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              className={`relative p-6 rounded-[var(--r)] border transition-all cursor-pointer ${
                role.status === "available"
                  ? "border-[var(--accent)]"
                  : "border-[var(--border)] opacity-70"
              }`}
              style={{
                background: role.status === "available"
                  ? "rgba(124,107,240,0.06)"
                  : "var(--bg2)",
              }}
            >
              {role.status === "coming" && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "var(--yellow-bg)", color: "var(--yellow)" }}>Coming soon</span>
              )}
              {role.status === "available" && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-[var(--green)]" style={{ background: "var(--green-g)", border: "1px solid var(--green-b)" }}>Available now</span>
              )}
              <div className="text-3xl mb-3">{role.emoji}</div>
              <h3 className="font-bold text-base mb-1">{role.title}</h3>
              <p className="text-xs text-[var(--dim)] mb-4 leading-relaxed">{role.desc}</p>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-extrabold">{role.price}</span>
                  <span className="text-sm text-[var(--dim)]">/mo</span>
                </div>
                {role.status === "available" ? (
                  <a href="/auth/login" className="text-sm font-semibold px-4 py-2 rounded-[var(--r2)] text-white transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>
                    Hire now →
                  </a>
                ) : (
                  <span className="text-xs text-[var(--muted)]">Notify me</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VS HUMAN */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-10">Why hire an AI employee?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
            <h3 className="font-bold text-lg mb-4 text-red-400">Human assistant</h3>
            <ul className="space-y-3 text-sm text-[var(--dim)]">
              <li className="flex gap-2"><span className="text-red-400">✗</span>$2,000–5,000/month salary</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Works 8 hours, sleeps 16</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>2-4 weeks to hire & onboard</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>Sick days, vacations, turnover</li>
              <li className="flex gap-2"><span className="text-red-400">✗</span>One person, one skill set</li>
            </ul>
          </div>
          <div className="p-6 rounded-[var(--r)] border border-[var(--accent)]" style={{ background: "rgba(124,107,240,0.06)" }}>
            <h3 className="font-bold text-lg mb-4 text-[var(--green)]">AI employee</h3>
            <ul className="space-y-3 text-sm text-[var(--text)]">
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>$49/month — flat rate</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Works 24/7, never sleeps</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Ready in 60 seconds</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>No sick days, always available</li>
              <li className="flex gap-2"><span className="text-[var(--green)]">✓</span>Writes, researches, browses — does it all</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[520px] mx-auto px-5 py-16">
        <div className="text-center p-8 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
          <h2 className="text-2xl font-bold mb-3">Ready to hire your AI employee?</h2>
          <p className="text-sm text-[var(--dim)] mb-6">7 days free. No credit card required. Cancel anytime.</p>
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
        <p className="text-xs text-[var(--muted)] mt-1">© 2026 InstantWorker</p>
      </footer>
    </main>
  );
}
