/**
 * Type Definition 样板
 * 职责：类型定义、接口声明
 */

/**
 * 基础类型
 */
export type UserRole = 'USER' | 'ADMIN' | 'VIP';

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

/**
 * 通用响应类型
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 分页元数据
 */
export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * 实体类型
 */
export interface Xxx {
  id: number;
  name: string;
  description?: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO类型
 */
export interface CreateXxxDto {
  name: string;
  description?: string;
}

export interface UpdateXxxDto {
  name?: string;
  description?: string;
}

export interface XxxListParams {
  page: number;
  page_size: number;
  sort?: string;
  keyword?: string;
}

/**
 * 过滤器类型
 */
export interface XxxFilter {
  keyword?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
  status?: string;
}

/**
 * 统计类型
 */
export interface XxxStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * 表格列配置
 */
export interface TableColumn {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter?: boolean;
  filters?: any;
}

/**
 * 表单字段配置
 */
export interface FormField {
  name: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'date' | 'number';
  required?: boolean;
  options?: { label: string; value: any }[];
  placeholder?: string;
}
