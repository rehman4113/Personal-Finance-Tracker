import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TopNavbarComponent } from './top-navbar/top-navbar.component';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';
import { routeTransition } from '../../../shared/animations/route.animations';
import { MotionState } from '../../../shared/services/motion-state.service';

/**
 * Finance application shell (Section 7) — top navbar hosting the primary nav +
 * router-outlet + mobile bottom nav. WHY: it is the post-login counterpart of
 * AuthLayout; mounted once by the finance shell route, never re-created when
 * navigating children. The sidebar column was removed — nav lives in the
 * top bar (desktop inline, mobile hamburger menu), bottom nav on phones.
 */
@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, TopNavbarComponent, BottomNavComponent],
  animations: [routeTransition],
  template: `
    <div class="app-shell">
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
      <app-bottom-nav />
    </div>
  `,
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  constructor(
    public readonly motion: MotionState,
    private readonly router: Router,
  ) {}

  outletUrl(): string {
    return this.router.url;
  }
}