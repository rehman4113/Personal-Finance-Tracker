import { FINANCE_ROUTES } from '../constants/finance-routes.constants';

/**
 * Sidebar menu definition — configuration-driven (Section 8).
 * WHY: adding a menu entry is a data change here, never a template change.
 * The Transactions group offers the combined history list and the single
 * create page (its internal type-switcher covers all four transaction types).
 */
export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  /** Action items (e.g. logout) perform behavior, not navigation. */
  action?: 'logout';
}

export const NAV_MENU: NavItem[] = [
  { label: 'Dashboard', icon: 'bi-speedometer2', route: FINANCE_ROUTES.DASHBOARD },
  {
    label: 'Transactions',
    icon: 'bi-list-ul',
    children: [
      { label: 'All Transactions', icon: 'bi-list-check', route: FINANCE_ROUTES.TRANSACTIONS },
      { label: 'New Transaction', icon: 'bi-plus-lg', route: FINANCE_ROUTES.CREATE_TRANSACTION },
    ],
  },
  { label: 'Wallets', icon: 'bi-wallet', route: FINANCE_ROUTES.WALLETS },
  { label: 'Loan Users', icon: 'bi-people', route: FINANCE_ROUTES.LOAN_USERS },
  { label: 'Budgets', icon: 'bi-pie-chart', route: FINANCE_ROUTES.BUDGETS },
  { label: 'Reports', icon: 'bi-bar-chart-line', route: FINANCE_ROUTES.REPORTS },
];