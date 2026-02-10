import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const PLANS: Record<string, { stripe_price_id: string }> = {
  simple: { stripe_price_id: process.env.STRIPE_SIMPLE_PRICE_ID || '' },
  expert: { stripe_price_id: process.env.STRIPE_EXPERT_PRICE_ID || '' },
  legend: { stripe_price_id: process.env.STRIPE_LEGEND_PRICE_ID || '' },
};

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { userId, planId } = await request.json();
    if (!userId || !planId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const plan = PLANS[planId];
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

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
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${appUrl}/onboarding?step=provision&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/onboarding?step=cancelled`,
      metadata: { userId, planId },
      subscription_data: { trial_period_days: 7, metadata: { userId, planId } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
