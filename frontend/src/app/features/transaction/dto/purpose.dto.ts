/**
 * Purpose / subcategory DTOs — mirror PurposeRequest / SubcategoryRequest and
 * the created-item responses (SimpleMasterItem) in the backend finance module.
 * Used by the creatable dropdowns: income type, expense category,
 * expense sub-category, budget category.
 */
export interface PurposeRequest {
  transactionTypeId: number;
  name: string;
  description?: string;
}

export interface SubcategoryRequest {
  name: string;
  description?: string;
}

/** Created item returned by POST /purposes, POST /purposes/{id}/subcategories. */
export interface PurposeCreatedItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  active?: boolean;
  userId?: number | null;
}
