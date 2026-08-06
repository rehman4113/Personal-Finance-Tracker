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
  VERIFY_EMAIL: '/api/v1/auth/verify-email',
  RESEND_OTP: '/api/v1/auth/resend-otp',
  FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  RESET_PASSWORD: '/api/v1/auth/reset-password',
  UPDATE_PROFILE: '/api/v1/auth/profile',
  DEMO_COMPLETE: '/api/v1/auth/demo-complete',
} as const;

/** Endpoints that must NOT receive Bearer access token.
 *  NOTE: UPDATE_PROFILE and DEMO_COMPLETE are deliberately absent — they are
 *  authenticated endpoints (PUT /api/v1/auth/profile, PATCH
 *  /api/v1/auth/demo-complete) and need the access token. */
export const AUTH_PUBLIC_ENDPOINTS = [
  AUTH_API.REGISTER,
  AUTH_API.LOGIN,
  AUTH_API.REFRESH,
  AUTH_API.VERIFY_EMAIL,
  AUTH_API.RESEND_OTP,
  AUTH_API.FORGOT_PASSWORD,
  AUTH_API.RESET_PASSWORD,
] as const;
