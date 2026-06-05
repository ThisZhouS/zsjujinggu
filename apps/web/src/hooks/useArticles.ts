import useSWR from 'swr';
import apiClient from '@/lib/api';

export type ArticleCategory = 'buffett' | 'arkk' | 'general';
export type ArticleTopicType = 'general' | 'investor' | 'executive';
export type AutomationProviderType = 'openclaw' | 'harness';

export interface ArticleItem {
  id: number;
  title: string;
  content: string;
  summary?: string | null;
  coverImage?: string | null;
  author?: string | null;
  category?: ArticleCategory | null;
  topicType: ArticleTopicType;
  relatedInvestorId: number | null;
  relatedStockCode?: string | null;
  relatedExecutiveName?: string | null;
  automationProvider?: AutomationProviderType | null;
  automationExternalId?: string | null;
  sourceUrl?: string | null;
  sourceMetadata?: string | null;
  publishDate: string;
  isPinned: boolean;
  viewCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListResponse {
  list: ArticleItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface UseArticlesParams {
  page: number;
  page_size: number;
  category?: ArticleCategory;
  keyword?: string;
  topicType?: ArticleTopicType;
  relatedInvestorId?: number;
  relatedStockCode?: string;
  relatedExecutiveName?: string;
}

export function useArticles(params: UseArticlesParams) {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('page_size', params.page_size.toString());
  if (params.category) {
    query.append('category', params.category);
  }
  if (params.keyword?.trim()) {
    query.append('keyword', params.keyword.trim());
  }
  if (params.topicType) {
    query.append('topicType', params.topicType);
  }
  if (params.relatedInvestorId) {
    query.append('relatedInvestorId', params.relatedInvestorId.toString());
  }
  if (params.relatedStockCode?.trim()) {
    query.append('relatedStockCode', params.relatedStockCode.trim());
  }
  if (params.relatedExecutiveName?.trim()) {
    query.append('relatedExecutiveName', params.relatedExecutiveName.trim());
  }

  const fetcher = async (url: string) => {
    return apiClient.get<ArticleListResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<ArticleListResponse>(
    `/api/v1/articles?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch articles:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useArticleDetail(id: number) {
  const fetcher = async (url: string) => {
    return apiClient.get<ArticleItem>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<ArticleItem>(
    `/api/v1/articles/${id}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch article detail:', error);
      },
    }
  );

  return { data, error, isLoading, mutate };
}

export function useInvestorNews(investorId: number, pageSize: number = 6) {
  const fetcher = async (url: string) => {
    return apiClient.get<ArticleListResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<ArticleListResponse>(
    investorId > 0
      ? `/api/v1/articles/investor/${investorId}/news?page=1&page_size=${pageSize}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (requestError) => {
        console.error('Failed to fetch investor news:', requestError);
      },
    },
  );

  return { data, error, isLoading, mutate };
}

export function useExecutiveNews(options?: {
  page?: number;
  page_size?: number;
  relatedStockCode?: string;
  relatedExecutiveName?: string;
}) {
  const query = new URLSearchParams();
  query.append('page', String(options?.page ?? 1));
  query.append('page_size', String(options?.page_size ?? 6));
  if (options?.relatedStockCode?.trim()) {
    query.append('relatedStockCode', options.relatedStockCode.trim());
  }
  if (options?.relatedExecutiveName?.trim()) {
    query.append('relatedExecutiveName', options.relatedExecutiveName.trim());
  }

  const fetcher = async (url: string) => {
    return apiClient.get<ArticleListResponse>(url);
  };

  const { data, error, isLoading, mutate } = useSWR<ArticleListResponse>(
    `/api/v1/articles/executive/news?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (requestError) => {
        console.error('Failed to fetch executive news:', requestError);
      },
    },
  );

  return { data, error, isLoading, mutate };
}
