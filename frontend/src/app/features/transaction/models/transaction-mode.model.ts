/** Transaction modes — one config-driven module serves all of them (§9). */
export type TransactionMode = 'INCOME' | 'EXPENSE' | 'LOAN' | 'TRANSFER' | 'ALL';

/** Transaction type codes from master data (resolved at runtime to ids). */
export type TransactionTypeCode = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'LOAN';

export const TRANSACTION_MODES: TransactionMode[] = ['INCOME', 'EXPENSE', 'LOAN', 'TRANSFER', 'ALL'];