import useSWR from 'swr';
import apiClient from '@/lib/api';

export type GainerPeriod = '' | '1w' | '2w' | '3w' | '1m' | '2m' | '3m' | '4m' | '6m' | '12m';

interface UseTopGainersParams {
  page?: number;
  page_size?: number;
  period?: GainerPeriod;
  keyword?: string;
}

interface TopGainerItem {
  code: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  change: number;
  turnover: number;
  volume: number;
  amount: number;
  marketCap: number;
}

interface TopGainerResponse {
  list: TopGainerItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export function useTopGainers(params?: UseTopGainersParams) {
  const query = new URLSearchParams();
  if (params?.page) {
    query.append('page', params.page.toString());
  }
  if (params?.page_size) {
    query.append('page_size', params.page_size.toString());
  }
  if (params?.period) {
    query.append('period', params.period);
  }
  if (params?.keyword) {
    query.append('keyword', params.keyword);
  }

  const fetcher = async (url: string) => {
    return apiClient.get<TopGainerResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<TopGainerResponse>(
    `/api/v1/top-gainers?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // 每 30 秒刷新一次
      onError: (error) => {
        console.error('Failed to fetch top gainers:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
