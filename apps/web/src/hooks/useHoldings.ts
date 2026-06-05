import useSWR from 'swr';
import apiClient from '@/lib/api';

export interface HoldingChangeItem {
  id: number;
  investorId: number;
  investorName: string;
  investorAvatar?: string | null;
  stockCode: string;
  stockName: string;
  industry?: string | null;
  mainRevenue?: number | null;
  revenueReportDate?: string | null;
  currentPrice: number;
  averageChangePrice?: number | null;
  averageChangePriceDate?: string | null;
  currentShares: number;
  previousShares: number | null;
  totalMarketValue: number;
  changeShares: number;
  changePercent: number | null;
  changeMarketValue: number;
  reportDate: string;
}

export interface HoldingNewStockAggregateItem {
  stockCode: string;
  stockName: string;
  industry?: string | null;
  mainRevenue?: number | null;
  revenueReportDate?: string | null;
  currentPrice: number;
  totalMarketValue: number;
  changeMarketValue: number;
  newInvestorCount: number;
  investorNames: string[];
  reportDate: string;
}

export interface HoldingChangeResponse<T> {
  list: T[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    mode?: 'detail' | 'stock';
  };
}

interface UseHoldingsChangeParams {
  page: number;
  page_size: number;
  keyword?: string;
  reportDate?: string;
  type: 'increase' | 'decrease' | 'new';
  mode?: 'detail' | 'stock';
}

export function useHoldingsChange(params: UseHoldingsChangeParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.keyword) {
    query.append('keyword', params.keyword);
  }
  if (params.reportDate) {
    query.append('reportDate', params.reportDate);
  }
  if (params.mode) {
    query.append('mode', params.mode);
  }

  const fetcher = async (url: string) => {
    return apiClient.get(url);
  };

  const endpoint = `/api/v1/holdings/${params.type}`;

  const { data, error, isLoading, mutate } = useSWR<
    HoldingChangeResponse<HoldingChangeItem | HoldingNewStockAggregateItem>
  >(
    `${endpoint}?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch holdings change:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

interface UseCommonHoldingsParams {
  page: number;
  page_size: number;
  investorIds?: number[];
}

export function useCommonHoldings(params: UseCommonHoldingsParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.investorIds && params.investorIds.length > 0) {
    query.append('investorIds', params.investorIds.join(','));
  }

  const fetcher = async (url: string) => {
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/holdings/common?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch common holdings:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
