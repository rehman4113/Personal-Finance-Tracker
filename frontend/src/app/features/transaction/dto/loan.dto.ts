/**
 * Loan DTOs — mirror LoanUserResponse / LoanUserRequest / LoanHistoryResponse
 * in the backend guide (§13.4).
 */
export interface LoanUserDto {
  id: number;
  userId?: number;
  fullName: string;
  contactNumber?: string | null;
  uniqueKey?: string;
  currentAmount: number;
  loanStatus: 'RECEIVABLE' | 'PAYABLE' | 'CLOSED';
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoanUserRequest {
  fullName: string;
  contactNumber?: string;
  notes?: string;
}

export interface LoanHistoryDto {
  id: number;
  loanUserId: number;
  transactionHistoryId?: number | null;
  transactionDetailId?: number | null;
  amount: number;
  previousAmount: number;
  currentAmount: number;
  previousStatus: string;
  currentStatus: string;
  transactionType: string;
  remarks?: string | null;
  createdAt?: string;
}

export interface LedgerEntryDto {
  id: number;
  transactionId: number;
  userId?: number;
  walletId: number;
  debit: number;
  credit: number;
  balanceAfter: number;
  remarks?: string | null;
  createdAt?: string;
}