/** Strip HTML tags from a string */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

/** Sanitize and trim input to max length */
export function sanitize(s: string | undefined | null, maxLength: number): string {
  return stripHtml(s || '').trim().slice(0, maxLength);
}

/** Validate a URL string (basic check) */
export function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

/** Sanitize an array of strings */
export function sanitizeArray(arr: unknown[], maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map(item => sanitize(String(item), maxLength))
    .filter(Boolean);
}
