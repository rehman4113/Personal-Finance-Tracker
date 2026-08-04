import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { getValidationMessage } from '../../../features/auth/validators/auth.validators';

@Component({
  selector: 'app-validation-messages',
  standalone: true,
  template: `
    @if (showError()) {
      <div class="invalid-feedback d-block">
        {{ errorMessage() }}
      </div>
    }
  `,
})
export class ValidationMessagesComponent {
  readonly control = input.required<AbstractControl>();
  readonly fieldName = input<string>('');

  showError(): boolean {
    const ctrl = this.control();
    return !!(ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  errorMessage(): string {
    return getValidationMessage(this.control().errors) ?? 'Invalid value';
  }
}
