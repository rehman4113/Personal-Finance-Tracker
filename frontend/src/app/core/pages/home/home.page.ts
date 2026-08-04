import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../features/auth/services/authentication.service';
import { AUTH_ROUTES } from '../../../features/auth/constants/auth.constants';

/**
 * Home stub route — Section 8 / §17.
 * WHY: Gives AuthGuard/GuestGuard a concrete authenticated destination while the
 * Finance module is out of scope. Will be replaced by the finance dashboard later.
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  template: `
    <div class="home-stub">
      <div class="home-stub__card">
        <div class="home-stub__icon mb-3">
          <i class="bi bi-person-check"></i>
        </div>
        <h1 class="h3 mb-1">Welcome, {{ user()?.firstName }}</h1>
        <p class="text-muted mb-4">{{ user()?.email }}</p>
        <button class="btn btn-outline-primary btn-lg w-100" (click)="onLogout()">
          <i class="bi bi-box-arrow-left me-2"></i>Logout
        </button>
      </div>
    </div>
  `,
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly user = this.authService.currentUser;

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
      error: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
    });
  }
}
