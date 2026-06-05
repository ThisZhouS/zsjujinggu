/**
 * Executive Repository - 高管交易数据访问层
 * 负责高管交易数据查询
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BusinessDataSlot, Prisma, TradeType } from '@prisma/client';

export interface ExecutiveTradeRow {
  id: number;
  stockCode: string;
  stockName: string;
  executiveName: string;
  executivePosition: string;
  tradeType: TradeType;
  tradeCount: number;
  tradePrice: number | null;
  tradeAmount: number | null;
  tradeDate: Date;
  reportDate: Date;
}

export interface ExecutiveHoldingIncreaseRow {
  stockCode: string;
  stockName: string;
  executiveName: string;
  executivePosition: string;
  currentShares: number;
  previousShares: number;
  increaseShares: number;
  increaseRate: number | null;
  currentHoldRatio: number | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  industry: string | null;
  reportDate: string;
  announcementDate: string | null;
}

@Injectable()
export class ExecutiveRepository {
  constructor(private prisma: PrismaService) {}

  private async getActiveDataSlot(): Promise<BusinessDataSlot> {
    const state = await this.prisma.businessDataSourceState.findUnique({
      where: { id: 1 },
      select: { activeSlot: true },
    });

    return state?.activeSlot ?? 'PRIMARY';
  }

  private normalizeStockCode(value: string): string {
    return value.trim().toUpperCase().split('.')[0];
  }

  private normalizeReportDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    return value.replace(/-/g, '');
  }

  private async getRepresentativeTopFlowHolderReportDates(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ reportDate: string; rowCount: number }>>(Prisma.sql`
      SELECT
        jzrq AS "reportDate",
        COUNT(*)::int AS "rowCount"
      FROM company_top_flow_holders
      WHERE gdlx = '自然人' AND jzrq IS NOT NULL
      GROUP BY jzrq
      ORDER BY jzrq DESC
    `);

    if (rows.length === 0) {
      return [];
    }

    const maxCount = Math.max(...rows.map((row) => Number(row.rowCount) || 0));
    const threshold = Math.max(1, Math.floor(maxCount * 0.3));
    const representativeRows = rows.filter((row) => Number(row.rowCount) >= threshold);

    return (representativeRows.length > 0 ? representativeRows : rows).map((row) => row.reportDate);
  }

  private isMemberActiveAtReportDate(
    reportDate: string,
    startDate?: string | null,
    endDate?: string | null,
  ): boolean {
    const normalizedStart = this.normalizeReportDate(startDate);
    const normalizedEnd = this.normalizeReportDate(endDate);

    if (!normalizedStart) {
      return false;
    }

    if (normalizedStart > reportDate) {
      return false;
    }

    if (normalizedEnd && normalizedEnd < reportDate) {
      return false;
    }

    return true;
  }

  async findRealIncreaseRows(options: {
    keyword?: string;
    reportDate?: string;
  }): Promise<ExecutiveHoldingIncreaseRow[]> {
    const representativeDates = await this.getRepresentativeTopFlowHolderReportDates();
    const targetReportDate =
      this.normalizeReportDate(options.reportDate) ?? representativeDates[0] ?? null;

    if (!targetReportDate) {
      return [];
    }

    const currentRows = await this.prisma.companyTopFlowHolders.findMany({
      where: {
        gdlx: '自然人',
        jzrq: targetReportDate,
        gdmc: { not: null },
        cgsl: { not: null, gt: 0 },
      },
      select: {
        stockCode: true,
        gdmc: true,
        cgsl: true,
        cgbl: true,
        ggrq: true,
        createdAt: true,
      },
      orderBy: [
        { gdmc: 'asc' },
        { stockCode: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const currentMap = new Map<string, (typeof currentRows)[number]>();
    for (const row of currentRows) {
      const executiveName = row.gdmc?.trim();
      if (!executiveName) {
        continue;
      }

      const key = `${row.stockCode}::${executiveName}`;
      if (!currentMap.has(key)) {
        currentMap.set(key, row);
      }
    }

    const dedupedCurrentRows = Array.from(currentMap.values());
    if (dedupedCurrentRows.length === 0) {
      return [];
    }

    const stockCodes = Array.from(new Set(dedupedCurrentRows.map((row) => row.stockCode)));
    const normalizedStockCodes = Array.from(
      new Set(stockCodes.map((stockCode) => this.normalizeStockCode(stockCode))),
    );
    const executiveNames = Array.from(
      new Set(
        dedupedCurrentRows
          .map((row) => row.gdmc?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const [memberRows, previousRows, stockSummaryMap] = await Promise.all([
      this.prisma.executiveMember.findMany({
        where: {
          dm: { in: normalizedStockCodes },
          name: { in: executiveNames },
        },
        orderBy: [
          { dm: 'asc' },
          { name: 'asc' },
          { sdate: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.companyTopFlowHolders.findMany({
        where: {
          gdlx: '自然人',
          jzrq: {
            in: representativeDates.filter((date) => date < targetReportDate).slice(0, 8),
          },
          stockCode: { in: stockCodes },
          gdmc: { in: executiveNames },
          cgsl: { not: null },
        },
        select: {
          stockCode: true,
          gdmc: true,
          cgsl: true,
          createdAt: true,
          jzrq: true,
        },
        orderBy: [
          { gdmc: 'asc' },
          { stockCode: 'asc' },
          { jzrq: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.findStockSummaries(stockCodes),
    ]);

    const memberMap = new Map<string, { position: string; active: boolean }>();
    for (const member of memberRows) {
      const executiveName = member.name?.trim();
      if (!executiveName) {
        continue;
      }

      const key = `${this.normalizeStockCode(member.dm)}::${executiveName}`;
      const active = this.isMemberActiveAtReportDate(targetReportDate, member.sdate, member.edate);
      const existing = memberMap.get(key);

      if (!existing || (active && !existing.active)) {
        memberMap.set(key, {
          position: member.title ?? '高管成员',
          active,
        });
      }
    }

    const previousMap = new Map<string, number>();
    for (const row of previousRows) {
      const executiveName = row.gdmc?.trim();
      if (!executiveName) {
        continue;
      }

      const key = `${row.stockCode}::${executiveName}`;
      if (!previousMap.has(key)) {
        previousMap.set(key, row.cgsl ? Number(row.cgsl) : 0);
      }
    }

    const keywordText = options.keyword?.trim().toLowerCase();

    return dedupedCurrentRows
      .map<ExecutiveHoldingIncreaseRow | null>((row) => {
        const executiveName = row.gdmc?.trim();
        if (!executiveName) {
          return null;
        }

        const key = `${this.normalizeStockCode(row.stockCode)}::${executiveName}`;
        const member = memberMap.get(key);
        if (!member) {
          return null;
        }

        const currentShares = row.cgsl ? Number(row.cgsl) : 0;
        const previousShares = previousMap.get(key) ?? 0;
        if (currentShares <= previousShares) {
          return null;
        }

        const stockSummary = stockSummaryMap.get(row.stockCode);
        return {
          stockCode: row.stockCode,
          stockName: stockSummary?.name ?? row.stockCode,
          executiveName,
          executivePosition: member.position,
          currentShares,
          previousShares,
          increaseShares: currentShares - previousShares,
          increaseRate:
            previousShares > 0
              ? ((currentShares - previousShares) / previousShares) * 100
              : null,
          currentHoldRatio: row.cgbl ? Number(row.cgbl) : null,
          currentPrice: stockSummary?.currentPrice ?? null,
          totalMarketCap: stockSummary?.totalMarketCap ?? null,
          industry: stockSummary?.industry ?? null,
          reportDate: `${targetReportDate.slice(0, 4)}-${targetReportDate.slice(4, 6)}-${targetReportDate.slice(6, 8)}`,
          announcementDate: row.ggrq ? `${row.ggrq.slice(0, 4)}-${row.ggrq.slice(4, 6)}-${row.ggrq.slice(6, 8)}` : null,
        };
      })
      .filter((row): row is ExecutiveHoldingIncreaseRow => row !== null)
      .filter((row) => {
        if (!keywordText) {
          return true;
        }

        return [
          row.stockCode,
          row.stockName,
          row.executiveName,
          row.executivePosition,
        ].some((field) => field.toLowerCase().includes(keywordText));
      });
  }

  /**
   * 根据股票代码查找高管交易记录
   */
  async findByStockCode(stockCode: string): Promise<ExecutiveTradeRow[]> {
    const activeSlot = await this.getActiveDataSlot();
    const trades = await this.prisma.executiveTrade.findMany({
      where: {
        stockCode,
        dataSlot: activeSlot,
      },
      orderBy: { reportDate: 'desc' },
    });

    return trades.map((t) => ({
      id: Number(t.id),
      stockCode: t.stockCode,
      stockName: t.stockName,
      executiveName: t.executiveName,
      executivePosition: t.executivePosition,
      tradeType: t.tradeType,
      tradeCount: Number(t.tradeCount),
      tradePrice: t.tradePrice ? Number(t.tradePrice) : null,
      tradeAmount: t.tradeAmount ? Number(t.tradeAmount) : null,
      tradeDate: t.tradeDate,
      reportDate: t.reportDate,
    }));
  }

  /**
   * 查询高管增持记录
   */
  async findIncrease(options: {
    page: number;
    pageSize: number;
    keyword?: string;
  }): Promise<ExecutiveTradeRow[]> {
    const activeSlot = await this.getActiveDataSlot();
    const { page, pageSize, keyword } = options;
    const skip = (page - 1) * pageSize;

    const where: any = {
      tradeType: 'INCREASE',
      dataSlot: activeSlot,
      ...(keyword ? {
        OR: [
          { stockName: { contains: keyword } },
          { executiveName: { contains: keyword } },
        ],
      } : {}),
    };

    const trades = await this.prisma.executiveTrade.findMany({
      where,
      orderBy: { tradeAmount: 'desc' },
      skip,
      take: pageSize,
    });

    return trades.map((t) => ({
      id: Number(t.id),
      stockCode: t.stockCode,
      stockName: t.stockName,
      executiveName: t.executiveName,
      executivePosition: t.executivePosition,
      tradeType: t.tradeType,
      tradeCount: Number(t.tradeCount),
      tradePrice: t.tradePrice ? Number(t.tradePrice) : null,
      tradeAmount: t.tradeAmount ? Number(t.tradeAmount) : null,
      tradeDate: t.tradeDate,
      reportDate: t.reportDate,
    }));
  }

  /**
   * 查询指定时间范围内的高管增持记录（用于聚合榜单）
   */
  async findIncreaseForAggregation(options: {
    keyword?: string;
    startDate: Date;
    endDate?: Date;
  }): Promise<ExecutiveTradeRow[]> {
    const activeSlot = await this.getActiveDataSlot();
    const { keyword, startDate, endDate } = options;
    const where: any = {
      tradeType: 'INCREASE',
      dataSlot: activeSlot,
      tradeDate: {
        gte: startDate,
        ...(endDate ? { lte: endDate } : {}),
      },
      ...(keyword ? {
        OR: [
          { stockCode: { contains: keyword } },
          { stockName: { contains: keyword } },
          { executiveName: { contains: keyword } },
        ],
      } : {}),
    };

    const trades = await this.prisma.executiveTrade.findMany({
      where,
      orderBy: [
        { tradeDate: 'desc' },
        { tradeAmount: 'desc' },
      ],
    });

    return trades.map((t) => ({
      id: Number(t.id),
      stockCode: t.stockCode,
      stockName: t.stockName,
      executiveName: t.executiveName,
      executivePosition: t.executivePosition,
      tradeType: t.tradeType,
      tradeCount: Number(t.tradeCount),
      tradePrice: t.tradePrice ? Number(t.tradePrice) : null,
      tradeAmount: t.tradeAmount ? Number(t.tradeAmount) : null,
      tradeDate: t.tradeDate,
      reportDate: t.reportDate,
    }));
  }

  async findLatestIncreaseTradeDate(): Promise<Date | null> {
    const activeSlot = await this.getActiveDataSlot();
    const row = await this.prisma.executiveTrade.findFirst({
      where: {
        tradeType: 'INCREASE',
        dataSlot: activeSlot,
      },
      orderBy: {
        tradeDate: 'desc',
      },
      select: {
        tradeDate: true,
      },
    });

    return row?.tradeDate ?? null;
  }

  /**
   * 批量获取股票摘要
   */
  async findStockSummaries(stockCodes: string[]): Promise<Map<string, {
    name: string;
    industry: string | null;
    currentPrice: number | null;
    totalMarketCap: number | null;
  }>> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        code: { in: stockCodes },
      },
      select: {
        code: true,
        name: true,
        industry: true,
        currentPrice: true,
        totalMarketCap: true,
      },
    });

    return new Map(
      stocks.map((stock) => [
        stock.code,
        {
          name: stock.name,
          industry: stock.industry,
          currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
          totalMarketCap: stock.totalMarketCap ? Number(stock.totalMarketCap) : null,
        },
      ]),
    );
  }

  /**
   * 统计高管交易记录数量
   */
  async count(tradeType?: TradeType, keyword?: string): Promise<number> {
    const activeSlot = await this.getActiveDataSlot();
    const where: any = {
      dataSlot: activeSlot,
    };

    if (tradeType) {
      where.tradeType = tradeType;
    }

    if (keyword) {
      where.OR = [
        { stockName: { contains: keyword } },
        { executiveName: { contains: keyword } },
      ];
    }

    return this.prisma.executiveTrade.count({ where });
  }

  /**
   * 查询历届高管成员（从 executive_member 表）
   */
  async findMembers(options: {
    page: number;
    pageSize: number;
    keyword?: string;
  }): Promise<{
    id: number;
    stockCode: string;
    stockName: string;
    executiveName: string;
    executivePosition: string;
    startDate: string;
    endDate: string;
  }[]> {
    const { page, pageSize, keyword } = options;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { dm: { contains: keyword } },
      ];
    }

    const members = await this.prisma.executiveMember.findMany({
      where,
      orderBy: { sdate: 'desc' },
      skip,
      take: pageSize,
    });

    // 补充股票名称
    const results = [];
    for (const m of members) {
      const stock = await this.prisma.stock.findUnique({
        where: { code: m.dm },
        select: { name: true },
      });

      results.push({
        stockCode: m.dm,
        stockName: stock?.name ?? '',
        executiveName: m.name ?? '',
        executivePosition: m.title ?? '',
        startDate: m.sdate ?? '',
        endDate: m.edate ?? '',
      });
    }

    return results;
  }

  /**
   * 统计历届高管成员数量
   */
  async countMembers(keyword?: string): Promise<number> {
    const where: any = {};
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { dm: { contains: keyword } },
      ];
    }
    return this.prisma.executiveMember.count({ where });
  }
}
