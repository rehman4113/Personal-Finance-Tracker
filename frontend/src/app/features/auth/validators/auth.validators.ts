import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PASSWORD_RULES } from '../config/password-rules.config';
import { REGEX, VALIDATION_MESSAGES } from '../constants/auth.constants';

export const firstNameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string)?.trim() ?? '';
  if (!value) return { required: true };
  if (!REGEX.ALPHABETS.test(value)) return { alphabetsOnly: true };
  if (value.length < 2) return { minlength: { requiredLength: 2, actualLength: value.length } };
  if (value.length > 100) return { maxlength: { requiredLength: 100, actualLength: value.length } };
  return null;
};

export const lastNameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string)?.trim() ?? '';
  if (!value) return null;
  if (!REGEX.ALPHABETS.test(value)) return { alphabetsOnly: true };
  if (value.length > 100) return { maxlength: { requiredLength: 100, actualLength: value.length } };
  return null;
};

export const emailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string)?.trim() ?? '';
  if (!value) return { required: true };
  if (!REGEX.EMAIL.test(value)) return { email: true };
  if (!REGEX.GMAIL.test(value)) return { gmailOnly: true };
  return null;
};

export const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string)?.trim() ?? '';
  if (!value) return { required: true };
  if (!REGEX.DIGITS.test(value)) return { phoneDigits: true };
  if (value.length < 10 || value.length > 15) return { phoneLength: true };
  return null;
};

export const passwordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string) ?? '';
  if (!value) return { required: true };
  if (value.length < PASSWORD_RULES.minLength) {
    return { minlength: { requiredLength: PASSWORD_RULES.minLength, actualLength: value.length } };
  }
  if (value.length > PASSWORD_RULES.maxLength) {
    return { maxlength: { requiredLength: PASSWORD_RULES.maxLength, actualLength: value.length } };
  }
  if (!REGEX.PASSWORD_UPPERCASE.test(value)) return { passwordUppercase: true };
  if (!REGEX.PASSWORD_LOWERCASE.test(value)) return { passwordLowercase: true };
  if (!REGEX.PASSWORD_DIGIT.test(value)) return { passwordDigit: true };
  if (!REGEX.PASSWORD_SPECIAL.test(value)) return { passwordSpecial: true };
  return null;
};

export function getValidationMessage(errors: ValidationErrors | null): string | null {
  if (!errors) return null;
  if (errors['required']) return VALIDATION_MESSAGES.required;
  if (errors['email']) return VALIDATION_MESSAGES.email;
  if (errors['gmailOnly']) return VALIDATION_MESSAGES.gmailOnly;
  if (errors['alphabetsOnly']) return VALIDATION_MESSAGES.alphabetsOnly;
  if (errors['minlength']) return VALIDATION_MESSAGES.minLength(errors['minlength'].requiredLength);
  if (errors['maxlength']) return VALIDATION_MESSAGES.maxLength(errors['maxlength'].requiredLength);
  if (errors['phoneDigits']) return VALIDATION_MESSAGES.phoneDigits;
  if (errors['phoneLength']) return VALIDATION_MESSAGES.phoneLength;
  if (errors['passwordMismatch']) return VALIDATION_MESSAGES.passwordMismatch;
  if (errors['passwordUppercase']) return 'Must contain an uppercase letter';
  if (errors['passwordLowercase']) return 'Must contain a lowercase letter';
  if (errors['passwordDigit']) return 'Must contain a digit';
  if (errors['passwordSpecial']) return 'Must contain a special character';
  if (errors['otpDigits']) return 'Enter the complete 6-digit code';
  return 'Invalid value';
}

/** OTP must be exactly 6 digits (backend stores a 6-char code). */
export const otpValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return { required: true };
  if (!/^\d{6}$/.test(value)) return { otpDigits: true };
  return null;
};
