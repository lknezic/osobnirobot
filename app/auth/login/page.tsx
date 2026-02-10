"use client";

import { useState, FormEvent } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const supabase = createSupabaseBrowser();

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Auth error:", error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Back link */}
        <a href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-8 inline-block">
          &larr; Back
        </a>

        {/* Logo */}
        <div className="font-bold text-xl tracking-tight mb-8">
          Instant<span className="text-[var(--accent2)]">Worker</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-sm text-[var(--dim)] mb-8">Enter your email to sign in with a magic link</p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm font-medium hover:border-[var(--border-h)] transition-colors mb-4"
          style={{ background: "var(--bg2)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--muted)]">or</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Magic Link */}
        {status === "sent" ? (
          <div className="text-center py-8">
            <p className="text-[var(--green)] font-semibold">Check your email! Click the link to sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-[var(--r2)] border border-[var(--border)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
              style={{ background: "var(--bg2)", color: "var(--text)" }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-[var(--r2)] font-semibold text-sm text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--accent), #9b7bf7)" }}
            >
              {status === "loading" ? "..." : "Send magic link"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-red-400 text-xs mt-3 text-center">Error sending link. Please try again.</p>
        )}
      </div>
    </main>
  );
}
