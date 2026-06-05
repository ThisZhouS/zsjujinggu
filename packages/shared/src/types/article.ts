/**
 * 文章相关类型定义
 */

export interface Article {
  id: number;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  author?: string;
  category?: 'buffett' | 'arkk' | 'general';
  topicType?: 'general' | 'investor' | 'executive';
  relatedInvestorId?: number | null;
  relatedStockCode?: string | null;
  relatedExecutiveName?: string | null;
  automationProvider?: 'openclaw' | 'harness' | null;
  automationExternalId?: string | null;
  sourceUrl?: string | null;
  sourceMetadata?: string | null;
  publishDate: Date;
  isPinned: boolean;
  viewCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleListItem {
  id: number;
  title: string;
  summary: string;
  coverImage?: string;
  author?: string;
  category?: string;
  publishDate: Date;
  isPinned: boolean;
  viewCount: number;
}

export interface ArticleDetail extends Article {}
