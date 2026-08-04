import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormHeaderComponent } from '../../../../shared/components/form-header/form-header.component';
import { SubmitButtonComponent } from '../../../../shared/components/submit-button/submit-button.component';
import { ValidationMessagesComponent } from '../../../../shared/components/validation-messages/validation-messages.component';
import { PasswordInputComponent } from '../../components/password-input/password-input.component';
import { CountryCodeDropdownComponent } from '../../components/country-code-dropdown/country-code-dropdown.component';
import { PhoneNumberInputComponent } from '../../components/phone-number-input/phone-number-input.component';
import { AuthenticationService } from '../../services/authentication.service';
import {
  emailValidator,
  firstNameValidator,
  lastNameValidator,
  passwordValidator,
  phoneValidator,
} from '../../validators/auth.validators';
import { confirmPasswordValidator } from '../../validators/confirm-password.validator';
import { AUTH_ROUTES } from '../../constants/auth.constants';
import { RegisterRequest } from '../../dto/request/register-request.dto';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FormHeaderComponent,
    SubmitButtonComponent,
    ValidationMessagesComponent,
    PasswordInputComponent,
    CountryCodeDropdownComponent,
    PhoneNumberInputComponent,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly routes = AUTH_ROUTES;
  readonly apiError = signal<string | null>(null);
  readonly countryCode = signal<string>('+92');

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [firstNameValidator]],
    lastName: ['', [lastNameValidator]],
    email: ['', [emailValidator]],
    countryCode: ['+92'],
    phone: ['', [phoneValidator]],
    password: ['', [passwordValidator]],
    confirmPassword: ['', [confirmPasswordValidator('password')]],
  });

  constructor() {
    this.form.controls.countryCode.valueChanges.subscribe((value) => this.countryCode.set(value));
    // Re-check the confirm-password mismatch whenever the password changes.
    this.form.controls.password.valueChanges.subscribe(() => {
      this.form.controls.confirmPassword.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password } = this.form.getRawValue();
    // NOTE: phone/country code are validated on the UI only — the backend contract
    // RegisterRequest carries firstName/lastName/email/password exclusively.
    const request: RegisterRequest = {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || undefined,
      email: email.trim(),
      password,
    };

    this.authService.register(request).subscribe({
      next: () => void this.router.navigate([AUTH_ROUTES.LOGIN]),
      error: (err: { message?: string }) => {
        this.apiError.set(err.message ?? 'Registration failed');
      },
    });
  }
}
