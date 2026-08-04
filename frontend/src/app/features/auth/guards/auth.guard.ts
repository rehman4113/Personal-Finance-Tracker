import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { AUTH_ROUTES } from '../constants/auth.constants';

/**
 * AuthGuard — Section 17 implementation.
 * WHY: Protects routes; blocks unauthenticated users and redirects to /login,
 * optionally preserving the intended destination as a `returnUrl` query param.
 */
export const authGuard: CanActivateFn = (route): boolean | UrlTree => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  const returnUrl = route.url.map((segment) => segment.path).join('/');
  const queryParams = returnUrl ? { returnUrl: `/${returnUrl}` } : {};
  return router.createUrlTree([AUTH_ROUTES.LOGIN], { queryParams });
};
