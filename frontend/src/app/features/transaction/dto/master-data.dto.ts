/**
 * Master data DTOs — mirror MasterDataResponse in the backend finance module.
 * NOTE: purposes carry their subcategories (LOAN exposes RECEIVABLE/PAYABLE);
 * ids/codes are resolved from /master at runtime — never hardcoded.
 * userId != null marks a user-created item (system seeds have userId == null).
 * transactionTypeId links a purpose to its transaction type (used to filter
 * user-created income types / expense categories).
 */
export interface SimpleMasterItem {
  id: number;
  code: string;
  name?: string;
  description?: string | null;
  active?: boolean;
  userId?: number | null;
}

export interface PurposeWithSubcategories extends SimpleMasterItem {
  transactionTypeId?: number | null;
  subcategories: SimpleMasterItem[];
}

export interface MasterDataDto {
  walletTypes: SimpleMasterItem[];
  transactionTypes: SimpleMasterItem[];
  transactionPurposes: PurposeWithSubcategories[];
  transactionStatuses: SimpleMasterItem[];
}