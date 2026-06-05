/**
 * 持仓相关类型定义
 */

export interface Holding {
  id: number;
  investorId: number;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdRatio: number | null;
  actualCost: number | null;
  reportDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncreaseItem {
  investorId: number;
  investorName: string;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdChange: number;
  holdRatio: number | null;
  reportDate: string;
  currentPrice?: number;
  holdMarketValue?: number;
}

export interface DecreaseItem {
  investorId: number;
  investorName: string;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdChange: number;
  holdRatio: number | null;
  reportDate: string;
  currentPrice?: number;
}

export interface NewItem {
  investorId: number;
  investorName: string;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdRatio: number | null;
  reportDate: string;
  currentPrice?: number;
  holdMarketValue?: number;
}

export interface CommonHoldingItem {
  stockCode: string;
  stockName: string;
  investors: {
    investorId: number;
    investorName: string;
    holdCount: number;
    holdRatio: number | null;
  }[];
  totalInvestors: number;
  currentPrice?: number;
  marketCap?: number;
}
