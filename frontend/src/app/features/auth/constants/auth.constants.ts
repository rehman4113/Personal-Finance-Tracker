import { APP_ROUTES } from '../../../core/constants/routes.constants';
import { STORAGE_KEYS } from '../../../core/constants/storage-keys.constants';

/**
 * Auth feature constants — Section 18.
 * WHY: Feature-specific strings centralized; core constants reused where shared.
 */
export const AUTH_ROUTES = APP_ROUTES;

export const AUTH_STORAGE_KEYS = STORAGE_KEYS;

export const REGEX = {
  ALPHABETS: /^[A-Za-z\s]+$/,
  DIGITS: /^\d+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  GMAIL: /^[^\s@]+@gmail\.com$/i,
  PASSWORD_UPPERCASE: /[A-Z]/,
  PASSWORD_LOWERCASE: /[a-z]/,
  PASSWORD_DIGIT: /\d/,
  PASSWORD_SPECIAL: /[!@#$%^&*(),.?":{}|<>[\]\\/_+=\-~`]/,
} as const;

export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Enter a valid email address',
  gmailOnly: 'Only @gmail.com addresses are allowed',
  alphabetsOnly: 'Only letters are allowed',
  minLength: (min: number) => `Minimum ${min} characters required`,
  maxLength: (max: number) => `Maximum ${max} characters allowed`,
  passwordMismatch: 'Passwords do not match',
  phoneDigits: 'Phone number must contain digits only',
  phoneLength: 'Phone number must be 10–15 digits',
} as const;
