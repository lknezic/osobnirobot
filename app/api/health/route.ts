import { NextResponse } from "next/server";
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};
  const start = Date.now();

  // 1. Supabase connectivity
  try {
    const t0 = Date.now();
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" },
    });
    checks.supabase = { ok: res.ok, ms: Date.now() - t0 };
  } catch (err) {
    checks.supabase = { ok: false, error: err instanceof Error ? err.message : "Unknown" };
  }

  // 2. Orchestrator connectivity
  try {
    const t0 = Date.now();
    const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/health`, {
      headers: { "x-orchestrator-secret": ORCHESTRATOR_SECRET },
      signal: AbortSignal.timeout(5000),
    });
    checks.orchestrator = { ok: res.ok, ms: Date.now() - t0 };
  } catch (err) {
    checks.orchestrator = { ok: false, error: err instanceof Error ? err.message : "Unknown" };
  }

  // 3. Stripe (key configured)
  checks.stripe = { ok: !!process.env.STRIPE_SECRET_KEY };

  // 4. Environment
  checks.env = {
    ok: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.ORCHESTRATOR_SECRET
    ),
  };

  const allOk = Object.values(checks).every(c => c.ok);

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", totalMs: Date.now() - start, checks },
    { status: allOk ? 200 : 503 }
  );
}
