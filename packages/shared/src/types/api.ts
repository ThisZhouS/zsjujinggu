/**
 * 通用 API 响应类型
 */

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  code: number;
  message: string;
  data: null;
}
