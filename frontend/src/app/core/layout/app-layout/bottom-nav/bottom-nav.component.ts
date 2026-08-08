import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FINANCE_ROUTES } from '../../../constants/finance-routes.constants';

/**
 * Mobile bottom navigation bar (visible < 768px).
 * WHY: on phones the sidebar is an off-canvas drawer, so the 5 primary
 * destinations stay one thumb-tap away without opening the drawer.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav" aria-label="Primary navigation">
      @for (item of items; track item.route) {
        <a
          class="bottom-nav__item"
          [routerLink]="item.route"
          routerLinkActive="bottom-nav__item--active"
          [routerLinkActiveOptions]="{ exact: item.route === FINANCE_ROUTES.DASHBOARD }"
        >
          <i class="bi {{ item.icon }}" aria-hidden="true"></i>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  readonly items = [
    { label: 'Home', icon: 'bi-house-door', route: FINANCE_ROUTES.DASHBOARD },
    { label: 'Activity', icon: 'bi-list-ul', route: FINANCE_ROUTES.TRANSACTIONS },
    { label: 'Wallets', icon: 'bi-wallet', route: FINANCE_ROUTES.WALLETS },
    { label: 'Budgets', icon: 'bi-pie-chart', route: FINANCE_ROUTES.BUDGETS },
    { label: 'Loan Users', icon: 'bi-people', route: FINANCE_ROUTES.LOAN_USERS },
  ];

  readonly FINANCE_ROUTES = FINANCE_ROUTES;
}