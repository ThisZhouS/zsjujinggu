/**
 * WatchlistRepository - 自选股数据访问层
 * 负责自选股 CRUD 操作
 */

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

export interface WatchlistRow {
  id: number;
  userId: number;
  stockCode: string;
  stockName: string;
  sortOrder: number;
  currentPrice: number | null;
  changePercent: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindWatchlistOptions {
  skip?: number;
  take?: number;
}

export interface WatchlistListResult {
  list: WatchlistRow[];
  total: number;
}

interface WatchlistWithStock {
  id: bigint;
  userId: bigint;
  stockCode: string;
  stockName: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  stock: {
    currentPrice: unknown;
  };
}

interface LocalStockInfo {
  code: string;
  name: string;
}

@Injectable()
export class WatchlistRepository {
  constructor(private prisma: PrismaService) {}

  normalizeStockCode(code: string): string {
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

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private mapWatchlistRow(w: WatchlistWithStock): WatchlistRow {
    return {
      id: Number(w.id),
      userId: Number(w.userId),
      stockCode: w.stockCode,
      stockName: w.stockName,
      sortOrder: w.sortOrder,
      currentPrice: this.toNumber(w.stock.currentPrice),
      changePercent: null,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    };
  }

  private async loadLatestChangePercentMap(stockCodes: string[]): Promise<Map<string, number>> {
    if (stockCodes.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.$queryRaw<Array<{
      stockCode: string;
      changePercent: number | string | null;
    }>>(Prisma.sql`
      WITH latest_kline AS (
        SELECT DISTINCT ON ("stockCode")
          "stockCode",
          "changePct" AS "changePercent"
        FROM kline_daily
        WHERE "stockCode" IN (${Prisma.join(stockCodes)})
          AND "changePct" IS NOT NULL
        ORDER BY "stockCode", "tradeDate" DESC
      ),
      latest_history AS (
        SELECT DISTINCT ON (s.code)
          s.code AS "stockCode",
          CASE
            WHEN h.pc IS NOT NULL AND h.pc > 0 AND h.c IS NOT NULL
              THEN ROUND(((h.c - h.pc) / h.pc * 100)::numeric, 4)
            ELSE NULL
          END AS "changePercent"
        FROM stocks s
        INNER JOIN hs_stock_history_trading h
          ON split_part(s.code, '.', 1) = split_part(h.dm, '.', 1)
        WHERE s.code IN (${Prisma.join(stockCodes)})
          AND h.model = 'n'
        ORDER BY s.code, split_part(h.t, ' ', 1) DESC, h.t DESC
      )
      SELECT
        s.code AS "stockCode",
        COALESCE(k."changePercent", h."changePercent") AS "changePercent"
      FROM stocks s
      LEFT JOIN latest_kline k ON k."stockCode" = s.code
      LEFT JOIN latest_history h ON h."stockCode" = s.code
      WHERE s.code IN (${Prisma.join(stockCodes)})
    `);

    return new Map(
      rows
        .map((row) => [row.stockCode, this.toNumber(row.changePercent)] as const)
        .filter((row): row is readonly [string, number] => row[1] !== null),
    );
  }

  async findStockByCode(stockCode: string): Promise<LocalStockInfo | null> {
    const normalizedCode = this.normalizeStockCode(stockCode);
    const stock = await this.prisma.stock.findUnique({
      where: { code: normalizedCode },
      select: {
        code: true,
        name: true,
      },
    });

    return stock;
  }

  /**
   * 根据用户 ID 查找所有自选股
   */
  async findByUserId(userId: number, options: FindWatchlistOptions = {}): Promise<WatchlistListResult> {
    const { skip = 0, take = 20 } = options;
    const [watchlists, total] = await this.prisma.$transaction([
      this.prisma.watchlist.findMany({
        where: { userId },
        include: {
          stock: true,
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take,
      }),
      this.prisma.watchlist.count({
        where: { userId },
      }),
    ]);

    const rows = watchlists.map((w) => this.mapWatchlistRow(w));
    const changePercentMap = await this.loadLatestChangePercentMap(
      rows.map((row) => row.stockCode),
    );

    return {
      list: rows.map((row) => ({
        ...row,
        changePercent: changePercentMap.get(row.stockCode) ?? row.changePercent,
      })),
      total,
    };
  }

  /**
   * 查找单个自选股记录
   */
  async findOne(id: number, userId: number): Promise<WatchlistRow | null> {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id, userId },
      include: {
        stock: true,
      },
    });

    if (!watchlist) {
      return null;
    }

    return this.mapWatchlistRow(watchlist);
  }

  /**
   * 创建自选股记录
   */
  async create(userId: number, stockCode: string, stockName: string): Promise<WatchlistRow> {
    const normalizedCode = this.normalizeStockCode(stockCode);
    // 检查是否已存在
    const existing = await this.prisma.watchlist.findUnique({
      where: {
        userId_stockCode: {
          userId,
          stockCode: normalizedCode,
        },
      },
    });

    if (existing) {
      throw new ConflictException('该股票已在自选股中');
    }

    const watchlist = await this.prisma.watchlist.create({
      data: {
        userId,
        stockCode: normalizedCode,
        stockName,
        sortOrder: 0,
      },
      include: {
        stock: true,
      },
    });

    return this.mapWatchlistRow(watchlist);
  }

  /**
   * 删除自选股记录
   */
  async delete(id: number, userId: number): Promise<void> {
    const watchlist = await this.prisma.watchlist.findFirst({
      where: { id, userId },
    });

    if (!watchlist) {
      throw new NotFoundException('自选股记录不存在');
    }

    await this.prisma.watchlist.delete({
      where: { id },
    });
  }

  /**
   * 更新自选股排序
   */
  async updateSortOrder(userId: number, stockCodes: string[]): Promise<void> {
    const normalizedCodes = stockCodes.map((stockCode) => this.normalizeStockCode(stockCode));
    await this.prisma.$transaction(
      normalizedCodes.map((stockCode, index) =>
        this.prisma.watchlist.update({
          where: {
            userId_stockCode: {
              userId,
              stockCode,
            },
          },
          data: {
            sortOrder: index,
          },
        }),
      ),
    );
  }
}
