import { TransactionTypeCode } from '../models/transaction-mode.model';

export type TransactionFieldType =
  | 'input'
  | 'select'
  | 'currency'
  | 'date'
  | 'textarea'
  | 'wallet'
  | 'purpose'
  | 'loanUser';

/**
 * Declarative form field descriptor (Section 10.2).
 * WHY: the form page renders fields from config only — validation rules,
 * wallet-entry wiring and hints are derived from the descriptor.
 */
export interface TransactionFormField {
  name: string;
  label: string;
  controlType: TransactionFieldType;
  required: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  /** For native selects — e.g. LOAN direction from master subcategories. */
  optionsSource?: 'loanDirections';
  /** Secondary field: shown only when the primary purpose's subcategory list is non-empty. */
  dependsOn?: string;
}

/** What the form constructs for the request, per type (Section 13.3). */
export interface TransactionFormPlan {
  /** walletEntries built from these fields (single-entry or source/destination). */
  entryFields: ('walletId' | 'sourceWalletId' | 'destinationWalletId')[];
  /** Subcategory id resolved from the primary purpose. */
  subcategorySource?: 'purpose' | 'loanDirection';
}

const COMMON_META: TransactionFormField[] = [
  { name: 'description', label: 'Description', controlType: 'input', required: false, placeholder: 'Optional short note', fullWidth: true },
  { name: 'notes', label: 'Notes', controlType: 'textarea', required: false, placeholder: 'Any extra details…', fullWidth: true },
];

/** Per-type form fields (Section 10.1) + the request wiring plan. */
export const TRANSACTION_FORM_FIELDS: Record<TransactionTypeCode, { fields: TransactionFormField[]; plan: TransactionFormPlan }> = {
  INCOME: {
    fields: [
      { name: 'purposeId', label: 'Income Type', controlType: 'purpose', required: true },
      { name: 'amount', label: 'Amount', controlType: 'currency', required: true, placeholder: '0.00' },
      { name: 'walletId', label: 'To Wallet', controlType: 'wallet', required: true },
      { name: 'merchant', label: 'Paid By / From', controlType: 'input', required: false, placeholder: 'e.g. Company, Client' },
      { name: 'transactionDate', label: 'Date', controlType: 'date', required: true },
      ...COMMON_META,
    ],
    plan: { entryFields: ['walletId'] },
  },
  EXPENSE: {
    fields: [
      { name: 'purposeId', label: 'Expense Category', controlType: 'purpose', required: true },
      { name: 'subcategoryId', label: 'Sub Category', controlType: 'select', required: false, dependsOn: 'purposeId' },
      { name: 'amount', label: 'Amount', controlType: 'currency', required: true, placeholder: '0.00' },
      { name: 'walletId', label: 'From Wallet', controlType: 'wallet', required: true },
      { name: 'merchant', label: 'Paid To', controlType: 'input', required: false, placeholder: 'e.g. Store, Vendor' },
      { name: 'transactionDate', label: 'Date', controlType: 'date', required: true },
      ...COMMON_META,
    ],
    plan: { entryFields: ['walletId'], subcategorySource: 'purpose' },
  },
  LOAN: {
    fields: [
      { name: 'loanUserId', label: 'Person', controlType: 'loanUser', required: true, placeholder: 'Search or type a new name' },
      { name: 'directionId', label: 'Direction', controlType: 'select', required: true, optionsSource: 'loanDirections' },
      { name: 'amount', label: 'Amount', controlType: 'currency', required: true, placeholder: '0.00' },
      { name: 'walletId', label: 'Wallet', controlType: 'wallet', required: true },
      { name: 'transactionDate', label: 'Date', controlType: 'date', required: true },
      ...COMMON_META,
    ],
    plan: { entryFields: ['walletId'], subcategorySource: 'loanDirection' },
  },
  TRANSFER: {
    fields: [
      { name: 'sourceWalletId', label: 'From Wallet', controlType: 'wallet', required: true },
      { name: 'destinationWalletId', label: 'To Wallet', controlType: 'wallet', required: true },
      { name: 'amount', label: 'Amount', controlType: 'currency', required: true, placeholder: '0.00' },
      { name: 'transactionDate', label: 'Date', controlType: 'date', required: true },
      ...COMMON_META,
    ],
    plan: { entryFields: ['sourceWalletId', 'destinationWalletId'] },
  },
};