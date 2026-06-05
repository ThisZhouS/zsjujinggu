/**
 * Holding Service - 持仓业务逻辑层
 * 负责业务逻辑、计算、跨 Repository 聚合
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { HoldingRepository } from './holding.repository';
import { StockRepository } from '@/domain/stock/stock.repository';
import { HoldingChangeRow, CommonHoldingRow } from './holding.repository';

export interface HoldingChangeResult {
  list: HoldingChangeRow[];
  total: number;
}

export interface CommonHoldingResult {
  list: CommonHoldingRow[];
  total: number;
}

export interface HoldingNewStockAggregateRow {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  totalMarketValue: number;
  changeMarketValue: number;
  newInvestorCount: number;
  investorNames: string[];
  reportDate: string;
  industry?: string | null;
  mainRevenue?: number | null;
  revenueReportDate?: string | null;
}

export interface HoldingNewStockAggregateResult {
  list: HoldingNewStockAggregateRow[];
  total: number;
}

@Injectable()
export class HoldingService {
  constructor(
    private holdingRepository: HoldingRepository,
    private stockRepository: StockRepository,
  ) {}

  private async enrichStockBusinessFields<
    T extends {
      stockCode: string;
      industry?: string | null;
    },
  >(rows: T[]): Promise<Array<T & {
    industry: string | null;
    mainRevenue: number | null;
    revenueReportDate: string | null;
  }>> {
    if (rows.length === 0) {
      return [];
    }

    const stockCodes = Array.from(new Set(rows.map((row) => row.stockCode)));
    const [stocks, revenueRows] = await Promise.all([
      this.stockRepository.findByCodes(stockCodes),
      this.stockRepository.findLatestRevenueByCodes(stockCodes),
    ]);

    const stockMap = new Map(stocks.map((stock) => [stock.code, stock]));
    const revenueMap = new Map(revenueRows.map((row) => [row.stockCode, row]));

    return rows.map((row) => {
      const stock = stockMap.get(row.stockCode);
      const revenue = revenueMap.get(row.stockCode);

      return {
        ...row,
        industry: row.industry ?? stock?.industry ?? null,
        mainRevenue: revenue?.mainRevenue ?? null,
        revenueReportDate: revenue?.reportDate ?? null,
      };
    });
  }

  /**
   * 获取增持榜单
   */
  async getIncreaseList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingChangeResult> {
    const result = await this.holdingRepository.findIncrease(options);

    return {
      list: await this.enrichStockBusinessFields(result.list),
      total: result.total,
    };
  }

  /**
   * 获取减持榜单
   */
  async getDecreaseList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingChangeResult> {
    const result = await this.holdingRepository.findDecrease(options);

    return {
      list: await this.enrichStockBusinessFields(result.list),
      total: result.total,
    };
  }

  /**
   * 获取新进榜单
   */
  async getNewList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingChangeResult> {
    const result = await this.holdingRepository.findNew(options);

    return {
      list: await this.enrichStockBusinessFields(result.list),
      total: result.total,
    };
  }

  /**
   * 获取按股票聚合的新进榜单
   */
  async getNewStockSummaryList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingNewStockAggregateResult> {
    const result = await this.holdingRepository.findNewStockSummary(options);

    return {
      list: await this.enrichStockBusinessFields(result.list),
      total: result.total,
    };
  }

  /**
   * 获取共同持仓
   */
  async getCommonHoldings(options: {
    page: number;
    pageSize: number;
    investorIds?: string;
  }): Promise<CommonHoldingResult> {
    const { investorIds } = options;

    // 如果没有传入 investorIds，返回所有共同持仓
    let ids: number[] = [];
    if (investorIds) {
      ids = investorIds.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
    }

    // 如果传了但少于 2 个，报错
    if (investorIds && ids.length < 2) {
      throw new BadRequestException('至少需要选择 2 个牛散');
    }

    const result = await this.holdingRepository.findCommonHoldings({
      investorIds: ids,
      page: options.page,
      pageSize: options.pageSize,
    });

    return {
      list: await this.enrichStockBusinessFields(result.list),
      total: result.total,
    };
  }

  /**
   * 获取牛散持仓明细
   */
  async getInvestorHoldings(investorId: number) {
    return this.holdingRepository.findByInvestorId(investorId);
  }

  /**
   * 获取股票持仓明细
   */
  async getStockHoldings(stockCode: string) {
    return this.holdingRepository.findByStockCode(stockCode);
  }
}
