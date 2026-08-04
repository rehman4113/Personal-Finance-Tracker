import { Routes } from '@angular/router';

/**
 * Root application routes — finance shell (protected) + auth routes (public).
 * WHY: the finance shell is the default post-login destination; `/login` and
 * friends fall through to the untouched auth routes. `/home` kept as a legacy
 * redirect for sessions that stored the old post-login route.
 */
export const routes: Routes = [
  {
    path: 'home',
    redirectTo: '/dashboard',
  },
  {
    path: '',
    loadChildren: () => import('./features/finance.routes').then((m) => m.FINANCE_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '/dashboard' },
];