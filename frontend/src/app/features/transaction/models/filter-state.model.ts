/** Client-side filter state for the transaction list (§11). */
export interface TransactionFilterState {
  from?: string | null;
  to?: string | null;
  purposeId?: number | null;
  walletId?: number | null;
  status?: string | null;
  search?: string | null;
}

export const EMPTY_FILTER: TransactionFilterState = {};