"use client";

import { useState, useEffect, FormEvent } from "react";
import { translations, Lang } from "@/lib/translations";

export default function Home() {
  const [lang, setLang] = useState<Lang>("hr");
  const [selectedModel, setSelectedModel] = useState("claude");
  const [selectedChannel, setSelectedChannel] = useState("telegram");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const t = translations[lang];

  // Auto-detect language
  useEffect(() => {
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("hr") || browserLang.startsWith("sr") || browserLang.startsWith("bs")) {
      setLang("hr");
    } else {
      setLang("en");
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          model: selectedModel,
          channel: selectedChannel,
          plan: selectedPlan,
          language: lang,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  const models = [
    { id: "claude", name: "Claude Opus 4.5", img: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg" },
    { id: "gpt", name: "GPT-5.2", img: "https://img.icons8.com/androidL/512/FFFFFF/chatgpt.png" },
    { id: "gemini", name: "Gemini 3 Flash", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/960px-Google_Gemini_icon_2025.svg.png" },
  ];

  const channels = [
    { id: "telegram", name: "Telegram", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/960px-Telegram_logo.svg.png", disabled: false },
    { id: "discord", name: "Discord", img: "https://scbwi-storage-prod.s3.amazonaws.com/images/discord-mark-blue_rA6tXJo.png", disabled: true },
    { id: "whatsapp", name: "WhatsApp", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/960px-WhatsApp.svg.png", disabled: true },
  ];

  return (
    <main>
      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-7 py-3.5 border-b border-[var(--border)]" style={{ background: "rgba(9,9,11,.82)", backdropFilter: "blur(24px)" }}>
        <div className="font-bold text-[17px] tracking-tight">
          Osobni<span className="text-[var(--accent2)]">Robot</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "hr" ? "en" : "hr")}
            className="text-sm text-[var(--dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            {lang === "hr" ? "🇬🇧 English" : "🇭🇷 Hrvatski"}
          </button>
          <a href="#cta" className="text-sm font-medium text-[var(--accent2)] hover:underline">
            {t.navCta}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center pt-[72px] pb-8 px-6 relative">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-60" style={{ background: "radial-gradient(circle, var(--accent-g) 0%, transparent 65%)" }} />
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--green)] border border-[var(--green-b)] mb-6 fade-in" style={{ background: "var(--green-g)" }}>
          {t.prelaunch}
        </div>
        <h1 className="text-[clamp(32px,5.5vw,58px)] font-extrabold tracking-[-2px] leading-[1.08] mb-4 relative fade-in d1">
          {t.heroTitle1}
          <br />
          {t.heroTitle2}
        </h1>
        <p className="text-[clamp(15px,2.2vw,19px)] text-[var(--dim)] max-w-[540px] mx-auto leading-relaxed relative fade-in d2">
          {t.heroSub}
        </p>
        <p className="text-xs text-[var(--muted)] mt-4 font-mono relative fade-in d3">
          {t.heroPowered}
        </p>
      </section>

      {/* MODEL SELECTION */}
      <section className="max-w-[840px] mx-auto px-5 py-9">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-7 fade-in d2">
          {t.modelTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {models.map((m, i) => (
            <div
              key={m.id}
              className={`card fade-in d${i + 2} ${selectedModel === m.id ? "selected" : ""}`}
              onClick={() => setSelectedModel(m.id)}
            >
              <img src={m.img} alt={m.name} />
              <h3>{m.name}</h3>
              <div className="indicator" />
            </div>
          ))}
        </div>
      </section>

      {/* CHANNEL SELECTION */}
      <section className="max-w-[840px] mx-auto px-5 py-9">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-7 fade-in">
          {t.channelTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {channels.map((c, i) => (
            <div
              key={c.id}
              className={`card fade-in d${i + 1} ${selectedChannel === c.id ? "selected" : ""} ${c.disabled ? "disabled" : ""}`}
              onClick={() => !c.disabled && setSelectedChannel(c.id)}
            >
              {c.disabled && (
                <span className="absolute top-2.5 right-2.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "var(--yellow-bg)", color: "var(--yellow)" }}>
                  {t.comingSoon}
                </span>
              )}
              <img src={c.img} alt={c.name} />
              <h3>{c.name}</h3>
              <div className="indicator" />
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-[960px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3 fade-in">
          {t.pricingTitle}
        </h2>
        <p className="text-center text-[var(--dim)] text-sm max-w-[500px] mx-auto mb-10 fade-in d1">
          {t.pricingSub}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* BYOK */}
          <PricingCard
            name={t.byokName}
            desc={t.byokDesc}
            price="$5"
            mo={t.mo}
            features={[t.byokF1, t.byokF2, t.byokF3, t.byokF4]}
            note={t.noSetup}
            isPro={false}
            selected={selectedPlan === "byok"}
            onClick={() => setSelectedPlan("byok")}
            delay="d1"
          />
          {/* Starter */}
          <PricingCard
            name={t.starterName}
            desc={t.starterDesc}
            price="$19"
            mo={t.mo}
            features={[t.starterF1, t.starterF2, t.starterF3, t.starterF4]}
            note={t.setupFee}
            isPro={false}
            selected={selectedPlan === "starter"}
            onClick={() => setSelectedPlan("starter")}
            delay="d2"
          />
          {/* Pro */}
          <PricingCard
            name={t.proName}
            desc={t.proDesc}
            price="$39"
            mo={t.mo}
            features={[t.proF1, t.proF2, t.proF3, t.proF4]}
            note={t.setupFee}
            badge={t.popular}
            isPro={true}
            selected={selectedPlan === "pro"}
            onClick={() => setSelectedPlan("pro")}
            delay="d3"
          />
          {/* Unlimited */}
          <PricingCard
            name={t.unlimitedName}
            desc={t.unlimitedDesc}
            price="$79"
            mo={t.mo}
            features={[t.unlimitedF1, t.unlimitedF2, t.unlimitedF3, t.unlimitedF4]}
            note={t.setupFee}
            isPro={false}
            selected={selectedPlan === "unlimited"}
            onClick={() => setSelectedPlan("unlimited")}
            delay="d4"
          />
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="max-w-[840px] mx-auto px-5 py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-10 fade-in">
          {t.painTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="pain-card fade-in d1">
            <h3 className="text-lg font-bold">{t.painSetupTitle}</h3>
            <blockquote>{t.painSetupQuote}</blockquote>
            <p className="text-xs text-[var(--muted)]">{t.painSetupSource}</p>
            <p className="answer">{t.painSetupAnswer}</p>
          </div>
          <div className="pain-card fade-in d2">
            <h3 className="text-lg font-bold">{t.painCostTitle}</h3>
            <blockquote>{t.painCostQuote}</blockquote>
            <p className="text-xs text-[var(--muted)]">{t.painCostSource}</p>
            <p className="answer">{t.painCostAnswer}</p>
          </div>
          <div className="pain-card fade-in d3">
            <h3 className="text-lg font-bold">{t.painSecTitle}</h3>
            <blockquote>{t.painSecQuote}</blockquote>
            <p className="text-xs text-[var(--muted)]">{t.painSecSource}</p>
            <p className="answer">{t.painSecAnswer}</p>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="max-w-[840px] mx-auto px-5 py-12">
        <p className="text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-[2.5px] mb-2">
          {lang === "hr" ? "Usporedba" : "Comparison"}
        </p>
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-8">
          {t.compTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Traditional */}
          <div className="compare-card">
            <h3 className="font-bold text-lg mb-4">{t.compTradTitle}</h3>
            <ul className="step-list">
              {[
                [t.compStep1, "15 min"],
                [t.compStep2, "10 min"],
                [t.compStep3, "5 min"],
                [t.compStep4, "5 min"],
                [t.compStep5, "7 min"],
                [t.compStep6, "10 min"],
                [t.compStep7, "4 min"],
                [t.compStep8, "4 min"],
              ].map(([step, time], i) => (
                <li key={i}>
                  <span>{step}</span>
                  <span className="step-time">{time}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="font-bold">{t.compTotal}</span>
              <span className="font-mono text-xl font-bold text-[var(--yellow)]">60 min</span>
            </div>
            <p className="text-xs text-[var(--muted)] italic mt-3">{t.compTradNote}</p>
          </div>
          {/* OsobniRobot */}
          <div className="compare-card simple flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-lg mb-4">{t.compSimpleTitle}</h3>
            <div className="text-6xl font-extrabold text-[var(--green)] mb-4">{t.compSimpleBig}</div>
            <p className="text-[var(--text)] text-sm">{t.compSimpleDesc}</p>
            <p className="text-[var(--dim)] text-sm mt-3">{t.compSimpleDesc2}</p>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-16">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-2">
          {t.usecaseTitle}
        </h2>
        <p className="text-center text-[var(--dim)] text-sm mb-8">{t.usecaseSub}</p>

        {t.pills.map((row, ri) => (
          <div className="marquee-wrap" key={ri}>
            <div className={`marquee-track ${ri === 1 ? "rev" : ""} ${ri === 2 ? "slow" : ""}`}>
              {/* Duplicate for seamless loop */}
              {[...row, ...row].map((pill, pi) => (
                <span className="pill" key={`${ri}-${pi}`}>{pill}</span>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-[var(--muted)] text-sm italic mt-5 px-4">{t.usecasePS}</p>
      </section>

      {/* EMAIL CTA */}
      <section id="cta" className="max-w-[520px] mx-auto px-5 py-16">
        <div className="text-center p-8 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
          <h2 className="text-2xl font-bold mb-4">{t.ctaTitle}</h2>

          {status === "success" ? (
            <p className="text-[var(--green)] font-semibold py-4">{t.ctaSuccess}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.ctaPlaceholder}
                required
                className="flex-1 px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ background: "var(--bg3)", color: "var(--text)" }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {status === "loading" ? "..." : t.ctaButton}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-red-400 text-xs mt-2">{errorMsg}</p>
          )}

          <p className="text-[var(--muted)] text-xs mt-4 leading-relaxed">{t.ctaSub}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-10 border-t border-[var(--border)] mt-5">
        <p className="text-xs text-[var(--muted)]">
          {t.footerMade} · {t.footerPowered}{" "}
          <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener" className="text-[var(--accent2)] hover:underline">
            {t.footerTech}
          </a>
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">© 2026 OsobniRobot</p>
      </footer>
    </main>
  );
}

/* ─── Pricing Card Component ─── */
function PricingCard({
  name, desc, price, mo, features, note, badge, isPro, selected, onClick, delay,
}: {
  name: string; desc: string; price: string; mo: string;
  features: string[]; note: string; badge?: string;
  isPro: boolean; selected: boolean; onClick: () => void; delay: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`fade-in ${delay} rounded-[var(--r)] border p-6 cursor-pointer transition-all relative ${
        isPro
          ? "pricing-card-pro border-[var(--accent)]"
          : selected
          ? "border-[var(--accent)] bg-[rgba(124,107,240,0.06)]"
          : "border-[var(--border)] hover:border-[var(--border-h)]"
      }`}
      style={{ background: isPro ? "rgba(124,107,240,0.06)" : selected ? "rgba(124,107,240,0.04)" : "var(--bg2)" }}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-[var(--accent2)]" style={{ background: "var(--accent-g)" }}>
          {badge}
        </span>
      )}
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-xs text-[var(--muted)] mb-4">{desc}</p>
      <div className="mb-4">
        <span className="text-3xl font-extrabold">{price}</span>
        <span className="text-sm text-[var(--dim)]">{mo}</span>
      </div>
      <ul className="space-y-2 mb-4">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-[var(--dim)] flex items-start gap-2">
            <span className="text-[var(--green)] mt-0.5">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-[var(--muted)]">{note}</p>
    </div>
  );
}
