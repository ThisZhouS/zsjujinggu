/**
 * 牛散相关类型定义
 */

export interface Investor {
  id: number;
  name: string;
  avatar?: string;
  bio?: string;
  totalMarketValue?: number;
  stockCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestorWithMarketValue extends Investor {
  totalMarketValue: number;
  stockCount: number;
}

export interface InvestorListItem {
  id: number;
  name: string;
  totalMarketValue: number;
  stockCount: number;
  avatar?: string;
}

export interface InvestorDetail extends Investor {
  holdings: HoldingRow[];
  totalMarketValue: number;
  stockCount: number;
  pieData: PieDataItem[];
}

export interface PieDataItem {
  name: string;
  value: number;
}

export interface HoldingRow {
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdChange: number;
  returnRate: number | null;
  holdRatio: number | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  reportDate: string;
  avgCost: number | null;
  holdMarketValue: number | null;
  actualCost: number | null;
  sellProfit: number | null;
}
