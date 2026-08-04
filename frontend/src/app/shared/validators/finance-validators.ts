import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Amount must be a positive number (server is authoritative; this is a hint). */
export const positiveAmountValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric)) return { invalidAmount: true };
  if (numeric <= 0) return { invalidAmount: true };
  return null;
};

/** Date must be today or in the past (finance records are historical). */
export const notInFutureValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { invalidDate: true };
  return null;
};

/** "YYYY-MM" month format used by budgets. */
export const monthFormatValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return { invalidMonth: true };
  return null;
};

/** Chain of reusable messages keyed by validator name — mirrors auth pattern. */
export function getFinanceValidationMessage(errors: ValidationErrors | null): string | null {
  if (!errors) return null;
  if (errors['required']) return 'This field is required';
  if (errors['invalidAmount']) return 'Enter an amount greater than zero';
  if (errors['invalidDate']) return 'Enter a valid date';
  if (errors['invalidMonth']) return 'Use the YYYY-MM format';
  if (errors['walletRequired']) return 'Select a wallet';
  if (errors['transferWalletMismatch']) return 'From and To wallets must be different';
  if (errors['amountExceedsBalance']) return 'Amount exceeds the selected wallet balance';
  if (errors['personRequired']) return 'Borrower name is required';
  return 'Invalid value';
}