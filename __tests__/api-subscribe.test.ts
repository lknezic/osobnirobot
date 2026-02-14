import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockInsert = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

import { POST } from '@/app/api/subscribe/route';

function makeRequest(body: Record<string, unknown>, ip = '127.0.0.1'): Request {
  return new Request('https://instantworker.ai/api/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }, '1.1.1.1'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid email');
  });

  it('rejects missing email', async () => {
    const res = await POST(makeRequest({}, '1.1.1.2'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid email');
  });

  it('succeeds with valid email', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const res = await POST(makeRequest({ email: 'test@example.com' }, '1.1.1.3'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('normalizes email to lowercase', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await POST(makeRequest({ email: 'Test@EXAMPLE.com' }, '1.1.1.4'));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' })
    );
  });

  it('handles duplicate email (409)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } });
    const res = await POST(makeRequest({ email: 'dupe@test.com' }, '1.1.1.5'));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('already registered');
  });

  it('passes optional fields to Supabase', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await POST(makeRequest({
      email: 'test@example.com',
      model: 'sonnet',
      channel: 'x-twitter',
      plan: 'worker',
      language: 'en',
    }, '1.1.1.6'));

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        selected_model: 'sonnet',
        selected_channel: 'x-twitter',
        selected_plan: 'worker',
        language: 'en',
      })
    );
  });

  it('rate limits rapid requests from same IP', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const ip = '10.0.0.1';

    // First request should succeed
    const res1 = await POST(makeRequest({ email: 'a@test.com' }, ip));
    expect(res1.status).toBe(200);

    // Immediate second request should be rate limited
    const res2 = await POST(makeRequest({ email: 'b@test.com' }, ip));
    expect(res2.status).toBe(429);
    const json = await res2.json();
    expect(json.error).toContain('Too many requests');
  });
});
