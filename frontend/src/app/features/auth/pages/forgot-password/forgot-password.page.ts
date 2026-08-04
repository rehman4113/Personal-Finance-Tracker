import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormHeaderComponent } from '../../../../shared/components/form-header/form-header.component';
import { AUTH_ROUTES } from '../../constants/auth.constants';

/**
 * Forgot-password placeholder — Section 8 / §8.
 * WHY: The task allows a link-only route; no backend API exists for password
 * reset, so this stub explains that clearly instead of 404ing.
 */
@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [RouterLink, FormHeaderComponent],
  template: `
    <app-form-header
      title="Forgot Password"
      subtitle="Password reset is not available in this module yet"
      icon="bi-key"
    />
    <div class="alert alert-info d-flex align-items-center" role="alert">
      <i class="bi bi-info-circle me-2"></i>
      <div>
        No backend API exists for password reset in the current scope.
        Please contact support.
      </div>
    </div>
    <a [routerLink]="routes.LOGIN" class="btn btn-outline-primary btn-lg w-100">
      <i class="bi bi-arrow-left me-2"></i>Back to Login
    </a>
  `,
})
export class ForgotPasswordPage {
  readonly routes = AUTH_ROUTES;
}
