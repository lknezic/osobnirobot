import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, trialExpiringEmail } from "@/lib/email";

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || "http://localhost:3500";
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date();

    // 1. Stop expired trials
    const { data: expired, error: expError } = await supabase
      .from("profiles")
      .select("id, assistant_name, plan_status, trial_ends_at, container_status")
      .eq("plan_status", "trial")
      .lt("trial_ends_at", now.toISOString())
      .in("container_status", ["running", "creating"]);

    if (expError) {
      console.error("Expired query error:", expError);
      return NextResponse.json({ error: "Failed to query expired trials" }, { status: 500 });
    }

    let stopped = 0;
    if (expired && expired.length > 0) {
      console.log(`Found ${expired.length} expired trial(s) to stop`);

      for (const profile of expired) {
        try {
          const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/stop`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-orchestrator-secret": ORCHESTRATOR_SECRET,
            },
            body: JSON.stringify({ userId: profile.id }),
          });

          if (res.ok) {
            await supabase
              .from("profiles")
              .update({ container_status: "stopped", plan_status: "expired" })
              .eq("id", profile.id);
            stopped++;
            console.log(`Stopped container for ${profile.id.slice(0, 8)} (${profile.assistant_name})`);
          }
        } catch (err) {
          console.error(`Error stopping ${profile.id.slice(0, 8)}:`, err);
        }
      }
    }

    // 2. Send trial expiring emails (2 days before expiry)
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const { data: expiring, error: warnError } = await supabase
      .from("profiles")
      .select("id, email, assistant_name, trial_ends_at")
      .eq("plan_status", "trial")
      .gt("trial_ends_at", now.toISOString())
      .lt("trial_ends_at", twoDaysFromNow.toISOString());

    if (warnError) {
      console.error("Warning query error:", warnError);
      // Non-fatal — still return success for the stop phase
    }

    let warned = 0;
    if (expiring && expiring.length > 0) {
      for (const profile of expiring) {
        if (!profile.email) continue;
        const daysLeft = Math.max(1, Math.ceil(
          (new Date(profile.trial_ends_at).getTime() - now.getTime()) / 86400000
        ));
        const { subject, html } = trialExpiringEmail(profile.assistant_name || "your worker", daysLeft);
        const sent = await sendEmail({ to: profile.email, subject, html });
        if (sent) warned++;
      }
      console.log(`Sent ${warned} trial expiring email(s)`);
    }

    return NextResponse.json({
      message: `Stopped ${stopped}, warned ${warned}`,
      stopped,
      warned,
    });
  } catch (err: any) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
