import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase SSR
const mockGetUser = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Set required env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

import { middleware } from '@/middleware';

function makeRequest(path: string, host = 'instantworker.ai'): NextRequest {
  const url = `https://${host}${path}`;
  const req = new NextRequest(url, {
    headers: { host },
  });
  return req;
}

function setUser(user: { email: string } | null) {
  mockGetUser.mockResolvedValue({
    data: { user },
  });
}

describe('Middleware — Main domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows unauthenticated access to landing page /', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/'));
    // Should pass through (not a redirect)
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated user from /dashboard to /auth/login', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth/login');
  });

  it('redirects unauthenticated user from /onboarding to /auth/login', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/onboarding'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth/login');
  });

  it('allows authenticated user to access /dashboard', async () => {
    setUser({ email: 'user@test.com' });
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects logged-in user from /auth/login to /dashboard', async () => {
    setUser({ email: 'user@test.com' });
    const res = await middleware(makeRequest('/auth/login'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard');
  });

  it('allows unauthenticated user to see /auth/login', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/auth/login'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('blocks /admin paths on main domain — redirects to /', async () => {
    setUser({ email: 'contact@lukaknezic.com' });
    const res = await middleware(makeRequest('/admin'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  it('blocks /admin/health on main domain', async () => {
    setUser({ email: 'contact@lukaknezic.com' });
    const res = await middleware(makeRequest('/admin/health'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });
});

describe('Middleware — Admin subdomain', () => {
  const adminHost = 'admin.instantworker.ai';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user to /auth/login', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/', adminHost));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth/login');
  });

  it('does NOT redirect loop on /auth/login (unauthenticated)', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/auth/login', adminHost));
    // Should pass through — no redirect
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects logged-in user from /auth/login to /', async () => {
    setUser({ email: 'contact@lukaknezic.com' });
    const res = await middleware(makeRequest('/auth/login', adminHost));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });

  it('rewrites / to /admin for authenticated user', async () => {
    setUser({ email: 'contact@lukaknezic.com' });
    const res = await middleware(makeRequest('/', adminHost));
    const rewrite = res.headers.get('x-middleware-rewrite');
    expect(rewrite).toBeTruthy();
    expect(new URL(rewrite!).pathname).toBe('/admin');
  });

  it('allows /api paths through without auth', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/api/admin/overview', adminHost));
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /_next paths through without auth', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/_next/static/chunk.js', adminHost));
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows /auth/callback through without auth', async () => {
    setUser(null);
    const res = await middleware(makeRequest('/auth/callback', adminHost));
    expect(res.headers.get('location')).toBeNull();
  });

  it('passes through /admin paths on subdomain for authenticated user', async () => {
    setUser({ email: 'contact@lukaknezic.com' });
    const res = await middleware(makeRequest('/admin/health', adminHost));
    // Should pass through (already has /admin prefix)
    expect(res.headers.get('location')).toBeNull();
  });
});

describe('Middleware — matcher config', () => {
  it('matcher includes all critical paths', async () => {
    // Import the config
    const { config } = await import('@/middleware');
    const { matcher } = config;

    expect(matcher).toContain('/dashboard/:path*');
    expect(matcher).toContain('/onboarding/:path*');
    expect(matcher).toContain('/admin/:path*');
    expect(matcher).toContain('/auth/login');
    expect(matcher).toContain('/');
  });
});
