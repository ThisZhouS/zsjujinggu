import useSWR from 'swr';
import apiClient from '@/lib/api';

interface UseOrdersParams {
  page: number;
  page_size: number;
}

type OrderStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'EXPIRED';
type MemberPlan = 'VIP_MONTHLY' | 'VIP_YEARLY' | 'LIFETIME';
type PaymentType = 'WECHAT' | 'ALIPAY';

export interface OrderItem {
  id: number;
  orderNo: string;
  userId: number;
  plan: MemberPlan;
  productName: string;
  amount: number;
  status: OrderStatus;
  paymentType: PaymentType;
  expiresAt: string;
  paidAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  list: OrderItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export function useOrders(params: UseOrdersParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());

  const fetcher = async (url: string) => {
    return apiClient.get<OrdersResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
    `/api/v1/orders?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch orders:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
