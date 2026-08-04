/**
 * Application-wide configuration.
 * WHY: Single place for API base URL and token timing — no magic strings in services/interceptors.
 */
export const APP_CONFIG = {
  apiBaseUrl: 'http://localhost:8082',
  /** Refresh access token this many seconds before it expires */
  tokenRefreshMarginSeconds: 60,
  defaultRoute: '/',
} as const;

export type AppConfig = typeof APP_CONFIG;
