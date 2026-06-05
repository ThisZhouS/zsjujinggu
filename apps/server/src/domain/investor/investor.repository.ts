/**
 * Investor Repository - 牛散数据访问层
 * 负责单表 CRUD 操作
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Investor, Holding, Stock } from '@prisma/client';
import { sanitizeCount } from '@/common/utils/data-sanitizer';
import {
  buildTrackedInvestorWhere,
  buildTrackedPersonalInvestorWhere,
  InvestorCategory,
} from '@/common/utils/investor-name-filter';

@Injectable()
export class InvestorRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据 ID 查找牛散
   */
  async findById(id: number): Promise<Investor | null> {
    return this.prisma.investor.findUnique({
      where: { id: BigInt(id) },
    });
  }

  /**
   * 根据名称查找牛散
   */
  async findByName(name: string): Promise<Investor | null> {
    return this.prisma.investor.findFirst({
      where: { name },
    });
  }

  /**
   * 分页查询牛散列表
   * 支持关键词搜索和排序
   */
  async findMany(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    category?: InvestorCategory;
    includeUntracked?: boolean;
  }): Promise<Investor[]> {
    const {
      page,
      pageSize,
      keyword,
      sortBy = 'totalMarketValue',
      order,
      category = 'personal',
      includeUntracked = false,
    } = options;
    const skip = (page - 1) * pageSize;

    const where: any = includeUntracked
      ? { category }
      : buildTrackedInvestorWhere(category);

    if (keyword) {
      where.name = {
        contains: keyword,
      };
    }

    const orderBy: { [key: string]: 'desc' | 'asc' } = {};
    const sortDirection: 'asc' | 'desc' = order ?? (sortBy === 'name' ? 'asc' : 'desc');

    if (sortBy === 'name') {
      orderBy.name = sortDirection;
    } else if (sortBy === 'stockCount') {
      orderBy.stockCount = sortDirection;
    } else {
      orderBy.totalMarketValue = sortDirection;
    }

    const investors = await this.prisma.investor.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    });
    return investors;
  }

  /**
   * 统计牛散数量
   */
  async count(
    keyword?: string,
    includeUntracked: boolean = false,
    category: InvestorCategory = 'personal',
  ): Promise<number> {
    const where: any = includeUntracked
      ? { category }
      : buildTrackedInvestorWhere(category);

    if (keyword) {
      where.name = {
        contains: keyword,
      };
    }

    return sanitizeCount(await this.prisma.investor.count({ where }));
  }

  /**
   * 创建牛散
   */
  async create(data: {
    name: string;
    avatar?: string;
    bio?: string;
    isTracked?: boolean;
  }): Promise<Investor> {
    return this.prisma.investor.create({
      data,
    });
  }

  /**
   * 更新牛散
   */
  async update(id: number, data: Partial<Investor>): Promise<Investor> {
    return this.prisma.investor.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  /**
   * 删除牛散
   */
  async delete(id: number): Promise<void> {
    await this.prisma.investor.delete({
      where: { id: BigInt(id) },
    });
  }

  /**
   * 根据代码列表查找股票
   */
  async findStocksByCodes(codes: string[]): Promise<Stock[]> {
    return this.prisma.stock.findMany({
      where: {
        code: {
          in: codes,
        },
      },
    });
  }

  /**
   * 查找所有活跃牛散（用于缓存）
   * 返回总市值大于 0 的牛散
   */
  async findAllActive(): Promise<Investor[]> {
    const investors = await this.prisma.investor.findMany({
      where: {
        ...buildTrackedPersonalInvestorWhere(),
        totalMarketValue: {
          gt: 0,
        },
      },
    });

    return investors;
  }

  /**
   * 批量更新牛散总市值
   */
  async updateMarketValue(
    updates: Array<{ id: number; totalMarketValue: number; stockCount: number }>,
  ): Promise<void> {
    await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.investor.update({
          where: { id: BigInt(update.id) },
          data: {
            totalMarketValue: update.totalMarketValue,
            stockCount: update.stockCount,
          },
        }),
      ),
    );
  }

  async findTrackedInvestorsForSurnameDiscovery(): Promise<
    Array<{
      id: number;
      name: string;
      avatar: string | null;
      totalMarketValue: number;
      stockCount: number;
    }>
  > {
    const investors = await this.prisma.investor.findMany({
      where: {
        ...buildTrackedPersonalInvestorWhere(),
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        totalMarketValue: true,
        stockCount: true,
      },
    });

    return investors.map((investor) => ({
      id: Number(investor.id),
      name: investor.name,
      avatar: investor.avatar,
      totalMarketValue: Number(investor.totalMarketValue ?? 0),
      stockCount: sanitizeCount(investor.stockCount),
    }));
  }
}
