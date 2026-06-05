import useSWR from 'swr';
import apiClient from '@/lib/api';

export type StarInvestorSlug = 'buffett' | 'catherine-wood';
export type StarHoldingType = 'ALL' | 'INCREASE' | 'DECREASE' | 'KEEP' | 'UNKNOWN';

export interface StarInvestorSummary {
  id: number;
  investorType: 'BUFFETT' | 'CATHERINE_WOOD';
  investorName: string;
  organizationName: string | null;
  description: string | null;
  logoUrl: string | null;
  period: string;
  reportDate: string | null;
  holdingStockCount: number | null;
  holdingValue: number | null;
  tradeProportion: number | null;
  topTenPercent: number | null;
  topIncreaseCode: string | null;
  topIncreaseName: string | null;
  topDecreaseCode: string | null;
  topDecreaseName: string | null;
  sourceUrl: string;
  scrapedAt: string;
}

export interface StarInvestorHolding {
  id: number;
  investorType: 'BUFFETT' | 'CATHERINE_WOOD';
  investorName: string;
  period: string;
  sourceReportDate: string | null;
  stockCode: string;
  stockName: string;
  instrumentCode: string | null;
  iconUrl: string | null;
  industry: string | null;
  holdingType: 'INCREASE' | 'DECREASE' | 'KEEP' | 'UNKNOWN';
  tradePrice: number | null;
  tradeQuantity: number | null;
  previousHoldingQuantity: number | null;
  holdingQuantity: number | null;
  reportDate: string | null;
  reportMarketValue: number | null;
  changeRate: number | null;
  proportion: number | null;
  latestPrice: number | null;
  latestMarketValue: number | null;
  sourceUrl: string;
  scrapedAt: string;
}

export interface StarInvestorHoldingsResponse {
  investor: StarInvestorSummary | null;
  list: StarInvestorHolding[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export function useStarInvestorHoldings(
  slug: StarInvestorSlug,
  params: {
    page: number;
    page_size: number;
    holdingType?: StarHoldingType;
    keyword?: string;
  },
) {
  const query = new URLSearchParams();
  query.set('page', String(params.page));
  query.set('page_size', String(params.page_size));
  if (params.holdingType && params.holdingType !== 'ALL') {
    query.set('holdingType', params.holdingType);
  }
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }

  const fetcher = async (url: string) => apiClient.get<StarInvestorHoldingsResponse>(url, {
    skipAuthRedirect: true,
  });

  const { data, error, isLoading, mutate } = useSWR<StarInvestorHoldingsResponse>(
    `/api/v1/star-investors/${slug}/holdings?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch star investor holdings:', error);
      },
    },
  );

  return { data, error, isLoading, mutate };
}

export function useStarInvestorTrades(
  slug: StarInvestorSlug,
  params: {
    page: number;
    page_size: number;
    holdingType?: StarHoldingType;
    keyword?: string;
  },
) {
  const query = new URLSearchParams();
  query.set('page', String(params.page));
  query.set('page_size', String(params.page_size));
  if (params.holdingType && params.holdingType !== 'ALL') {
    query.set('holdingType', params.holdingType);
  }
  if (params.keyword) {
    query.set('keyword', params.keyword);
  }

  const fetcher = async (url: string) => apiClient.get<StarInvestorHoldingsResponse>(url, {
    skipAuthRedirect: true,
  });

  const { data, error, isLoading, mutate } = useSWR<StarInvestorHoldingsResponse>(
    `/api/v1/star-investors/${slug}/trades?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch star investor trades:', error);
      },
    },
  );

  return { data, error, isLoading, mutate };
}
