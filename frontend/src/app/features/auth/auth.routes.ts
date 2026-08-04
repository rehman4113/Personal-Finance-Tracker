import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '../../core/layout/auth-layout/auth-layout.component';
import { guestGuard } from './guards/guest.guard';

/**
 * Auth feature lazy routes — Section 6.16 / Section 25 step 6.
 * Login/register/forgot-password are wrapped in AuthLayout and guarded by GuestGuard
 * so authenticated users are redirected to the home route.
 */
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
      { path: 'register', loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage) },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
      },
    ],
  },
];
