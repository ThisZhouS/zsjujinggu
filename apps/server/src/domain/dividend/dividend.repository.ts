/**
 * Dividend Repository - 分红数据访问层
 * 负责分红数据查询、股息率排行
 * 数据源：dividends 业务表
 */

import { Injectable } from '@nestjs/common';
import { BusinessDataSlot, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

export interface DividendYieldRow {
  stockCode: string;
  stockName: string;
  year: number | null;
  periodLabel: string;
  dividendPerShare: number | null;
  totalDividend: number | null;
  dividendYield: number | null;
  currentPrice: number | null;
}

export type DividendRankingMode = 'rolling1y' | 'annual' | 'avg3y';

export interface DividendYieldRankingResult {
  list: DividendYieldRow[];
  total: number;
}

export interface StockPriceMeta {
  currentPrice: number | null;
  totalMarketCap: number | null;
}

export interface StockDividendMetric {
  stockCode: string;
  stockName: string;
  dividendYear: number;
  dividendDate: Date | null;
  cashDividend: number | null;
  totalDividend: number | null;
  dividendYield: number | null;
  currentPrice: number | null;
  dataSlot: BusinessDataSlot;
}

export interface DividendMetricBackfillSummary {
  dataSlot: BusinessDataSlot;
  totalRecords: number;
  cashDividendRecords: number;
  recordsWithPrice: number;
  yieldReadyRecords: number;
  totalDividendReadyRecords: number;
  missingYieldRecords: number;
  missingTotalDividendRecords: number;
  isComplete: boolean;
  mirroredRecords: number;
  updatedRecords: number;
}

export type DividendMetricCoverageSummary = Omit<
  DividendMetricBackfillSummary,
  'mirroredRecords' | 'updatedRecords'
>;

@Injectable()
export class DividendRepository {
  constructor(private prisma: PrismaService) {}

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private normalizeStockCode(code: string): string {
    return code.trim().toUpperCase().split('.')[0];
  }

  private canonicalizeStockCode(code: string): string {
    const normalized = this.normalizeStockCode(code);

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

  private getStockCodeCandidates(code: string): string[] {
    const normalized = this.normalizeStockCode(code);
    return Array.from(
      new Set([normalized, this.canonicalizeStockCode(normalized)]),
    );
  }

  private estimateTotalDividend(options: {
    cashDividend: number | null;
    currentPrice: number | null;
    totalMarketCap: number | null;
    totalShares?: number | null;
  }): number | null {
    const { cashDividend, currentPrice, totalMarketCap, totalShares } = options;
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
  }

  private calculateDividendYield(options: {
    cashDividend: number | null;
    currentPrice: number | null;
    storedYield?: number | null;
  }): number | null {
    const { cashDividend, currentPrice, storedYield } = options;

    if (cashDividend != null && currentPrice != null && currentPrice > 0) {
      return Number(((cashDividend / currentPrice) * 100).toFixed(4));
    }

    return storedYield != null ? Number(storedYield.toFixed(4)) : null;
  }

  private compareDividendRows(left: DividendYieldRow, right: DividendYieldRow): number {
    const rightYield = right.dividendYield ?? Number.NEGATIVE_INFINITY;
    const leftYield = left.dividendYield ?? Number.NEGATIVE_INFINITY;
    if (rightYield !== leftYield) {
      return rightYield - leftYield;
    }

    const rightDividend = right.totalDividend ?? Number.NEGATIVE_INFINITY;
    const leftDividend = left.totalDividend ?? Number.NEGATIVE_INFINITY;
    if (rightDividend !== leftDividend) {
      return rightDividend - leftDividend;
    }

    return left.stockCode.localeCompare(right.stockCode);
  }

  private async getActiveDataSlot(): Promise<BusinessDataSlot> {
    const state = await this.prisma.businessDataSourceState.findUnique({
      where: { id: 1 },
      select: { activeSlot: true },
    });

    const activeSlot = state?.activeSlot ?? 'PRIMARY';
    const activeCount = await this.prisma.dividend.count({
      where: { dataSlot: activeSlot },
    });
    if (activeCount > 0) {
      return activeSlot;
    }

    const fallbackSlot: BusinessDataSlot =
      activeSlot === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
    const fallbackCount = await this.prisma.dividend.count({
      where: { dataSlot: fallbackSlot },
    });

    return fallbackCount > 0 ? fallbackSlot : activeSlot;
  }

  private async loadCapitalShareMap(stockCodes: string[]): Promise<Map<string, number>> {
    if (stockCodes.length === 0) {
      return new Map();
    }

    const normalizedCodes = Array.from(
      new Set(stockCodes.map((code) => this.normalizeStockCode(code))),
    );
    const allCandidates = Array.from(
      new Set(normalizedCodes.flatMap((code) => this.getStockCodeCandidates(code))),
    );

    const rows = await this.prisma.companyCapital.findMany({
      where: {
        stockCode: {
          in: allCandidates,
        },
        zgb: {
          not: null,
        },
      },
      select: {
        stockCode: true,
        zgb: true,
        plrq: true,
        bdrq: true,
        createdAt: true,
      },
      orderBy: [
        { stockCode: 'asc' },
        { plrq: 'desc' },
        { bdrq: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const sharesByStoredCode = new Map<string, number>();
    for (const row of rows) {
      if (!sharesByStoredCode.has(row.stockCode) && row.zgb != null) {
        sharesByStoredCode.set(row.stockCode, Number(row.zgb));
      }
    }

    const result = new Map<string, number>();
    for (const stockCode of normalizedCodes) {
      const candidates = this.getStockCodeCandidates(stockCode);
      const matched = candidates.find((candidate) => sharesByStoredCode.has(candidate));
      if (matched) {
        const shares = sharesByStoredCode.get(matched)!;
        result.set(stockCode, shares);
        result.set(this.canonicalizeStockCode(stockCode), shares);
      }
    }

    return result;
  }

  private async loadLatestPriceMap(stockCodes: string[]): Promise<Map<string, number>> {
    if (stockCodes.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.$queryRaw<Array<{
      stockCode: string;
      currentPrice: number | string | null;
    }>>(Prisma.sql`
      SELECT DISTINCT ON (s.code)
        s.code AS "stockCode",
        h.c AS "currentPrice"
      FROM stocks s
      INNER JOIN hs_stock_history_trading h
        ON split_part(s.code, '.', 1) = split_part(h.dm, '.', 1)
      WHERE s.code IN (${Prisma.join(stockCodes)})
        AND h.model = 'n'
        AND h.c IS NOT NULL
      ORDER BY s.code, split_part(h.t, ' ', 1) DESC, h.t DESC
    `);

    return new Map(
      rows
        .filter(
          (row): row is { stockCode: string; currentPrice: number | string } =>
            row.currentPrice !== null && row.currentPrice !== undefined,
        )
        .map((row) => [row.stockCode, Number(row.currentPrice)]),
    );
  }

  private async loadStockPriceMetaMap(stockCodes: string[]): Promise<Map<string, StockPriceMeta>> {
    if (stockCodes.length === 0) {
      return new Map();
    }

    const normalizedCodes = Array.from(
      new Set(stockCodes.map((code) => this.normalizeStockCode(code))),
    );
    const allCandidates = Array.from(
      new Set(normalizedCodes.flatMap((code) => this.getStockCodeCandidates(code))),
    );

    const [stocks, latestPriceMap] = await Promise.all([
      this.prisma.stock.findMany({
        where: { code: { in: allCandidates } },
        select: { code: true, currentPrice: true, totalMarketCap: true },
      }),
      this.loadLatestPriceMap(allCandidates),
    ]);

    const metaByStoredCode = new Map<string, StockPriceMeta>();
    for (const stock of stocks) {
      metaByStoredCode.set(stock.code, {
        currentPrice:
          latestPriceMap.get(stock.code) ?? this.toNumber(stock.currentPrice),
        totalMarketCap: this.toNumber(stock.totalMarketCap),
      });
    }

    const result = new Map<string, StockPriceMeta>();
    for (const stockCode of normalizedCodes) {
      const candidates = this.getStockCodeCandidates(stockCode);
      const matched = candidates.find((candidate) => metaByStoredCode.has(candidate));
      if (!matched) {
        continue;
      }

      const meta = metaByStoredCode.get(matched)!;
      result.set(stockCode, meta);
      result.set(this.canonicalizeStockCode(stockCode), meta);
    }

    return result;
  }

  private formatDateLabel(date: Date | null | undefined): string {
    if (!date) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  /**
   * 根据股票代码查找分红记录
   */
  async findByStockCode(stockCode: string) {
    const activeSlot = await this.getActiveDataSlot();
    const candidates = this.getStockCodeCandidates(stockCode);

    return this.prisma.dividend.findMany({
      where: {
        stockCode: {
          in: candidates,
        },
        dataSlot: activeSlot,
      },
      include: {
        stock: {
          select: {
            currentPrice: true,
            totalMarketCap: true,
          },
        },
      },
      orderBy: { dividendYear: 'desc' },
    });
  }

  async getEffectiveStockPriceMeta(stockCode: string): Promise<StockPriceMeta | null> {
    const priceMetaMap = await this.loadStockPriceMetaMap([stockCode]);

    return (
      priceMetaMap.get(stockCode) ??
      priceMetaMap.get(this.normalizeStockCode(stockCode)) ??
      priceMetaMap.get(this.canonicalizeStockCode(stockCode)) ??
      null
    );
  }

  async getEffectiveTotalShares(stockCode: string): Promise<number | null> {
    const capitalShareMap = await this.loadCapitalShareMap([stockCode]);

    return (
      capitalShareMap.get(stockCode) ??
      capitalShareMap.get(this.normalizeStockCode(stockCode)) ??
      capitalShareMap.get(this.canonicalizeStockCode(stockCode)) ??
      null
    );
  }

  async findLatestMetricByStockCode(stockCode: string): Promise<StockDividendMetric | null> {
    const activeSlot = await this.getActiveDataSlot();
    const candidates = this.getStockCodeCandidates(stockCode);

    const dividend = await this.prisma.dividend.findFirst({
      where: {
        stockCode: {
          in: candidates,
        },
        cashDividend: {
          not: null,
        },
        dataSlot: activeSlot,
      },
      orderBy: [
        { dividendYear: 'desc' },
        { dividendDate: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    if (!dividend) {
      return null;
    }

    const [priceMeta, capitalShareMap] = await Promise.all([
      this.getEffectiveStockPriceMeta(dividend.stockCode),
      this.loadCapitalShareMap([dividend.stockCode]),
    ]);
    const cashDividend = this.toNumber(dividend.cashDividend);
    const currentPrice = priceMeta?.currentPrice ?? null;

    return {
      stockCode: dividend.stockCode,
      stockName: dividend.stockName,
      dividendYear: dividend.dividendYear,
      dividendDate: dividend.dividendDate,
      cashDividend,
      totalDividend:
        this.toNumber(dividend.totalDividend) ??
        this.estimateTotalDividend({
          cashDividend,
          currentPrice,
          totalMarketCap: priceMeta?.totalMarketCap ?? null,
          totalShares: capitalShareMap.get(dividend.stockCode) ?? null,
        }),
      dividendYield: this.calculateDividendYield({
        cashDividend,
        currentPrice,
        storedYield: this.toNumber(dividend.dividendYield),
      }),
      currentPrice,
      dataSlot: dividend.dataSlot,
    };
  }

  /**
   * 补齐分红业务表中的股息率与分红总额。
   * 价格优先使用最新日线收盘价，其次使用 stocks.currentPrice；总股本优先使用 company_capitals.zgb。
   * 若目标槽位为空且另一槽位已有分红业务数据，先镜像一份到目标槽位，保证 A/B 切源后字段仍完整。
   */
  async backfillDividendMetrics(
    dataSlot?: BusinessDataSlot,
  ): Promise<DividendMetricBackfillSummary> {
    const targetSlot = dataSlot ?? (await this.getActiveDataSlot());
    const mirroredRecords = await this.ensureDividendSlotSeeded(targetSlot);

    const updatedRows = await this.prisma.$queryRaw<Array<{ id: bigint }>>(Prisma.sql`
      WITH latest_history_price AS (
        SELECT DISTINCT ON (split_part(h.dm, '.', 1))
          split_part(h.dm, '.', 1) AS "normalizedCode",
          h.c AS "currentPrice"
        FROM hs_stock_history_trading h
        WHERE h.model = 'n'
          AND h.c IS NOT NULL
        ORDER BY split_part(h.dm, '.', 1), split_part(h.t, ' ', 1) DESC, h.t DESC
      ),
      latest_capital AS (
        SELECT DISTINCT ON (split_part(cc."stockCode", '.', 1))
          split_part(cc."stockCode", '.', 1) AS "normalizedCode",
          cc.zgb AS "totalShares"
        FROM company_capitals cc
        WHERE cc.zgb IS NOT NULL
        ORDER BY split_part(cc."stockCode", '.', 1), cc.plrq DESC NULLS LAST, cc.bdrq DESC NULLS LAST, cc."createdAt" DESC
      ),
      price_meta AS (
        SELECT
          s.code AS "stockCode",
          split_part(s.code, '.', 1) AS "normalizedCode",
          COALESCE(lhp."currentPrice", s."currentPrice") AS "currentPrice",
          lc."totalShares" AS "totalShares",
          COALESCE(
            s."totalMarketCap",
            CASE
              WHEN lc."totalShares" IS NOT NULL
                AND COALESCE(lhp."currentPrice", s."currentPrice") IS NOT NULL
                THEN lc."totalShares" * COALESCE(lhp."currentPrice", s."currentPrice")
              ELSE NULL
            END
          ) AS "totalMarketCap"
        FROM stocks s
        LEFT JOIN latest_history_price lhp
          ON split_part(s.code, '.', 1) = lhp."normalizedCode"
        LEFT JOIN latest_capital lc
          ON split_part(s.code, '.', 1) = lc."normalizedCode"
      ),
      updated AS (
        UPDATE dividends d
        SET
          "dividendYield" = CASE
            WHEN d."cashDividend" IS NOT NULL
              AND pm."currentPrice" IS NOT NULL
              AND pm."currentPrice" > 0
              THEN ROUND((d."cashDividend" / pm."currentPrice" * 100)::numeric, 4)
            ELSE d."dividendYield"
          END,
          "totalDividend" = COALESCE(
            NULLIF(d."totalDividend", 0),
            CASE
              WHEN d."cashDividend" IS NOT NULL
                AND pm."totalShares" IS NOT NULL
                THEN ROUND((d."cashDividend" * pm."totalShares")::numeric, 2)
              WHEN d."cashDividend" IS NOT NULL
                AND pm."totalMarketCap" IS NOT NULL
                AND pm."currentPrice" IS NOT NULL
                AND pm."currentPrice" > 0
                THEN ROUND((d."cashDividend" * pm."totalMarketCap" / pm."currentPrice")::numeric, 2)
              ELSE NULL
            END
          ),
          "updatedAt" = now()
        FROM price_meta pm
        WHERE split_part(d."stockCode", '.', 1) = pm."normalizedCode"
          AND d."dataSlot" = ${targetSlot}::"BusinessDataSlot"
          AND d."cashDividend" IS NOT NULL
          AND (
            (
              pm."currentPrice" IS NOT NULL
              AND pm."currentPrice" > 0
              AND (
                d."dividendYield" IS NULL
                OR d."dividendYield" <> ROUND((d."cashDividend" / pm."currentPrice" * 100)::numeric, 4)
              )
            )
            OR (
              (d."totalDividend" IS NULL OR d."totalDividend" = 0)
              AND (
                pm."totalShares" IS NOT NULL
                OR (
                  pm."totalMarketCap" IS NOT NULL
                  AND pm."currentPrice" IS NOT NULL
                  AND pm."currentPrice" > 0
                )
              )
            )
          )
        RETURNING d.id
      )
      SELECT id FROM updated
    `);

    const coverage = await this.getDividendMetricCoverage(targetSlot);

    return {
      ...coverage,
      mirroredRecords,
      updatedRecords: updatedRows.length,
    };
  }

  private async ensureDividendSlotSeeded(targetSlot: BusinessDataSlot): Promise<number> {
    const sourceSlot: BusinessDataSlot =
      targetSlot === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
    const sourceCount = await this.prisma.dividend.count({
      where: { dataSlot: sourceSlot },
    });
    if (sourceCount === 0) {
      return 0;
    }

    return this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO dividends (
        "stockCode",
        "stockName",
        "dividendYear",
        "dividendDate",
        "cashDividend",
        "bonusShare",
        "transferShare",
        "totalDividend",
        "dividendYield",
        "dataSlot",
        "createdAt",
        "updatedAt"
      )
      SELECT
        "stockCode",
        "stockName",
        "dividendYear",
        "dividendDate",
        "cashDividend",
        "bonusShare",
        "transferShare",
        "totalDividend",
        "dividendYield",
        ${targetSlot}::"BusinessDataSlot",
        now(),
        now()
      FROM dividends
      WHERE "dataSlot" = ${sourceSlot}::"BusinessDataSlot"
      ON CONFLICT ("stockCode", "dividendYear", "dataSlot") DO NOTHING
    `);
  }

  async getDividendMetricCoverage(
    dataSlot?: BusinessDataSlot,
  ): Promise<DividendMetricCoverageSummary> {
    const targetSlot = dataSlot ?? (await this.getActiveDataSlot());
    const [coverage] = await this.prisma.$queryRaw<Array<{
      totalRecords: bigint;
      cashDividendRecords: bigint;
      recordsWithPrice: bigint;
      yieldReadyRecords: bigint;
      totalDividendReadyRecords: bigint;
    }>>(Prisma.sql`
      WITH latest_history_price AS (
        SELECT DISTINCT ON (split_part(h.dm, '.', 1))
          split_part(h.dm, '.', 1) AS "normalizedCode",
          h.c AS "currentPrice"
        FROM hs_stock_history_trading h
        WHERE h.model = 'n'
          AND h.c IS NOT NULL
        ORDER BY split_part(h.dm, '.', 1), split_part(h.t, ' ', 1) DESC, h.t DESC
      ),
      price_meta AS (
        SELECT
          split_part(s.code, '.', 1) AS "normalizedCode",
          COALESCE(lhp."currentPrice", s."currentPrice") AS "currentPrice"
        FROM stocks s
        LEFT JOIN latest_history_price lhp
          ON split_part(s.code, '.', 1) = lhp."normalizedCode"
      )
      SELECT
        COUNT(*)::bigint AS "totalRecords",
        COUNT(*) FILTER (
          WHERE d."cashDividend" IS NOT NULL
            AND d."cashDividend" > 0
        )::bigint AS "cashDividendRecords",
        COUNT(*) FILTER (
          WHERE d."cashDividend" IS NOT NULL
            AND d."cashDividend" > 0
            AND pm."currentPrice" IS NOT NULL
            AND pm."currentPrice" > 0
        )::bigint AS "recordsWithPrice",
        COUNT(*) FILTER (
          WHERE d."cashDividend" IS NOT NULL
            AND d."cashDividend" > 0
            AND d."dividendYield" IS NOT NULL
        )::bigint AS "yieldReadyRecords",
        COUNT(*) FILTER (
          WHERE d."cashDividend" IS NOT NULL
            AND d."cashDividend" > 0
            AND d."totalDividend" IS NOT NULL
            AND d."totalDividend" > 0
        )::bigint AS "totalDividendReadyRecords"
      FROM dividends d
      LEFT JOIN price_meta pm
        ON split_part(d."stockCode", '.', 1) = pm."normalizedCode"
      WHERE d."dataSlot" = ${targetSlot}::"BusinessDataSlot"
    `);

    const cashDividendRecords = this.toNumber(coverage?.cashDividendRecords) ?? 0;
    const yieldReadyRecords = this.toNumber(coverage?.yieldReadyRecords) ?? 0;
    const totalDividendReadyRecords =
      this.toNumber(coverage?.totalDividendReadyRecords) ?? 0;

    return {
      dataSlot: targetSlot,
      totalRecords: this.toNumber(coverage?.totalRecords) ?? 0,
      cashDividendRecords,
      recordsWithPrice: this.toNumber(coverage?.recordsWithPrice) ?? 0,
      yieldReadyRecords,
      totalDividendReadyRecords,
      missingYieldRecords: Math.max(0, cashDividendRecords - yieldReadyRecords),
      missingTotalDividendRecords: Math.max(
        0,
        cashDividendRecords - totalDividendReadyRecords,
      ),
      isComplete:
        cashDividendRecords === 0 ||
        (yieldReadyRecords >= cashDividendRecords &&
          totalDividendReadyRecords >= cashDividendRecords),
    };
  }

  /**
   * 获取股息率排行榜
   * 数据源：dividends 业务表，结合 stock 表补充当前价格
   */
  async getDividendYieldRanking(options: {
    page: number;
    pageSize: number;
    year?: number;
    mode?: DividendRankingMode;
  }): Promise<DividendYieldRankingResult> {
    const { page, pageSize, year } = options;
    const skip = (page - 1) * pageSize;
    const mode = options.mode ?? 'rolling1y';
    const activeSlot = await this.getActiveDataSlot();

    if (mode === 'rolling1y') {
      const rollingStartDate = new Date();
      rollingStartDate.setUTCFullYear(rollingStartDate.getUTCFullYear() - 1);
      rollingStartDate.setUTCHours(0, 0, 0, 0);
      const dividends = await this.prisma.dividend.findMany({
        where: {
          dividendDate: {
            not: null,
            gte: rollingStartDate,
          },
          cashDividend: { not: null },
          dataSlot: activeSlot,
        },
        orderBy: [
          { stockCode: 'asc' },
          { dividendDate: 'desc' },
        ],
      });

      const stockCodes = [...new Set(dividends.map((row) => row.stockCode))];
      const [priceMetaMap, capitalShareMap] = await Promise.all([
        this.loadStockPriceMetaMap(stockCodes),
        this.loadCapitalShareMap(stockCodes),
      ]);

      const groupedMap = new Map<string, typeof dividends>();
      for (const row of dividends) {
        if (!groupedMap.has(row.stockCode)) {
          groupedMap.set(row.stockCode, []);
        }
        groupedMap.get(row.stockCode)!.push(row);
      }

      const aggregatedRows = Array.from(groupedMap.entries())
        .map<DividendYieldRow>(([stockCode, rows]) => {
          const priceMeta = priceMetaMap.get(stockCode) ?? null;
          const dividendPerShare = rows.reduce(
            (sum, row) => sum + (this.toNumber(row.cashDividend) ?? 0),
            0,
          );
          const storedTotalDividend = rows.reduce(
            (sum, row) => sum + (this.toNumber(row.totalDividend) ?? 0),
            0,
          );
          const storedYield = rows.reduce(
            (sum, row) => sum + (this.toNumber(row.dividendYield) ?? 0),
            0,
          );
          const dates = rows
            .map((row) => row.dividendDate)
            .filter((date): date is Date => date != null)
            .sort((left, right) => left.getTime() - right.getTime());
          const currentPrice = priceMeta?.currentPrice ?? null;

          return {
            stockCode,
            stockName: rows[0]?.stockName ?? stockCode,
            year: null,
            periodLabel: `${this.formatDateLabel(dates[0])}~${this.formatDateLabel(dates[dates.length - 1])}`,
            dividendPerShare,
            totalDividend:
              storedTotalDividend > 0
                ? Number(storedTotalDividend.toFixed(2))
                : this.estimateTotalDividend({
                    cashDividend: dividendPerShare,
                    currentPrice,
                    totalMarketCap: priceMeta?.totalMarketCap ?? null,
                    totalShares: capitalShareMap.get(stockCode) ?? null,
                  }),
            dividendYield: this.calculateDividendYield({
              cashDividend: dividendPerShare,
              currentPrice,
              storedYield: storedYield > 0 ? storedYield : null,
            }),
            currentPrice,
          };
        })
        .sort((left, right) => this.compareDividendRows(left, right));

      return {
        list: aggregatedRows.slice(skip, skip + pageSize),
        total: aggregatedRows.length,
      };
    }

    if (mode === 'avg3y') {
      const dividends = await this.prisma.dividend.findMany({
        where: {
          cashDividend: { not: null },
          dataSlot: activeSlot,
        },
        orderBy: [
          { stockCode: 'asc' },
          { dividendYear: 'desc' },
        ],
      });

      const stockCodes = [...new Set(dividends.map((row) => row.stockCode))];
      const [priceMetaMap, capitalShareMap] = await Promise.all([
        this.loadStockPriceMetaMap(stockCodes),
        this.loadCapitalShareMap(stockCodes),
      ]);

      const groupedMap = new Map<string, typeof dividends>();
      for (const row of dividends) {
        if (!groupedMap.has(row.stockCode)) {
          groupedMap.set(row.stockCode, []);
        }
        groupedMap.get(row.stockCode)!.push(row);
      }

      const aggregatedRows = Array.from(groupedMap.values())
        .map<DividendYieldRow | null>((rows) => {
          const stockCode = rows[0]?.stockCode;
          if (!stockCode) {
            return null;
          }

          const priceMeta = priceMetaMap.get(stockCode) ?? null;
          const currentPrice = priceMeta?.currentPrice ?? null;
          const recentRows = rows
            .map((row) => {
              const cashDividend = this.toNumber(row.cashDividend);
              const dividendYield = this.calculateDividendYield({
                cashDividend,
                currentPrice,
                storedYield: this.toNumber(row.dividendYield),
              });

              return {
                row,
                cashDividend,
                dividendYield,
                totalDividend:
                  this.toNumber(row.totalDividend) ??
                  this.estimateTotalDividend({
                    cashDividend,
                    currentPrice,
                    totalMarketCap: priceMeta?.totalMarketCap ?? null,
                    totalShares: capitalShareMap.get(stockCode) ?? null,
                  }),
              };
            })
            .filter((item) => item.dividendYield != null)
            .sort((left, right) => right.row.dividendYear - left.row.dividendYear)
            .slice(0, 3);

          if (recentRows.length < 3) {
            return null;
          }

          const totalYield = recentRows.reduce(
            (sum, item) => sum + (item.dividendYield ?? 0),
            0,
          );
          const totalDividend = recentRows.reduce(
            (sum, item) => sum + (item.totalDividend ?? 0),
            0,
          );
          const totalDividendPerShare = recentRows.reduce(
            (sum, item) => sum + (item.cashDividend ?? 0),
            0,
          );
          const years = recentRows.map((item) => item.row.dividendYear).sort((a, b) => a - b);

          return {
            stockCode,
            stockName: recentRows[0].row.stockName,
            year: null,
            periodLabel: `${years[0]}-${years[years.length - 1]}`,
            dividendPerShare: Number(totalDividendPerShare.toFixed(4)),
            totalDividend: totalDividend > 0 ? Number(totalDividend.toFixed(2)) : null,
            dividendYield: Number((totalYield / recentRows.length).toFixed(4)),
            currentPrice,
          };
        })
        .filter((row): row is DividendYieldRow => row !== null)
        .sort((left, right) => this.compareDividendRows(left, right));

      const paginatedRows = aggregatedRows.slice(skip, skip + pageSize);

      return {
        list: paginatedRows,
        total: aggregatedRows.length,
      };
    }

    const dividends = await this.prisma.dividend.findMany({
      where: year
        ? {
            dividendYear: year,
            cashDividend: { not: null },
            dataSlot: activeSlot,
          }
        : {
            cashDividend: { not: null },
            dataSlot: activeSlot,
          },
      orderBy: [
        { dividendYield: 'desc' },
        { dividendYear: 'desc' },
      ],
    });

    if (dividends.length === 0) {
      return {
        list: [],
        total: 0,
      };
    }

    const stockCodes = [...new Set(dividends.map((div) => div.stockCode))];
    const [priceMetaMap, capitalShareMap] = await Promise.all([
      this.loadStockPriceMetaMap(stockCodes),
      this.loadCapitalShareMap(stockCodes),
    ]);

    const hydratedRows = dividends
      .map<DividendYieldRow>((dividend) => {
        const priceMeta = priceMetaMap.get(dividend.stockCode) ?? null;
        const currentPrice = priceMeta?.currentPrice ?? null;
        const cashDividend = this.toNumber(dividend.cashDividend);

        return {
          stockCode: dividend.stockCode,
          stockName: dividend.stockName,
          year: dividend.dividendYear,
          periodLabel: `${dividend.dividendYear}年`,
          dividendPerShare: cashDividend,
          totalDividend:
            this.toNumber(dividend.totalDividend) ??
            this.estimateTotalDividend({
              cashDividend,
              currentPrice,
              totalMarketCap: priceMeta?.totalMarketCap ?? null,
              totalShares: capitalShareMap.get(dividend.stockCode) ?? null,
            }),
          dividendYield: this.calculateDividendYield({
            cashDividend,
            currentPrice,
            storedYield: this.toNumber(dividend.dividendYield),
          }),
          currentPrice,
        };
      })
      .sort((left, right) => this.compareDividendRows(left, right));

    return {
      list: hydratedRows.slice(skip, skip + pageSize),
      total: hydratedRows.length,
    };
  }

  /**
   * 统计分红记录数量
   */
  async count(year?: number): Promise<number> {
    const activeSlot = await this.getActiveDataSlot();
    return this.prisma.dividend.count({
      where: year
        ? {
            dividendYear: year,
            dataSlot: activeSlot,
          }
        : {
            dataSlot: activeSlot,
          },
    });
  }
}
