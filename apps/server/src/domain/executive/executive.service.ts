/**
 * Executive Service - 高管交易业务逻辑层
 * 负责高管交易数据查询
 */

import { Injectable } from '@nestjs/common';
import { ExecutiveRepository } from './executive.repository';
import { StockRepository } from '@/domain/stock/stock.repository';

export interface ExecutiveResult {
  list: any[];
  total: number;
}

export interface ExecutiveIncreaseItem {
  stockCode: string;
  stockName: string;
  totalIncreaseShares: number;
  estimatedIncreaseMarketValue: number | null;
  executiveCount: number;
  executives: string[];
  industry: string | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  mainRevenue: number | null;
  revenueReportDate: string | null;
  reportDate: string;
  latestAnnouncementDate: string | null;
}

export interface ExecutiveIncreaseResult {
  list: ExecutiveIncreaseItem[];
  total: number;
  reportDate: string | null;
}

@Injectable()
export class ExecutiveService {
  constructor(
    private executiveRepository: ExecutiveRepository,
    private stockRepository: StockRepository,
  ) {}

  /**
   * 获取高管增持列表
   */
  async getIncreaseList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<ExecutiveIncreaseResult> {
    const { page, pageSize, keyword, reportDate } = options;
    const rows = await this.executiveRepository.findRealIncreaseRows({
      keyword,
      reportDate,
    });

    if (rows.length === 0) {
      return {
        list: [],
        total: 0,
        reportDate: null,
      };
    }

    const stockCodes = Array.from(new Set(rows.map((row) => row.stockCode)));
    const revenueRows = await this.stockRepository.findLatestRevenueByCodes(stockCodes);
    const revenueMap = new Map(revenueRows.map((row) => [row.stockCode, row]));
    const groupedMap = new Map<string, ExecutiveIncreaseItem & { executiveSet: Set<string> }>();

    for (const row of rows) {
      const revenue = revenueMap.get(row.stockCode);
      const executiveLabel = row.executivePosition
        ? `${row.executiveName}（${row.executivePosition}）`
        : row.executiveName;

      if (!groupedMap.has(row.stockCode)) {
        groupedMap.set(row.stockCode, {
          stockCode: row.stockCode,
          stockName: row.stockName,
          totalIncreaseShares: 0,
          estimatedIncreaseMarketValue: 0,
          executiveCount: 0,
          executives: [],
          industry: row.industry ?? null,
          currentPrice: row.currentPrice ?? null,
          totalMarketCap: row.totalMarketCap ?? null,
          mainRevenue: revenue?.mainRevenue ?? null,
          revenueReportDate: revenue?.reportDate ?? null,
          reportDate: row.reportDate,
          latestAnnouncementDate: row.announcementDate,
          executiveSet: new Set<string>(),
        });
      }

      const item = groupedMap.get(row.stockCode)!;
      item.totalIncreaseShares += row.increaseShares;
      item.estimatedIncreaseMarketValue =
        item.currentPrice != null
          ? Number((item.totalIncreaseShares * item.currentPrice).toFixed(2))
          : null;
      item.executiveSet.add(executiveLabel);
      if (
        row.announcementDate &&
        (!item.latestAnnouncementDate || row.announcementDate > item.latestAnnouncementDate)
      ) {
        item.latestAnnouncementDate = row.announcementDate;
      }
    }

    const groupedList = Array.from(groupedMap.values())
      .map(({ executiveSet, ...item }) => ({
        ...item,
        executiveCount: executiveSet.size,
        executives: Array.from(executiveSet),
      }))
      .sort((a, b) => {
        const leftMarketValue = a.estimatedIncreaseMarketValue ?? -1;
        const rightMarketValue = b.estimatedIncreaseMarketValue ?? -1;
        if (rightMarketValue !== leftMarketValue) {
          return rightMarketValue - leftMarketValue;
        }
        return b.totalIncreaseShares - a.totalIncreaseShares;
      });

    const start = (page - 1) * pageSize;
    return {
      list: groupedList.slice(start, start + pageSize),
      total: groupedList.length,
      reportDate: groupedList[0]?.reportDate ?? null,
    };
  }

  /**
   * 获取股票高管交易历史
   */
  async getStockTrades(stockCode: string) {
    return this.executiveRepository.findByStockCode(stockCode);
  }

  /**
   * 获取历届高管成员列表
   */
  async getMemberList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
  }): Promise<ExecutiveResult> {
    const [list, total] = await Promise.all([
      this.executiveRepository.findMembers(options),
      this.executiveRepository.countMembers(options.keyword),
    ]);

    return {
      list,
      total,
    };
  }
}
