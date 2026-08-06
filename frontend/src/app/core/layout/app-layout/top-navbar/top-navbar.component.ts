import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutService } from '../../../services/layout.service';
import { AuthenticationService } from '../../../../features/auth/services/authentication.service';
import { FINANCE_ROUTES } from '../../../constants/finance-routes.constants';

/**
 * Top navbar — collapse toggle + user profile block.
 * The whole profile block navigates straight to Settings (which owns the
 * Logout action), per the sidebar/top-bar simplification.
 */
@Component({
  selector: 'app-top-navbar',
  standalone: true,
  template: `
    <header class="top-navbar">
      <div class="top-navbar__left">
        <button
          type="button"
          class="top-navbar__toggle"
          aria-label="Toggle sidebar"
          (click)="layoutService.toggle()"
        >
          <i class="bi bi-list"></i>
        </button>
      </div>

      <div class="top-navbar__right">
        <button type="button" class="top-navbar__user" (click)="goToSettings()" aria-label="Open settings">
          <span class="top-navbar__avatar">{{ initials() }}</span>
          <span class="top-navbar__user-text">
            <span class="top-navbar__user-name">{{ user()?.firstName }} {{ user()?.lastName }}</span>
            <span class="top-navbar__user-email">{{ user()?.email }}</span>
          </span>
          <i class="bi bi-chevron-right top-navbar__caret"></i>
        </button>
      </div>
    </header>
  `,
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent {
  readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly user = this.authService.currentUser;
  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  goToSettings(): void {
    void this.router.navigate([FINANCE_ROUTES.SETTINGS]);
  }
}
