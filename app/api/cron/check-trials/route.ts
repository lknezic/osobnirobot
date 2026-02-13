import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, trialExpiringEmail } from "@/lib/email";
import { ORCHESTRATOR_URL, ORCHESTRATOR_SECRET } from "@/lib/constants";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  try {
    const now = new Date();

    // 1. Find expired trials
    const { data: expired, error: expError } = await supabase
      .from("profiles")
      .select("id, plan_status, trial_ends_at")
      .eq("plan_status", "trial")
      .lt("trial_ends_at", now.toISOString());

    if (expError) {
      console.error("Expired query error:", expError);
      return NextResponse.json({ error: "Failed to query expired trials" }, { status: 500 });
    }

    let stopped = 0;
    if (expired && expired.length > 0) {
      console.log(`Found ${expired.length} expired trial(s) to stop`);

      for (const profile of expired) {
        try {
          // Get all running employee containers for this user
          const { data: employees } = await supabase
            .from("employees")
            .select("id")
            .eq("user_id", profile.id)
            .in("container_status", ["running", "provisioning"]);

          if (employees && employees.length > 0) {
            // Stop all containers in parallel
            await Promise.all(
              employees.map(emp =>
                fetch(`${ORCHESTRATOR_URL}/api/containers/stop`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-orchestrator-secret": ORCHESTRATOR_SECRET,
                  },
                  body: JSON.stringify({ employeeId: emp.id }),
                }).catch(() => {})
              )
            );

            // Batch update all employee statuses
            const empIds = employees.map(e => e.id);
            await supabase
              .from("employees")
              .update({ container_status: "stopped" })
              .in("id", empIds);
          }

          await supabase
            .from("profiles")
            .update({ plan_status: "expired" })
            .eq("id", profile.id);
          stopped++;
          console.log(`Stopped containers for ${profile.id.slice(0, 8)}`);
        } catch (err) {
          console.error(`Error stopping ${profile.id.slice(0, 8)}:`, err);
        }
      }
    }

    // 2. Send trial expiring emails (2 days before expiry) in parallel
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const { data: expiring, error: warnError } = await supabase
      .from("profiles")
      .select("id, email, trial_ends_at")
      .eq("plan_status", "trial")
      .gt("trial_ends_at", now.toISOString())
      .lt("trial_ends_at", twoDaysFromNow.toISOString());

    if (warnError) {
      console.error("Warning query error:", warnError);
    }

    let warned = 0;
    if (expiring && expiring.length > 0) {
      const results = await Promise.all(
        expiring
          .filter(p => p.email)
          .map(profile => {
            const daysLeft = Math.max(1, Math.ceil(
              (new Date(profile.trial_ends_at).getTime() - now.getTime()) / 86400000
            ));
            const { subject, html } = trialExpiringEmail("your team", daysLeft);
            return sendEmail({ to: profile.email, subject, html });
          })
      );
      warned = results.filter(Boolean).length;
      if (warned > 0) console.log(`Sent ${warned} trial expiring email(s)`);
    }

    return NextResponse.json({
      message: `Stopped ${stopped}, warned ${warned}`,
      stopped,
      warned,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Cron error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
