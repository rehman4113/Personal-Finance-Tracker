/**
 * JWT helper utilities — Section 6.15 / Section 15.
 * WHY: Pure, dependency-free functions for decoding tokens and checking expiry.
 * Used by the AuthenticationService and the auth interceptor.
 */

export interface JwtPayload {
  sub?: string;
  userId?: number;
  email?: string;
  iat?: number;
  exp?: number;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, marginSeconds = 0): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 - marginSeconds * 1000 <= Date.now();
}
