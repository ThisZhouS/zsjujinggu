/**
 * Stock Repository - 股票数据访问层
 * 负责单表 CRUD 操作
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { HsIndexRealTimeData, Stock, Market } from '@prisma/client';

@Injectable()
export class StockRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 批量获取指数最新实时快照
   */
  async findLatestIndexSnapshots(indexCodes: string[]): Promise<HsIndexRealTimeData[]> {
    if (indexCodes.length === 0) {
      return [];
    }

    const rows = await this.prisma.hsIndexRealTimeData.findMany({
      where: {
        indexCode: {
          in: indexCodes,
        },
      },
      orderBy: {
        t: 'desc',
      },
    });

    const latestMap = new Map<string, HsIndexRealTimeData>();
    for (const row of rows) {
      if (!latestMap.has(row.indexCode)) {
        latestMap.set(row.indexCode, row);
      }
    }

    return indexCodes
      .map((indexCode) => latestMap.get(indexCode))
      .filter((row): row is HsIndexRealTimeData => Boolean(row));
  }

  /**
   * 根据代码查找股票
   */
  async findByCode(code: string): Promise<Stock | null> {
    return this.prisma.stock.findUnique({
      where: { code },
    });
  }

  async findByCodeCandidates(codes: string[]): Promise<Stock | null> {
    const uniqueCodes = Array.from(new Set(codes.filter(Boolean)));
    if (uniqueCodes.length === 0) {
      return null;
    }

    const stocks = await this.prisma.stock.findMany({
      where: {
        code: {
          in: uniqueCodes,
        },
      },
    });

    return uniqueCodes
      .map((code) => stocks.find((stock) => stock.code === code))
      .find((stock): stock is Stock => Boolean(stock)) ?? null;
  }

  /**
   * 根据名称查找股票
   */
  async findByName(name: string): Promise<Stock | null> {
    return this.prisma.stock.findFirst({
      where: { name },
    });
  }

  async findByCodes(codes: string[]): Promise<Stock[]> {
    if (codes.length === 0) {
      return [];
    }

    return this.prisma.stock.findMany({
      where: {
        code: {
          in: codes,
        },
      },
    });
  }

  async findLatestRevenueByCodes(stockCodes: string[]): Promise<Array<{
    stockCode: string;
    reportDate: string | null;
    mainRevenue: number | null;
  }>> {
    if (stockCodes.length === 0) {
      return [];
    }

    const rows = await this.prisma.incomeStatement.findMany({
      where: {
        dm: {
          in: Array.from(new Set(stockCodes)),
        },
      },
      select: {
        dm: true,
        jzrq: true,
        yyzsr: true,
      },
      orderBy: [
        { dm: 'asc' },
        { jzrq: 'desc' },
      ],
    });

    const latestMap = new Map<string, {
      stockCode: string;
      reportDate: string | null;
      mainRevenue: number | null;
    }>();

    for (const row of rows) {
      if (!latestMap.has(row.dm)) {
        latestMap.set(row.dm, {
          stockCode: row.dm,
          reportDate: row.jzrq,
          mainRevenue: row.yyzsr != null ? Number(row.yyzsr) : null,
        });
      }
    }

    return Array.from(latestMap.values());
  }

  /**
   * 分页查询股票列表
   * 支持关键词搜索、市场过滤和排序
   */
  async findMany(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    market?: Market;
    sortBy?: string;
  }): Promise<Stock[]> {
    const { page, pageSize, keyword, market, sortBy = 'changePercent' } = options;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ];
    }

    if (market) {
      where.market = market;
    }

    const orderBy: any = {};
    if (sortBy === 'latestPrice') {
      orderBy.currentPrice = 'desc';
    } else if (sortBy === 'volume') {
      orderBy.volume = 'desc';
    } else if (sortBy === 'turnover') {
      orderBy.turnover = 'desc';
    } else {
      // 默认按涨跌幅排序
      orderBy.changePercent = 'desc';
    }

    return this.prisma.stock.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
    });
  }

  /**
   * 统计股票数量
   */
  async count(keyword?: string, market?: Market): Promise<number> {
    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ];
    }

    if (market) {
      where.market = market;
    }

    return this.prisma.stock.count({ where });
  }

  /**
   * 创建股票
   */
  async create(data: {
    code: string;
    name: string;
    industry?: string;
    market?: Market;
    listingDate?: Date;
    currentPrice?: number;
    totalMarketCap?: number;
    priceUpdatedAt?: Date;
  }): Promise<Stock> {
    return this.prisma.stock.create({
      data,
    });
  }

  /**
   * 更新股票
   */
  async update(id: number, data: Partial<Stock>): Promise<Stock> {
    return this.prisma.stock.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  /**
   * 根据代码更新股票
   */
  async updateByCode(code: string, data: Partial<Stock>): Promise<Stock> {
    return this.prisma.stock.update({
      where: { code },
      data,
    });
  }

  /**
   * 删除股票
   */
  async delete(id: bigint): Promise<void> {
    await this.prisma.stock.delete({
      where: { id },
    });
  }

  /**
   * 查找所有活跃股票（用于缓存）
   * 返回当前价格不为 null 的股票
   */
  async findAllActive(): Promise<Stock[]> {
    return this.prisma.stock.findMany({
      where: {
        currentPrice: {
          not: null,
        },
      },
    });
  }

  /**
   * 批量创建或更新股票
   */
  async upsertMany(
    stocks: Array<{
      code: string;
      name: string;
      industry?: string;
      market?: Market;
      currentPrice?: number;
      totalMarketCap?: number;
      priceUpdatedAt?: Date;
    }>,
  ): Promise<void> {
    await this.prisma.$transaction(
      stocks.map((stock) =>
        this.prisma.stock.upsert({
          where: { code: stock.code },
          update: stock,
          create: stock,
        }),
      ),
    );
  }

  /**
   * 批量更新行情数据
   */
  async updateQuotes(
    quotes: Array<{
      code: string;
      currentPrice: number;
      totalMarketCap: number;
      priceUpdatedAt: Date;
    }>,
  ): Promise<void> {
    await this.prisma.$transaction(
      quotes.map((quote) =>
        this.prisma.stock.update({
          where: { code: quote.code },
          data: {
            currentPrice: quote.currentPrice,
            totalMarketCap: quote.totalMarketCap,
            priceUpdatedAt: quote.priceUpdatedAt,
          },
        }),
      ),
    );
  }
}
