import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { LayoutService } from '../../services/layout.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopNavbarComponent } from './top-navbar/top-navbar.component';
import { routeTransition } from '../../../shared/animations/route.animations';
import { MotionState } from '../../../shared/services/motion-state.service';

/**
 * Finance application shell (Section 7) — top navbar + collapsible left sidebar
 * + router-outlet. WHY: it is the post-login counterpart of AuthLayout; mounted
 * once by the finance shell route, never re-created when navigating children.
 * Presentation pass: route transitions animate page changes (respects
 * prefers-reduced-motion via [@.disabled]).
 */
@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopNavbarComponent],
  animations: [routeTransition],
  template: `
    <div class="app-shell" [class.app-shell--collapsed]="layoutService.collapsed()">
      <app-sidebar />
      <div class="app-shell__main">
        <app-top-navbar />
        <main class="app-shell__content">
          <div
            class="app-shell__route"
            [@routeTransition]="outlet.activatedRouteData['animation'] ?? outletUrl()"
            [@.disabled]="motion.reduced()"
          >
            <router-outlet #outlet="outlet" />
          </div>
        </main>
      </div>
    </div>
  `,
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  readonly layoutService = inject(LayoutService);
  readonly motion = inject(MotionState);
  private readonly router = inject(Router);

  private readonly mobileQuery = window.matchMedia('(max-width: 767.98px)');
  private navSubscription: Subscription | null = null;
  private readonly onMediaChange = (ev: MediaQueryListEvent): void => {
    this.layoutService.setMobile(ev.matches);
  };

  private readonly onNavigationEnd = (): void => {
    this.layoutService.closeMobile();
  };

  outletUrl(): string {
    return this.router.url;
  }

  ngOnInit(): void {
    this.layoutService.setMobile(this.mobileQuery.matches);
    this.mobileQuery.addEventListener('change', this.onMediaChange);
    this.navSubscription = this.router.events.subscribe(this.onNavigationEnd);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('change', this.onMediaChange);
    this.navSubscription?.unsubscribe();
  }
}