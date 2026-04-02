import type { PaginatedResponse } from "@paper-read/shared";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export function normalizePagination(input: PaginationInput) {
  const page = Number.isFinite(input.page) && input.page && input.page > 0 ? input.page : DEFAULT_PAGE;
  const requestedPageSize =
    Number.isFinite(input.pageSize) && input.pageSize && input.pageSize > 0
      ? input.pageSize
      : DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize: Math.min(requestedPageSize, MAX_PAGE_SIZE)
  };
}

export function paginateItems<TItem>(
  items: TItem[],
  input: PaginationInput
): PaginatedResponse<TItem> {
  const { page, pageSize } = normalizePagination(input);
  const startIndex = (page - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    total: items.length,
    page,
    pageSize
  };
}
