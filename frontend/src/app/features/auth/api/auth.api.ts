/**
 * Auth API endpoint constants ONLY — Section 12 implementation.
 * WHY: Single source of truth; services never hardcode URLs.
 * Base URL lives in core/config/app.config.ts.
 */
export const AUTH_API = {
  REGISTER: '/api/v1/auth/register',
  LOGIN: '/api/v1/auth/login',
  REFRESH: '/api/v1/auth/refresh',
  LOGOUT: '/api/v1/auth/logout',
} as const;

/** Endpoints that must NOT receive Bearer access token */
export const AUTH_PUBLIC_ENDPOINTS = [
  AUTH_API.REGISTER,
  AUTH_API.LOGIN,
  AUTH_API.REFRESH,
] as const;
