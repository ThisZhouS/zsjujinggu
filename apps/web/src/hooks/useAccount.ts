import useSWR from 'swr';
import apiClient from '@/lib/api';
import { isUnauthorizedError } from '@/lib/api-error';

export interface AccountProfile {
  id: number;
  phone: string;
  phoneMasked: string;
  email?: string | null;
  emailVerifiedAt?: string | null;
  username?: string | null;
  nickname?: string | null;
  role: 'USER' | 'ADMIN';
  canUploadArticles: boolean;
  canAccessVideos: boolean;
  vipExpiresAt?: string | null;
  avatar?: string | null;
  createdAt: string;
}

interface UseAccountOptions {
  enabled?: boolean;
  requireAuth?: boolean;
}

export function useAccount(options?: UseAccountOptions) {
  const enabled = options?.enabled ?? true;
  const requireAuth = options?.requireAuth ?? true;

  const fetcher = async (url: string) => {
    return apiClient.get<AccountProfile>(url, {
      skipAuthRedirect: !requireAuth,
    });
  };

  const { data, error, isLoading, mutate } = useSWR<AccountProfile>(
    enabled ? '/api/v1/account/profile' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        if (isUnauthorizedError(error)) {
          return;
        }
        console.error('Failed to fetch account:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}
