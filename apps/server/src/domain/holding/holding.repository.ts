/**
 * Holding Repository - 持仓数据访问层
 * 负责单表 CRUD 操作及简单查询
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BusinessDataSlot, Holding, Prisma } from '@prisma/client';
import {
  buildTrackedInvestorWhere,
  buildTrackedPersonalInvestorWhere,
  InvestorCategory,
} from '@/common/utils/investor-name-filter';

export interface HoldingChangeRow {
  id: number;
  investorId: number;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdRatio: number;
  actualCost: number;
  reportDate: string;
  createdAt: string;
  investorName: string;
  investorAvatar: string | null;
  previousCount: number | null;
  changeCount: number;
  changeRate: number | null;
  marketValue: number;
  changeMarketValue: number;
  currentPrice: number;
  averageChangePrice?: number | null;
  averageChangePriceDate?: string | null;
  isCleared?: boolean;
  industry?: string | null;
  mainRevenue?: number | null;
  revenueReportDate?: string | null;
}

export interface HoldingChangeQueryResult {
  list: HoldingChangeRow[];
  total: number;
}

export interface CommonHoldingRow {
  stockCode: string;
  stockName: string;
  industry: string | null;
  currentPrice: number;
  totalMarketValue: number;
  investorCount: number;
  investorNames: string[];
  mainRevenue?: number | null;
  revenueReportDate?: string | null;
  investors: Array<{
    investorId: number;
    investorName: string;
    holdCount: number;
    marketValue: number;
  }>;
}

export interface CommonHoldingQueryResult {
  list: CommonHoldingRow[];
  total: number;
}

export interface HoldingNewStockSummaryRow {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  totalMarketValue: number;
  changeMarketValue: number;
  newInvestorCount: number;
  investorNames: string[];
  reportDate: string;
}

export interface HoldingNewStockSummaryResult {
  list: HoldingNewStockSummaryRow[];
  total: number;
}

export interface TrackedHoldingSnapshot {
  investorId: number;
  investorName: string;
  investorAvatar: string | null;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdRatio: number;
  reportDate: string;
  currentPrice: number;
  marketValue: number;
}

interface ReportDateCoverageRow {
  reportDate: string;
  rowCount: number;
}

interface DistinctTrackedStockCodeRow {
  stockCode: string;
}

interface LatestTrackedHoldingRow {
  investorId: bigint;
  investorName: string;
  investorAvatar: string | null;
  stockCode: string;
  stockName: string;
  holdCount: bigint;
  holdRatio: Prisma.Decimal | number | null;
  reportDate: Date;
}

interface HistoricalPriceSnapshotRow {
  baseCode: string;
  price: number | string | null;
  tradeDate: string;
}

interface CommonHoldingAggregateRow {
  stockCode: string;
  stockName: string;
  investorCount: number | string;
  totalHoldCount: number | string;
  totalCount: number | string;
  investors: Array<{
    investorId: number | string;
    investorName: string;
    holdCount: number | string;
  }>;
}

interface HoldingChangeQueryRow {
  id: bigint | number | string;
  investorId: bigint | number | string;
  stockCode: string;
  stockName: string;
  holdCount: bigint | number | string;
  holdRatio: Prisma.Decimal | number | string | null;
  actualCost: Prisma.Decimal | number | string | null;
  reportDate: Date | string;
  createdAt: Date | string;
  investorName: string;
  investorAvatar: string | null;
  previousCount: bigint | number | string | null;
  changeCount: bigint | number | string;
  changeRate: Prisma.Decimal | number | string | null;
  marketValue: Prisma.Decimal | number | string;
  changeMarketValue: Prisma.Decimal | number | string;
  currentPrice: Prisma.Decimal | number | string;
  totalCount: bigint | number | string;
}

interface HoldingNewStockSummaryQueryRow {
  stockCode: string;
  stockName: string;
  totalHoldCount: bigint | number | string;
  currentPrice: Prisma.Decimal | number | string;
  totalMarketValue: Prisma.Decimal | number | string;
  changeMarketValue: Prisma.Decimal | number | string;
  newInvestorCount: bigint | number | string;
  investorNames: string[];
  reportDate: Date | string;
  totalCount: bigint | number | string;
}

@Injectable()
export class HoldingRepository {
  constructor(private prisma: PrismaService) {}

  private async getActiveDataSlot(): Promise<BusinessDataSlot> {
    const state = await this.prisma.businessDataSourceState.findUnique({
      where: { id: 1 },
      select: { activeSlot: true },
    });

    return state?.activeSlot ?? 'PRIMARY';
  }

  private buildTrackedPersonalInvestorFilter(): Prisma.InvestorWhereInput {
    return buildTrackedPersonalInvestorWhere();
  }

  private buildTrackedInvestorFilter(category?: InvestorCategory): Prisma.InvestorWhereInput {
    return buildTrackedInvestorWhere(category);
  }

  private filterLikelyPersonalInvestorRows<
    T extends {
      investor: {
        category: string;
      };
    },
  >(rows: T[]): T[] {
    return rows.filter((row) => row.investor.category === 'personal');
  }

  private filterInvestorRowsByCategory<
    T extends {
      investor: {
        category: string;
      };
    },
  >(rows: T[], category: InvestorCategory): T[] {
    return rows.filter((row) => row.investor.category === category);
  }

  private normalizeStockCode(stockCode: string): string {
    return stockCode.trim().toUpperCase().split('.')[0];
  }

  private async resolveTargetReportDate(reportDate?: string): Promise<Date | null> {
    if (reportDate) {
      return new Date(`${reportDate}T00:00:00Z`);
    }

    const representativeDates = await this.getRepresentativeReportDates();
    return representativeDates[0] ?? null;
  }

  async getRepresentativeReportDates(): Promise<Date[]> {
    const activeSlot = await this.getActiveDataSlot();
    const rows = await this.prisma.$queryRaw<ReportDateCoverageRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(h."reportDate", 'YYYY-MM-DD') AS "reportDate",
        COUNT(*)::int AS "rowCount"
      FROM holdings h
      INNER JOIN investors i ON i.id = h."investorId"
      WHERE i."isTracked" = true
        AND h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
      GROUP BY h."reportDate"
      ORDER BY h."reportDate" DESC
    `);

    if (rows.length === 0) {
      return [];
    }

    const maxCount = Math.max(...rows.map((row) => Number(row.rowCount) || 0));
    const threshold = Math.max(1, Math.floor(maxCount * 0.3));
    const representativeRows = rows.filter((row) => Number(row.rowCount) >= threshold);

    return (representativeRows.length > 0 ? representativeRows : rows).map(
      (row) => new Date(`${row.reportDate}T00:00:00Z`),
    );
  }

  async getRepresentativeReportDateStrings(): Promise<string[]> {
    const representativeDates = await this.getRepresentativeReportDates();

    return representativeDates
      .map((date) => date.toISOString().slice(0, 10))
      .sort((left, right) => left.localeCompare(right));
  }

  private buildHoldingKey(investorId: bigint | number, stockCode: string): string {
    return `${investorId.toString()}::${this.normalizeStockCode(stockCode)}`;
  }

  private async loadPreviousHoldingMap(
    currentHoldings: Holding[],
    targetReportDate: Date,
  ): Promise<Map<string, Holding>> {
    const activeSlot = await this.getActiveDataSlot();
    const representativeDates = await this.getRepresentativeReportDates();
    const previousDates = representativeDates
      .filter((date) => date.getTime() < targetReportDate.getTime())
      .slice(0, 1);

    if (previousDates.length === 0 || currentHoldings.length === 0) {
      return new Map();
    }

    const investorIds = Array.from(
      new Set(currentHoldings.map((holding) => holding.investorId.toString())),
    ).map((id) => BigInt(id));
    const stockCodes = Array.from(
      new Set(currentHoldings.map((holding) => holding.stockCode)),
    );

    const previousHoldings = await this.prisma.holding.findMany({
      where: {
        investorId: {
          in: investorIds,
        },
        stockCode: {
          in: stockCodes,
        },
        reportDate: {
          in: previousDates,
        },
        dataSlot: activeSlot,
        investor: {
          ...this.buildTrackedPersonalInvestorFilter(),
        },
      },
      orderBy: [
        { reportDate: 'desc' },
        { holdCount: 'desc' },
      ],
    });

    const previousMap = new Map<string, Holding>();
    for (const holding of previousHoldings) {
      const key = this.buildHoldingKey(holding.investorId, holding.stockCode);
      if (!previousMap.has(key)) {
        previousMap.set(key, holding);
      }
    }

    return previousMap;
  }

  private async loadPriceMap(stockCodes: string[]): Promise<Map<string, number>> {
    if (stockCodes.length === 0) {
      return new Map();
    }

    const normalizedCodes = Array.from(
      new Set(stockCodes.map((stockCode) => this.normalizeStockCode(stockCode))),
    );
    const historyCodeCandidates = Array.from(
      new Set(
        normalizedCodes.flatMap((stockCode) => [
          stockCode,
          `${stockCode}.SH`,
          `${stockCode}.SZ`,
          `${stockCode}.BJ`,
        ]),
      ),
    );

    const stocks = await this.prisma.stock.findMany({
      where: {
        code: { in: historyCodeCandidates },
        currentPrice: { not: null },
      },
      select: { code: true, currentPrice: true },
      orderBy: { code: 'asc' },
    });

    const normalizedPriceMap = new Map<string, number>();
    for (const stock of stocks) {
      const normalizedCode = this.normalizeStockCode(stock.code);
      if (!normalizedPriceMap.has(normalizedCode) && stock.currentPrice) {
        normalizedPriceMap.set(normalizedCode, Number(stock.currentPrice));
      }
    }

    const missingCodes = normalizedCodes.filter((stockCode) => !normalizedPriceMap.has(stockCode));
    if (missingCodes.length > 0) {
      const missingHistoryCodeCandidates = Array.from(
        new Set(
          missingCodes.flatMap((stockCode) => [
            stockCode,
            `${stockCode}.SH`,
            `${stockCode}.SZ`,
            `${stockCode}.BJ`,
          ]),
        ),
      );

      const historyRows = await this.prisma.$queryRaw<Array<{
        baseCode: string;
        currentPrice: number | string | null;
      }>>(Prisma.sql`
        SELECT DISTINCT ON (split_part(dm, '.', 1))
          split_part(dm, '.', 1) AS "baseCode",
          c AS "currentPrice"
        FROM hs_stock_history_trading
        WHERE dm IN (${Prisma.join(missingHistoryCodeCandidates)})
          AND model = 'n'
          AND c IS NOT NULL
        ORDER BY split_part(dm, '.', 1), t DESC
      `);

      for (const row of historyRows) {
        if (!normalizedPriceMap.has(row.baseCode) && row.currentPrice !== null) {
          normalizedPriceMap.set(row.baseCode, Number(row.currentPrice));
        }
      }
    }

    return new Map(
      stockCodes.map((stockCode) => [
        stockCode,
        normalizedPriceMap.get(this.normalizeStockCode(stockCode)) ?? 0,
      ]),
    );
  }

  private async loadHistoricalPriceSnapshotMap(
    stockCodes: string[],
    targetReportDate: Date,
  ): Promise<Map<string, { price: number | null; tradeDate: string | null }>> {
    if (stockCodes.length === 0) {
      return new Map();
    }

    const normalizedCodes = Array.from(
      new Set(stockCodes.map((stockCode) => this.normalizeStockCode(stockCode))),
    );
    const historyCodeCandidates = Array.from(
      new Set(
        normalizedCodes.flatMap((stockCode) => [
          stockCode,
          `${stockCode}.SH`,
          `${stockCode}.SZ`,
          `${stockCode}.BJ`,
        ]),
      ),
    );
    const targetDate = targetReportDate.toISOString().slice(0, 10);

    const rows = await this.prisma.$queryRaw<HistoricalPriceSnapshotRow[]>(Prisma.sql`
      SELECT DISTINCT ON (split_part(dm, '.', 1))
        split_part(dm, '.', 1) AS "baseCode",
        COALESCE(c, o) AS "price",
        t AS "tradeDate"
      FROM hs_stock_history_trading
      WHERE dm IN (${Prisma.join(historyCodeCandidates)})
        AND model = 'n'
        AND t <= ${targetDate}
        AND COALESCE(c, o) IS NOT NULL
      ORDER BY split_part(dm, '.', 1), t DESC
    `);

    const snapshotMap = new Map<string, { price: number | null; tradeDate: string | null }>();
    for (const row of rows) {
      snapshotMap.set(row.baseCode, {
        price: row.price !== null ? Number(row.price) : null,
        tradeDate: row.tradeDate.includes(' ') ? row.tradeDate.split(' ')[0] : row.tradeDate,
      });
    }

    return new Map(
      stockCodes.map((stockCode) => [
        stockCode,
        snapshotMap.get(this.normalizeStockCode(stockCode)) ?? {
          price: null,
          tradeDate: null,
        },
      ]),
    );
  }

  private formatDateValue(value: Date | string): string {
    return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  }

  private formatDateTimeValue(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }

  private async findChangeRows(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }, changeType: 'increase' | 'decrease' | 'new'): Promise<HoldingChangeQueryResult> {
    const activeSlot = await this.getActiveDataSlot();
    const { keyword, reportDate } = options;
    const targetReportDate = await this.resolveTargetReportDate(reportDate);
    if (!targetReportDate) {
      return { list: [], total: 0 };
    }

    const representativeDates = await this.getRepresentativeReportDates();
    const previousDates = representativeDates
      .filter((date) => date.getTime() < targetReportDate.getTime())
      .slice(0, 1);
    const previousDateFilter = previousDates.length > 0
      ? Prisma.sql`AND p."reportDate" IN (${Prisma.join(previousDates)})`
      : Prisma.sql`AND FALSE`;
    const keywordText = keyword?.trim();
    const keywordFilter = keywordText
      ? Prisma.sql`AND (
          h."stockName" ILIKE ${`%${keywordText}%`}
          OR h."stockCode" ILIKE ${`%${keywordText}%`}
          OR i.name ILIKE ${`%${keywordText}%`}
        )`
      : Prisma.empty;
    const changeFilter = changeType === 'increase'
      ? Prisma.sql`lp."previousCount" IS NOT NULL AND c."holdCount" > lp."previousCount"`
      : changeType === 'decrease'
        ? Prisma.sql`lp."previousCount" IS NOT NULL AND c."holdCount" < lp."previousCount"`
        : Prisma.sql`lp."previousCount" IS NULL`;
    const orderBy = changeType === 'new'
      ? Prisma.sql`ORDER BY "marketValue" DESC, "holdCount" DESC`
      : Prisma.sql`ORDER BY "changeMarketValue" DESC, "marketValue" DESC`;
    const offset = (options.page - 1) * options.pageSize;

    const rows = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw(Prisma.sql`SET LOCAL max_parallel_workers_per_gather = 0`);

        return tx.$queryRaw<HoldingChangeQueryRow[]>(Prisma.sql`
          WITH current_holdings AS (
            SELECT
              h.id AS id,
              h."investorId" AS "investorId",
              i.name AS "investorName",
              i.avatar AS "investorAvatar",
              h."stockCode" AS "stockCode",
              h."stockName" AS "stockName",
              h."holdCount" AS "holdCount",
              h."holdRatio" AS "holdRatio",
              h."actualCost" AS "actualCost",
              h."reportDate" AS "reportDate",
              h."createdAt" AS "createdAt"
            FROM holdings h
            INNER JOIN investors i ON i.id = h."investorId"
            WHERE h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
              AND h."reportDate" = ${targetReportDate}
              AND i."isTracked" = true
              AND i."category" = 'personal'
              AND h."stockCode" IS NOT NULL
              AND h."stockCode" <> ''
              ${keywordFilter}
          ),
          latest_previous AS (
            SELECT
              p."investorId" AS "investorId",
              p."stockCode" AS "stockCode",
              p."holdCount" AS "previousCount"
            FROM holdings p
            INNER JOIN current_holdings c
              ON c."investorId" = p."investorId"
             AND c."stockCode" = p."stockCode"
            WHERE p."dataSlot" = ${activeSlot}::"BusinessDataSlot"
              ${previousDateFilter}
          ),
          change_rows AS (
            SELECT
              c.id,
              c."investorId",
              c."investorName",
              c."investorAvatar",
              c."stockCode",
              c."stockName",
              c."holdCount",
              c."holdRatio",
              c."actualCost",
              c."reportDate",
              c."createdAt",
              lp."previousCount",
              (c."holdCount" - COALESCE(lp."previousCount", 0)) AS "changeCount",
              CASE
                WHEN COALESCE(lp."previousCount", 0) > 0
                  THEN ((c."holdCount" - lp."previousCount")::numeric / lp."previousCount"::numeric) * 100
                ELSE NULL
              END AS "changeRate",
              COALESCE(s."currentPrice", 0)::numeric AS "currentPrice",
              (COALESCE(s."currentPrice", 0)::numeric * c."holdCount"::numeric) AS "marketValue",
              (COALESCE(s."currentPrice", 0)::numeric * ABS(c."holdCount" - COALESCE(lp."previousCount", 0))::numeric) AS "changeMarketValue"
            FROM current_holdings c
            LEFT JOIN latest_previous lp
              ON lp."investorId" = c."investorId"
             AND lp."stockCode" = c."stockCode"
            LEFT JOIN stocks s ON s.code = c."stockCode"
            WHERE ${changeFilter}
          )
          SELECT
            *,
            COUNT(*) OVER() AS "totalCount"
          FROM change_rows
          ${orderBy}
          OFFSET ${offset}
          LIMIT ${options.pageSize}
        `);
      },
      {
        maxWait: 10000,
        timeout: 60000,
      },
    );

    const stockCodes = rows.map((row) => row.stockCode);
    const [priceMap, historicalPriceMap] = await Promise.all([
      this.loadPriceMap(stockCodes),
      changeType === 'new'
        ? Promise.resolve(new Map<string, { price: number | null; tradeDate: string | null }>())
        : this.loadHistoricalPriceSnapshotMap(stockCodes, targetReportDate),
    ]);

    return {
      list: rows.map((row) => {
        const normalizedStockCode = this.normalizeStockCode(row.stockCode);
        const currentPrice = priceMap.get(row.stockCode) ?? Number(row.currentPrice) ?? 0;
        const holdCount = Number(row.holdCount) || 0;
        const previousCount = row.previousCount === null ? null : Number(row.previousCount);
        const historicalPrice = historicalPriceMap.get(row.stockCode);
        const changeCount = Number(row.changeCount) || 0;

        return {
          id: Number(row.id),
          investorId: Number(row.investorId),
          stockCode: normalizedStockCode,
          stockName: row.stockName,
          holdCount,
          holdRatio: row.holdRatio ? Number(row.holdRatio) : 0,
          actualCost: row.actualCost ? Number(row.actualCost) : 0,
          reportDate: this.formatDateValue(row.reportDate),
          createdAt: this.formatDateTimeValue(row.createdAt),
          investorName: row.investorName,
          investorAvatar: row.investorAvatar,
          previousCount,
          changeCount,
          changeRate: row.changeRate === null ? null : Number(row.changeRate),
          marketValue: currentPrice * holdCount,
          changeMarketValue: currentPrice * Math.abs(changeCount),
          currentPrice,
          averageChangePrice: historicalPrice?.price ?? null,
          averageChangePriceDate: historicalPrice?.tradeDate ?? null,
        };
      }),
      total: rows.length > 0 ? Number(rows[0].totalCount) : 0,
    };
  }

  /**
   * 根据牛散 ID 查找持仓
   */
  async findByInvestorId(investorId: number): Promise<Holding[]> {
    const activeSlot = await this.getActiveDataSlot();
    const holdings = await this.prisma.holding.findMany({
      where: {
        investorId: BigInt(investorId),
        dataSlot: activeSlot,
        investor: {
          ...this.buildTrackedInvestorFilter(),
        },
      },
      orderBy: [
        { reportDate: 'desc' },
        { holdCount: 'desc' },
      ],
    });

    const latestByStock = new Map<string, Holding>();
    for (const holding of holdings) {
      const normalizedStockCode = this.normalizeStockCode(holding.stockCode);
      if (!latestByStock.has(normalizedStockCode)) {
        latestByStock.set(normalizedStockCode, holding);
      }
    }

    return Array.from(latestByStock.values());
  }

  /**
   * 根据股票代码查找持仓
   */
  async findByStockCode(stockCode: string): Promise<Holding[]> {
    const activeSlot = await this.getActiveDataSlot();
    const holdings = await this.prisma.holding.findMany({
      where: {
        stockCode,
        dataSlot: activeSlot,
        investor: {
          ...this.buildTrackedPersonalInvestorFilter(),
        },
      },
      include: {
        investor: true,
      },
      orderBy: [
        { reportDate: 'desc' },
        { holdCount: 'desc' },
      ],
    });

    const filteredHoldings = this.filterLikelyPersonalInvestorRows(holdings);

    const latestByInvestor = new Map<bigint, Holding>();
    for (const holding of filteredHoldings) {
      if (!latestByInvestor.has(holding.investorId)) {
        latestByInvestor.set(holding.investorId, holding);
      }
    }

    return Array.from(latestByInvestor.values());
  }

  /**
   * 查询增持记录（本期 > 上期）
   */
  async findIncrease(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingChangeQueryResult> {
    return this.findChangeRows(options, 'increase');
  }

  /**
   * 查询减持记录（本期 < 上期）
   */
  async findDecrease(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingChangeQueryResult> {
    return this.findChangeRows(options, 'decrease');
  }

  /**
   * 查询新进记录（上期不存在）
   */
  async findNew(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingChangeQueryResult> {
    return this.findChangeRows(options, 'new');
  }

  async findNewStockSummary(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<HoldingNewStockSummaryResult> {
    const activeSlot = await this.getActiveDataSlot();
    const { keyword, reportDate } = options;
    const targetReportDate = await this.resolveTargetReportDate(reportDate);
    if (!targetReportDate) {
      return { list: [], total: 0 };
    }

    const representativeDates = await this.getRepresentativeReportDates();
    const previousDates = representativeDates
      .filter((date) => date.getTime() < targetReportDate.getTime())
      .slice(0, 1);
    const previousDateFilter = previousDates.length > 0
      ? Prisma.sql`AND p."reportDate" IN (${Prisma.join(previousDates)})`
      : Prisma.sql`AND FALSE`;
    const keywordText = keyword?.trim();
    const keywordFilter = keywordText
      ? Prisma.sql`AND (
          h."stockName" ILIKE ${`%${keywordText}%`}
          OR h."stockCode" ILIKE ${`%${keywordText}%`}
          OR i.name ILIKE ${`%${keywordText}%`}
        )`
      : Prisma.empty;
    const offset = (options.page - 1) * options.pageSize;

    const rows = await this.prisma.$queryRaw<HoldingNewStockSummaryQueryRow[]>(Prisma.sql`
      WITH current_holdings AS (
        SELECT
          h."investorId" AS "investorId",
          i.name AS "investorName",
          h."stockCode" AS "stockCode",
          h."stockName" AS "stockName",
          h."holdCount" AS "holdCount",
          h."reportDate" AS "reportDate"
        FROM holdings h
        INNER JOIN investors i ON i.id = h."investorId"
        WHERE h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
          AND h."reportDate" = ${targetReportDate}
          AND i."isTracked" = true
          AND i."category" = 'personal'
          AND h."stockCode" IS NOT NULL
          AND h."stockCode" <> ''
          ${keywordFilter}
      ),
      latest_previous AS (
        SELECT
          p."investorId" AS "investorId",
          p."stockCode" AS "stockCode",
          p."holdCount" AS "previousCount"
        FROM holdings p
        INNER JOIN current_holdings c
          ON c."investorId" = p."investorId"
         AND c."stockCode" = p."stockCode"
        WHERE p."dataSlot" = ${activeSlot}::"BusinessDataSlot"
          ${previousDateFilter}
      ),
      new_rows AS (
        SELECT c.*
        FROM current_holdings c
        LEFT JOIN latest_previous lp
          ON lp."investorId" = c."investorId"
         AND lp."stockCode" = c."stockCode"
        WHERE lp."previousCount" IS NULL
      ),
      grouped_rows AS (
        SELECT
          nr."stockCode",
          MAX(nr."stockName") AS "stockName",
          COALESCE(MAX(s."currentPrice"), 0)::numeric AS "currentPrice",
          SUM(nr."holdCount")::numeric AS "totalHoldCount",
          COUNT(DISTINCT nr."investorId")::int AS "newInvestorCount",
          ARRAY_AGG(DISTINCT nr."investorName" ORDER BY nr."investorName") AS "investorNames",
          MAX(nr."reportDate") AS "reportDate"
        FROM new_rows nr
        LEFT JOIN stocks s ON s.code = nr."stockCode"
        GROUP BY nr."stockCode"
      ),
      valued_rows AS (
        SELECT
          "stockCode",
          "stockName",
          "totalHoldCount",
          "currentPrice",
          ("currentPrice" * "totalHoldCount") AS "totalMarketValue",
          ("currentPrice" * "totalHoldCount") AS "changeMarketValue",
          "newInvestorCount",
          "investorNames",
          "reportDate"
        FROM grouped_rows
      )
      SELECT
        *,
        COUNT(*) OVER() AS "totalCount"
      FROM valued_rows
      ORDER BY "changeMarketValue" DESC, "newInvestorCount" DESC
      OFFSET ${offset}
      LIMIT ${options.pageSize}
    `);

    const priceMap = await this.loadPriceMap(rows.map((row) => row.stockCode));

    return {
      list: rows.map((row) => {
        const normalizedStockCode = this.normalizeStockCode(row.stockCode);
        const currentPrice = priceMap.get(row.stockCode) ?? Number(row.currentPrice) ?? 0;
        const totalHoldCount = Number(row.totalHoldCount) || 0;
        const marketValue = currentPrice * totalHoldCount;

        return {
          stockCode: normalizedStockCode,
          stockName: row.stockName,
          currentPrice,
          totalMarketValue: marketValue,
          changeMarketValue: marketValue,
          newInvestorCount: Number(row.newInvestorCount) || 0,
          investorNames: row.investorNames ?? [],
          reportDate: this.formatDateValue(row.reportDate),
        };
      }),
      total: rows.length > 0 ? Number(rows[0].totalCount) : 0,
    };
  }

  /**
   * 查询所有持仓
   */
  async findAll(): Promise<Holding[]> {
    const activeSlot = await this.getActiveDataSlot();
    return this.prisma.holding.findMany({
      where: {
        dataSlot: activeSlot,
        investor: {
          ...this.buildTrackedPersonalInvestorFilter(),
        },
      },
    });
  }

  /**
   * 查询共同持仓（被多个牛散持有的股票）
   */
  async findCommonHoldings(options: {
    investorIds?: number[];
    page: number;
    pageSize: number;
  }): Promise<CommonHoldingQueryResult> {
    const activeSlot = await this.getActiveDataSlot();
    const investorIds = options.investorIds ?? [];
    const selectedInvestorIds = investorIds.map((id) => BigInt(id));
    const offset = (options.page - 1) * options.pageSize;
    const investorFilter =
      selectedInvestorIds.length > 0
        ? Prisma.sql`AND h."investorId" IN (${Prisma.join(selectedInvestorIds)})`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<CommonHoldingAggregateRow[]>(Prisma.sql`
      WITH ranked_holdings AS (
        SELECT
          h."investorId" AS "investorId",
          i.name AS "investorName",
          SPLIT_PART(UPPER(h."stockCode"), '.', 1) AS "stockCode",
          h."stockName" AS "stockName",
          h."holdCount" AS "holdCount",
          ROW_NUMBER() OVER (
            PARTITION BY h."investorId", SPLIT_PART(UPPER(h."stockCode"), '.', 1)
            ORDER BY h."reportDate" DESC, h."holdCount" DESC, h.id DESC
          ) AS row_no
        FROM holdings h
        INNER JOIN investors i ON i.id = h."investorId"
        WHERE h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
          AND i."isTracked" = true
          AND i."category" = 'personal'
          AND h."stockCode" IS NOT NULL
          AND h."stockCode" <> ''
          ${investorFilter}
      ),
      latest_holdings AS (
        SELECT
          "investorId",
          "investorName",
          "stockCode",
          "stockName",
          "holdCount"
        FROM ranked_holdings
        WHERE row_no = 1
      ),
      common_stocks AS (
        SELECT
          "stockCode",
          MAX("stockName") AS "stockName",
          COUNT(*)::int AS "investorCount",
          SUM("holdCount")::numeric AS "totalHoldCount"
        FROM latest_holdings
        GROUP BY "stockCode"
        HAVING COUNT(*) >= 2
      ),
      paged_stocks AS (
        SELECT
          "stockCode",
          "stockName",
          "investorCount",
          "totalHoldCount",
          COUNT(*) OVER()::int AS "totalCount"
        FROM common_stocks
        ORDER BY "investorCount" DESC, "totalHoldCount" DESC
        OFFSET ${offset}
        LIMIT ${options.pageSize}
      )
      SELECT
        ps."stockCode" AS "stockCode",
        ps."stockName" AS "stockName",
        ps."investorCount" AS "investorCount",
        ps."totalHoldCount" AS "totalHoldCount",
        ps."totalCount" AS "totalCount",
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'investorId', lh."investorId",
              'investorName', lh."investorName",
              'holdCount', lh."holdCount"
            )
            ORDER BY lh."holdCount" DESC, lh."investorName" ASC
          ) FILTER (WHERE lh."investorId" IS NOT NULL),
          '[]'::json
        ) AS "investors"
      FROM paged_stocks ps
      LEFT JOIN LATERAL (
        SELECT
          "investorId",
          "investorName",
          "holdCount"
        FROM latest_holdings lh
        WHERE lh."stockCode" = ps."stockCode"
        ORDER BY lh."holdCount" DESC, lh."investorName" ASC
        LIMIT 50
      ) lh ON true
      GROUP BY
        ps."stockCode",
        ps."stockName",
        ps."investorCount",
        ps."totalHoldCount",
        ps."totalCount"
      ORDER BY ps."investorCount" DESC, ps."totalHoldCount" DESC
    `);

    const stockCodes = rows.map((row) => row.stockCode);

    const priceMap = await this.loadPriceMap(stockCodes);

    return {
      list: rows.map((row) => {
        const currentPrice = priceMap.get(row.stockCode) ?? 0;
        const investors = row.investors.map((investor) => {
          const holdCount = Number(investor.holdCount);
          return {
            investorId: Number(investor.investorId),
            investorName: investor.investorName,
            holdCount,
            marketValue: currentPrice * holdCount,
          };
        });

        return {
          stockCode: row.stockCode,
          stockName: row.stockName,
          industry: null,
          currentPrice,
          totalMarketValue: currentPrice * Number(row.totalHoldCount),
          investorCount: Number(row.investorCount),
          investorNames: investors.map((investor) => investor.investorName),
          investors,
        };
      }),
      total: rows.length > 0 ? Number(rows[0].totalCount) : 0,
    };
  }

  async findTrackedStockCodes(category: InvestorCategory = 'personal'): Promise<string[]> {
    const activeSlot = await this.getActiveDataSlot();
    const rows = await this.prisma.$queryRaw<DistinctTrackedStockCodeRow[]>(Prisma.sql`
      SELECT DISTINCT
        SPLIT_PART(UPPER(h."stockCode"), '.', 1) AS "stockCode"
      FROM holdings h
      INNER JOIN investors i ON i.id = h."investorId"
      WHERE i."isTracked" = true
        AND i."category" = ${category}
        AND h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
        AND h."stockCode" IS NOT NULL
        AND h."stockCode" <> ''
    `);

    return rows
      .map((row) => row.stockCode)
      .filter(Boolean);
  }

  async findLatestTrackedHoldings(): Promise<TrackedHoldingSnapshot[]> {
    const activeSlot = await this.getActiveDataSlot();
    const holdings = await this.prisma.holding.findMany({
      where: {
        dataSlot: activeSlot,
        investor: {
          ...this.buildTrackedPersonalInvestorFilter(),
        },
      },
      include: {
        investor: true,
      },
      orderBy: [
        { reportDate: 'desc' },
        { holdCount: 'desc' },
      ],
    });

    const filteredHoldings = this.filterLikelyPersonalInvestorRows(holdings);

    const latestByInvestorAndStock = new Map<string, (typeof filteredHoldings)[number]>();
    for (const holding of filteredHoldings) {
      const normalizedStockCode = this.normalizeStockCode(holding.stockCode);
      const key = `${holding.investorId.toString()}::${normalizedStockCode}`;
      if (!latestByInvestorAndStock.has(key)) {
        latestByInvestorAndStock.set(key, holding);
      }
    }

    const latestHoldings = Array.from(latestByInvestorAndStock.values());
    const priceMap = await this.loadPriceMap(
      Array.from(
        new Set(
          latestHoldings.map((holding) => this.normalizeStockCode(holding.stockCode)),
        ),
      ),
    );

    return latestHoldings.map((holding) => {
      const normalizedStockCode = this.normalizeStockCode(holding.stockCode);
      const currentPrice = priceMap.get(normalizedStockCode) ?? 0;
      const holdCount = Number(holding.holdCount);

      return {
        investorId: Number(holding.investorId),
        investorName: holding.investor.name,
        investorAvatar: holding.investor.avatar,
        stockCode: normalizedStockCode,
        stockName: holding.stockName,
        holdCount,
        holdRatio: holding.holdRatio ? Number(holding.holdRatio) : 0,
        reportDate: holding.reportDate.toISOString().slice(0, 10),
        currentPrice,
        marketValue: currentPrice * holdCount,
      };
    });
  }

  async findLatestTrackedHoldingsByInvestorIds(
    investorIds: number[],
    category: InvestorCategory = 'personal',
  ): Promise<TrackedHoldingSnapshot[]> {
    const activeSlot = await this.getActiveDataSlot();
    if (investorIds.length === 0) {
      return [];
    }

    const holdings = await this.prisma.holding.findMany({
      where: {
        investorId: {
          in: investorIds.map((investorId) => BigInt(investorId)),
        },
        dataSlot: activeSlot,
        investor: {
          ...this.buildTrackedInvestorFilter(category),
        },
      },
      include: {
        investor: true,
      },
      orderBy: [
        { reportDate: 'desc' },
        { holdCount: 'desc' },
      ],
    });

    const filteredHoldings = this.filterInvestorRowsByCategory(holdings, category);

    const latestByInvestorAndStock = new Map<string, (typeof filteredHoldings)[number]>();
    for (const holding of filteredHoldings) {
      const normalizedStockCode = this.normalizeStockCode(holding.stockCode);
      const key = `${holding.investorId.toString()}::${normalizedStockCode}`;
      if (!latestByInvestorAndStock.has(key)) {
        latestByInvestorAndStock.set(key, holding);
      }
    }

    const latestHoldings = Array.from(latestByInvestorAndStock.values());
    const priceMap = await this.loadPriceMap(
      Array.from(
        new Set(
          latestHoldings.map((holding) => this.normalizeStockCode(holding.stockCode)),
        ),
      ),
    );

    return latestHoldings.map((holding) => {
      const normalizedStockCode = this.normalizeStockCode(holding.stockCode);
      const currentPrice = priceMap.get(normalizedStockCode) ?? 0;
      const holdCount = Number(holding.holdCount);

      return {
        investorId: Number(holding.investorId),
        investorName: holding.investor.name,
        investorAvatar: holding.investor.avatar,
        stockCode: normalizedStockCode,
        stockName: holding.stockName,
        holdCount,
        holdRatio: holding.holdRatio ? Number(holding.holdRatio) : 0,
        reportDate: holding.reportDate.toISOString().slice(0, 10),
        currentPrice,
        marketValue: currentPrice * holdCount,
      };
    });
  }

  async findLatestTrackedHoldingsByStockCodes(
    stockCodes: string[],
    category: InvestorCategory = 'personal',
  ): Promise<TrackedHoldingSnapshot[]> {
    const activeSlot = await this.getActiveDataSlot();
    if (stockCodes.length === 0) {
      return [];
    }

    const normalizedStockCodes = Array.from(
      new Set(stockCodes.map((stockCode) => this.normalizeStockCode(stockCode))),
    );
    const stockCodeCandidates = Array.from(
      new Set(
        normalizedStockCodes.flatMap((stockCode) => [
          stockCode,
          `${stockCode}.SH`,
          `${stockCode}.SZ`,
          `${stockCode}.BJ`,
        ]),
      ),
    );

    const latestHoldings = await this.prisma.$queryRaw<LatestTrackedHoldingRow[]>(Prisma.sql`
      WITH ranked_holdings AS (
        SELECT
          h."investorId" AS "investorId",
          i.name AS "investorName",
          i.avatar AS "investorAvatar",
          SPLIT_PART(UPPER(h."stockCode"), '.', 1) AS "stockCode",
          h."stockName" AS "stockName",
          h."holdCount" AS "holdCount",
          h."holdRatio" AS "holdRatio",
          h."reportDate" AS "reportDate",
          ROW_NUMBER() OVER (
            PARTITION BY h."investorId", SPLIT_PART(UPPER(h."stockCode"), '.', 1)
            ORDER BY h."reportDate" DESC, h."holdCount" DESC, h.id DESC
          ) AS row_no
        FROM holdings h
        INNER JOIN investors i ON i.id = h."investorId"
        WHERE h."stockCode" IN (${Prisma.join(stockCodeCandidates)})
          AND h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
          AND i."isTracked" = true
          AND i."category" = ${category}
      )
      SELECT
        "investorId",
        "investorName",
        "investorAvatar",
        "stockCode",
        "stockName",
        "holdCount",
        "holdRatio",
        "reportDate"
      FROM ranked_holdings
      WHERE row_no = 1
    `);

    const priceMap = await this.loadPriceMap(
      Array.from(
        new Set(
          latestHoldings.map((holding) => this.normalizeStockCode(holding.stockCode)),
        ),
      ),
    );

    return latestHoldings.map((holding) => {
      const normalizedStockCode = this.normalizeStockCode(holding.stockCode);
      const currentPrice = priceMap.get(normalizedStockCode) ?? 0;
      const holdCount = Number(holding.holdCount);

      return {
        investorId: Number(holding.investorId),
        investorName: holding.investorName,
        investorAvatar: holding.investorAvatar,
        stockCode: normalizedStockCode,
        stockName: holding.stockName,
        holdCount,
        holdRatio: holding.holdRatio ? Number(holding.holdRatio) : 0,
        reportDate: new Date(holding.reportDate).toISOString().slice(0, 10),
        currentPrice,
        marketValue: currentPrice * holdCount,
      };
    });
  }

  /**
   * 查找上期持仓
   */
  private async findPreviousHolding(
    investorId: bigint,
    stockCode: string,
    currentReportDate: Date,
  ): Promise<Holding | null> {
    const activeSlot = await this.getActiveDataSlot();
    return this.prisma.holding.findFirst({
      where: {
        investorId,
        stockCode,
        dataSlot: activeSlot,
        reportDate: {
          lt: currentReportDate,
        },
      },
      orderBy: {
        reportDate: 'desc',
      },
    });
  }

  /**
   * 创建持仓
   */
  async create(data: {
    investorId: number;
    stockCode: string;
    stockName: string;
    holdCount: number;
    holdRatio?: number;
    actualCost?: number;
    reportDate: Date;
  }): Promise<Holding> {
    return this.prisma.holding.create({
      data,
    });
  }

  /**
   * 批量创建持仓
   */
  async createMany(data: Array<{
    investorId: number;
    stockCode: string;
    stockName: string;
    holdCount: number;
    holdRatio?: number;
    actualCost?: number;
    reportDate: Date;
  }>): Promise<number> {
    const result = await this.prisma.holding.createMany({
      data: data.map(d => ({
        ...d,
        holdCount: BigInt(d.holdCount),
        investorId: BigInt(d.investorId),
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  /**
   * 删除持仓
   */
  async delete(id: number): Promise<void> {
    await this.prisma.holding.delete({
      where: { id: BigInt(id) },
    });
  }
}
