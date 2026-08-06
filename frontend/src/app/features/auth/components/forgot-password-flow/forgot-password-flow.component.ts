import { Component, OnDestroy, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OtpInputComponent } from '../../../../shared/components/otp-input/otp-input.component';
import { SubmitButtonComponent } from '../../../../shared/components/submit-button/submit-button.component';
import { ValidationMessagesComponent } from '../../../../shared/components/validation-messages/validation-messages.component';
import { AuthenticationService } from '../../services/authentication.service';
import {
  emailValidator,
  otpValidator,
  passwordValidator,
} from '../../validators/auth.validators';
import { confirmPasswordValidator } from '../../validators/confirm-password.validator';
import { AUTH_ROUTES } from '../../constants/auth.constants';

/**
 * Two-step password reset flow (email -> OTP + new password), rendered as ONE
 * component so state carries cleanly between steps. Used in two hosts:
 *  1. ForgotPasswordPage — inside the auth card.
 *  2. Settings modal — guest guard redirects logged-in users away from
 *     /forgot-password, so Settings embeds this same component with the
 *     current user's email pre-filled.
 * Field styling is self-contained (no .auth-layout dependency) so it looks
 * identical in both the luxury auth card and the app-shell modal.
 */
@Component({
  selector: 'app-forgot-password-flow',
  standalone: true,
  imports: [ReactiveFormsModule, OtpInputComponent, SubmitButtonComponent, ValidationMessagesComponent],
  template: `
    <div class="flow">
      @if (step() === 'email') {
        <div class="flow__step">
          @if (apiError()) {
            <div class="alert alert-danger d-flex align-items-start py-2 px-3" role="alert">
              <i class="bi bi-exclamation-circle me-2 mt-1"></i>
              <div>{{ apiError() }}</div>
            </div>
          }
          <form [formGroup]="emailForm" (ngSubmit)="onEmailSubmit()" novalidate>
            <div class="flow-field" [class.flow-field--filled]="emailControl.value.length > 0">
              <input
                id="flowEmail"
                type="email"
                class="flow-field__input"
                [class.is-invalid]="emailControl.invalid && (emailControl.dirty || emailControl.touched)"
                formControlName="email"
                placeholder="you@gmail.com"
                autocomplete="email"
              />
              <label class="flow-field__label" for="flowEmail">Email address</label>
            </div>
            <app-validation-messages [control]="emailControl" />
            <app-submit-button
              label="Send Reset Code"
              icon="bi-envelope-check"
              [loading]="submitting()"
              [disabled]="emailForm.invalid"
            />
          </form>
          <a class="flow__back" (click)="goToLogin()">
            <i class="bi bi-arrow-left me-1"></i>Back to Login
          </a>
        </div>
      } @else {
        <div class="flow__step">
          @if (apiError()) {
            <div class="alert alert-danger d-flex align-items-start py-2 px-3" role="alert">
              <i class="bi bi-exclamation-circle me-2 mt-1"></i>
              <div>{{ apiError() }}</div>
            </div>
          }
          <p class="flow__hint">
            Enter the 6-digit code sent to
            <strong class="flow__hint-email">{{ emailControl.value }}</strong> and set a new password.
          </p>
          <form [formGroup]="resetForm" (ngSubmit)="onResetSubmit()" novalidate>
            <div class="mb-2">
              <label class="flow-label" for="flowOtp">Verification code</label>
              <app-otp-input formControlName="otp" />
              <app-validation-messages [control]="otpControl" />
              <div class="flow__resend mt-3 text-center">
                @if (cooldown() > 0) {
                  <span class="flow__resend-wait">Resend code in {{ cooldown() }}s</span>
                } @else {
                  <button type="button" class="flow__resend-btn" (click)="onResend()" [disabled]="submitting()">
                    Resend code
                  </button>
                }
              </div>
            </div>

            <div class="flow-field mt-2" [class.flow-field--filled]="newPasswordControl.value.length > 0">
              <input
                id="flowNewPassword"
                type="password"
                class="flow-field__input"
                [class.is-invalid]="newPasswordControl.invalid && (newPasswordControl.dirty || newPasswordControl.touched)"
                formControlName="newPassword"
                placeholder="New password"
                autocomplete="new-password"
              />
              <label class="flow-field__label" for="flowNewPassword">New password</label>
            </div>
            <app-validation-messages [control]="newPasswordControl" />

            <div class="flow-field" [class.flow-field--filled]="confirmPasswordControl.value.length > 0">
              <input
                id="flowConfirmPassword"
                type="password"
                class="flow-field__input"
                [class.is-invalid]="confirmPasswordControl.invalid && (confirmPasswordControl.dirty || confirmPasswordControl.touched)"
                formControlName="confirmPassword"
                placeholder="Repeat new password"
                autocomplete="new-password"
              />
              <label class="flow-field__label" for="flowConfirmPassword">Confirm new password</label>
            </div>
            <app-validation-messages [control]="confirmPasswordControl" />

            <app-submit-button
              label="Reset Password"
              icon="bi-shield-check"
              [loading]="submitting()"
              [disabled]="resetForm.invalid"
            />
          </form>
          <a class="flow__back" (click)="backToEmail()">
            <i class="bi bi-arrow-left me-1"></i>Change email
          </a>
        </div>
      }
    </div>
  `,
  styleUrl: './forgot-password-flow.component.scss',
})
export class ForgotPasswordFlowComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthenticationService);

  /** Pre-fills step 1 when embedded (e.g. Settings "Reset Password" modal). */
  readonly initialEmail = input<string>('');

  readonly step = signal<'email' | 'reset'>('email');
  readonly apiError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly cooldown = signal(0);

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [emailValidator]],
  });

  readonly resetForm = this.fb.nonNullable.group({
    otp: ['', [otpValidator]],
    newPassword: ['', [passwordValidator]],
    confirmPassword: ['', [confirmPasswordValidator('newPassword')]],
  });

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  get emailControl() {
    return this.emailForm.controls.email;
  }

  get otpControl() {
    return this.resetForm.controls.otp;
  }

  get newPasswordControl() {
    return this.resetForm.controls.newPassword;
  }

  get confirmPasswordControl() {
    return this.resetForm.controls.confirmPassword;
  }

  constructor() {
    // Re-check the confirm-password mismatch whenever the new password changes.
    this.resetForm.controls.newPassword.valueChanges.subscribe(() => {
      this.resetForm.controls.confirmPassword.updateValueAndValidity();
    });
    // Pre-fill step 1 with the host-provided email (Settings modal). Runs after
    // input binding, and only patches while the field is still untouched.
    effect(() => {
      const email = this.initialEmail();
      if (email && this.step() === 'email' && this.emailControl.value.length === 0) {
        this.emailControl.setValue(email);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCooldown();
  }

  onEmailSubmit(): void {
    this.apiError.set(null);
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.requestResetCode();
  }

  private requestResetCode(): void {
    this.submitting.set(true);
    this.authService.forgotPassword({ email: this.emailControl.value.trim() }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.apiError.set(null);
        this.step.set('reset');
      },
      error: (err: { message?: string }) => {
        this.submitting.set(false);
        this.apiError.set(err.message ?? 'Could not send reset code');
      },
    });
  }

  onResend(): void {
    this.apiError.set(null);
    this.requestResetCode();
    this.startCooldown(30);
  }

  onResetSubmit(): void {
    this.apiError.set(null);
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const { otp, newPassword, confirmPassword } = this.resetForm.getRawValue();
    this.submitting.set(true);
    this.authService
      .resetPassword({
        email: this.emailControl.value.trim(),
        otp,
        newPassword,
        confirmPassword,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigate([AUTH_ROUTES.LOGIN]);
        },
        error: (err: { message?: string }) => {
          this.submitting.set(false);
          // Keep the form filled so the user can retry the OTP without
          // re-entering the new password.
          this.apiError.set(err.message ?? 'Could not reset password');
        },
      });
  }

  backToEmail(): void {
    this.apiError.set(null);
    this.step.set('email');
  }

  goToLogin(): void {
    void this.router.navigate([AUTH_ROUTES.LOGIN]);
  }

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
