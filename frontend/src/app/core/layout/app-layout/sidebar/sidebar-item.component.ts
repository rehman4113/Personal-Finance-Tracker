import { Component, inject, input, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../../config/menu.config';
import { AuthenticationService } from '../../../../features/auth/services/authentication.service';
import { AUTH_ROUTES } from '../../../../features/auth/constants/auth.constants';

/**
 * Recursive sidebar menu node (Section 8).
 * WHY: menu config supports arbitrary nesting; one component renders leaf links,
 * parent groups with expandable children, and the logout action.
 */
@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styleUrl: './sidebar-item.component.scss',
  template: `
    @if (item().children?.length) {
      <div class="nav-group">
        <button
          type="button"
          class="sidebar-link sidebar-link--parent"
          [class.sidebar-link--active]="hasActiveChild()"
          [attr.aria-expanded]="open()"
          (click)="toggleGroup()"
        >
          <i [class]="'bi ' + item().icon"></i>
          @if (!collapsed()) {
            <span class="sidebar-link__label">{{ item().label }}</span>
            <i class="bi bi-chevron-down sidebar-link__chevron" [class.rotated]="open()"></i>
          }
        </button>
        @if (!collapsed() && open()) {
          <div class="nav-group__children">
            @for (child of item().children; track child.label) {
              <app-sidebar-item [item]="child" [collapsed]="collapsed()" />
            }
          </div>
        }
      </div>
    } @else if (item().action === 'logout') {
      <button type="button" class="sidebar-link sidebar-link--logout" (click)="onLogout()">
        <i [class]="'bi ' + item().icon"></i>
        @if (!collapsed()) {
          <span class="sidebar-link__label">{{ item().label }}</span>
        }
      </button>
    } @else {
      <a
        class="sidebar-link"
        [routerLink]="item().route"
        routerLinkActive="sidebar-link--active"
        [routerLinkActiveOptions]="{ exact: item().route === '/' }"
      >
        <i [class]="'bi ' + item().icon"></i>
        @if (!collapsed()) {
          <span class="sidebar-link__label">{{ item().label }}</span>
        }
      </a>
    }
  `,
})
export class SidebarItemComponent implements OnInit {
  readonly item = input.required<NavItem>();
  readonly collapsed = input<boolean>(false);

  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly open = signal(false);

  ngOnInit(): void {
    if (this.hasActiveChild()) this.open.set(true);
  }

  /** True when the current URL sits under this group — highlights the parent. */
  hasActiveChild(): boolean {
    const url = this.router.url;
    return (this.item().children ?? []).some((child) => child.route && url.startsWith(child.route));
  }

  toggleGroup(): void {
    if (this.collapsed()) {
      this.open.set(true);
      return;
    }
    this.open.update((v) => !v);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
      error: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
    });
  }
}