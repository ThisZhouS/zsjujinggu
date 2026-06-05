/**
 * 高管交易相关类型定义
 */

export interface Executive {
  id: number;
  stockCode: string;
  stockName: string;
  name: string;
  position: string;
  title?: string;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutiveTrade {
  id: number;
  stockCode: string;
  stockName: string;
  executiveName: string;
  executivePosition: string;
  tradeType: 'increase' | 'decrease' | 'same';
  tradeCount: number;
  tradePrice: number | null;
  tradeAmount: number | null;
  tradeDate: Date;
  reportDate: Date;
  createdAt: Date;
}

export interface ExecutiveIncreaseItem {
  stockCode: string;
  stockName: string;
  executiveName: string;
  executivePosition: string;
  tradeCount: number;
  tradePrice: number | null;
  tradeAmount: number | null;
  tradeDate: string;
  reportDate: string;
  currentPrice?: number;
  changePercent?: number;
}
