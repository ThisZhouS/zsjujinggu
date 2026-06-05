/**
 * Natural Person Holder Service - 自然人股东持仓业务逻辑层
 * 负责：
 * 1. 加权平均成本计算（增持按市价累加，减持按均价扣减）
 * 2. 每期当期全部卖出收益计算
 * 3. 分红收益计算
 *
 * 持股记录按代表性报告期输出。已进入十大流通股东后，连续两个季度未出现则输出清仓记录。
 */

import { Injectable } from '@nestjs/common';
import {
  NaturalPersonHolderRepository,
  RawHolderData,
  TradingData,
  DividendData,
} from './natural-person-holder.repository';
import {
  HoldingRepository,
  TrackedHoldingSnapshot,
} from '@/domain/holding/holding.repository';
import { TopGainerRepository } from '@/domain/top-gainer/top-gainer.repository';
import { GainerPeriod } from '@/domain/top-gainer/dto/top-gainer.dto';
import { InvestorCategory } from '@/common/utils/investor-name-filter';

export interface HoldingRecord {
  stockCode: string;
  stockName: string;
  reportDate: string;
  holdAmount: number;
  holdChange: number;
  holdRatio: number;
  closePricePeriod: number | null;
  avgCostPerShare: number | null;
  totalInvestedCost: number;
  marketValue: number | null;
  unrealizedGain: number | null;
  currentPrice: number | null;
  currentGainRate: number | null;
  profitIfSellAll: number | null;
  isCleared?: boolean;
}

export interface HoldingsHistoryResult {
  shareholderName: string;
  holdings: HoldingRecord[];
}

export interface TopFlowTrackingRecord {
  stockCode: string;
  stockName: string;
  firstEntryReportDate: string;
  reportDate: string;
  isInTopFlowHolders: boolean;
  holderRank: string | null;
  announcementDate: string | null;
  holdAmount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  marketValue: number;
  changeReason: string | null;
  shareholderType: string | null;
}

export interface TopFlowTrackingResult {
  shareholderName: string;
  tracking: TopFlowTrackingRecord[];
}

export interface DividendRecord {
  stockCode: string;
  stockName: string;
  dividendDate: string;
  dividendPerShare: number;
  holdAmount: number;
  totalDividend: number;
  priceOnExDate: number | null;
  dividendYield: number | null;
}

export interface DividendRecordsResult {
  shareholderName: string;
  dividendRecords: DividendRecord[];
}

export interface HiddenShareholderMatchedStock {
  stockCode: string;
  stockName: string;
  reportDate: string;
  holdCount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  marketValue: number;
  sourceMetric: number;
  sourceMetricLabel: string;
}

export interface HiddenShareholderRow {
  investorId: number;
  shareholderName: string;
  matchedStockCount: number;
  matchedMarketValue: number;
  latestReportDate: string;
  totalMarketValue: number;
  stockCount: number;
  matchedStocks: HiddenShareholderMatchedStock[];
}

export interface HiddenShareholderResult {
  period: string;
  sourceStockCount: number;
  list: HiddenShareholderRow[];
}

interface CostState {
  totalCost: number;
  prevHold: number;
}

@Injectable()
export class NaturalPersonHolderService {
  constructor(
    private naturalPersonHolderRepository: NaturalPersonHolderRepository,
    private topGainerRepository: TopGainerRepository,
    private holdingRepository: HoldingRepository,
  ) {}

  /**
   * 获取自然人股东的持仓历史（含成本收益计算）
   * 按代表性报告期输出，仅输出有持仓的记录
   */
  async getHoldingsHistory(shareholderName: string): Promise<HoldingsHistoryResult> {
    const rawHoldings = await this.naturalPersonHolderRepository.findNaturalPersonHolders({
      shareholderName,
    });

    if (rawHoldings.length > 0) {
      const allReportDates = await this.getTimelineReportDates();
      return this.buildHoldingsHistory(shareholderName, rawHoldings, allReportDates);
    }

    const fallbackSnapshots =
      await this.naturalPersonHolderRepository.findHoldingSnapshotsByShareholderName(
        shareholderName,
      );

    if (fallbackSnapshots.length === 0) {
      return { shareholderName, holdings: [] };
    }

    const syntheticRows = fallbackSnapshots.map((snapshot) => ({
      dm: this.canonicalizeStockCode(snapshot.stockCode),
      ggrq: null,
      jzrq: snapshot.reportDate,
      gdmc: shareholderName,
      gdlx: '自然人',
      cgsl: snapshot.holdCount,
      bdyy: null,
      cgbl: snapshot.holdRatio,
      gfxz: null,
      cgpm: null,
    }));

    const fallbackReportDates = Array.from(
      new Set(
        fallbackSnapshots
          .map((snapshot) => snapshot.reportDate)
          .filter((reportDate): reportDate is string => Boolean(reportDate)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const stockNameMap = new Map<string, string>();
    for (const snapshot of fallbackSnapshots) {
      const canonicalCode = this.canonicalizeStockCode(snapshot.stockCode);
      if (!stockNameMap.has(canonicalCode) && snapshot.stockName) {
        stockNameMap.set(canonicalCode, snapshot.stockName);
      }
    }

    return this.buildHoldingsHistory(
      shareholderName,
      syntheticRows,
      fallbackReportDates,
      stockNameMap,
    );
  }

  /**
   * 获取牛散进入某只股票十大流通股东后的连续期次追踪记录
   * 自首次进入起，对后续每一个报告期都生成一条记录，即使该期已不在前十大中
   */
  async getTopFlowTracking(
    shareholderName: string,
    stockCode?: string,
  ): Promise<TopFlowTrackingResult> {
    const rawHoldings = await this.naturalPersonHolderRepository.findNaturalPersonHolders({
      shareholderName,
      stockCode,
    });

    if (rawHoldings.length === 0) {
      return {
        shareholderName,
        tracking: [],
      };
    }

    const allReportDates = await this.getTimelineReportDates();
    const groupedRows = new Map<string, RawHolderData[]>();

    for (const row of rawHoldings) {
      if (!row.dm || !row.jzrq) {
        continue;
      }

      const canonicalStockCode = this.canonicalizeStockCode(row.dm);
      if (!groupedRows.has(canonicalStockCode)) {
        groupedRows.set(canonicalStockCode, []);
      }
      groupedRows.get(canonicalStockCode)!.push({
        ...row,
        dm: canonicalStockCode,
      });
    }

    const tracking: TopFlowTrackingRecord[] = [];

    for (const [canonicalStockCode, rows] of groupedRows.entries()) {
      const rowMap = new Map<string, RawHolderData>();
      for (const row of rows) {
        if (!row.jzrq) {
          continue;
        }

        const existing = rowMap.get(row.jzrq);
        const nextHoldAmount = row.cgsl ?? 0;
        const existingHoldAmount = existing?.cgsl ?? -1;
        if (!existing || nextHoldAmount >= existingHoldAmount) {
          rowMap.set(row.jzrq, row);
        }
      }

      const firstEntryReportDate = allReportDates.find((reportDate) => rowMap.has(reportDate));
      if (!firstEntryReportDate) {
        continue;
      }

      const relevantReportDates = allReportDates.filter(
        (reportDate) => reportDate >= firstEntryReportDate,
      );
      const [stockInfo, currentPrice] = await Promise.all([
        this.naturalPersonHolderRepository.getStockInfo(canonicalStockCode),
        this.naturalPersonHolderRepository.getLatestPrice(canonicalStockCode),
      ]);

      for (const reportDate of relevantReportDates) {
        const row = rowMap.get(reportDate);
        const holdAmount = row?.cgsl ?? 0;

        tracking.push({
          stockCode: canonicalStockCode,
          stockName: stockInfo?.name ?? canonicalStockCode,
          firstEntryReportDate,
          reportDate,
          isInTopFlowHolders: Boolean(row),
          holderRank: row?.cgpm ?? null,
          announcementDate: row?.ggrq ?? null,
          holdAmount,
          holdRatio: row?.cgbl ?? null,
          currentPrice,
          marketValue: currentPrice != null ? holdAmount * currentPrice : 0,
          changeReason: row?.bdyy ?? null,
          shareholderType: row?.gdlx ?? null,
        });
      }
    }

    tracking.sort((left, right) => {
      if (right.firstEntryReportDate !== left.firstEntryReportDate) {
        return right.firstEntryReportDate.localeCompare(left.firstEntryReportDate);
      }
      if (left.stockCode !== right.stockCode) {
        return left.stockCode.localeCompare(right.stockCode);
      }
      return right.reportDate.localeCompare(left.reportDate);
    });

    return {
      shareholderName,
      tracking,
    };
  }

  private async getTimelineReportDates(): Promise<string[]> {
    const representativeReportDates =
      await this.holdingRepository.getRepresentativeReportDateStrings();

    if (representativeReportDates.length > 0) {
      return representativeReportDates;
    }

    const rawReportDates = await this.naturalPersonHolderRepository.getAllReportDates();
    return rawReportDates.sort((left, right) => left.localeCompare(right));
  }

  private async buildHoldingsHistory(
    shareholderName: string,
    sourceRows: RawHolderData[],
    reportDates: string[],
    stockNameOverrides?: Map<string, string>,
  ): Promise<HoldingsHistoryResult> {
    const grouped = new Map<string, RawHolderData[]>();
    for (const row of sourceRows) {
      if (!row.gdmc || !row.dm) continue;
      const canonicalStockCode = this.canonicalizeStockCode(row.dm);
      const key = `${row.gdmc}|${canonicalStockCode}`;
      const normalizedRow: RawHolderData = {
        ...row,
        dm: canonicalStockCode,
      };
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(normalizedRow);
    }

    const allHoldings: HoldingRecord[] = [];

    for (const [key, rows] of grouped.entries()) {
      const [holderName, stockCode] = key.split('|');

      const holdingMap = new Map<string, RawHolderData>();
      for (const row of rows) {
        if (!row.jzrq) {
          continue;
        }

        const existing = holdingMap.get(row.jzrq);
        const nextHoldAmount = row.cgsl ?? 0;
        const existingHoldAmount = existing?.cgsl ?? -1;
        if (!existing || nextHoldAmount >= existingHoldAmount) {
          holdingMap.set(row.jzrq, row);
        }
      }

      const stockInfo = await this.naturalPersonHolderRepository.getStockInfo(stockCode);
      const stockName = stockInfo?.name ?? stockNameOverrides?.get(stockCode) ?? stockCode;
      const tradingData = await this.naturalPersonHolderRepository.findTradingData({ stockCode });
      const currentPrice = await this.naturalPersonHolderRepository.getLatestPrice(stockCode);

      const holdings = this.calculateHoldingsWithCost(
        holderName,
        stockCode,
        stockName,
        reportDates,
        holdingMap,
        tradingData,
        currentPrice,
      );

      allHoldings.push(...holdings);
    }

    return {
      shareholderName,
      holdings: allHoldings,
    };
  }

  private canonicalizeStockCode(code: string): string {
    const normalized = code.trim().toUpperCase().split('.')[0];

    if (
      normalized.startsWith('43') ||
      normalized.startsWith('83') ||
      normalized.startsWith('87') ||
      normalized.startsWith('92')
    ) {
      return `${normalized}.BJ`;
    }

    if (normalized.startsWith('688') || normalized.startsWith('689')) {
      return `${normalized}.SH`;
    }

    if (normalized.startsWith('6') || normalized.startsWith('9')) {
      return `${normalized}.SH`;
    }

    return `${normalized}.SZ`;
  }

  /**
   * 核心算法：按代表性报告期遍历，输出有持仓记录；连续两个报告期缺席后输出一次清仓记录。
   * 计算加权平均成本和当期全部卖出收益
   */
  private calculateHoldingsWithCost(
    shareholderName: string,
    stockCode: string,
    stockName: string,
    reportDates: string[],
    holdingMap: Map<string, RawHolderData>,
    tradingData: TradingData[],
    currentPrice: number | null,
  ): HoldingRecord[] {
    const holdings: HoldingRecord[] = [];

    const state: CostState = {
      totalCost: 0,
      prevHold: 0,
    };
    let missingQuarterCount = 0;
    let clearedEmitted = false;

    const tradingMap = new Map<string, TradingData>();
    for (const t of tradingData) {
      tradingMap.set(t.t, t);
    }

    const tradingDates = tradingData.map(t => t.t).sort();

    for (const reportDate of reportDates) {
      const row = holdingMap.get(reportDate);
      const holdAmount = row?.cgsl ?? 0;

      if (!row || holdAmount <= 0) {
        if (state.prevHold > 0) {
          missingQuarterCount += 1;
        }

        if (state.prevHold > 0 && missingQuarterCount >= 2 && !clearedEmitted) {
          const effectivePrice = this.findEffectivePrice(reportDate, tradingMap, tradingDates);
          const avgCostPerShare = state.totalCost > 0
            ? state.totalCost / state.prevHold
            : null;
          const profitIfSellAll = (avgCostPerShare !== null && effectivePrice !== null)
            ? state.prevHold * (effectivePrice - avgCostPerShare)
            : null;

          holdings.push({
            stockCode,
            stockName,
            reportDate,
            holdAmount: 0,
            holdChange: -state.prevHold,
            holdRatio: 0,
            closePricePeriod: effectivePrice,
            avgCostPerShare: avgCostPerShare !== null ? parseFloat(avgCostPerShare.toFixed(4)) : null,
            totalInvestedCost: parseFloat(state.totalCost.toFixed(2)),
            marketValue: 0,
            unrealizedGain: null,
            currentPrice,
            currentGainRate: null,
            profitIfSellAll: profitIfSellAll !== null ? parseFloat(profitIfSellAll.toFixed(2)) : null,
            isCleared: true,
          });

          state.totalCost = 0;
          state.prevHold = 0;
          clearedEmitted = true;
        }

        continue;
      }

      missingQuarterCount = 0;
      clearedEmitted = false;

      const holdRatio = row.cgbl ?? 0;
      const effectivePrice = this.findEffectivePrice(reportDate, tradingMap, tradingDates);

      // 成本计算
      const holdChange = holdAmount - state.prevHold;

      if (holdChange > 0 && state.prevHold > 0) {
        // 增持：新增投入 = 增持股数 * 当期价格
        const buyCost = holdChange * (effectivePrice ?? 0);
        state.totalCost += buyCost;
      } else if (holdChange < 0 && state.prevHold > 0) {
        // 减持：按加权均价扣减成本
        const avgCostBefore = state.totalCost / state.prevHold;
        const sellCost = (state.prevHold - holdAmount) * avgCostBefore;
        state.totalCost -= sellCost;
      } else if (state.prevHold === 0 && holdAmount > 0) {
        // 首次建仓或清仓后重新建仓
        state.totalCost = holdAmount * (effectivePrice ?? 0);
      }

      // 计算衍生指标
      const avgCostPerShare = state.totalCost > 0 ? state.totalCost / holdAmount : null;

      const marketValue = effectivePrice !== null
        ? holdAmount * effectivePrice
        : null;

      const unrealizedGain = (marketValue !== null && state.totalCost > 0)
        ? marketValue - state.totalCost
        : null;

      const currentGainRate = (avgCostPerShare !== null && currentPrice !== null && avgCostPerShare > 0)
        ? ((currentPrice - avgCostPerShare) / avgCostPerShare) * 100
        : null;

      const profitIfSellAll = (avgCostPerShare !== null && currentPrice !== null)
        ? holdAmount * (currentPrice - avgCostPerShare)
        : null;

      holdings.push({
        stockCode,
        stockName,
        reportDate,
        holdAmount,
        holdChange,
        holdRatio,
        closePricePeriod: effectivePrice,
        avgCostPerShare: avgCostPerShare !== null ? parseFloat(avgCostPerShare.toFixed(4)) : null,
        totalInvestedCost: parseFloat(state.totalCost.toFixed(2)),
        marketValue: marketValue !== null ? parseFloat(marketValue.toFixed(2)) : null,
        unrealizedGain: unrealizedGain !== null ? parseFloat(unrealizedGain.toFixed(2)) : null,
        currentPrice,
        currentGainRate: currentGainRate !== null ? parseFloat(currentGainRate.toFixed(2)) : null,
        profitIfSellAll: profitIfSellAll !== null ? parseFloat(profitIfSellAll.toFixed(2)) : null,
      });

      state.prevHold = holdAmount;
    }

    return holdings;
  }

  /**
   * 价格匹配：找到指定日期之前最近的交易日价格
   * 优先级：收盘价 (c) → 开盘价 (o)
   */
  private findEffectivePrice(
    reportDate: string,
    tradingMap: Map<string, TradingData>,
    tradingDates: string[],
  ): number | null {
    let targetDate = reportDate;
    let trading = tradingMap.get(targetDate);

    while (!trading && targetDate > tradingDates[0]) {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - 1);
      targetDate = date.toISOString().split('T')[0];
      trading = tradingMap.get(targetDate);
    }

    if (!trading) {
      let left = 0;
      let right = tradingDates.length - 1;
      let resultIndex = -1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (tradingDates[mid] <= reportDate) {
          resultIndex = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      if (resultIndex >= 0) {
        trading = tradingMap.get(tradingDates[resultIndex]);
      }
    }

    if (!trading) return null;

    if (trading.c !== null && trading.c !== undefined && trading.c > 0) {
      return trading.c;
    }
    if (trading.o !== null && trading.o !== undefined && trading.o > 0) {
      return trading.o;
    }

    return null;
  }

  /**
   * 获取自然人股东的分红记录
   */
  async getDividendRecords(shareholderName: string): Promise<DividendRecordsResult> {
    const holdingsResult = await this.getHoldingsHistory(shareholderName);

    if (holdingsResult.holdings.length === 0) {
      return { shareholderName, dividendRecords: [] };
    }

    const dividends = await this.naturalPersonHolderRepository.findDividends();
    if (dividends.length === 0) {
      return { shareholderName, dividendRecords: [] };
    }

    const stockCodes = [...new Set(dividends.map(d => d.dm))];
    const tradingDataMap = new Map<string, TradingData[]>();
    for (const stockCode of stockCodes) {
      const data = await this.naturalPersonHolderRepository.findTradingData({ stockCode });
      tradingDataMap.set(stockCode, data);
    }

    const holdingsIndex = new Map<string, Map<string, number>>();
    for (const h of holdingsResult.holdings) {
      if (!holdingsIndex.has(h.stockCode)) {
        holdingsIndex.set(h.stockCode, new Map());
      }
      holdingsIndex.get(h.stockCode)!.set(h.reportDate, h.holdAmount);
    }

    const lastPositiveDate = new Map<string, string>();
    for (const [stockCode, dateMap] of holdingsIndex.entries()) {
      let lastDate: string | null = null;
      for (const [date, amount] of dateMap.entries()) {
        if (amount > 0 && (!lastDate || date > lastDate)) {
          lastDate = date;
        }
      }
      if (lastDate) {
        lastPositiveDate.set(stockCode, lastDate);
      }
    }

    const dividendRecords: DividendRecord[] = [];

    for (const [stockCode, dateMap] of holdingsIndex.entries()) {
      const stockDividends = dividends.filter(d => d.dm === stockCode);
      const stockInfo = await this.naturalPersonHolderRepository.getStockInfo(stockCode);
      const stockName = stockInfo?.name ?? stockCode;

      const tradingData = tradingDataMap.get(stockCode) || [];
      const tradingMap = new Map<string, TradingData>();
      for (const t of tradingData) {
        tradingMap.set(t.t, t);
      }
      const tradingDates = tradingData.map(t => t.t).sort();

      const lastDateWithHoldings = lastPositiveDate.get(stockCode);
      if (!lastDateWithHoldings) continue;

      const holdingDates = [...dateMap.keys()].sort();

      for (const div of stockDividends) {
        const sendPer10 = this.parseDividendAmount(div.fhx);
        if (sendPer10 === null || sendPer10 <= 0) continue;

        const recordDate = div.fhjzr || div.plrq;
        if (!recordDate) continue;

        if (recordDate > lastDateWithHoldings) continue;

        const nearestDate = this.findNearestPositiveHoldingDate(recordDate, holdingDates, dateMap);
        if (!nearestDate) continue;

        const holdAmount = dateMap.get(nearestDate)!;

        const dividendPerShare = sendPer10 / 10;
        const totalDividend = holdAmount * dividendPerShare;

        const exDate = div.fhjzr || div.plrq;
        const exDatePrice = this.findExDatePrice(exDate, tradingMap, tradingDates);

        const dividendYield = (exDatePrice !== null && exDatePrice > 0 && dividendPerShare > 0)
          ? (dividendPerShare / exDatePrice) * 100
          : null;

        dividendRecords.push({
          stockCode,
          stockName,
          dividendDate: exDate,
          dividendPerShare: parseFloat(dividendPerShare.toFixed(2)),
          holdAmount,
          totalDividend: parseFloat(totalDividend.toFixed(2)),
          priceOnExDate: exDatePrice !== null ? parseFloat(exDatePrice.toFixed(2)) : null,
          dividendYield: dividendYield !== null ? parseFloat(dividendYield.toFixed(2)) : null,
        });
      }
    }

    dividendRecords.sort((a, b) => b.dividendDate.localeCompare(a.dividendDate));

    const seen = new Set<string>();
    const uniqueRecords: DividendRecord[] = [];
    for (const record of dividendRecords) {
      const key = `${record.stockCode}|${record.dividendDate}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRecords.push(record);
      }
    }

    return {
      shareholderName,
      dividendRecords: uniqueRecords,
    };
  }

  private findNearestPositiveHoldingDate(
    targetDate: string,
    holdingDates: string[],
    dateMap: Map<string, number>,
  ): string | null {
    let result: string | null = null;
    for (const date of holdingDates) {
      if (date <= targetDate && (dateMap.get(date) ?? 0) > 0) {
        if (!result || date > result) {
          result = date;
        }
      }
    }
    return result;
  }

  private parseDividendAmount(fhx: string | null): number | null {
    if (!fhx) return null;

    const match = fhx.match(/派\s*([\d.]+)\s*元/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }

    const numMatch = fhx.match(/([\d.]+)/);
    if (numMatch && numMatch[1]) {
      return parseFloat(numMatch[1]);
    }

    return null;
  }

  private findExDatePrice(
    exDate: string,
    tradingMap: Map<string, TradingData>,
    tradingDates: string[],
  ): number | null {
    let targetDate = exDate;
    let trading = tradingMap.get(targetDate);

    while (!trading && targetDate > tradingDates[0]) {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - 1);
      targetDate = date.toISOString().split('T')[0];
      trading = tradingMap.get(targetDate);
    }

    if (!trading) {
      let left = 0;
      let right = tradingDates.length - 1;
      let resultIndex = -1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (tradingDates[mid] <= exDate) {
          resultIndex = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      if (resultIndex >= 0) {
        trading = tradingMap.get(tradingDates[resultIndex]);
      }
    }

    if (!trading) return null;

    if (trading.h !== null && trading.l !== null && trading.h > 0 && trading.l > 0) {
      return (trading.h + trading.l) / 2;
    }

    if (trading.c !== null && trading.c > 0) {
      return trading.c;
    }

    return null;
  }

  /**
   * 获取所有自然人股东列表（含持仓摘要）
   */
  async getShareholderList(options?: {
    keyword?: string;
    minMarketValue?: number;
  }): Promise<{ shareholderName: string; stockCount: number; latestReportDate: string; totalMarketValue: number }[]> {
    const summary = await this.naturalPersonHolderRepository.getShareholderMarketValueSummary();

    const defaultThreshold = Number(process.env.NATURAL_PERSON_MIN_MARKET_VALUE) || 70000000;
    const minMarketValue = options?.minMarketValue ?? defaultThreshold;

    let results: { shareholderName: string; stockCount: number; latestReportDate: string; totalMarketValue: number }[] = [];
    for (const [name, data] of summary.entries()) {
      results.push({
        shareholderName: name,
        stockCount: data.stockCount,
        latestReportDate: data.latestReportDate,
        totalMarketValue: data.totalMarketValue,
      });
    }

    results = results.filter(r => r.totalMarketValue >= minMarketValue);
    results.sort((a, b) => b.totalMarketValue - a.totalMarketValue);

    if (options?.keyword) {
      results = results.filter(r => r.shareholderName.includes(options.keyword!));
    }

    return results;
  }

  async getHiddenShareholdersInTopGainers(options?: {
    period?: GainerPeriod;
    limit?: number;
    stockLimit?: number;
    category?: InvestorCategory;
  }): Promise<HiddenShareholderResult> {
    const period = options?.period ?? GainerPeriod.ONE_MONTH;
    const stockLimit = options?.stockLimit ?? 120;
    const limit = options?.limit ?? 12;
    const category = options?.category ?? 'personal';

    const trackedStockCodeSet = new Set(
      await this.holdingRepository.findTrackedStockCodes(category),
    );
    const gainers = await this.topGainerRepository.getHistoricalGainers(period);
    const sourceStocks = gainers
      .filter((row) => trackedStockCodeSet.has(row.code))
      .map((row) => ({
        stockCode: row.code,
        stockName: row.name,
        sourceMetric: row.changePercent,
        sourceMetricLabel: `${row.changePercent.toFixed(2)}%`,
      }));

    const { list, sourceStockCount } = await this.buildHiddenShareholderRows(
      sourceStocks,
      limit,
      stockLimit,
      category,
    );

    return {
      period,
      sourceStockCount,
      list,
    };
  }

  async getHiddenShareholdersInLimitUp(options?: {
    period?: string;
    limit?: number;
    stockLimit?: number;
    category?: InvestorCategory;
  }): Promise<HiddenShareholderResult> {
    const period = options?.period ?? GainerPeriod.ONE_MONTH;
    const stockLimit = options?.stockLimit ?? 120;
    const limit = options?.limit ?? 12;
    const category = options?.category ?? 'personal';

    const trackedStockCodeSet = new Set(
      await this.holdingRepository.findTrackedStockCodes(category),
    );
    const stats = await this.topGainerRepository.getLimitUpCountStats(period);
    const sourceStocks = stats
      .filter((row) => trackedStockCodeSet.has(row.dm.split('.')[0]))
      .map((row) => ({
        stockCode: row.dm.split('.')[0],
        stockName: row.mc ?? row.dm,
        sourceMetric: row.count,
        sourceMetricLabel: `${row.count}次涨停`,
      }));

    const { list, sourceStockCount } = await this.buildHiddenShareholderRows(
      sourceStocks,
      limit,
      stockLimit,
      category,
    );

    return {
      period,
      sourceStockCount,
      list,
    };
  }

  private async buildHiddenShareholderRows(
    sourceStocks: Array<{
      stockCode: string;
      stockName: string;
      sourceMetric: number;
      sourceMetricLabel: string;
    }>,
    limit: number,
    initialStockLimit: number,
    category: InvestorCategory,
  ): Promise<{ list: HiddenShareholderRow[]; sourceStockCount: number }> {
    if (sourceStocks.length === 0) {
      return {
        list: [],
        sourceStockCount: 0,
      };
    }

    const attemptSizes = Array.from(
      new Set(
        [
          initialStockLimit,
          initialStockLimit * 3,
          initialStockLimit * 6,
        ]
          .map((size) => Math.min(size, sourceStocks.length))
          .filter((size) => size > 0),
      ),
    );

    let lastRows: HiddenShareholderRow[] = [];
    let lastSourceStockCount = Math.min(initialStockLimit, sourceStocks.length);

    for (const size of attemptSizes) {
      const sourceSubset = sourceStocks.slice(0, size);
      const rows = await this.buildHiddenShareholderRowsForSubset(sourceSubset, category);
      lastRows = rows;
      lastSourceStockCount = size;

      if (rows.length >= limit) {
        break;
      }
    }

    return {
      list: lastRows.slice(0, limit),
      sourceStockCount: lastSourceStockCount,
    };
  }

  private async buildHiddenShareholderRowsForSubset(
    sourceStocks: Array<{
      stockCode: string;
      stockName: string;
      sourceMetric: number;
      sourceMetricLabel: string;
    }>,
    category: InvestorCategory,
  ): Promise<HiddenShareholderRow[]> {
    const sourceStockMap = new Map(
      sourceStocks.map((stock) => [stock.stockCode, stock]),
    );
    const holdings = await this.holdingRepository.findLatestTrackedHoldingsByStockCodes(
      sourceStocks.map((stock) => stock.stockCode),
      category,
    );
    const trackedInvestorMap =
      await this.naturalPersonHolderRepository.findTrackedInvestorSnapshotsByNames(
        Array.from(new Set(holdings.map((holding) => holding.investorName))),
        category,
      );

    const grouped = new Map<number, HiddenShareholderRow>();
    for (const holding of holdings) {
      const sourceStock = sourceStockMap.get(holding.stockCode);
      if (!sourceStock) {
        continue;
      }

      const trackedInvestor = trackedInvestorMap.get(holding.investorName);

      if (!grouped.has(holding.investorId)) {
        grouped.set(holding.investorId, {
          investorId: holding.investorId,
          shareholderName: holding.investorName,
          matchedStockCount: 0,
          matchedMarketValue: 0,
          latestReportDate: holding.reportDate,
          totalMarketValue: trackedInvestor?.totalMarketValue ?? holding.marketValue,
          stockCount: trackedInvestor?.stockCount ?? 1,
          matchedStocks: [],
        });
      }

      const row = grouped.get(holding.investorId)!;
      row.matchedStockCount += 1;
      row.matchedMarketValue += holding.marketValue;
      if (holding.reportDate > row.latestReportDate) {
        row.latestReportDate = holding.reportDate;
      }
      row.matchedStocks.push(
        this.buildMatchedStockRow(
          holding,
          sourceStock.sourceMetric,
          sourceStock.sourceMetricLabel,
        ),
      );
    }

    return Array.from(grouped.values())
      .map((row) => ({
        ...row,
        matchedStocks: row.matchedStocks.sort((left, right) => right.marketValue - left.marketValue),
      }))
      .sort((left, right) => {
        if (right.matchedMarketValue !== left.matchedMarketValue) {
          return right.matchedMarketValue - left.matchedMarketValue;
        }
        if (right.matchedStockCount !== left.matchedStockCount) {
          return right.matchedStockCount - left.matchedStockCount;
        }
        return right.latestReportDate.localeCompare(left.latestReportDate);
      });
  }

  private buildMatchedStockRow(
    holding: TrackedHoldingSnapshot,
    sourceMetric: number,
    sourceMetricLabel: string,
  ): HiddenShareholderMatchedStock {
    return {
      stockCode: holding.stockCode,
      stockName: holding.stockName,
      reportDate: holding.reportDate,
      holdCount: holding.holdCount,
      holdRatio: holding.holdRatio,
      currentPrice: holding.currentPrice,
      marketValue: holding.marketValue,
      sourceMetric,
      sourceMetricLabel,
    };
  }
}
