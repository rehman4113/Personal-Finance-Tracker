/**
 * Universal pagination envelope returned by every backend list endpoint.
 * Mirrors PageResponse<T> in the backend (§ Section 4).
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/** Bound for "fetch everything" client loads (dashboard/report aggregates). */
export const PAGE_SIZE_ALL = 100000;