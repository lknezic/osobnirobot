"use client";

import { useState, useEffect, FormEvent } from "react";
import { translations, Lang } from "@/lib/translations";

export default function Home() {
  const [lang, setLang] = useState<Lang>("hr");
  const [selectedModel, setSelectedModel] = useState("claude");
  const [selectedChannel, setSelectedChannel] = useState("telegram");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [email, setEmail] = useState("");
  const [heroEmail, setHeroEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [heroStatus, setHeroStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const t = translations[lang];

  useEffect(() => {
    const b = navigator.language?.toLowerCase() || "";
    if (b.startsWith("hr")||b.startsWith("sr")||b.startsWith("bs")) setLang("hr");
    else setLang("en");
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [lang]);

  async function submitEmail(v: string, fn: (s: "idle"|"loading"|"success"|"error") => void) {
    if (!v) return; fn("loading"); setErrorMsg("");
    try {
      const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, model: selectedModel, channel: selectedChannel, plan: selectedPlan, language: lang }) });
      const d = await r.json();
      if (r.ok) fn("success"); else { fn("error"); setErrorMsg(d.error||"Something went wrong"); }
    } catch { fn("error"); setErrorMsg("Network error."); }
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
  const chat = lang === "hr" ? [
    { from: "user", text: "Sažmi sve nepročitane emailove" },
    { from: "bot", text: "Imaš 12 nepročitanih emailova. 3 su hitna:\n\n1. 📧 Klijent Marko — traži ponudu do petka\n2. 📧 Računovodstvo — faktura za potpis\n3. 📧 Newsletter — novi trendovi u AI\n\nŽeliš li da odgovorim na Markovu poruku?" },
    { from: "user", text: "Da, napiši mu da šaljem ponudu sutra" },
    { from: "bot", text: "✅ Poslano! Odgovorio sam Marku:\n\n\"Poštovani Marko, ponudu ćemo Vam dostaviti sutra do kraja radnog vremena. Hvala na strpljenju.\"" },
  ] : [
    { from: "user", text: "Summarize all unread emails" },
    { from: "bot", text: "You have 12 unread emails. 3 are urgent:\n\n1. 📧 Client Marco — needs a quote by Friday\n2. 📧 Accounting — invoice to sign\n3. 📧 Newsletter — new AI trends\n\nWant me to reply to Marco?" },
    { from: "user", text: "Yes, tell him I'll send the quote tomorrow" },
    { from: "bot", text: "✅ Sent! I replied to Marco:\n\n\"Dear Marco, we'll deliver the quote tomorrow by end of business. Thank you for your patience.\"" },
  ];

  return (
    <main>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-7 py-3.5 border-b border-[var(--border)]" style={{ background: "rgba(9,9,11,.82)", backdropFilter: "blur(24px)" }}>
        <div className="font-bold text-[17px] tracking-tight">Osobni<span className="text-[var(--accent2)]">Robot</span></div>
        <div className="flex items-center gap-4">
          <button onClick={() => setLang(lang === "hr" ? "en" : "hr")} className="text-sm text-[var(--dim)] hover:text-[var(--text)] transition-colors cursor-pointer">{lang === "hr" ? "🇬🇧 English" : "🇭🇷 Hrvatski"}</button>
          <a href="#cta" className="text-sm font-medium text-[var(--accent2)] hover:underline">{t.navCta}</a>
        </div>
      </nav>

      <section className="text-center pt-[72px] pb-12 px-6 relative">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-60" style={{ background: "radial-gradient(circle, var(--accent-g) 0%, transparent 65%)" }} />
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--green)] border border-[var(--green-b)] mb-6 fade-in" style={{ background: "var(--green-g)" }}>{t.prelaunch}</div>
        <h1 className="text-[clamp(32px,5.5vw,58px)] font-extrabold tracking-[-2px] leading-[1.08] mb-4 relative fade-in d1">{t.heroTitle1}<br />{t.heroTitle2}</h1>
        <p className="text-[clamp(15px,2.2vw,19px)] text-[var(--dim)] max-w-[540px] mx-auto leading-relaxed relative fade-in d2">{t.heroSub}</p>
        <div className="max-w-[440px] mx-auto mt-8 relative fade-in d3">
          {heroStatus === "success" ? <p className="text-[var(--green)] font-semibold py-3">{t.ctaSuccess}</p> : (
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); submitEmail(heroEmail, setHeroStatus); }} className="flex gap-2">
              <input type="email" value={heroEmail} onChange={(e) => setHeroEmail(e.target.value)} placeholder={t.ctaPlaceholder} required className="flex-1 px-4 py-3.5 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" style={{ background: "var(--bg2)", color: "var(--text)" }} />
              <button type="submit" disabled={heroStatus === "loading"} className="px-7 py-3.5 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110 hover:scale-[1.02] disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>{heroStatus === "loading" ? "..." : t.ctaButton}</button>
            </form>
          )}
        </div>
        <p className="text-xs text-[var(--muted)] mt-4 font-mono relative fade-in d4">{t.heroPowered}</p>
      </section>

      <section className="max-w-[600px] mx-auto px-5 pb-16 reveal">
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--bg2)" }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]" style={{ background: "var(--bg3)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}>🤖</div>
            <div><p className="text-sm font-semibold">OsobniRobot</p><p className="text-[11px] text-[var(--green)]">● online</p></div>
            <div className="ml-auto"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/960px-Telegram_logo.svg.png" alt="" className="w-5 h-5 opacity-40" /></div>
          </div>
          <div className="p-4 space-y-3 min-h-[280px]">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ${msg.from === "user" ? "rounded-br-sm text-white" : "rounded-bl-sm text-[var(--text)]"}`} style={{ background: msg.from === "user" ? "linear-gradient(135deg, var(--accent), #6b5ce7)" : "var(--bg3)" }}>{msg.text}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)]" style={{ background: "var(--bg3)" }}>
            <div className="flex-1 px-3 py-2 rounded-full text-xs text-[var(--muted)]" style={{ background: "var(--bg)" }}>{lang === "hr" ? "Napiši poruku..." : "Type a message..."}</div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
          </div>
        </div>
        <p className="text-center text-[10px] text-[var(--muted)] mt-3 italic">{lang === "hr" ? "Primjer razgovora s tvojim AI asistentom na Telegramu" : "Example conversation with your AI assistant on Telegram"}</p>
      </section>

      <section className="max-w-[840px] mx-auto px-5 py-9 reveal">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-7">{t.modelTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {models.map((m) => (<div key={m.id} className={`card ${selectedModel === m.id ? "selected" : ""}`} onClick={() => setSelectedModel(m.id)}><img src={m.img} alt={m.name} /><h3>{m.name}</h3><div className="indicator" /></div>))}
        </div>
      </section>

      <section className="max-w-[840px] mx-auto px-5 py-9 reveal">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-7">{t.channelTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {channels.map((c) => (<div key={c.id} className={`card ${selectedChannel === c.id ? "selected" : ""} ${c.disabled ? "disabled" : ""}`} onClick={() => !c.disabled && setSelectedChannel(c.id)}>{c.disabled && <span className="absolute top-2.5 right-2.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: "var(--yellow-bg)", color: "var(--yellow)" }}>{t.comingSoon}</span>}<img src={c.img} alt={c.name} /><h3>{c.name}</h3><div className="indicator" /></div>))}
        </div>
      </section>

      <section className="max-w-[960px] mx-auto px-5 py-16 reveal">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-3">{t.pricingTitle}</h2>
        <p className="text-center text-[var(--dim)] text-sm max-w-[500px] mx-auto mb-10">{t.pricingSub}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PC name={t.byokName} desc={t.byokDesc} price="$5" mo={t.mo} features={[t.byokF1,t.byokF2,t.byokF3,t.byokF4]} note={t.noSetup} isPro={false} sel={selectedPlan==="byok"} onClick={()=>setSelectedPlan("byok")} cta={t.navCta} />
          <PC name={t.starterName} desc={t.starterDesc} price="$19" mo={t.mo} features={[t.starterF1,t.starterF2,t.starterF3,t.starterF4]} note={t.setupFee} isPro={false} sel={selectedPlan==="starter"} onClick={()=>setSelectedPlan("starter")} cta={t.navCta} />
          <PC name={t.proName} desc={t.proDesc} price="$39" mo={t.mo} features={[t.proF1,t.proF2,t.proF3,t.proF4]} note={t.setupFee} badge={t.popular} isPro={true} sel={selectedPlan==="pro"} onClick={()=>setSelectedPlan("pro")} cta={t.navCta} />
          <PC name={t.unlimitedName} desc={t.unlimitedDesc} price="$79" mo={t.mo} features={[t.unlimitedF1,t.unlimitedF2,t.unlimitedF3,t.unlimitedF4]} note={t.setupFee} isPro={false} sel={selectedPlan==="unlimited"} onClick={()=>setSelectedPlan("unlimited")} cta={t.navCta} />
        </div>
      </section>

      <section className="max-w-[840px] mx-auto px-5 py-16 reveal">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-10">{t.painTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{t:t.painSetupTitle,q:t.painSetupQuote,s:t.painSetupSource,a:t.painSetupAnswer},{t:t.painCostTitle,q:t.painCostQuote,s:t.painCostSource,a:t.painCostAnswer},{t:t.painSecTitle,q:t.painSecQuote,s:t.painSecSource,a:t.painSecAnswer}].map((p,i)=>(<div key={i} className="pain-card"><h3 className="text-lg font-bold">{p.t}</h3><blockquote>{p.q}</blockquote><p className="text-xs text-[var(--muted)]">{p.s}</p><p className="answer">{p.a}</p></div>))}
        </div>
      </section>

      <section className="max-w-[840px] mx-auto px-5 py-12 reveal">
        <p className="text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-[2.5px] mb-2">{lang==="hr"?"Usporedba":"Comparison"}</p>
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-8">{t.compTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="compare-card">
            <h3 className="font-bold text-lg mb-4">{t.compTradTitle}</h3>
            <ul className="step-list">{[[t.compStep1,"15 min"],[t.compStep2,"10 min"],[t.compStep3,"5 min"],[t.compStep4,"5 min"],[t.compStep5,"7 min"],[t.compStep6,"10 min"],[t.compStep7,"4 min"],[t.compStep8,"4 min"]].map(([s,ti],i)=>(<li key={i}><span>{s}</span><span className="step-time">{ti}</span></li>))}</ul>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5"><span className="font-bold">{t.compTotal}</span><span className="font-mono text-xl font-bold text-[var(--yellow)]">60 min</span></div>
            <p className="text-xs text-[var(--muted)] italic mt-3">{t.compTradNote}</p>
          </div>
          <div className="compare-card simple flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-lg mb-4">{t.compSimpleTitle}</h3>
            <div className="text-6xl font-extrabold text-[var(--green)] mb-4">{t.compSimpleBig}</div>
            <p className="text-[var(--text)] text-sm">{t.compSimpleDesc}</p>
            <p className="text-[var(--dim)] text-sm mt-3">{t.compSimpleDesc2}</p>
          </div>
        </div>
      </section>

      <section className="py-16 reveal">
        <h2 className="text-center text-[clamp(22px,3.8vw,34px)] font-bold tracking-tight mb-2">{t.usecaseTitle}</h2>
        <p className="text-center text-[var(--dim)] text-sm mb-8">{t.usecaseSub}</p>
        {t.pills.map((row,ri)=>(<div className="marquee-wrap" key={ri}><div className={`marquee-track ${ri===1?"rev":""} ${ri===2?"slow":""}`}>{[...row,...row].map((p,pi)=>(<span className="pill" key={`${ri}-${pi}`}>{p}</span>))}</div></div>))}
        <p className="text-center text-[var(--muted)] text-sm italic mt-5 px-4">{t.usecasePS}</p>
      </section>

      <section id="cta" className="max-w-[520px] mx-auto px-5 py-16 reveal">
        <div className="text-center p-8 rounded-[var(--r)] border border-[var(--border)]" style={{ background: "var(--bg2)" }}>
          <h2 className="text-2xl font-bold mb-4">{t.ctaTitle}</h2>
          {status==="success"?<p className="text-[var(--green)] font-semibold py-4">{t.ctaSuccess}</p>:(
            <form onSubmit={(e: FormEvent)=>{e.preventDefault();submitEmail(email,setStatus);}} className="flex gap-2">
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={t.ctaPlaceholder} required className="flex-1 px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors" style={{background:"var(--bg3)",color:"var(--text)"}} />
              <button type="submit" disabled={status==="loading"} className="px-6 py-3 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110 disabled:opacity-50" style={{background:"linear-gradient(135deg, var(--accent), #9b7bf7)"}}>{status==="loading"?"...":t.ctaButton}</button>
            </form>
          )}
          {status==="error"&&<p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
          <p className="text-[var(--muted)] text-xs mt-4 leading-relaxed">{t.ctaSub}</p>
        </div>
      </section>

      <footer className="text-center py-10 border-t border-[var(--border)] mt-5">
        <p className="text-xs text-[var(--muted)]">{t.footerMade} · {t.footerPowered}{" "}<a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener" className="text-[var(--accent2)] hover:underline">{t.footerTech}</a></p>
        <p className="text-xs text-[var(--muted)] mt-1">© 2026 OsobniRobot</p>
      </footer>
    </main>
  );
}

function PC({name,desc,price,mo,features,note,badge,isPro,sel,onClick,cta}:{name:string;desc:string;price:string;mo:string;features:string[];note:string;badge?:string;isPro:boolean;sel:boolean;onClick:()=>void;cta:string}) {
  return (
    <div onClick={onClick} className={`rounded-[var(--r)] border p-6 cursor-pointer transition-all relative flex flex-col ${isPro?"pricing-card-pro border-[var(--accent)]":sel?"border-[var(--accent)]":"border-[var(--border)] hover:border-[var(--border-h)]"}`} style={{background:isPro?"rgba(124,107,240,0.06)":sel?"rgba(124,107,240,0.04)":"var(--bg2)"}}>
      {badge&&<span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-[var(--accent2)]" style={{background:"var(--accent-g)"}}>{badge}</span>}
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-xs text-[var(--muted)] mb-4">{desc}</p>
      <div className="mb-4"><span className="text-3xl font-extrabold">{price}</span><span className="text-sm text-[var(--dim)]">{mo}</span></div>
      <ul className="space-y-2 mb-4 flex-1">{features.map((f,i)=>(<li key={i} className="text-sm text-[var(--dim)] flex items-start gap-2"><span className="text-[var(--green)] mt-0.5">✓</span>{f}</li>))}</ul>
      <p className="text-[10px] text-[var(--muted)] mb-3">{note}</p>
      <a href="#cta" onClick={(e)=>e.stopPropagation()} className={`block text-center py-2.5 rounded-[var(--r2)] text-sm font-semibold transition-all hover:brightness-110 ${isPro?"text-white":"text-[var(--accent2)]"}`} style={{background:isPro?"linear-gradient(135deg, var(--accent), #9b7bf7)":"rgba(124,107,240,0.1)",border:isPro?"none":"1px solid rgba(124,107,240,0.2)"}}>{cta} →</a>
    </div>
  );
}
