/**
 * TopGainer Repository - 涨幅榜数据访问层
 * 负责涨幅榜数据查询、涨停/跌停次数统计
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { GainerPeriod } from './dto/top-gainer.dto';

export interface TopGainerRow {
  code: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  change: number;
  startPrice: number;
  industry?: string | null;
  volume: number;
  turnover: number;
  amount: number;
  marketCap: number;
}

export interface LimitStockCount {
  dm: string;
  mc: string | null;
  count: number;
  latestDate: string;
}

interface LatestHistoryRow {
  dm: string;
  pc: number | string | null;
  currentPrice: number | string | null;
  volume: number | string | bigint | null;
  amount: number | string | null;
}

interface LatestKlineRow {
  dm: string;
  volume: number | string | bigint | null;
  amount: number | string | null;
  turnover: number | string | null;
}

interface LimitCountQueryRow {
  dm: string;
  mc: string | null;
  count: number | bigint;
  latestDate: string;
}

interface HistoricalGainerQueryRow {
  code: string;
  name: string;
  industry: string | null;
  currentPrice: number | string | null;
  marketCap: number | string | null;
  startPrice: number | string | null;
  volume: number | string | bigint | null;
  amount: number | string | null;
}

@Injectable()
export class TopGainerRepository {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof value === 'object' && value && 'toNumber' in value) {
      const parsed = Number((value as { toNumber: () => number }).toNumber());
      return Number.isFinite(parsed) ? parsed : null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * 获取历史涨幅榜（从 kline_daily 表计算）
   */
  async getHistoricalGainers(period: GainerPeriod): Promise<TopGainerRow[]> {
    const daysMap: Record<string, number> = {
      '1w': 7,
      '2w': 14,
      '3w': 21,
      '1m': 30,
      '2m': 60,
      '3m': 90,
      '4m': 120,
      '6m': 180,
      '12m': 365,
    };
    const days = daysMap[period];
    if (!days) {
      return [];
    }

    const referenceDate = await this.getLatestHistoryTradeDate();
    if (!referenceDate) {
      return [];
    }

    const startDateString = this.calculateStartDate(period, referenceDate);

    const rows = await this.prisma.$queryRaw<HistoricalGainerQueryRow[]>(Prisma.sql`
      WITH normalized AS (
        SELECT
          s.code,
          s.name,
          s.industry,
          s."totalMarketCap",
          LEFT(h.t, 10)::date AS trade_date,
          h.c,
          h.v,
          h.a,
          ROW_NUMBER() OVER (
            PARTITION BY s.code, LEFT(h.t, 10)
            ORDER BY CASE WHEN h.dm = s.code THEN 0 ELSE 1 END, h.t DESC
          ) AS day_rank
        FROM stocks s
        INNER JOIN hs_stock_history_trading h
          ON split_part(s.code, '.', 1) = split_part(h.dm, '.', 1)
        WHERE s.market = 'A'
          AND h.model = 'n'
          AND h.t >= ${startDateString}
      ),
      daily AS (
        SELECT
          code,
          name,
          industry,
          "totalMarketCap",
          trade_date,
          c,
          v,
          a
        FROM normalized
        WHERE day_rank = 1
          AND c IS NOT NULL
      ),
      start_rows AS (
        SELECT DISTINCT ON (code)
          code,
          c AS start_price
        FROM daily
        ORDER BY code, trade_date ASC
      ),
      latest_rows AS (
        SELECT DISTINCT ON (code)
          code,
          c AS latest_close,
          v AS volume,
          a AS amount
        FROM daily
        ORDER BY code, trade_date DESC
      )
      SELECT
        s.code,
        s.name,
        s.industry,
        latest_rows.latest_close AS "currentPrice",
        s."totalMarketCap" AS "marketCap",
        start_rows.start_price AS "startPrice",
        latest_rows.volume,
        latest_rows.amount
      FROM stocks s
      INNER JOIN start_rows ON start_rows.code = s.code
      INNER JOIN latest_rows ON latest_rows.code = s.code
      WHERE s.market = 'A'
      ORDER BY s.code ASC
    `);

    return rows
      .map((row) => {
        const startPrice = row.startPrice ? Number(row.startPrice) : 0;
        const currentPrice = row.currentPrice ? Number(row.currentPrice) : 0;
        const changePercent =
          startPrice > 0
            ? Number((((currentPrice - startPrice) / startPrice) * 100).toFixed(2))
            : 0;

        return {
          code: row.code,
          name: row.name,
          currentPrice,
          changePercent,
          change: startPrice > 0 ? Number((currentPrice - startPrice).toFixed(2)) : 0,
          startPrice,
          industry: row.industry,
          volume: row.volume ? Number(row.volume) : 0,
          turnover: 0,
          amount: row.amount ? Number(row.amount) : 0,
          marketCap: row.marketCap ? Number(row.marketCap) : 0,
        };
      })
      .filter((item) => item.startPrice > 0 && item.currentPrice > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
  }

  /**
   * 获取今日涨幅榜（全量 A 股）
   */
  async getTodayGainers(): Promise<TopGainerRow[]> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        market: 'A',
      },
      select: {
        code: true,
        name: true,
        industry: true,
        currentPrice: true,
        totalMarketCap: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    if (stocks.length === 0) {
      return [];
    }

    const stockMap = new Map<string, {
      code: string;
      name: string;
      industry: string | null;
      currentPrice: number | null;
      totalMarketCap: number | null;
    }>();

    for (const stock of stocks) {
      const normalizedCode = this.normalizeStockCode(stock.code);
      const existing = stockMap.get(normalizedCode);
      const currentPrice = this.toNumber(stock.currentPrice);
      const totalMarketCap = this.toNumber(stock.totalMarketCap);

      if (!existing) {
        stockMap.set(normalizedCode, {
          code: normalizedCode,
          name: stock.name,
          industry: stock.industry,
          currentPrice,
          totalMarketCap,
        });
        continue;
      }

      stockMap.set(normalizedCode, {
        code: normalizedCode,
        name: existing.name || stock.name,
        industry: existing.industry ?? stock.industry,
        currentPrice: existing.currentPrice ?? currentPrice,
        totalMarketCap: existing.totalMarketCap ?? totalMarketCap,
      });
    }

    const [latestHistoryRows, latestKlineRows] = await Promise.all([
      this.loadLatestHistoryRows(),
      this.loadLatestKlineRows(),
    ]);

    const latestHistoryMap = new Map(
      latestHistoryRows.map((row) => [this.normalizeStockCode(row.dm), row]),
    );
    const latestKlineMap = new Map(
      latestKlineRows.map((row) => [this.normalizeStockCode(row.dm), row]),
    );

    return Array.from(stockMap.values())
      .map((stock) => {
        const latestHistory = latestHistoryMap.get(stock.code);
        const latestKline = latestKlineMap.get(stock.code);
        const startPrice = this.toNumber(latestHistory?.pc) ?? 0;
        const currentPrice =
          this.toNumber(latestHistory?.currentPrice) ??
          stock.currentPrice ??
          0;
        const changePercent =
          startPrice > 0
            ? Number((((currentPrice - startPrice) / startPrice) * 100).toFixed(2))
            : 0;

        return {
          code: stock.code,
          name: stock.name,
          currentPrice,
          changePercent,
          change: startPrice > 0 ? Number((currentPrice - startPrice).toFixed(2)) : 0,
          startPrice,
          industry: stock.industry,
          volume:
            this.toNumber(latestHistory?.volume) ??
            this.toNumber(latestKline?.volume) ??
            0,
          turnover: this.toNumber(latestKline?.turnover) ?? 0,
          amount:
            this.toNumber(latestHistory?.amount) ??
            this.toNumber(latestKline?.amount) ??
            0,
          marketCap: stock.totalMarketCap ?? 0,
        };
      })
      .filter((item) => item.startPrice > 0 && item.currentPrice > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
  }

  /**
   * 获取涨停板数据（从 Redis 缓存）
   */
  async getLimitUpStocks(): Promise<any[]> {
    const today = this.getShanghaiDateString(new Date()).replace(/-/g, '');
    const cacheKey = `limitup:${today}`;
    const cached = await this.redisService.safeGet(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return [];
  }

  /**
   * 统计涨停次数
   * 当日优先使用涨停池，历史周期回退到 kline_daily 真实行情计算
   */
  async getLimitUpCountStats(period: string): Promise<LimitStockCount[]> {
    if (!period) {
      const today = this.getShanghaiDateString(new Date());
      const poolResults = await this.getTodayLimitCountStats('up', today);
      if (poolResults.length > 0) {
        return poolResults;
      }
      const latestTradeDate = await this.getLatestHistoryTradeDate();
      return latestTradeDate ? this.getLimitCountStatsFromKline(latestTradeDate, 'up') : [];
    }

    const latestTradeDate = await this.getLatestHistoryTradeDate();
    if (!latestTradeDate) {
      return [];
    }

    return this.getLimitCountStatsFromKline(this.calculateStartDate(period, latestTradeDate), 'up');
  }

  /**
   * 统计跌停次数
   * 当日优先使用跌停池，历史周期回退到 kline_daily 真实行情计算
   */
  async getLimitDownCountStats(period: string): Promise<LimitStockCount[]> {
    if (!period) {
      const today = this.getShanghaiDateString(new Date());
      const poolResults = await this.getTodayLimitCountStats('down', today);
      if (poolResults.length > 0) {
        return poolResults;
      }
      const latestTradeDate = await this.getLatestHistoryTradeDate();
      return latestTradeDate ? this.getLimitCountStatsFromKline(latestTradeDate, 'down') : [];
    }

    const latestTradeDate = await this.getLatestHistoryTradeDate();
    if (!latestTradeDate) {
      return [];
    }

    return this.getLimitCountStatsFromKline(this.calculateStartDate(period, latestTradeDate), 'down');
  }

  /**
   * 计算开始日期
   */
  private calculateStartDate(period: string, referenceDate: string): string {
    const now = new Date(`${referenceDate}T00:00:00Z`);
    switch (period) {
      case '1w':
        now.setDate(now.getDate() - 7);
        break;
      case '2w':
        now.setDate(now.getDate() - 14);
        break;
      case '3w':
        now.setDate(now.getDate() - 21);
        break;
      case '1m':
        now.setMonth(now.getMonth() - 1);
        break;
      case '2m':
        now.setMonth(now.getMonth() - 2);
        break;
      case '3m':
        now.setMonth(now.getMonth() - 3);
        break;
      case '4m':
        now.setMonth(now.getMonth() - 4);
        break;
      case '6m':
        now.setMonth(now.getMonth() - 6);
        break;
      case '12m':
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        break;
    }

    return this.getShanghaiDateString(now);
  }

  /**
   * 计算股票在指定周期的涨幅
   */
  async calculateGain(stockCode: string, days: number): Promise<number | null> {
    const currentStock = await this.prisma.stock.findUnique({
      where: { code: stockCode },
    });

    if (!currentStock?.currentPrice) {
      return null;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const kline = await this.prisma.klineDaily.findFirst({
      where: {
        stockCode,
        tradeDate: {
          lte: startDate,
        },
      },
      orderBy: {
        tradeDate: 'desc',
      },
    });

    if (!kline) {
      return null;
    }

    const startPrice = Number(kline.close);
    const currentPrice = Number(currentStock.currentPrice);

    return ((currentPrice - startPrice) / startPrice) * 100;
  }

  private async loadLatestHistoryRows(): Promise<LatestHistoryRow[]> {
    const latestTradeDate = await this.getLatestHistoryTradeDate();
    if (!latestTradeDate) {
      return [];
    }

    return this.prisma.$queryRaw<LatestHistoryRow[]>(Prisma.sql`
      SELECT DISTINCT ON (s.code)
        s.code AS dm,
        h.pc,
        h.c AS "currentPrice",
        h.v AS volume,
        h.a AS amount
      FROM hs_stock_history_trading h
      INNER JOIN stocks s ON split_part(s.code, '.', 1) = split_part(h.dm, '.', 1)
      WHERE s.market = 'A'
        AND h.model = 'n'
        AND LEFT(h.t, 10) = ${latestTradeDate}
      ORDER BY s.code, CASE WHEN h.dm = s.code THEN 0 ELSE 1 END, h.t DESC
    `);
  }

  private async loadLatestKlineRows(): Promise<LatestKlineRow[]> {
    const latestTradeDate = await this.getLatestKlineTradeDate();
    if (!latestTradeDate) {
      return [];
    }

    return this.prisma.$queryRaw<LatestKlineRow[]>(Prisma.sql`
      SELECT DISTINCT ON (s.code)
        s.code AS dm,
        k.volume,
        k.amount,
        k.turnover
      FROM kline_daily k
      INNER JOIN stocks s ON split_part(s.code, '.', 1) = split_part(k."stockCode", '.', 1)
      WHERE s.market = 'A'
        AND k."tradeDate" = ${latestTradeDate}
      ORDER BY s.code, CASE WHEN k."stockCode" = s.code THEN 0 ELSE 1 END, k."tradeDate" DESC
    `);
  }

  private async getTodayLimitCountStats(
    direction: 'up' | 'down',
    today: string,
  ): Promise<LimitStockCount[]> {
    const records = await this.loadLimitPoolRecords(direction, today);
    if (records.length === 0) {
      const latestDate =
        direction === 'up'
          ? (await this.prisma.limitUpPool.findFirst({
              orderBy: { date: 'desc' },
              select: { date: true },
            }))?.date
          : (await this.prisma.limitDownPool.findFirst({
              orderBy: { date: 'desc' },
              select: { date: true },
            }))?.date;

      if (latestDate && latestDate !== today) {
        return this.getTodayLimitCountStats(direction, latestDate);
      }
    }

    const unique = new Map<string, LimitStockCount>();
    for (const record of records) {
      const dm = this.normalizeStockCode(record.dm);
      const existing = unique.get(dm);
      const next: LimitStockCount = {
        dm,
        mc: record.mc,
        count: 1,
        latestDate: record.date,
      };

      if (!existing || next.latestDate > existing.latestDate) {
        unique.set(dm, next);
      }
    }

    return Array.from(unique.values()).sort((a, b) => a.dm.localeCompare(b.dm));
  }

  private async getLimitCountStatsFromKline(
    startDate: string,
    direction: 'up' | 'down',
  ): Promise<LimitStockCount[]> {
    const lookbackDate = new Date(`${startDate}T00:00:00Z`);
    lookbackDate.setDate(lookbackDate.getDate() - 10);
    const lookbackStart = lookbackDate.toISOString().slice(0, 10);
    const ratioExpression = this.getLimitRatioExpression();
    const triggerCondition =
      direction === 'up'
        ? Prisma.sql`high >= ROUND(prev_close * (1 + ${ratioExpression}), 2)`
        : Prisma.sql`low <= ROUND(prev_close * (1 - ${ratioExpression}), 2)`;

    const rows = await this.prisma.$queryRaw<LimitCountQueryRow[]>(Prisma.sql`
      WITH normalized AS (
        SELECT
          s.code AS dm,
          COALESCE(s.name, h.dm) AS mc,
          LEFT(h.t, 10)::date AS trade_date,
          h.h AS high,
          h.l AS low,
          h.c AS close,
          h.pc AS prev_close_raw,
          ROW_NUMBER() OVER (
            PARTITION BY s.code, LEFT(h.t, 10)
            ORDER BY CASE WHEN h.dm = s.code THEN 0 ELSE 1 END, h.t DESC
          ) AS day_rank
        FROM hs_stock_history_trading h
        INNER JOIN stocks s ON split_part(s.code, '.', 1) = split_part(h.dm, '.', 1)
        WHERE s.market = 'A'
          AND h.model = 'n'
          AND h.t >= ${lookbackStart}
      ),
      priced AS (
        SELECT
          dm,
          mc,
          trade_date,
          high,
          low,
          COALESCE(prev_close_raw, LAG(close) OVER (PARTITION BY dm ORDER BY trade_date)) AS prev_close
        FROM normalized
        WHERE day_rank = 1
      )
      SELECT
        dm,
        mc,
        COUNT(*)::int AS count,
        MAX(to_char(trade_date, 'YYYY-MM-DD')) AS "latestDate"
      FROM priced
      WHERE trade_date >= ${startDate}::date
        AND prev_close IS NOT NULL
        AND prev_close > 0
        AND ${triggerCondition}
      GROUP BY dm, mc
      ORDER BY count DESC, "latestDate" DESC, dm ASC
    `);

    return rows.map((row) => ({
      dm: row.dm,
      mc: row.mc,
      count: Number(row.count),
      latestDate: row.latestDate,
    }));
  }

  private getLimitRatioExpression(): Prisma.Sql {
    return Prisma.sql`
      CASE
        WHEN UPPER(COALESCE(mc, '')) LIKE '%ST%' THEN 0.05
        WHEN regexp_replace(dm, '\\..*$', '') LIKE '30%' THEN 0.20
        WHEN regexp_replace(dm, '\\..*$', '') LIKE '68%' THEN 0.20
        WHEN regexp_replace(dm, '\\..*$', '') LIKE '8%' THEN 0.30
        WHEN regexp_replace(dm, '\\..*$', '') LIKE '4%' THEN 0.30
        ELSE 0.10
      END
    `;
  }

  private getShanghaiDateString(date: Date): string {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai',
    }).format(date);
  }

  private async getLatestHistoryTradeDate(): Promise<string | null> {
    const latest = await this.prisma.hsStockHistoryTrading.findFirst({
      where: {
        model: 'n',
      },
      orderBy: {
        t: 'desc',
      },
      select: {
        t: true,
      },
    });

    return latest?.t ? latest.t.slice(0, 10) : null;
  }

  private async getLatestKlineTradeDate(): Promise<Date | null> {
    const latest = await this.prisma.klineDaily.findFirst({
      orderBy: {
        tradeDate: 'desc',
      },
      select: {
        tradeDate: true,
      },
    });

    return latest?.tradeDate ?? null;
  }

  private async loadLimitPoolRecords(direction: 'up' | 'down', date: string) {
    if (direction === 'up') {
      return this.prisma.limitUpPool.findMany({
        where: { date },
        select: { dm: true, mc: true, date: true },
      });
    }

    return this.prisma.limitDownPool.findMany({
      where: { date },
      select: { dm: true, mc: true, date: true },
    });
  }

  private normalizeStockCode(code: string): string {
    return code.trim().toUpperCase().split('.')[0];
  }
}
