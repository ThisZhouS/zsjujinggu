/**
 * SWR Hook 样板
 * 职责：前端数据获取、状态管理
 */

import useSWR from 'swr';
import apiClient from '@/lib/api';

/**
 * 通用fetcher
 */
const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response;
};

/**
 * POST/PUT/DELETE操作fetcher
 */
const actionFetcher = async ({ url, method, data }: { url: string; method: string; data?: any }) => {
  if (method === 'POST') {
    return apiClient.post(url, data);
  } else if (method === 'PUT') {
    return apiClient.put(url, data);
  } else if (method === 'DELETE') {
    return apiClient.delete(url);
  }
};

/**
 * 接口类型定义
 */
interface UseXxxListParams {
  page: number;
  page_size: number;
  sort?: string;
  keyword?: string;
}

interface XxxItem {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

interface XxxListResponse {
  code: number;
  message: string;
  data: {
    items: XxxItem[];
    meta: {
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    };
  };
}

/**
 * 获取列表数据
 * R16: 必须配置onError回调
 */
export function useXxxList(params: UseXxxListParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.sort) {
    query.append('sort', params.sort);
  }
  if (params.keyword) {
    query.append('keyword', params.keyword);
  }

  const { data, error, isLoading, mutate } = useSWR<XxxListResponse>(
    `/api/v1/xxx?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch xxx list:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

/**
 * 获取详情数据
 */
export function useXxxDetail(id: number) {
  const { data, error, isLoading, mutate } = useSWR<XxxDetailResponse>(
    id > 0 ? `/api/v1/xxx/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch xxx detail:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

/**
 * 获取用户数据（需要认证）
 */
export function useUserProfile() {
  const { data, error, isLoading, mutate } = useSWR<UserProfileResponse>(
    '/api/v1/account/profile',
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch user profile:', error);
      },
      shouldRetryOnError: false, // 认证失败不重试
    }
  );

  return { data, error, isLoading, mutate };
}

/**
 * 创建数据
 */
export function useCreateXxx() {
  const { data, error, isLoading, mutate } = useSWR(
    null,
    null,
    {
      revalidateOnFocus: false,
    }
  );

  const create = async (data: CreateXxxDto) => {
    const result = await apiClient.post('/api/v1/xxx', data);
    return result;
  };

  return { create, isLoading, error };
}

/**
 * 更新数据
 */
export function useUpdateXxx(id: number) {
  const update = async (data: UpdateXxxDto) => {
    const result = await apiClient.put(`/api/v1/xxx/${id}`, data);
    return result;
  };

  return { update };
}

/**
 * 删除数据
 */
export function useDeleteXxx() {
  const remove = async (id: number) => {
    const result = await apiClient.delete(`/api/v1/xxx/${id}`);
    return result;
  };

  return { remove };
}

/**
 * 批量操作
 */
export function useBatchXxx() {
  const batchUpdate = async (ids: number[], data: any) => {
    const result = await apiClient.post('/api/v1/xxx/batch', { ids, data });
    return result;
  };

  const batchDelete = async (ids: number[]) => {
    const result = await apiClient.post('/api/v1/xxx/batch-delete', { ids });
    return result;
  };

  return { batchUpdate, batchDelete };
}
