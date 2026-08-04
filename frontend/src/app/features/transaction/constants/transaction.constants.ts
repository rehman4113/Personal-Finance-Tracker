import { TransactionTypeCode } from '../models/transaction-mode.model';

/**
 * Transaction feature constants (§13).
 * WHY: purpose codes per transaction type are the ONLY stable seed contracts —
 * ids are fetched from /master and resolved via these codes at runtime.
 */
export const TRANSACTION_TYPE_CODES: TransactionTypeCode[] = ['INCOME', 'EXPENSE', 'TRANSFER', 'LOAN'];

/** Status code used for successfully booked transactions. */
export const COMPLETED_STATUS_CODE = 'COMPLETED';

/** Purpose codes allowed per transaction type (used to filter /master purposes). */
export const PURPOSE_CODES_BY_TYPE: Record<TransactionTypeCode, string[]> = {
  INCOME: ['SALARY', 'FREELANCE', 'POCKET_MONEY', 'GIFT', 'OTHER_INCOME'],
  EXPENSE: [
    'FOOD_CAMPUS',
    'FOOD_OUTSIDE',
    'MOBILE',
    'TRAVEL_HOME',
    'TRAVEL_COMMUTE',
    'UTILITIES',
    'CLOTHING',
    'HEALTH',
    'EDUCATION',
    'ENTERTAINMENT',
    'GROCERIES',
    'MISC',
  ],
  TRANSFER: ['WALLET_TRANSFER'],
  LOAN: ['LOAN'],
};

/** Loan direction codes — subcategories of the LOAN purpose from /master. */
export const LOAN_DIRECTION_CODES = {
  RECEIVABLE: 'RECEIVABLE',
  PAYABLE: 'PAYABLE',
} as const;

/** Alert-level badge styling used across budgets. */
export const ALERT_LEVEL_CLASS: Record<string, string> = {
  NORMAL: 'bg-success-subtle text-success',
  WARNING: 'bg-warning-subtle text-warning-emphasis',
  EXCEEDED: 'bg-danger-subtle text-danger',
};

/** Loan status badge styling. */
export const LOAN_STATUS_CLASS: Record<string, string> = {
  RECEIVABLE: 'bg-info-subtle text-info-emphasis',
  PAYABLE: 'bg-warning-subtle text-warning-emphasis',
  CLOSED: 'bg-secondary-subtle text-secondary-emphasis',
};