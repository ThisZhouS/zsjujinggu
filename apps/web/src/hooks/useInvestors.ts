import useSWR from 'swr';
import apiClient from '@/lib/api';

export type InvestorCategory = 'personal' | 'institution';

interface UseInvestorsParams {
  page: number;
  page_size: number;
  sort?: string;
  order?: 'asc' | 'desc';
  keyword?: string;
  category?: InvestorCategory;
  admin?: boolean;
}

interface InvestorItem {
  id: number;
  name: string;
  category?: InvestorCategory;
  avatar?: string | null;
  bio?: string | null;
  totalMarketValue?: number;
  stockCount?: number;
  isTracked?: boolean;
}

interface PaginatedResponse<T> {
  list: T[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface InvestorPieDataItem {
  name: string;
  value: number;
}

export interface InvestorHoldingItem {
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdChange: number;
  returnRate: number | null;
  currentPrice: number | null;
  marketValue: number;
  proportion: number;
  reportDate: string;
}

export interface InvestorDetail {
  id: number;
  name: string;
  category: InvestorCategory;
  avatar: string | null;
  bio: string | null;
  totalMarketValue: number;
  stockCount: number;
  updatedAt: string;
  pieData?: InvestorPieDataItem[];
  holdings?: InvestorHoldingItem[];
  top10Holdings?: InvestorHoldingItem[];
  otherHoldings?: InvestorHoldingItem;
}

export function useInvestors(params: UseInvestorsParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.sort) {
    query.append('sort', params.sort);
  }
  if (params.order) {
    query.append('order', params.order);
  }
  if (params.keyword) {
    query.append('keyword', params.keyword);
  }
  if (params.category) {
    query.append('category', params.category);
  }

  const endpoint = params.admin ? '/api/v1/investors/admin/list' : '/api/v1/investors';

  const fetcher = async (url: string) => {
    return apiClient.get<PaginatedResponse<InvestorItem>>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<InvestorItem>>(
    `${endpoint}?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch investors:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useInvestorDetail(id: number) {
  const fetcher = async (url: string) => {
    return apiClient.get<InvestorDetail>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<InvestorDetail>(
    id > 0 ? `/api/v1/investors/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch investor detail:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export interface HoldingsHistoryRecord {
  stockCode: string;
  stockName: string;
  reportDate: string;
  holdAmount: number;
  holdChange: number;
  holdRatio: number;
  closePrice: number | null;
  avgCost: number | null;
  totalInvestedCost: number;
  marketValue: number | null;
  unrealizedGain: number | null;
  currentPrice: number | null;
  currentGainRate: number | null;
  profitIfSellAll: number | null;
  isCleared?: boolean;
}

export interface TopFlowTrackingRecord {
  stockCode: string;
  stockName: string;
  firstEntryReportDate: string;
  reportDate: string;
  isInTopFlowHolders: boolean;
  holderRank: string | null;
  announcementDate: string | null;
  holdAmount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  marketValue: number;
  changeReason: string | null;
  shareholderType: string | null;
}

export interface SameSurnameGroupInvestor {
  investorId: number;
  name: string;
  avatar: string | null;
  stockCount: number;
  totalMarketValue: number;
  latestReportDate: string;
}

export interface SameSurnameSharedStock {
  stockCode: string;
  stockName: string;
  investorCount: number;
  investorNames: string[];
  totalMarketValue: number;
}

export interface SameSurnameGroup {
  surname: string;
  memberCount: number;
  totalMarketValue: number;
  uniqueStockCount: number;
  sharedStockCount: number;
  latestReportDate: string;
  investors: SameSurnameGroupInvestor[];
  sharedStocks: SameSurnameSharedStock[];
}

export function useInvestorHoldingsHistory(id: number) {
  const fetcher = async (url: string) => {
    return apiClient.get<HoldingsHistoryRecord[]>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<HoldingsHistoryRecord[]>(
    id > 0 ? `/api/v1/investors/${id}/holdings-history` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch investor holdings history:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useInvestorTopFlowTracking(id: number, stockCode?: string) {
  const fetcher = async (url: string) => {
    return apiClient.get<TopFlowTrackingRecord[]>(url);
  };

  const query = new URLSearchParams();
  if (stockCode?.trim()) {
    query.append('stockCode', stockCode.trim());
  }

  const path = id > 0
    ? `/api/v1/investors/${id}/top-flow-tracking${query.toString() ? `?${query.toString()}` : ''}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<TopFlowTrackingRecord[]>(
    path,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (requestError) => {
        console.error('Failed to fetch investor top-flow tracking:', requestError);
      },
    },
  );

  return { data, error, isLoading, mutate };
}

export function useSameSurnameGroups(params: {
  page: number;
  page_size: number;
  keyword?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.keyword?.trim()) {
    query.append('keyword', params.keyword.trim());
  }
  if (params.sort) {
    query.append('sort', params.sort);
  }
  if (params.order) {
    query.append('order', params.order);
  }

  const fetcher = async (url: string) => {
    return apiClient.get<PaginatedResponse<SameSurnameGroup>>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<SameSurnameGroup>>(
    `/api/v1/investors/same-surname-groups?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch same-surname investor groups:', error);
      },
    },
  );

  return { data, error, isLoading, mutate };
}
