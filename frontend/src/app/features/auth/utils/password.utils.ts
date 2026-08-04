import { PASSWORD_RULES, PasswordStrength } from '../config/password-rules.config';
import { REGEX } from '../constants/auth.constants';
import { PasswordRequirement } from '../interfaces/password-requirement.interface';

export function buildPasswordRequirements(value: string): PasswordRequirement[] {
  return [
    {
      label: 'Uppercase letter',
      validator: (v: string) => REGEX.PASSWORD_UPPERCASE.test(v),
      met: REGEX.PASSWORD_UPPERCASE.test(value),
    },
    {
      label: 'Lowercase letter',
      validator: (v: string) => REGEX.PASSWORD_LOWERCASE.test(v),
      met: REGEX.PASSWORD_LOWERCASE.test(value),
    },
    { label: 'Digit', validator: (v: string) => REGEX.PASSWORD_DIGIT.test(v), met: REGEX.PASSWORD_DIGIT.test(value) },
    {
      label: 'Special character',
      validator: (v: string) => REGEX.PASSWORD_SPECIAL.test(v),
      met: REGEX.PASSWORD_SPECIAL.test(value),
    },
    {
      label: `Minimum ${PASSWORD_RULES.minLength} characters`,
      validator: (v: string) => v.length >= PASSWORD_RULES.minLength,
      met: value.length >= PASSWORD_RULES.minLength,
    },
    {
      label: `Maximum ${PASSWORD_RULES.maxLength} characters`,
      validator: (v: string) => v.length <= PASSWORD_RULES.maxLength,
      met: value.length <= PASSWORD_RULES.maxLength,
    },
  ];
}

export function computePasswordStrength(value: string): PasswordStrength {
  const requirements = buildPasswordRequirements(value);
  const metCount = requirements.filter((r) => r.met).length;
  const { weak, fair, good, strong } = PASSWORD_RULES.strengthThresholds;

  if (metCount >= strong) return 'strong';
  if (metCount >= good) return 'good';
  if (metCount >= fair) return 'fair';
  return 'weak';
}

export function strengthLabel(strength: PasswordStrength): string {
  return strength.charAt(0).toUpperCase() + strength.slice(1);
}

export function strengthPercent(strength: PasswordStrength): number {
  const map: Record<PasswordStrength, number> = { weak: 25, fair: 50, good: 75, strong: 100 };
  return map[strength];
}
