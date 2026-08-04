import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutService } from '../../../services/layout.service';
import { NAV_MENU } from '../../../config/menu.config';
import { SidebarItemComponent } from './sidebar-item.component';
import { FINANCE_ROUTES } from '../../../constants/finance-routes.constants';

/**
 * Collapsible left sidebar (Section 7–8).
 * WHY: config-driven menu rendered recursively; collapse hides text and closes
 * submenus; on mobile the whole drawer slides off-canvas behind a backdrop.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, SidebarItemComponent],
  template: `
    <aside
      class="sidebar"
      [class.sidebar--collapsed]="layoutService.collapsed()"
      [class.sidebar--mobile-open]="layoutService.mobileOpen()"
    >
      <div class="sidebar__brand">
        <a routerLink="/dashboard" class="sidebar__brand-link">
          <span class="sidebar__brand-icon"><i class="bi bi-wallet2"></i></span>
          @if (!layoutService.collapsed()) {
            <span class="sidebar__brand-name">Personal Finance</span>
          }
        </a>
      </div>
      <nav class="sidebar__nav">
        @for (item of appNav; track item.label) {
          <app-sidebar-item [item]="item" [collapsed]="layoutService.collapsed()" />
        }
      </nav>
    </aside>
    <div class="sidebar__backdrop" (click)="layoutService.closeMobile()"></div>
  `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly layoutService = inject(LayoutService);
  readonly appNav = NAV_MENU;
  readonly routes = FINANCE_ROUTES;
}