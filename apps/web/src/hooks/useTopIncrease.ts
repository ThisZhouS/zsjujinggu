import useSWR from 'swr';
import apiClient from '@/lib/api';

export interface TopIncreaseItem {
  stockCode: string;
  stockName: string;
  currentPrice: number | null;
  shareholderNames: string[];
  shareholderCount: number;
  totalIncreaseShares: number;
  reportDate: string;
}

export interface TopIncreaseResponse {
  list: TopIncreaseItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    report_date: string | null;
  };
}

interface UseTopIncreaseParams {
  page: number;
  page_size: number;
  keyword?: string;
  reportDate?: string;
}

export function useTopIncrease(params: UseTopIncreaseParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.keyword?.trim()) {
    query.append('keyword', params.keyword.trim());
  }
  if (params.reportDate) {
    query.append('reportDate', params.reportDate);
  }

  const fetcher = async (url: string) => {
    return apiClient.get<TopIncreaseResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<TopIncreaseResponse>(
    `/api/v1/stocks/top-increase?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch top increase:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
