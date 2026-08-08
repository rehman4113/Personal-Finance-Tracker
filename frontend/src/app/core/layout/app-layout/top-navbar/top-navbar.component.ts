import { Component, computed, inject, signal, AfterViewInit, ElementRef, OnDestroy, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { AuthenticationService } from '../../../../features/auth/services/authentication.service';
import { TransactionService } from '../../../../features/transaction/services/transaction.service';
import { FINANCE_ROUTES } from '../../../constants/finance-routes.constants';
import { AUTH_ROUTES } from '../../../../features/auth/constants/auth.constants';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownTriggerDirective } from '../../../../shared/components/dropdown/dropdown-trigger.directive';
import { APP_CONFIG } from '../../../config/app.config';
import { PROFILE_AVATARS } from '../../../../features/settings/config/profile-icons.config';
import { NAV_MENU, NavItem } from '../../../config/menu.config';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Top navbar — owns the primary navigation (the old sidebar menu), theme switch,
 * budget alert bell and the user profile dropdown (Settings / Logout).
 * Desktop/tablet render the nav inline as icon-only pills with tooltips;
 * mobile hides the row entirely (phones get the bottom nav bar instead).
 */
@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    DropdownComponent,
    DropdownTriggerDirective,
  ],
  template: `
    <header class="top-navbar">
      <!-- Primary nav (sidebar replaced) — icon-only row, hidden on phones -->
      <nav class="top-navbar__nav" #topNavHost aria-label="Primary navigation">
        <span
          class="top-navbar__indicator"
          aria-hidden="true"
          [style.top.px]="indicator().top"
          [style.left.px]="indicator().left"
          [style.width.px]="indicator().width"
          [style.height.px]="indicator().height"
        ></span>
        @for (item of nav; track item.label) {
          @if (item.children?.length) {
            <app-dropdown>
              <button
                type="button"
                class="top-navbar__nav-item top-navbar__nav-item--parent"
                [class.top-navbar__nav-item--active]="isItemActive(item)"
                [attr.title]="item.label"
                [attr.aria-label]="item.label"
                pfmDropdownTrigger
              >
                <i [class]="'bi ' + item.icon" aria-hidden="true"></i>
                <span class="top-navbar__nav-label">{{ item.label }}</span>
                <i class="bi bi-chevron-down top-navbar__nav-caret" aria-hidden="true"></i>
              </button>
              <div pfmDropdownMenu class="top-navbar__nav-menu" role="menu">
                @for (child of item.children; track child.label) {
                  <a
                    class="top-navbar__nav-menu-item"
                    role="menuitem"
                    [routerLink]="child.route"
                    routerLinkActive="top-navbar__nav-menu-item--active"
                  >
                    <i [class]="'bi ' + child.icon" aria-hidden="true"></i>
                    <span class="top-navbar__nav-label">{{ child.label }}</span>
                  </a>
                }
              </div>
            </app-dropdown>
          } @else {
            <a
              class="top-navbar__nav-item"
              [routerLink]="item.route"
              routerLinkActive="top-navbar__nav-item--active"
              [routerLinkActiveOptions]="{ exact: item.route === FINANCE_ROUTES.DASHBOARD }"
              [attr.title]="item.label"
              [attr.aria-label]="item.label"
            >
              <i [class]="'bi ' + item.icon" aria-hidden="true"></i>
              <span class="top-navbar__nav-label">{{ item.label }}</span>
            </a>
          }
        }
      </nav>

      <div class="top-navbar__right">
        <button
          type="button"
          class="top-navbar__icon"
          [attr.aria-label]="theme.current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          [title]="theme.current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          (click)="theme.toggle()"
        >
          @if (theme.current() === 'dark') {
            <i class="bi bi-sun" aria-hidden="true"></i>
          } @else {
            <i class="bi bi-moon-stars" aria-hidden="true"></i>
          }
        </button>

        <button
          type="button"
          class="top-navbar__icon"
          aria-label="Budget alerts"
          title="Budget alerts"
          (click)="goToBudgets()"
        >
          <i class="bi bi-bell" aria-hidden="true"></i>
          @if (alertCount() > 0) {
            <span class="top-navbar__badge" [class]="'top-navbar__badge--' + alertTone()">{{ alertCount() }}</span>
          }
        </button>

        <app-dropdown [backdrop]="true">
          <button type="button" class="top-navbar__user" pfmDropdownTrigger aria-label="Open profile menu">
            @if (user()) {
              @if (pictureUrl()) {
                <img class="top-navbar__avatar top-navbar__avatar--img" [src]="pictureUrl()" alt="Profile picture" />
              } @else {
                <span class="top-navbar__avatar">{{ initials() }}</span>
              }
              <span class="top-navbar__user-name">{{ user()?.firstName }} {{ user()?.lastName }}</span>
              <i class="bi bi-caret-down-fill top-navbar__caret"></i>
            } @else {
              <!-- Profile block has no content yet — shimmer skeleton matching
                   the avatar + name/email shapes so nothing "pops in". -->
              <span class="top-navbar__profile-skeleton" aria-hidden="true">
                <span class="pfm-skeleton top-navbar__avatar-skeleton"></span>
                <span class="top-navbar__skeleton-lines">
                  <span class="pfm-skeleton pfm-skeleton--text top-navbar__skeleton-line top-navbar__skeleton-line--name"></span>
                  <span class="pfm-skeleton pfm-skeleton--text top-navbar__skeleton-line top-navbar__skeleton-line--email"></span>
                </span>
              </span>
            }
          </button>

          <div pfmDropdownMenu class="top-navbar__menu" role="menu">
            @if (user()) {
              <div class="top-navbar__menu-header">
                <div class="top-navbar__menu-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
                <div class="top-navbar__menu-email">{{ user()?.email }}</div>
              </div>
              <button
                type="button"
                class="top-navbar__menu-item"
                role="menuitem"
                (click)="goToSettings()"
              >
                <i class="bi bi-gear me-2" aria-hidden="true"></i>Settings
              </button>
              <div class="top-navbar__menu-divider" role="separator"></div>
              <button
                type="button"
                class="top-navbar__menu-item top-navbar__menu-item--danger"
                role="menuitem"
                (click)="onLogout()"
              >
                <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Logout
              </button>
            }
          </div>
        </app-dropdown>
      </div>

    </header>
  `,
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent implements AfterViewInit, OnDestroy {
  readonly theme = inject(ThemeService);
  private readonly authService = inject(AuthenticationService);
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);

  readonly nav: NavItem[] = NAV_MENU;
  readonly FINANCE_ROUTES = FINANCE_ROUTES;

  /* --- Magnetic active pill (exact same behaviour as the old sidebar) --- */
  readonly navHost = viewChild<ElementRef<HTMLElement>>('topNavHost');
  readonly indicator = signal({ top: 0, left: 0, width: 0, height: 0 });
  private navResizeObserver?: ResizeObserver;

  readonly user = this.authService.currentUser;
  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  /** Picture wins, then curated avatar, then native initials rendering. */
  readonly pictureUrl = computed(() => {
    const u = this.user();
    if (u?.profilePictureUrl) return `${APP_CONFIG.apiBaseUrl}${u.profilePictureUrl}`;
    if (u?.profileIconId) return PROFILE_AVATARS.find((a) => a.id === u.profileIconId)?.assetPath ?? null;
    return null;
  });

  /* --- Live budget alert badge (bell) --- */

  private readonly monthBudgets = computed(() =>
    (this.transactionService.budgets() ?? []).filter((b) => b.month === currentMonth()),
  );

  readonly alertCount = computed(
    () => this.monthBudgets().filter((b) => b.alertLevel === 'WARNING' || b.alertLevel === 'EXCEEDED').length,
  );

  readonly alertTone = computed(() => {
    const exceeded = this.monthBudgets().filter((b) => b.alertLevel === 'EXCEEDED').length;
    return exceeded > 0 ? 'danger' : 'warning';
  });

  private readonly navSubscription: Subscription;

  constructor() {
    // Re-measure the active pill after every navigation so it slides to the
    // current route's icon, mirroring the old sidebar's magnetic indicator.
    this.navSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.measureActivePill();
    });
  }

  ngAfterViewInit(): void {
    const host = this.navHost()?.nativeElement;
    if (!host) return;
    this.measureActivePill();
    this.navResizeObserver = new ResizeObserver(() => this.measureActivePill());
    this.navResizeObserver.observe(host);
  }

  /** True when the route is the item's route or any descendant — keeps the
   *  parent pill lit while a child (e.g. Add Transaction) is open, exactly
   *  like the old sidebar groups. */
  isItemActive(item: NavItem): boolean {
    if (item.children?.length) return item.children.some((child) => (child.route ? this.isRouteActive(child.route) : false));
    return item.route ? this.isRouteActive(item.route) : false;
  }

  private isRouteActive(route: string): boolean {
    const url = this.router.url;
    return url === route || url.startsWith(route + '/');
  }

  private measureActivePill(): void {
    const host = this.navHost()?.nativeElement;
    if (!host) return;
    const active = host.querySelector<HTMLElement>('.top-navbar__nav-item--active');
    if (!active) {
      this.indicator.set({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }
    const hostRect = host.getBoundingClientRect();
    const itemRect = active.getBoundingClientRect();
    this.indicator.set({
      top: itemRect.top - hostRect.top,
      left: itemRect.left - hostRect.left,
      width: itemRect.width,
      height: itemRect.height,
    });
  }

  ngOnDestroy(): void {
    this.navResizeObserver?.disconnect();
    this.navSubscription.unsubscribe();
  }

  goToBudgets(): void {
    void this.router.navigate([FINANCE_ROUTES.BUDGETS]);
  }

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