// Email utility — uses Resend API directly (no package dependency)
// Set RESEND_API_KEY env var to enable. If not set, emails are logged but not sent.

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "InstantWorker <noreply@instantworker.ai>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SKIP] No RESEND_API_KEY. Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[EMAIL ERROR] ${res.status}: ${err}`);
      return false;
    }

    console.log(`[EMAIL SENT] ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    return false;
  }
}

// --- Templates ---

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: `${name} is hired — your AI worker is live`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e5e5e5;">
        <h1 style="font-size: 22px; color: #fff; margin-bottom: 8px;">Welcome to InstantWorker</h1>
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          <strong>${name}</strong> is now live and working for you 24/7. Head to your dashboard to watch it in action.
        </p>
        <a href="https://instantworker.ai/dashboard" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #7c6bf0, #9b7bf7); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Open Dashboard →</a>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">Your 7-day free trial has started. You won't be charged until it ends.</p>
      </div>
    `,
  };
}

export function trialExpiringEmail(name: string, daysLeft: number): { subject: string; html: string } {
  return {
    subject: `${name}'s trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e5e5e5;">
        <h1 style="font-size: 22px; color: #fff; margin-bottom: 8px;">Your trial is ending soon</h1>
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          <strong>${name}</strong>'s free trial ends in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.
          After that, your worker will stop running unless you subscribe.
        </p>
        <a href="https://instantworker.ai/dashboard" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #7c6bf0, #9b7bf7); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Keep ${name} running →</a>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">If you've already subscribed, you can ignore this email.</p>
      </div>
    `,
  };
}

export function paymentFailedEmail(name: string): { subject: string; html: string } {
  return {
    subject: `Payment failed — ${name} will stop soon`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e5e5e5;">
        <h1 style="font-size: 22px; color: #fff; margin-bottom: 8px;">Payment failed</h1>
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          We couldn't process your payment for <strong>${name}</strong>. Please update your payment method to keep your worker running.
        </p>
        <a href="https://instantworker.ai/dashboard" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #7c6bf0, #9b7bf7); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Update payment →</a>
        <p style="color: #555; font-size: 12px; margin-top: 32px;">If payment isn't updated, your worker will be stopped.</p>
      </div>
    `,
  };
}
