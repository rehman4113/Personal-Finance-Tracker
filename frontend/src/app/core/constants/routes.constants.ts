/**
 * Top-level application routes.
 * WHY: Guards, services, and pages navigate using constants — not hardcoded strings.
 */
export const APP_ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  REGISTER: '/register',
} as const;
