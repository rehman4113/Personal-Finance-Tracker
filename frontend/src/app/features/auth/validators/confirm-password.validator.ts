import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function confirmPasswordValidator(passwordField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;
    const password = parent.get(passwordField)?.value;
    const confirm = control.value;
    if (!confirm) return { required: true };
    if (password !== confirm) return { passwordMismatch: true };
    return null;
  };
}
