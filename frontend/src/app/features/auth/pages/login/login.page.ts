import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormHeaderComponent } from '../../../../shared/components/form-header/form-header.component';
import { SubmitButtonComponent } from '../../../../shared/components/submit-button/submit-button.component';
import { ValidationMessagesComponent } from '../../../../shared/components/validation-messages/validation-messages.component';
import { PasswordInputComponent } from '../../components/password-input/password-input.component';
import { AuthenticationService } from '../../services/authentication.service';
import { emailValidator } from '../../validators/auth.validators';
import { AUTH_ROUTES, AUTH_STORAGE_KEYS } from '../../constants/auth.constants';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FormHeaderComponent,
    SubmitButtonComponent,
    ValidationMessagesComponent,
    PasswordInputComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly routes = AUTH_ROUTES;
  readonly apiError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [emailValidator]],
    // Login validates the password is non-empty only — no min-length/complexity
    // rules here (those belong to Register per §26.1.4).
    password: ['', [Validators.required]],
    rememberMe: [localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER_ME) === 'true'],
  });

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  onSubmit(): void {
    this.apiError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();

    this.authService.login({ email: email.trim(), password }, rememberMe).subscribe({
      next: () => this.authService.navigateAfterLogin(),
      error: (err: { message?: string }) => {
        this.apiError.set(err.message ?? 'Login failed');
      },
    });
  }
}
