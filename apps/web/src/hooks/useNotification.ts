import useSWR from 'swr';
import apiClient from '@/lib/api';

interface UseNotificationsParams {
  page: number;
  page_size: number;
}

export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  relatedId?: number | null;
  createdAt: string;
}

export interface NotificationResponse {
  list: NotificationItem[];
  unreadCount: number;
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export function useNotifications(params: UseNotificationsParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());

  const fetcher = async (url: string) => {
    return apiClient.get<NotificationResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<NotificationResponse>(
    `/api/v1/notifications?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch notifications:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
