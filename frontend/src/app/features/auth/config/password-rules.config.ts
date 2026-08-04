/**
 * Password complexity rules — Section 11.6 / Section 19.
 * Frontend enforces 8–100 chars (stricter than backend 6–100).
 */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 100,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  strengthThresholds: {
    weak: 2,
    fair: 3,
    good: 4,
    strong: 5,
  },
} as const;

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';
