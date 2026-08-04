import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutService } from '../../../services/layout.service';
import { AuthenticationService } from '../../../../features/auth/services/authentication.service';
import { AUTH_ROUTES } from '../../../../features/auth/constants/auth.constants';
import { FINANCE_ROUTES } from '../../../constants/finance-routes.constants';
import { DropdownComponent, DropdownTriggerDirective } from '../../../../shared/components/dropdown';

/**
 * Top navbar — collapse toggle, user menu, logout (Section 7).
 * WHY: shares layout state through LayoutService; user identity from the
 * existing AuthenticationService — no duplicate session logic.
 */
@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [DropdownComponent, DropdownTriggerDirective],
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
        <app-dropdown>
          <button type="button" pfmDropdownTrigger class="top-navbar__user">
            <span class="top-navbar__avatar">{{ initials() }}</span>
            <span class="top-navbar__user-text">
              <span class="top-navbar__user-name">{{ user()?.firstName }} {{ user()?.lastName }}</span>
              <span class="top-navbar__user-email">{{ user()?.email }}</span>
            </span>
            <i class="bi bi-chevron-down top-navbar__caret"></i>
          </button>
          <div pfmDropdownMenu class="top-navbar__menu">
            <div class="top-navbar__menu-header">
              <div class="top-navbar__menu-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
              <div class="top-navbar__menu-email">{{ user()?.email }}</div>
            </div>
            <button type="button" class="top-navbar__menu-item" (click)="goToSettings()">
              <i class="bi bi-gear me-2"></i>Settings
            </button>
            <button type="button" class="top-navbar__menu-item top-navbar__menu-item--danger" (click)="onLogout()">
              <i class="bi bi-box-arrow-right me-2"></i>Logout
            </button>
          </div>
        </app-dropdown>
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

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
      error: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
    });
  }
}