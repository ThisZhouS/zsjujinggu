import useSWR from 'swr';
import apiClient from '@/lib/api';

export interface MarketOverviewIndex {
  name: string;
  code: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  turnover: number | null;
  updatedAt: string | null;
  source: 'database' | 'live' | 'unavailable';
}

export interface MarketOverviewResponse {
  shIndex: MarketOverviewIndex;
  szIndex: MarketOverviewIndex;
  bjIndex: MarketOverviewIndex;
}

export function useMarketOverview() {
  const fetcher = async (url: string) => {
    return apiClient.get<MarketOverviewResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<MarketOverviewResponse>(
    '/api/v1/stocks/market/overview',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
      onError: (requestError) => {
        console.error('Failed to fetch market overview:', requestError);
      },
    },
  );

  return { data, error, isLoading, mutate };
}
