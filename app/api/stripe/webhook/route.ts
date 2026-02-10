import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, paymentFailedEmail } from "@/lib/email";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        if (userId && planId) {
          // Fetch subscription to check if it's trialing
          const subId = session.subscription as string;
          const sub = subId ? await stripe.subscriptions.retrieve(subId) : null;
          const isTrial = sub?.status === "trialing";
          const trialEnd = sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

          await supabase.from("profiles").update({
            plan_status: isTrial ? "trial" : "active",
            selected_plan: planId,
            stripe_subscription_id: subId,
            ...(trialEnd ? { trial_ends_at: trialEnd } : {}),
          }).eq("id", userId);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          let status: string;
          if (sub.status === "trialing") {
            status = "trial";
          } else if (sub.status === "active") {
            status = "active";
          } else if (sub.status === "past_due") {
            status = "past_due";
          } else {
            status = "cancelled";
          }
          const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
          await supabase.from("profiles").update({
            plan_status: status,
            ...(trialEnd ? { trial_ends_at: trialEnd } : {}),
          }).eq("id", userId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await supabase.from("profiles").update({
            plan_status: "cancelled",
            container_status: "stopped",
          }).eq("id", userId);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const { data: profile } = await supabase.from("profiles").select("id, assistant_name").eq("stripe_customer_id", customerId).single();
        if (profile) {
          await supabase.from("profiles").update({ plan_status: "past_due" }).eq("id", profile.id);
          // Send payment failed email
          const customerEmail = typeof invoice.customer_email === "string" ? invoice.customer_email : null;
          if (customerEmail) {
            const { subject, html } = paymentFailedEmail(profile.assistant_name || "your worker");
            sendEmail({ to: customerEmail, subject, html }).catch(() => {});
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
