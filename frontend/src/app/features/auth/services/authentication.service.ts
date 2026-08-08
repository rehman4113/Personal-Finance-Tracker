import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, finalize, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app.config';
import { User } from '../../../core/models/user.model';
import { TokenInfo } from '../../../core/models/token-info.model';
import { ToastService } from '../../../core/services/toast.service';
import { AUTH_API } from '../api/auth.api';
import { LoginRequest } from '../dto/request/login-request.dto';
import { RegisterRequest } from '../dto/request/register-request.dto';
import { RefreshTokenRequest } from '../dto/request/refresh-token-request.dto';
import { ForgotPasswordRequest } from '../dto/request/forgot-password-request.dto';
import { ResetPasswordRequest } from '../dto/request/reset-password-request.dto';
import { ResendOtpRequest } from '../dto/request/resend-otp-request.dto';
import { VerifyEmailRequest } from '../dto/request/verify-email-request.dto';
import { UpdateProfileRequest } from '../dto/request/update-profile-request.dto';
import { LoginResponse, LoginResponseData, LoginUserDto } from '../dto/response/login-response.dto';
import { RegisterResponse } from '../dto/response/register-response.dto';
import { ForgotPasswordResponse } from '../dto/response/forgot-password-response.dto';
import { ResetPasswordResponse } from '../dto/response/reset-password-response.dto';
import { ResendOtpResponse } from '../dto/response/resend-otp-response.dto';
import { VerifyEmailResponse } from '../dto/response/verify-email-response.dto';
import { RefreshTokenResponse, RefreshTokenResponseData } from '../dto/response/refresh-token-response.dto';
import { LogoutResponse } from '../dto/response/logout-response.dto';
import { ApiResponse } from '../dto/response/api-response.dto';
import { ProfileAvatarOption } from '../../settings/config/profile-icons.config';
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
   * Step 1 of the password reset flow — requests a reset OTP for an email.
   * Backend contract: throws USER_NOT_FOUND (404) for unknown emails.
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    this._isLoading.set(true);
    return this.http.post<ForgotPasswordResponse>(`${this.baseUrl}${AUTH_API.FORGOT_PASSWORD}`, request).pipe(
      tap((response) => {
        if (response.success) {
          this.toast.success(response.message || 'Reset code sent to your email');
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._isLoading.set(false)),
    );
  }

  /**
   * Step 2 of the password reset flow — verifies the OTP and sets a new password.
   */
  resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    this._isLoading.set(true);
    return this.http.post<ResetPasswordResponse>(`${this.baseUrl}${AUTH_API.RESET_PASSWORD}`, request).pipe(
      tap((response) => {
        if (response.success) {
          this.toast.success(response.message || 'Password reset successfully');
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._isLoading.set(false)),
    );
  }

  /**
   * Confirms an email address with its OTP (registration, or a changed
   * email address after updateProfile).
   */
  verifyEmail(request: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    this._isLoading.set(true);
    return this.http.post<VerifyEmailResponse>(`${this.baseUrl}${AUTH_API.VERIFY_EMAIL}`, request).pipe(
      tap((response) => {
        if (response.success) {
          this.toast.success(response.message || 'Email verified successfully');
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._isLoading.set(false)),
    );
  }

  /**
   * Re-sends the email verification OTP for an unverified address (register
   * verify step, and email changes after updateProfile).
   */
  resendOtp(request: ResendOtpRequest): Observable<ResendOtpResponse> {
    this._isLoading.set(true);
    return this.http.post<ResendOtpResponse>(`${this.baseUrl}${AUTH_API.RESEND_OTP}`, request).pipe(
      tap((response) => {
        if (response.success) {
          this.toast.success(response.message || 'Verification code sent to your email');
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._isLoading.set(false)),
    );
  }

  /**
   * Updates the authenticated user's profile (authenticated PUT endpoint).
   * On success the in-memory + stored user are refreshed with the response,
   * so Settings and the top bar reflect the new values immediately.
   */
  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<LoginUserDto>> {
    this._isLoading.set(true);
    return this.http.put<ApiResponse<LoginUserDto>>(`${this.baseUrl}${AUTH_API.UPDATE_PROFILE}`, request).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.updateStoredUser(response.data);
          this.toast.success(response.message || 'Profile updated successfully');
        }
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this._isLoading.set(false)),
    );
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

  /** Replaces the stored user with the profile returned by the backend. */
  private updateStoredUser(data: LoginUserDto): void {
    const user: User = { ...data };
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    this._currentUser.set(user);
  }

  /**
   * The 6 curated avatar options (stable id + asset reference).
   * Backend-driven; falls back to the bundled config if the endpoint
   * is unavailable.
   */
  getAvatars(): Observable<ProfileAvatarOption[]> {
    return this.http.get<ApiResponse<ProfileAvatarOption[]>>(`${this.baseUrl}${AUTH_API.AVATARS}`).pipe(
      map((response: ApiResponse<ProfileAvatarOption[]>) =>
        response.success && Array.isArray(response.data) ? response.data : [],
      ),
      catchError(() => throwError(() => [])),
    );
  }

  /**
   * Uploads the user's profile picture (multipart POST). On success the
   * stored user gains profilePictureUrl, which takes precedence over the
   * curated avatar everywhere the profile renders.
   */
  uploadProfilePicture(file: File): Observable<ApiResponse<LoginUserDto>> {
    const formData = new FormData();
    formData.append('file', file);
    this._isLoading.set(true);
    return this.http
      .post<ApiResponse<LoginUserDto>>(`${this.baseUrl}${AUTH_API.UPLOAD_PROFILE_PICTURE}`, formData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.updateStoredUser(response.data);
            this.toast.success(response.message || 'Profile picture uploaded');
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._isLoading.set(false)),
      );
  }

  /**
   * Removes the uploaded profile picture — the user falls back to their
   * curated avatar (or initials).
   */
  removeProfilePicture(): Observable<ApiResponse<LoginUserDto>> {
    this._isLoading.set(true);
    return this.http
      .delete<ApiResponse<LoginUserDto>>(`${this.baseUrl}${AUTH_API.UPLOAD_PROFILE_PICTURE}`)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.updateStoredUser(response.data);
            this.toast.success(response.message || 'Profile picture removed');
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._isLoading.set(false)),
      );
  }

  /**
   * Marks the current user's email as verified locally after a successful
   * verify-email call (the verify endpoint returns only a message, so the
   * stored profile is updated client-side to stay in sync with the backend).
   */
  markEmailVerified(): void {
    const user = this._currentUser();
    if (!user) return;
    const updated: User = { ...user, emailVerified: true };
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
    this._currentUser.set(updated);
  }

  /**
   * Marks the demo tour as completed (authenticated PATCH). On success the
   * stored user's `demo` flag is flipped locally so the tour never shows
   * again without a reload.
   */
  markDemoCompleted(): Observable<ApiResponse<{ message: string }>> {
    this._isLoading.set(true);
    return this.http
      .patch<ApiResponse<{ message: string }>>(`${this.baseUrl}${AUTH_API.DEMO_COMPLETE}`, null)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.markDemoSeenLocally();
          }
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this._isLoading.set(false)),
      );
  }

  private markDemoSeenLocally(): void {
    const user = this._currentUser();
    if (!user) return;
    const updated: User = { ...user, demo: true };
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
    this._currentUser.set(updated);
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
