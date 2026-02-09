import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("AUTH CALLBACK:", { code: code?.slice(0, 8), origin });

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("EXCHANGE RESULT:", { error: error?.message || "success" });

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("USER:", { id: user?.id?.slice(0, 8), email: user?.email });

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_step")
          .eq("id", user.id)
          .single();

        console.log("PROFILE:", { profile, profileError: profileError?.message });

        if (!profile || profile.onboarding_step < 3) {
          return NextResponse.redirect(new URL("/onboarding", origin));
        }
      }

      return NextResponse.redirect(new URL(next, origin));
    }

    console.error("EXCHANGE ERROR:", error.message);
  }

  return NextResponse.redirect(new URL("/auth/login?error=auth", origin));
}
