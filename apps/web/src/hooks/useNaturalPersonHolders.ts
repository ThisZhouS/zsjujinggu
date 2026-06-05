import useSWR from 'swr';
import apiClient from '@/lib/api';
import type { GainerPeriod } from './useTopGainers';
import type { InvestorCategory } from './useInvestors';

interface UseNaturalPersonHoldersParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

export interface HiddenShareholderMatchedStock {
  stockCode: string;
  stockName: string;
  reportDate: string;
  holdCount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  marketValue: number;
  sourceMetric: number;
  sourceMetricLabel: string;
}

export interface HiddenShareholderRow {
  investorId: number;
  shareholderName: string;
  matchedStockCount: number;
  matchedMarketValue: number;
  latestReportDate: string;
  totalMarketValue: number;
  stockCount: number;
  matchedStocks: HiddenShareholderMatchedStock[];
}

export interface HiddenShareholderResponse {
  period: string;
  sourceStockCount: number;
  list: HiddenShareholderRow[];
}

export function useNaturalPersonHolders(params: UseNaturalPersonHoldersParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.pageSize.toString());
  if (params.keyword) {
    query.append('keyword', params.keyword);
  }

  const fetcher = async (url: string) => {
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/natural-person-holders?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch natural person holders:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useNaturalPersonHoldings(shareholderName: string) {
  const fetcher = async (url: string) => {
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    shareholderName ? `/api/v1/natural-person-holders/${encodeURIComponent(shareholderName)}/holdings` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch natural person holdings:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useNaturalPersonDividends(shareholderName: string) {
  const fetcher = async (url: string) => {
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    shareholderName ? `/api/v1/natural-person-holders/${encodeURIComponent(shareholderName)}/dividends` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch natural person dividends:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useHiddenShareholdersInGainers(
  period: GainerPeriod,
  limit = 12,
  stockLimit = 40,
  category: InvestorCategory = 'personal',
) {
  const query = new URLSearchParams();
  if (period) {
    query.append('period', period);
  }
  query.append('limit', limit.toString());
  query.append('stock_limit', stockLimit.toString());
  query.append('category', category);

  const fetcher = async (url: string) => {
    return apiClient.get<HiddenShareholderResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<HiddenShareholderResponse>(
    `/api/v1/natural-person-holders/hidden-in-gainers?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch hidden shareholders in top gainers:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useHiddenShareholdersInLimitUp(
  period: Exclude<GainerPeriod, ''>,
  limit = 12,
  stockLimit = 40,
  category: InvestorCategory = 'personal',
) {
  const query = new URLSearchParams();
  query.append('period', period);
  query.append('limit', limit.toString());
  query.append('stock_limit', stockLimit.toString());
  query.append('category', category);

  const fetcher = async (url: string) => {
    return apiClient.get<HiddenShareholderResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<HiddenShareholderResponse>(
    `/api/v1/natural-person-holders/hidden-in-limit-up?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch hidden shareholders in limit-up stocks:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
