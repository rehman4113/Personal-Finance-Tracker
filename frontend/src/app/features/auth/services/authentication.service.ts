import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app.config';
import { User } from '../../../core/models/user.model';
import { TokenInfo } from '../../../core/models/token-info.model';
import { ToastService } from '../../../core/services/toast.service';
import { AUTH_API } from '../api/auth.api';
import { LoginRequest } from '../dto/request/login-request.dto';
import { RegisterRequest } from '../dto/request/register-request.dto';
import { RefreshTokenRequest } from '../dto/request/refresh-token-request.dto';
import { LoginResponse, LoginResponseData } from '../dto/response/login-response.dto';
import { RegisterResponse } from '../dto/response/register-response.dto';
import { RefreshTokenResponse, RefreshTokenResponseData } from '../dto/response/refresh-token-response.dto';
import { LogoutResponse } from '../dto/response/logout-response.dto';
import { ApiResponse } from '../dto/response/api-response.dto';
import { AUTH_ROUTES, AUTH_STORAGE_KEYS } from '../constants/auth.constants';
import { isTokenExpired } from '../utils/token.utils';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly baseUrl = APP_CONFIG.apiBaseUrl;

  private readonly _currentUser = signal<User | null>(this.loadStoredUser());
  private readonly _isLoading = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this.isLoggedIn());

  login(request: LoginRequest, rememberMe = false): Observable<LoginResponse> {
    this._isLoading.set(true);
    return this.http.post<LoginResponse>(`${this.baseUrl}${AUTH_API.LOGIN}`, request).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.persistSession(response.data, rememberMe);
          this.toast.success(response.message || 'Login successful');
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._isLoading.set(false)),
    );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    this._isLoading.set(true);
    return this.http.post<RegisterResponse>(`${this.baseUrl}${AUTH_API.REGISTER}`, request).pipe(
      tap((response) => {
        if (response.success) {
          this.toast.success(response.message || 'Registration successful');
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._isLoading.set(false)),
    );
  }

  /**
   * Exchanges a refresh token for a new token pair (rotation).
   * NOTE: errors are NOT toasted here — the interceptor owns the 401-refresh flow.
   */
  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<RefreshTokenResponse>(`${this.baseUrl}${AUTH_API.REFRESH}`, request);
  }

  /**
   * Revokes the refresh token on the backend (Authorization: Bearer <refreshToken>)
   * then clears local session state.
   */
  logout(): Observable<LogoutResponse> {
    const refreshToken = this.getRefreshToken();
    const headers = refreshToken
      ? { Authorization: `Bearer ${refreshToken}` }
      : undefined;
    return this.http
      .post<LogoutResponse>(`${this.baseUrl}${AUTH_API.LOGOUT}`, null, { headers })
      .pipe(
        tap(() => {
          this.clearTokens();
          this.toast.success('Logged out successfully');
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.clearTokens()),
      );
  }

  storeTokens(tokenInfo: TokenInfo, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokenInfo.accessToken);
    storage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokenInfo.refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_ME, String(rememberMe));
  }

  clearTokens(): void {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
      storage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    });
    localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER_ME);
    this._currentUser.set(null);
  }

  getCurrentUser(): User | null {
    return this._currentUser();
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    return !isTokenExpired(token, APP_CONFIG.tokenRefreshMarginSeconds);
  }

  getAccessToken(): string | null {
    return (
      localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN) ??
      sessionStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)
    );
  }

  getRefreshToken(): string | null {
    return (
      localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN) ??
      sessionStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
    );
  }

  /**
   * Persists a refreshed token pair after a successful 401-refresh flow.
   * Reuses the same storage location (localStorage vs sessionStorage) as the
   * original session ("remember me" choice).
   */
  storeRefreshedTokens(data: RefreshTokenResponseData): void {
    const tokenInfo: TokenInfo = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenType: data.tokenType,
      expiresIn: data.expiresIn,
      expiresAt: new Date(Date.now() + data.expiresIn * 1000),
    };
    const rememberMe = localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER_ME) === 'true';
    this.storeTokens(tokenInfo, rememberMe);
  }

  navigateAfterLogin(): void {
    this.router.navigate([AUTH_ROUTES.HOME]);
  }

  private persistSession(data: LoginResponseData, rememberMe: boolean): void {
    const tokenInfo: TokenInfo = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenType: data.tokenType,
      expiresIn: data.expiresIn,
      expiresAt: new Date(Date.now() + data.expiresIn * 1000),
    };
    const user: User = { ...data.user };
    this.storeTokens(tokenInfo, rememberMe);
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  /**
   * Maps any HTTP failure to a common shape consumed by pages:
   * { message, code, status }. Backend ApiResponse.message is preferred,
   * with a friendly fallback for network/offline errors.
   */
  private handleError(error: unknown): Observable<never> {
    let message = 'Something went wrong. Please try again.';
    let code: string | null = null;
    let status = 0;

    if (error instanceof HttpErrorResponse) {
      status = error.status;
      const body = error.error as Partial<ApiResponse<unknown>> | null;
      if (body?.message) message = body.message;
      if (body?.code) code = body.code;
      if (status === 0) message = 'Cannot reach server. Check your connection.';
      if (status === 401 && code === 'AUTH-401-001') message = 'Invalid email or password';
      if (status === 401 && (code === 'AUTH-401-002' || code === 'AUTH-401-003')) {
        message = 'Your session has expired. Please sign in again.';
      }
      if (status === 409 && code === 'AUTH-409-001') message = 'This email is already registered';
    }

    this.toast.error(message);
    return throwError(() => ({ message, code, status, error }));
  }
}
