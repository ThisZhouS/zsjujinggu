import useSWR from 'swr';
import apiClient from '@/lib/api';

export type DividendRankingMode = 'rolling1y' | 'annual' | 'avg3y';

export interface DividendYieldItem {
  stockCode: string;
  stockName: string;
  year: number | null;
  periodLabel: string;
  dividendPerShare: number | null;
  totalDividend: number | null;
  dividendYield: number | null;
  currentPrice: number | null;
}

export interface DividendYieldResponse {
  list: DividendYieldItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    mode: DividendRankingMode;
  };
}

interface UseDividendYieldParams {
  page: number;
  page_size: number;
  year?: number;
  mode?: DividendRankingMode;
}

export function useDividendYield(params: UseDividendYieldParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.year) {
    query.append('year', params.year.toString());
  }
  if (params.mode) {
    query.append('mode', params.mode);
  }

  const fetcher = async (url: string) => {
    return apiClient.get<DividendYieldResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<DividendYieldResponse>(
    `/api/v1/dividends/yield-ranking?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch dividend yield:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
