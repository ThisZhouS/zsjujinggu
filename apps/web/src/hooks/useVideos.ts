import useSWR from 'swr';
import apiClient from '@/lib/api';

export type VideoAccessLevel = 'PUBLIC' | 'USER' | 'VIDEO' | 'VIP';

export interface VideoItem {
  id: number;
  title: string;
  summary: string | null;
  description: string | null;
  coverUrl: string | null;
  videoUrl: string;
  durationSec: number | null;
  accessLevel: VideoAccessLevel;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoListResponse {
  list: VideoItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface UseVideosParams {
  page: number;
  page_size: number;
  featured?: boolean;
}

export function useVideos(params: UseVideosParams) {
  const query = new URLSearchParams();
  query.append('page', String(params.page));
  query.append('page_size', String(params.page_size));
  if (params.featured) {
    query.append('featured', 'true');
  }

  const fetcher = async (url: string) =>
    apiClient.get<VideoListResponse>(url, {
      skipAuthRedirect: true,
    });

  const { data, error, isLoading, mutate } = useSWR<VideoListResponse>(
    `/api/v1/videos?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}

export function useVideoDetail(id?: number | null) {
  const fetcher = async (url: string) =>
    apiClient.get<VideoItem>(url, {
      skipAuthRedirect: true,
    });

  const { data, error, isLoading, mutate } = useSWR<VideoItem>(
    id ? `/api/v1/videos/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return { data, error, isLoading, mutate };
}
