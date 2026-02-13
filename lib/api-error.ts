import { NextResponse } from 'next/server';

/** Create a standard JSON error response */
export function apiError(message: string, code: string, status: number): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

export function unauthorized(message = 'Not authenticated'): NextResponse {
  return apiError(message, 'UNAUTHORIZED', 401);
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return apiError(message, 'FORBIDDEN', 403);
}

export function notFound(message = 'Not found'): NextResponse {
  return apiError(message, 'NOT_FOUND', 404);
}

export function badRequest(message: string): NextResponse {
  return apiError(message, 'BAD_REQUEST', 400);
}

export function serverError(message = 'Internal server error'): NextResponse {
  return apiError(message, 'SERVER_ERROR', 500);
}

export function planLimitReached(message = 'Employee limit reached for your plan'): NextResponse {
  return apiError(message, 'PLAN_LIMIT', 403);
}
