/**
 * localStorage keys shared across features.
 * WHY: Centralized keys prevent typos and make storage auditable.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pfm_access_token',
  REFRESH_TOKEN: 'pfm_refresh_token',
  AUTH_USER: 'pfm_auth_user',
  REMEMBER_ME: 'pfm_remember_me',
  THEME: 'pfm_theme',
} as const;
