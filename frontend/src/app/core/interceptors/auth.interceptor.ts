import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthenticationService } from '../../features/auth/services/authentication.service';
import { AUTH_API, AUTH_PUBLIC_ENDPOINTS } from '../../features/auth/api/auth.api';
import { AUTH_ROUTES } from '../../features/auth/constants/auth.constants';

/**
 * JWT HTTP interceptor — Section 16 implementation.
 * WHY: App-wide token handling lives in one place so features never deal with headers.
 *
 * Behavior:
 * - Attach `Authorization: Bearer <accessToken>` to every protected request.
 * - Skip public auth endpoints (/login, /register, /refresh).
 * - Logout sends the REFRESH token (backend contract: Authorization: Bearer <refreshToken>).
 * - On 401 (non-public): single-flight refresh (concurrent 401s share one call),
 *   retry the original request once with the new token; on refresh failure
 *   sign out locally and redirect to /login. The refresh request itself is never retried.
 */

/** True while a refresh request is in flight (single-flight guard). */
let isRefreshing = false;
/** Shared refresh result so concurrent 401s wait on the same request. */
let refreshResult$: Observable<boolean> | null = null;

function isPublicRequest(url: string): boolean {
  return AUTH_PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function isLogoutRequest(url: string): boolean {
  return url.includes(AUTH_API.LOGOUT);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  let authReq: HttpRequest<unknown> = req;

  if (isLogoutRequest(req.url)) {
    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${refreshToken}` } });
    }
  } else if (!isPublicRequest(req.url)) {
    const accessToken = authService.getAccessToken();
    if (accessToken) {
      authReq = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicRequest(req.url)) {
        return handleUnauthorized(authService, router, authReq, next);
      }
      return throwError(() => error);
    }),
  );
};

function handleUnauthorized(
  authService: AuthenticationService,
  router: Router,
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) {
      forceSignOut(authService, router);
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Session expired' }));
    }

    isRefreshing = true;
    refreshResult$ = authService.refreshToken(refreshToken).pipe(
      map((response) => {
        if (response.success && response.data) {
          authService.storeRefreshedTokens(response.data);
          return true;
        }
        return false;
      }),
      catchError(() => {
        forceSignOut(authService, router);
        return of(false);
      }),
      shareReplay(1),
    );
  }

  return refreshResult$!.pipe(
    switchMap((refreshed) => {
      isRefreshing = false;
      if (!refreshed) {
        return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Session expired' }));
      }
      const accessToken = authService.getAccessToken();
      const retryRequest = accessToken
        ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
        : request;
      return next(retryRequest);
    }),
  );
}

function forceSignOut(authService: AuthenticationService, router: Router): void {
  isRefreshing = false;
  refreshResult$ = null;
  authService.clearTokens();
  void router.navigateByUrl(AUTH_ROUTES.LOGIN);
}
