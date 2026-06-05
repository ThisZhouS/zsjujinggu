import useSWR from 'swr';
import apiClient from '@/lib/api';

export type PriceAlertType = 'ABOVE' | 'BELOW';

export interface PriceAlertItem {
  id: number;
  userId: number;
  stockCode: string;
  stockName: string;
  alertType: PriceAlertType;
  targetPrice: number;
  isActive: boolean;
  triggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function usePriceAlerts() {
  const fetcher = async (url: string) => {
    return apiClient.get<PriceAlertItem[]>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<PriceAlertItem[]>(
    '/api/v1/price-alerts',
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch price alerts:', error);
      },
    },
  );

  return { data, error, isLoading, mutate };
}
