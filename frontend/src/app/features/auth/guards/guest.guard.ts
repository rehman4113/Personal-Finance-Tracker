import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { AUTH_ROUTES } from '../constants/auth.constants';

/**
 * GuestGuard — Section 17 implementation.
 * WHY: Blocks authenticated users from auth pages (login/register);
 * redirects them to the home route instead.
 */
export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.createUrlTree([AUTH_ROUTES.HOME]);
  }
  return true;
};
