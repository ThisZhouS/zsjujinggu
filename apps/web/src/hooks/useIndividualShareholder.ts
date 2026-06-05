import useSWR from 'swr';
import apiClient from '@/lib/api';
import type { InvestorCategory } from './useInvestors';

interface UseIndividualShareholdersParams {
  page: number;
  page_size: number;
  category: InvestorCategory;
  keyword?: string;
}

export interface IndividualShareholderItem {
  investorId: number;
  investorName: string;
  category: InvestorCategory;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  totalMarketValue: number;
  reportDate: string;
}

export interface IndividualShareholderResponse {
  list: IndividualShareholderItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export function useIndividualShareholders(params: UseIndividualShareholdersParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  query.append('category', params.category);
  if (params.keyword?.trim()) {
    query.append('keyword', params.keyword.trim());
  }

  const fetcher = async (url: string) => {
    return apiClient.get<IndividualShareholderResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<IndividualShareholderResponse>(
    `/api/v1/individual-shareholders?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch individual shareholders:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
