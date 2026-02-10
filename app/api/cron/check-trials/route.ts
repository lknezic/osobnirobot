import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    // Find users with expired trials that still have running containers
    const { data: expired, error } = await supabase
      .from("profiles")
      .select("id, assistant_name, plan_status, trial_ends_at, container_status")
      .eq("plan_status", "trial")
      .lt("trial_ends_at", new Date().toISOString())
      .in("container_status", ["running", "creating"]);

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ message: "No expired trials", stopped: 0 });
    }

    console.log(`Found ${expired.length} expired trial(s) to stop`);

    let stopped = 0;
    for (const profile of expired) {
      try {
        // Stop container via orchestrator
        const res = await fetch(`${ORCHESTRATOR_URL}/api/containers/stop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-orchestrator-secret": ORCHESTRATOR_SECRET,
          },
          body: JSON.stringify({ userId: profile.id }),
        });

        if (res.ok) {
          // Update profile
          await supabase
            .from("profiles")
            .update({ container_status: "stopped", plan_status: "expired" })
            .eq("id", profile.id);
          stopped++;
          console.log(`Stopped container for ${profile.id.slice(0, 8)} (${profile.assistant_name})`);
        } else {
          console.error(`Failed to stop container for ${profile.id.slice(0, 8)}:`, await res.text());
        }
      } catch (err) {
        console.error(`Error stopping ${profile.id.slice(0, 8)}:`, err);
      }
    }

    return NextResponse.json({ message: `Stopped ${stopped} expired trial(s)`, stopped });
  } catch (err: any) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
