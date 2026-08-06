import { Component } from '@angular/core';
import { FormHeaderComponent } from '../../../../shared/components/form-header/form-header.component';
import { ForgotPasswordFlowComponent } from '../../components/forgot-password-flow/forgot-password-flow.component';

/**
 * Forgot-password page — auth-card wrapper around the shared two-step flow.
 * Step state (email -> OTP + new password) lives inside the flow component.
 */
@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [FormHeaderComponent, ForgotPasswordFlowComponent],
  template: `
    <app-form-header
      title="Forgot Password?"
      subtitle="Enter your email and we'll send you a reset code"
      icon="bi-key"
    />
    <app-forgot-password-flow />
  `,
})
export class ForgotPasswordPage {}
