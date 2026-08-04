/**
 * Transaction DTOs — mirror TransactionResponse (+ WalletEntryResponse) and
 * TransactionRequest (+ WalletEntry) in the backend guide (§13.3).
 */
export interface TransactionWalletEntryDto {
  transactionId?: number;
  walletId?: number | null;
  sourceWalletId?: number | null;
  destinationWalletId?: number | null;
  amount: number;
  merchant?: string | null;
}

export interface TransactionDto {
  id: number;
  transactionHistoryId?: number;
  userId?: number;
  transactionTypeCode: string;
  transactionPurposeCode: string;
  transactionStatusCode: string;
  subcategoryCode?: string | null;
  totalAmount: number;
  description?: string | null;
  personName?: string | null;
  transactionDate: string;
  referenceNumber?: string | null;
  notes?: string | null;
  attachmentId?: number | null;
  walletEntries?: TransactionWalletEntryDto[];
  createdAt?: string;

  /** Convenience projections mirrored from the first wallet entry (§13.3). */
  merchant?: string | null;
  walletId?: number | null;
  sourceWalletId?: number | null;
  destinationWalletId?: number | null;
}

export interface TransactionWalletEntryRequest {
  /** income/expense/loan */
  walletId?: number;
  /** transfer */
  sourceWalletId?: number;
  destinationWalletId?: number;
  amount: number;
  merchant?: string;
}

export interface CreateTransactionRequest {
  transactionTypeId: number;
  transactionPurposeId: number;
  transactionSubcategoryId?: number;
  transactionStatusId: number;
  totalAmount: number;
  transactionDate: string;
  description?: string;
  referenceNumber?: string;
  notes?: string;
  personName?: string;
  walletEntries: TransactionWalletEntryRequest[];
}