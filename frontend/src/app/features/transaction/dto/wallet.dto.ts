/**
 * Wallet DTOs — mirror WalletResponse / WalletTypeResponse / WalletRequest /
 * WalletTypeRequest in the backend guide (§13.2).
 */
export interface WalletDto {
  id: number;
  userId?: number;
  walletTypeCode: string;
  walletTypeName?: string;
  walletName: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  accountNumber?: string | null;
  description?: string | null;
  status: string;
  createdAt?: string;
}

export interface WalletRequest {
  walletTypeId: number;
  walletName: string;
  currency?: string;
  initialBalance?: number;
  accountNumber?: string;
  description?: string;
}

export interface WalletTypeDto {
  id: number;
  userId?: number | null;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  systemDefault?: boolean;
}

export interface WalletTypeRequest {
  code: string;
  name: string;
  description?: string;
}