import useSWR from 'swr';
import apiClient from '@/lib/api';

export function useStockPrice(code: string, enabled = true) {
  const fetcher = async (url: string) => {
    return apiClient.get(url);
  };

  const { data, error, isLoading, mutate } = useSWR(
    enabled && code ? `/api/v1/stocks/${code}/quote` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 5000, // 每5秒刷新一次
      onError: (error) => {
        console.error('Failed to fetch stock price:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
