/**
 * Dividend Service - 分红业务逻辑层
 * 负责分红数据查询、股息率排行
 */

import { Injectable } from '@nestjs/common';
import { BusinessDataSlot } from '@prisma/client';
import {
  DividendMetricBackfillSummary,
  DividendMetricCoverageSummary,
  DividendRankingMode,
  DividendRepository,
  DividendYieldRow,
} from './dividend.repository';

export interface DividendResult {
  list: DividendYieldRow[];
  total: number;
}

@Injectable()
export class DividendService {
  constructor(private dividendRepository: DividendRepository) {}

  /**
   * 获取股息率排行榜
   */
  async getDividendYieldRanking(options: {
    page: number;
    pageSize: number;
    year?: number;
    mode?: DividendRankingMode;
  }): Promise<DividendResult> {
    const result = await this.dividendRepository.getDividendYieldRanking(options);

    return {
      list: result.list,
      total: result.total,
    };
  }

  async backfillDividendMetrics(
    dataSlot?: BusinessDataSlot,
  ): Promise<DividendMetricBackfillSummary> {
    return this.dividendRepository.backfillDividendMetrics(dataSlot);
  }

  async getDividendMetricCoverage(
    dataSlot?: BusinessDataSlot,
  ): Promise<DividendMetricCoverageSummary> {
    return this.dividendRepository.getDividendMetricCoverage(dataSlot);
  }

  /**
   * 获取股票分红历史
   */
  async getStockDividends(stockCode: string) {
    const [dividends, priceMeta, totalShares] = await Promise.all([
      this.dividendRepository.findByStockCode(stockCode),
      this.dividendRepository.getEffectiveStockPriceMeta(stockCode),
      this.dividendRepository.getEffectiveTotalShares(stockCode),
    ]);

    return dividends.map((div) => {
      const cashDividend = div.cashDividend != null ? Number(div.cashDividend) : null;
      const currentPrice =
        priceMeta?.currentPrice ??
        (div.stock.currentPrice != null ? Number(div.stock.currentPrice) : null);
      const totalMarketCap =
        priceMeta?.totalMarketCap ??
        (div.stock.totalMarketCap != null ? Number(div.stock.totalMarketCap) : null);
      const estimatedTotalDividend = (() => {
        if (cashDividend == null) {
          return null;
        }

        if (totalShares != null && totalShares > 0) {
          return Number((cashDividend * totalShares).toFixed(2));
        }

        if (
          currentPrice == null ||
          currentPrice <= 0 ||
          totalMarketCap == null ||
          totalMarketCap <= 0
        ) {
          return null;
        }

        return Number(((cashDividend * totalMarketCap) / currentPrice).toFixed(2));
      })();
      const dividendYield =
        cashDividend != null && currentPrice != null && currentPrice > 0
          ? Number(((cashDividend / currentPrice) * 100).toFixed(4))
          : div.dividendYield != null
            ? Number(div.dividendYield)
            : null;

      return {
        id: Number(div.id),
        stockCode: div.stockCode,
        stockName: div.stockName,
        dividendYear: div.dividendYear,
        dividendDate: div.dividendDate,
        cashDividend,
        bonusShare: div.bonusShare != null ? Number(div.bonusShare) : null,
        transferShare: div.transferShare != null ? Number(div.transferShare) : null,
        totalDividend: div.totalDividend != null ? Number(div.totalDividend) : estimatedTotalDividend,
        dividendYield,
        currentPrice,
        dataSlot: div.dataSlot,
        createdAt: div.createdAt,
        updatedAt: div.updatedAt,
      };
    });
  }
}
