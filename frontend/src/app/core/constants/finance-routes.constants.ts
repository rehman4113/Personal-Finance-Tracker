/**
 * Finance module routes.
 * WHY: Guards, layout, and pages navigate using constants — never hardcoded strings.
 */
export const FINANCE_ROUTES = {
  ROOT: '/',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  CREATE_TRANSACTION: '/transactions/create',
  WALLETS: '/wallets',
  BUDGETS: '/budgets',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;
