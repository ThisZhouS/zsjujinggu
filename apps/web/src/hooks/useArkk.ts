import { useArticles } from './useArticles';

interface UseArkkHoldingsParams {
  page: number;
  page_size: number;
}

export function useArkkHoldings(params: UseArkkHoldingsParams) {
  return useArticles({
    ...params,
    category: 'arkk',
    topicType: 'general',
  });
}
