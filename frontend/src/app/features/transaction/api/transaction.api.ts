/**
 * Finance API endpoint constants ONLY (Sections 12–13).
 * WHY: single source of truth for URLs — services never hardcode paths.
 * Base URL lives in core/config/app.config.ts.
 */
export const TRANSACTION_API = {
  MASTER: '/api/v1/finance/master',

  WALLETS: '/api/v1/finance/wallets',
  wallet: (id: number) => `/api/v1/finance/wallets/${id}`,

  WALLET_TYPES: '/api/v1/finance/wallets/types',
  walletType: (id: number) => `/api/v1/finance/wallets/types/${id}`,

  TRANSACTIONS: '/api/v1/finance/transactions',
  transaction: (id: number) => `/api/v1/finance/transactions/${id}`,
  transactionLedger: (id: number) => `/api/v1/finance/transactions/${id}/ledger`,

  TRANSACTION_DETAILS: '/api/v1/finance/transaction-details',

  LOAN_USERS: '/api/v1/finance/loan-users',
  loanUser: (id: number) => `/api/v1/finance/loan-users/${id}`,
  loanUserHistory: (id: number) => `/api/v1/finance/loan-users/${id}/history`,

  BUDGETS: '/api/v1/finance/budgets',
  budget: (id: number) => `/api/v1/finance/budgets/${id}`,

  PURPOSES: '/api/v1/finance/purposes',
  purpose: (id: number) => `/api/v1/finance/purposes/${id}`,
  purposeSubcategories: (purposeId: number) => `/api/v1/finance/purposes/${purposeId}/subcategories`,

  SUBCATEGORIES: '/api/v1/finance/subcategories',
  subcategory: (id: number) => `/api/v1/finance/subcategories/${id}`,
} as const;