import { Routes } from '@angular/router';
import { AppLayoutComponent } from '../core/layout/app-layout/app-layout.component';
import { authGuard } from './auth/guards/auth.guard';

/**
 * Finance shell routes — Section 6.11.
 * WHY: single protected shell route group. The shell mounts AppLayout once and
 * every feature loads lazily; the auth module routes remain untouched.
 */
export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: '',
        loadChildren: () => import('./transaction/transaction.routes').then((m) => m.TRANSACTION_ROUTES),
      },
      {
        path: 'wallets',
        loadChildren: () => import('./wallet/wallet.routes').then((m) => m.WALLET_ROUTES),
      },
      {
        path: 'budgets',
        loadChildren: () => import('./budget/budget.routes').then((m) => m.BUDGET_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () => import('./report/report.routes').then((m) => m.REPORT_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
    ],
  },
];