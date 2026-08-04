import { Component, effect, HostBinding, inject } from '@angular/core';
import { MotionState } from '../../services/motion-state.service';

/**
 * Decorative finance-themed FULL-SCREEN background (per §27.1.1).
 * WHY: generic (not login/register-specific), so both auth pages share one
 * component. Pure presentation — no inputs, no interactivity. Decorative
 * elements are scattered so they peek out around the floating card; they
 * are hidden below 768px so the card stays the clear focus.
 * UI polish pass: gentle mouse parallax on the glow-blobs and floating
 * icon tiles (desktop only, plain CSS transforms via custom properties),
 * and the bar-chart illustration animates growing up on load (staggered).
 */
@Component({
  selector: 'app-auth-illustration-panel',
  standalone: true,
  template: `
    <div class="auth-illustration">
      <div class="auth-illustration__blob auth-illustration__blob--one" aria-hidden="true"></div>
      <div class="auth-illustration__blob auth-illustration__blob--two" aria-hidden="true"></div>

      <div class="auth-illustration__tiles" aria-hidden="true">
        <span class="auth-illustration__tile auth-illustration__tile--solid">
          <i class="bi bi-wallet2"></i>
        </span>
        <span class="auth-illustration__tile auth-illustration__tile--accent">
          <i class="bi bi-graph-up-arrow"></i>
        </span>
        <span class="auth-illustration__tile auth-illustration__tile--solid">
          <i class="bi bi-coin"></i>
        </span>
        <span class="auth-illustration__tile auth-illustration__tile--light">
          <i class="bi bi-credit-card"></i>
        </span>
      </div>

      <div class="auth-illustration__chart" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div class="auth-illustration__headline">
        <h2 class="auth-illustration__title">Take control of your finances</h2>
        <p class="auth-illustration__subtitle">
          Track expenses, set budgets, and grow your savings — all in one place.
        </p>
      </div>
    </div>
  `,
  styleUrl: './auth-illustration-panel.component.scss',
})
export class AuthIllustrationPanelComponent {
  private readonly motion = inject(MotionState);

  /** Mouse position, normalized to ±14px — layers consume it at different depths. */
  @HostBinding('style.--pfm-par-x') parX = '0px';
  @HostBinding('style.--pfm-par-y') parY = '0px';

  constructor() {
    const onMove = (e: MouseEvent): void => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      this.parX = `${(nx * 14).toFixed(2)}px`;
      this.parY = `${(ny * 14).toFixed(2)}px`;
    };

    effect(() => {
      if (this.motion.desktopPointer() && !this.motion.reduced()) {
        window.addEventListener('mousemove', onMove, { passive: true });
      } else {
        window.removeEventListener('mousemove', onMove);
        this.parX = '0px';
        this.parY = '0px';
      }
    });
  }
}
