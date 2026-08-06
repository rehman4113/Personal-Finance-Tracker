import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormHeaderComponent } from '../../../../shared/components/form-header/form-header.component';
import { SubmitButtonComponent } from '../../../../shared/components/submit-button/submit-button.component';
import { ValidationMessagesComponent } from '../../../../shared/components/validation-messages/validation-messages.component';
import { OtpInputComponent } from '../../../../shared/components/otp-input/otp-input.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input';
import { PasswordInputComponent } from '../../components/password-input/password-input.component';
import { AuthenticationService } from '../../services/authentication.service';
import {
  emailValidator,
  firstNameValidator,
  lastNameValidator,
  otpValidator,
  passwordValidator,
  phoneValidator,
} from '../../validators/auth.validators';
import { confirmPasswordValidator } from '../../validators/confirm-password.validator';
import { AUTH_ROUTES } from '../../constants/auth.constants';
import { RegisterRequest } from '../../dto/request/register-request.dto';

/**
 * Registration with a post-submit email-verification step. The form and the
 * OTP verification share the same card: after a successful /register call the
 * form content is swapped for the OTP step (no route change, state carries).
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FormHeaderComponent,
    SubmitButtonComponent,
    ValidationMessagesComponent,
    OtpInputComponent,
    PhoneInputComponent,
    PasswordInputComponent,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly routes = AUTH_ROUTES;
  readonly apiError = signal<string | null>(null);
  readonly step = signal<'form' | 'verify'>('form');
  readonly registeredEmail = signal('');
  readonly resending = signal(false);
  readonly cooldown = signal(0);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [firstNameValidator]],
    lastName: ['', [lastNameValidator]],
    email: ['', [emailValidator]],
    countryCode: ['+92'],
    phone: ['', [phoneValidator]],
    password: ['', [passwordValidator]],
    confirmPassword: ['', [confirmPasswordValidator('password')]],
  });

  readonly verifyForm = this.fb.nonNullable.group({
    otp: ['', [otpValidator]],
  });

  constructor() {
    // Re-check the confirm-password mismatch whenever the password changes.
    this.form.controls.password.valueChanges.subscribe(() => {
      this.form.controls.confirmPassword.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    this.stopCooldown();
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, countryCode, phone, password } = this.form.getRawValue();
    // Backend contract: separate countryCode (digits, no '+') + phoneNumber,
    // combined server-side into a single stored contact.
    const request: RegisterRequest = {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || undefined,
      email: email.trim(),
      password,
      countryCode: (countryCode ?? '').replace('+', ''),
      phoneNumber: phone ?? '',
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.registeredEmail.set(email.trim());
        this.step.set('verify');
      },
      error: (err: { message?: string }) => {
        this.apiError.set(err.message ?? 'Registration failed');
      },
    });
  }

  onVerifySubmit(): void {
    this.apiError.set(null);
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }
    const { otp } = this.verifyForm.getRawValue();
    this.authService.verifyEmail({ email: this.registeredEmail(), otp }).subscribe({
      next: () => void this.router.navigate([AUTH_ROUTES.LOGIN]),
      error: (err: { message?: string }) => {
        this.apiError.set(err.message ?? 'Verification failed');
      },
    });
  }

  onResend(): void {
    this.apiError.set(null);
    this.resending.set(true);
    this.authService.resendOtp({ email: this.registeredEmail() }).subscribe({
      next: () => {
        this.resending.set(false);
        this.startCooldown(30);
      },
      error: (err: { message?: string }) => {
        this.resending.set(false);
        this.apiError.set(err.message ?? 'Could not resend verification code');
      },
    });
  }

  backToForm(): void {
    this.apiError.set(null);
    this.step.set('form');
  }

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  private startCooldown(seconds: number): void {
    this.stopCooldown();
    this.cooldown.set(seconds);
    this.cooldownTimer = setInterval(() => {
      const next = this.cooldown() - 1;
      if (next <= 0) {
        this.stopCooldown();
        this.cooldown.set(0);
      } else {
        this.cooldown.set(next);
      }
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}
