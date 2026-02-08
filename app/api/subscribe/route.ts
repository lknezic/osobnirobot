import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Simple in-memory rate limiter
const rateLimit = new Map<string, number>();

export async function POST(request: Request) {
  try {
    // Rate limit: 5 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const lastRequest = rateLimit.get(ip) || 0;
    if (now - lastRequest < 12000) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }
    rateLimit.set(ip, now);

    const body = await request.json();
    const { email, model, channel, plan, language } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const supabase = getSupabase();
    const { error } = await supabase.from("waitlist").insert({
      email: email.toLowerCase().trim(),
      selected_model: model || null,
      selected_channel: channel || null,
      selected_plan: plan || null,
      language: language || "hr",
    });

    if (error) {
      // Duplicate email
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already registered." },
          { status: 409 }
        );
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
