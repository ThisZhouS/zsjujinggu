import useSWR from 'swr';
import apiClient from '@/lib/api';

interface UseApiKeysParams {
  page: number;
  page_size: number;
}

export type ApiPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface ApiKeyItem {
  id: number;
  userId: number;
  keyPrefix: string | null;
  plan: ApiPlan;
  quota: number;
  used: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyListResponse {
  list: ApiKeyItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface CreateApiKeyResponse {
  apiKey: string;
  keyPrefix: string;
}

export function useApiKeys(params: UseApiKeysParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());

  const fetcher = async (url: string) => {
    return apiClient.get<ApiKeyListResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<ApiKeyListResponse>(
    `/api/v1/account/api-keys?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch API keys:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
