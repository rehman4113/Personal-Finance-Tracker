import { TransactionMode, TransactionTypeCode } from '../models/transaction-mode.model';
import { TransactionFormField } from './transaction-form.config';

export interface TransactionModeConfig {
  mode: TransactionMode;
  /** Page title / menu label. */
  title: string;
  subtitle: string;
  pageHeaderIcon: string;
  /** Primary action label, e.g. "Add Income". */
  createLabel: string;
  /** Backend type code resolved to an id via /master (undefined for ALL). */
  transactionTypeCode?: TransactionTypeCode;
  /** Per-mode form fields (ALL resolves the selected inner type's fieldset). */
  form: TransactionFormField[];
  /** Whether the list adds a Type column. */
  showTypeColumn: boolean;
}

/**
 * Mode configuration (Section 9.2) — the single source of truth behind the
 * transaction pages. The list page always runs in ALL mode; the create page
 * switches between the four types via its in-page type selector.
 * WHY: Open/Closed — a new transaction type is a new config entry, zero pages.
 */
export const TRANSACTION_TYPES: Record<TransactionMode, TransactionModeConfig> = {
  INCOME: {
    mode: 'INCOME',
    title: 'Income',
    subtitle: 'Money received from any source',
    pageHeaderIcon: 'bi-arrow-down-circle',
    createLabel: 'Add Income',
    transactionTypeCode: 'INCOME',
    form: [],
    showTypeColumn: false,
  },
  EXPENSE: {
    mode: 'EXPENSE',
    title: 'Expenses',
    subtitle: 'Money spent on any category',
    pageHeaderIcon: 'bi-arrow-up-circle',
    createLabel: 'Add Expense',
    transactionTypeCode: 'EXPENSE',
    form: [],
    showTypeColumn: false,
  },
  LOAN: {
    mode: 'LOAN',
    title: 'Loan',
    subtitle: 'Loans given or received with borrowers',
    pageHeaderIcon: 'bi-cash-coin',
    createLabel: 'New Loan',
    transactionTypeCode: 'LOAN',
    form: [],
    showTypeColumn: false,
  },
  TRANSFER: {
    mode: 'TRANSFER',
    title: 'Wallet Transfer',
    subtitle: 'Move money between your wallets',
    pageHeaderIcon: 'bi-arrow-left-right',
    createLabel: 'New Transfer',
    transactionTypeCode: 'TRANSFER',
    form: [],
    showTypeColumn: false,
  },
  ALL: {
    mode: 'ALL',
    title: 'All Transactions',
    subtitle: 'Every income, expense, loan and transfer',
    pageHeaderIcon: 'bi-list-ul',
    createLabel: 'New Transaction',
    transactionTypeCode: undefined,
    form: [],
    showTypeColumn: true,
  },
};

/** Create-order for the ALL-mode type selector. */
export const CREATEABLE_TYPE_CODES: TransactionTypeCode[] = ['INCOME', 'EXPENSE', 'LOAN', 'TRANSFER'];