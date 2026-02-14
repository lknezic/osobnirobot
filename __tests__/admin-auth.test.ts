import { describe, it, expect } from 'vitest';
import { isAdmin } from '@/lib/admin-auth';

describe('isAdmin', () => {
  it('returns true for admin email', () => {
    expect(isAdmin('contact@lukaknezic.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAdmin('Contact@LukaKnezic.com')).toBe(true);
    expect(isAdmin('CONTACT@LUKAKNEZIC.COM')).toBe(true);
  });

  it('returns false for non-admin email', () => {
    expect(isAdmin('random@user.com')).toBe(false);
    expect(isAdmin('admin@other.com')).toBe(false);
  });

  it('returns false for undefined/null/empty', () => {
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin('')).toBe(false);
  });
});
