import useSWR from 'swr';
import apiClient from '@/lib/api';

interface UseWatchlistParams {
  page: number;
  page_size: number;
}

export interface WatchlistItem {
  id: number;
  userId: number;
  stockCode: string;
  stockName: string;
  sortOrder: number;
  currentPrice: number | null;
  changePercent: number | null;
  createdAt: string;
  updatedAt: string;
}

interface WatchlistResponse {
  list: WatchlistItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export function useWatchlist(params: UseWatchlistParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());

  const fetcher = async (url: string) => {
    return apiClient.get<WatchlistResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<WatchlistResponse>(
    `/api/v1/watchlist?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch watchlist:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
