import useSWR from 'swr';
import apiClient from '@/lib/api';

export interface ExecutiveIncreaseItem {
  stockCode: string;
  stockName: string;
  totalIncreaseShares: number;
  estimatedIncreaseMarketValue: number | null;
  executiveCount: number;
  executives: string[];
  industry: string | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  mainRevenue: number | null;
  revenueReportDate: string | null;
  reportDate: string;
  latestAnnouncementDate: string | null;
}

export interface ExecutiveIncreaseResponse {
  list: ExecutiveIncreaseItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    report_date: string | null;
  };
}

interface UseExecutiveIncreaseParams {
  page: number;
  page_size: number;
  keyword?: string;
  reportDate?: string;
}

export function useExecutiveIncrease(params: UseExecutiveIncreaseParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.keyword) {
    query.append('keyword', params.keyword);
  }
  if (params.reportDate) {
    query.append('reportDate', params.reportDate);
  }

  const fetcher = async (url: string) => {
    return apiClient.get<ExecutiveIncreaseResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<ExecutiveIncreaseResponse>(
    `/api/v1/executives/increase?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch executive increase:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
