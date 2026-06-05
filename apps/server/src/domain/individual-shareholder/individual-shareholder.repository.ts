/**
 * IndividualShareholder Repository - 单支持股股东数据访问层
 * 负责按“牛散单支持股 / 机构单支持股”口径查询业务股东榜单
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { InvestorCategory } from '@/common/utils/investor-name-filter';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

export interface IndividualShareholderRow {
  investorId: number;
  investorName: string;
  category: InvestorCategory;
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  totalMarketValue: number;
  reportDate: string;
}

@Injectable()
export class IndividualShareholderRepository {
  constructor(private prisma: PrismaService) {}

  private normalizeStockCode(stockCode: string): string {
    return stockCode.trim().toUpperCase().split('.')[0];
  }

  private buildSingleStockInvestorWhere(
    category: InvestorCategory,
    keyword?: string,
  ): Prisma.InvestorWhereInput {
    const normalizedKeyword = keyword?.trim();
    const where: Prisma.InvestorWhereInput = {
      isTracked: true,
      category,
      stockCount: 1,
    };

    if (!normalizedKeyword) {
      return where;
    }

    return {
      ...where,
      OR: [
        {
          name: {
            contains: normalizedKeyword,
          },
        },
        {
          holdings: {
            some: {
              stockCode: {
                contains: normalizedKeyword,
              },
            },
          },
        },
        {
          holdings: {
            some: {
              stockName: {
                contains: normalizedKeyword,
              },
            },
          },
        },
      ],
    };
  }

  private mapRankingRow(
    investor: {
      id: bigint;
      name: string;
      category: string;
      totalMarketValue: Prisma.Decimal | number | null;
      holdings: Array<{
        stockCode: string;
        stockName: string;
        holdCount: bigint;
        holdRatio: Prisma.Decimal | number | null;
        reportDate: Date;
        stock: {
          currentPrice: Prisma.Decimal | number | null;
        } | null;
      }>;
    },
  ): IndividualShareholderRow | null {
    const latestHolding = investor.holdings[0];
    if (!latestHolding) {
      return null;
    }

    const holdCount = Number(latestHolding.holdCount);
    const currentPrice =
      latestHolding.stock?.currentPrice != null
        ? Number(latestHolding.stock.currentPrice)
        : null;
    const totalMarketValue =
      investor.totalMarketValue != null
        ? Number(investor.totalMarketValue)
        : currentPrice != null
          ? currentPrice * holdCount
          : 0;

    return {
      investorId: Number(investor.id),
      investorName: investor.name,
      category: investor.category as InvestorCategory,
      stockCode: this.normalizeStockCode(latestHolding.stockCode),
      stockName: latestHolding.stockName,
      holdCount,
      holdRatio:
        latestHolding.holdRatio != null ? Number(latestHolding.holdRatio) : null,
      currentPrice,
      totalMarketValue,
      reportDate: latestHolding.reportDate.toISOString().slice(0, 10),
    };
  }

  async getRanking(options: {
    page: number;
    pageSize: number;
    category: InvestorCategory;
    keyword?: string;
  }): Promise<IndividualShareholderRow[]> {
    const { page, pageSize, category, keyword } = options;
    const skip = (page - 1) * pageSize;

    const investors = await this.prisma.investor.findMany({
      where: this.buildSingleStockInvestorWhere(category, keyword),
      orderBy: [
        { totalMarketValue: 'desc' },
        { updatedAt: 'desc' },
      ],
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        category: true,
        totalMarketValue: true,
        holdings: {
          orderBy: [
            { reportDate: 'desc' },
            { holdCount: 'desc' },
          ],
          take: 1,
          select: {
            stockCode: true,
            stockName: true,
            holdCount: true,
            holdRatio: true,
            reportDate: true,
            stock: {
              select: {
                currentPrice: true,
              },
            },
          },
        },
      },
    });

    return investors
      .map((investor) => this.mapRankingRow(investor))
      .filter((row): row is IndividualShareholderRow => row !== null);
  }

  async count(category: InvestorCategory, keyword?: string): Promise<number> {
    return this.prisma.investor.count({
      where: this.buildSingleStockInvestorWhere(category, keyword),
    });
  }

  async findByStockCode(
    stockCode: string,
    category: InvestorCategory = 'personal',
  ): Promise<IndividualShareholderRow[]> {
    const normalizedStockCode = this.normalizeStockCode(stockCode);
    const investors = await this.prisma.investor.findMany({
      where: {
        isTracked: true,
        category,
        stockCount: 1,
        holdings: {
          some: {
            stockCode: {
              contains: normalizedStockCode,
            },
          },
        },
      },
      orderBy: [
        { totalMarketValue: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        category: true,
        totalMarketValue: true,
        holdings: {
          where: {
            stockCode: {
              contains: normalizedStockCode,
            },
          },
          orderBy: [
            { reportDate: 'desc' },
            { holdCount: 'desc' },
          ],
          take: 1,
          select: {
            stockCode: true,
            stockName: true,
            holdCount: true,
            holdRatio: true,
            reportDate: true,
            stock: {
              select: {
                currentPrice: true,
              },
            },
          },
        },
      },
    });

    return investors
      .map((investor) => this.mapRankingRow(investor))
      .filter((row): row is IndividualShareholderRow => row !== null);
  }
}
