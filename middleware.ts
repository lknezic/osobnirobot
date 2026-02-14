import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';

  const isAdminSubdomain = host.startsWith('admin.');

  // admin.instantworker.ai subdomain → rewrite to /admin routes
  if (isAdminSubdomain) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    // Root of admin subdomain → /admin
    if (path === '/') {
      return NextResponse.rewrite(new URL('/admin', request.url));
    }
    // /health → /admin/health, /workers → /admin/workers, /clients → /admin/clients, etc.
    if (!path.startsWith('/admin') && !path.startsWith('/api') && !path.startsWith('/auth') && !path.startsWith('/_next')) {
      return NextResponse.rewrite(new URL(`/admin${path}`, request.url));
    }
    // Already an /admin path on the subdomain — allow through
    return response;
  }

  // Block /admin paths on the main domain — admin is only via subdomain
  if (path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect dashboard/onboarding
  if ((path.startsWith("/dashboard") || path.startsWith("/onboarding")) && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Already logged in visiting login page
  if (path === "/auth/login" && user) {
    // Admin subdomain → redirect to admin, not dashboard
    if (host.startsWith('admin.')) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin/:path*", "/auth/login", "/", "/health", "/workers/:path*", "/clients/:path*"],
};
