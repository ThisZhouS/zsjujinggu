import { useArticles } from './useArticles';

interface UseBuffettHoldingsParams {
  page: number;
  page_size: number;
}

export function useBuffettHoldings(params: UseBuffettHoldingsParams) {
  return useArticles({
    ...params,
    category: 'buffett',
    topicType: 'general',
  });
}
