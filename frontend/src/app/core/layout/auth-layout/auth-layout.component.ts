import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthIllustrationPanelComponent } from '../../../shared/components/auth-illustration-panel/auth-illustration-panel.component';
import { routeTransition } from '../../../shared/animations/route.animations';
import { MotionState } from '../../../shared/services/motion-state.service';

/**
 * Full-screen background + floating card auth shell (per §27):
 * the illustration panel covers the whole viewport (fixed) and the
 * login/register card floats centered on top. Pages only fill the
 * router-outlet. Presentation pass: glassmorphism card + smooth
 * login/register route transitions (respects reduced-motion).
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, AuthIllustrationPanelComponent],
  animations: [routeTransition],
  template: `
    <div class="auth-layout">
      <app-auth-illustration-panel class="auth-layout__background" />
      <div class="auth-layout__center">
        <div class="auth-layout__card pfm-glass">
          <div class="auth-layout__brand">
            <i class="bi bi-wallet2"></i>
            <span>Personal Finance</span>
          </div>
          <div
            class="auth-layout__content"
            [@routeTransition]="router.url"
            [@.disabled]="motion.reduced()"
          >
            <router-outlet />
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly router = inject(Router);
  readonly motion = inject(MotionState);
}
