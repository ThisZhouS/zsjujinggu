/**
 * 股票相关类型定义
 */

export interface Stock {
  code: string;
  name: string;
  industry?: string;
  market: 'A' | 'HK' | 'US';
  listingDate?: Date;
  currentPrice?: number;
  totalMarketCap?: number;
  priceUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockQuote {
  code: string;
  name: string;
  currentPrice: number;
  preClose: number;
  change: number;
  changePercent: number;
  volume: number;
  amount: number;
  high: number;
  low: number;
  open: number;
  marketCap: number;
  timestamp: Date;
}

export interface TopGainerItem {
  code: string;
  name: string;
  industry?: string;
  currentPrice: number;
  changePercent: number;
  change: number;
  turnover: number;
  high: number;
  low: number;
  open: number;
  preClose: number;
  volume: number;
  amount: number;
  pe?: number;
  marketCap: number;
  listDate?: Date;
  isNewStock?: boolean;
  limitUp?: number; // 封板资金
  continuousLimitDays?: number; // 连板天数
  industryRank?: number; // 行业排名
}

export interface LimitUpData {
  date: string;
  items: TopGainerItem[];
  total: number;
}
