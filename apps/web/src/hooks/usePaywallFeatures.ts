import useSWR from 'swr';
import apiClient from '@/lib/api';

export interface PaywallFeatureView {
  featureKey: string;
  title: string;
  description: string;
  requiredPlan: 'USER';
  status: 'ACTIVE' | 'RESERVED';
  dataScope: string;
  previewLimit: number;
  fullLimit: number;
  apiPath: string;
  canAccess: boolean;
  reason: string | null;
}

export interface PaywallPreviewHolding {
  stockCode: string;
  stockName: string;
  marketValue: number;
  holdCount: number;
  reportDate: string;
}

export interface PaywallPreviewItem {
  rank: number;
  label: string;
  metric: string;
  masked: boolean;
  investorId?: number;
  name?: string;
  category?: 'personal' | 'institution';
  totalMarketValue?: number;
  stockCount?: number;
  latestReportDate?: string | null;
  topHoldings?: PaywallPreviewHolding[];
  stockCode?: string;
  stockName?: string;
  holdCount?: number;
  currentPrice?: number | null;
  holdingMarketValue?: number;
}

export interface PaywallFeaturePreviewResponse {
  feature: PaywallFeatureView;
  list: PaywallPreviewItem[];
}

export function usePaywallFeaturePreview(featureKey: string) {
  const fetcher = async (url: string) => {
    return apiClient.get<PaywallFeaturePreviewResponse>(url, {
      skipAuthRedirect: true,
    });
  };

  const { data, error, isLoading, mutate } = useSWR<PaywallFeaturePreviewResponse>(
    featureKey ? `/api/v1/paywall/features/${featureKey}/preview` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch paywall feature preview:', error);
      },
    },
  );

  return { data, error, isLoading, mutate };
}
