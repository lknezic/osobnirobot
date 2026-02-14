import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

// New pricing: single $199/worker plan
// Legacy plan IDs supported for existing subscriptions
const PRICE_IDS: Record<string, string> = {
  worker: process.env.STRIPE_WORKER_PRICE_ID || '',
  // Legacy (keep until all migrated, then remove)
  simple: process.env.STRIPE_SIMPLE_PRICE_ID || '',
  expert: process.env.STRIPE_EXPERT_PRICE_ID || '',
  legend: process.env.STRIPE_LEGEND_PRICE_ID || '',
};

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();

    // Verify the authenticated user matches the requested userId
    const authSupabase = createSupabaseServer();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { userId, planId } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Default to 'worker' plan if no planId provided
    const resolvedPlanId = planId || 'worker';
    const priceId = PRICE_IDS[resolvedPlanId];
    if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get or create Stripe customer
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId: profile.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://instantworker.ai";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/dashboard?payment=cancelled`,
      metadata: { userId, planId: resolvedPlanId },
      subscription_data: { trial_period_days: 7, metadata: { userId, planId: resolvedPlanId } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
