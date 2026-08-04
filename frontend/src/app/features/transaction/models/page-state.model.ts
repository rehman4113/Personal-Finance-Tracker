/** Client-side pagination state for list pages (§11). */
export interface PageState {
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_STATE: PageState = { page: 1, pageSize: 10 };