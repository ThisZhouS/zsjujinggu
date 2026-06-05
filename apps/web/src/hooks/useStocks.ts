import useSWR from 'swr';
import apiClient from '@/lib/api';

export interface StockDetail {
  id: number;
  code: string;
  name: string;
  industry: string | null;
  market: string;
  listingDate: string | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  priceUpdatedAt: string | null;
  mainRevenue?: number | null;
  revenueReportDate?: string | null;
  companyDescription?: string | null;
  companySite?: string | null;
  principal?: string | null;
  address?: string | null;
  latestDividendYear?: number | null;
  latestDividendDate?: string | null;
  latestCashDividend?: number | null;
  latestTotalDividend?: number | null;
  latestDividendYield?: number | null;
  dividendPrice?: number | null;
}

export interface StockKlinePoint {
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  changePercent: number | null;
  turnover: number | null;
}

export interface StockPerformanceItem {
  label: string;
  days: number;
  startDate: string | null;
  endDate: string | null;
  startPrice: number | null;
  endPrice: number | null;
  changePercent: number | null;
}

export interface StockLimitHistoryItem {
  date: string;
  type: 'UP' | 'DOWN';
  stockCode: string;
  stockName: string;
  price: number | null;
  changePercent: number | null;
  turnover: number | null;
  sealAmount: number | null;
  statusText: string | null;
}

export interface StockRealtimePayload {
  available: boolean;
  message: string;
  data: {
    code: string;
    name: string;
    currentPrice: number | null;
    totalMarketCap: number | null;
    updatedAt: string | null;
  };
}

export interface StockTrackedHolder {
  investorId: number;
  investorName: string;
  investorAvatar: string | null;
  holdCount: number;
  holdRatio: number | null;
  marketValue: number;
  reportDate: string;
}

const fetcher = async <T>(url: string) => apiClient.get<T>(url);

export function useStockDetail(code: string) {
  const { data, error, isLoading, mutate } = useSWR(
    code ? `/api/v1/stocks/${code}` : null,
    fetcher<StockDetail>,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}

export function useStockKline(code: string, limit: number = 120) {
  const { data, error, isLoading, mutate } = useSWR(
    code ? `/api/v1/stocks/${code}/kline?limit=${limit}` : null,
    fetcher<StockKlinePoint[]>,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}

export function useStockPerformance(code: string) {
  const { data, error, isLoading, mutate } = useSWR(
    code ? `/api/v1/stocks/${code}/performance` : null,
    fetcher<StockPerformanceItem[]>,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}

export function useStockLimitHistory(code: string, limit: number = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    code ? `/api/v1/stocks/${code}/limit-history?limit=${limit}` : null,
    fetcher<StockLimitHistoryItem[]>,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}

export function useStockRealtime(code: string) {
  const { data, error, isLoading, mutate } = useSWR(
    code ? `/api/v1/stocks/${code}/realtime` : null,
    fetcher<StockRealtimePayload>,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}

export function useStockTrackedHolders(code: string) {
  const { data, error, isLoading, mutate } = useSWR(
    code ? `/api/v1/stocks/${code}/holders` : null,
    fetcher<StockTrackedHolder[]>,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}
