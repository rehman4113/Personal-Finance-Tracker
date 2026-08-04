import { Routes } from '@angular/router';
import { TransactionListComponent } from './pages/transaction-list/transaction-list.component';
import { TransactionFormComponent } from './pages/transaction-form/transaction-form.component';

/**
 * Transaction feature routes.
 * WHY: the sidebar offers two entry points — the combined history list and the
 * single create page (its internal Income/Expense/Loan/Wallet Transfer
 * type-switcher replaces the old per-type routes /income, /expense, /loan,
 * /transfer and their /create variants).
 */
export const TRANSACTION_ROUTES: Routes = [
  { path: 'transactions', component: TransactionListComponent, data: { mode: 'ALL' } },
  { path: 'transactions/create', component: TransactionFormComponent, data: { mode: 'ALL' } },
];
