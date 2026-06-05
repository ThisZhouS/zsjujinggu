import useSWR from 'swr';
import apiClient from '@/lib/api';

export type AdPosition =
  | 'HOME_TOP'
  | 'HOME_VIDEO_HERO'
  | 'HOME_SIDEBAR'
  | 'ARTICLE_BOTTOM'
  | 'MOBILE_BANNER';

export type AdMediaType = 'IMAGE' | 'VIDEO';

export interface AdItem {
  id: number;
  position: AdPosition;
  mediaType: AdMediaType;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  linkUrl: string;
  isActive: boolean;
  priority: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

const fetcher = async (url: string) => apiClient.get<AdItem[]>(url);

export function useAdsByPosition(position: AdPosition) {
  const { data, error, isLoading, mutate } = useSWR<AdItem[]>(
    position ? `/api/v1/ads/${position}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}
