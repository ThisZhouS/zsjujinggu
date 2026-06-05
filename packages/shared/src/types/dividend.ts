/**
 * 分红相关类型定义
 */

export interface Dividend {
  id: number;
  stockCode: string;
  stockName: string;
  dividendYear: number;
  dividendDate?: Date;
  cashDividend: number | null; // 现金分红（每股）
  bonusShare: number | null; // 送股（每10股送股数）
  transferShare: number | null; // 转增股（每10股转增股数）
  totalDividend: number | null; // 总分红额
  dividendYield: number | null; // 股息率
  createdAt: Date;
  updatedAt: Date;
}

export interface DividendYieldItem {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  marketCap: number;
  industry?: string;
  totalDividend: number;
  dividendYield: number; // 股息率（%）
  dividendYear: number;
  pe?: number;
}

export interface DividendStats {
  stockCode: string;
  totalDividend: number; // 累计分红
  dividendYears: number; // 分红年数
  avgDividendYield: number; // 平均股息率
}
