/**
 * Budget DTOs — mirror BudgetResponse / BudgetRequest in the backend guide (§13.5).
 */
export interface BudgetDto {
  id: number;
  userId?: number;
  purposeCode: string;
  purposeName: string;
  monthlyLimit: number;
  month: string;
  warningThreshold: number;
  totalSpent: number;
  remaining: number;
  usagePercentage?: number;
  alertLevel: 'NORMAL' | 'WARNING' | 'EXCEEDED';
  createdAt?: string;
}

export interface BudgetRequest {
  transactionPurposeId: number;
  monthlyLimit: number;
  month: string;
  warningThreshold?: number;
}