/**
 * Search Service - 全局搜索业务逻辑层
 * 支持：股票代码（纯数字）、牛散姓名（中文）、股票名称（中文）
 * 匹配优先级：股票代码 > 牛散姓名 > 股票名称
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  buildTrackedPersonalInvestorWhere,
  isLikelyPersonalInvestorName,
} from '@/common/utils/investor-name-filter';

export interface SearchResult {
  type: 'stock' | 'investor';
  id: number;
  code?: string;
  name: string;
  matchType: 'exact' | 'prefix' | 'fuzzy';
  priority: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * 全局搜索
   * 支持纯数字匹配股票代码，中文匹配牛散姓名和股票名称
   */
  async search(keyword: string, limit: number = 10): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // 判断是否为纯数字（股票代码匹配）
    const isNumeric = /^\d+$/.test(keyword);

    if (isNumeric) {
      // 纯数字：匹配股票代码（精确 + 前缀）
      const stocks = await this.searchStocksByCode(keyword, limit);
      results.push(...stocks);
    } else {
      // 中文：匹配牛散姓名和股票名称
      const investors = await this.searchInvestors(keyword, limit);
      const stocks = await this.searchStocksByName(keyword, limit);
      results.push(...investors, ...stocks);
    }

    // 按优先级排序（数字越小优先级越高）
    results.sort((a, b) => a.priority - b.priority);

    // 限制返回数量
    return results.slice(0, limit);
  }

  /**
   * 根据代码搜索股票
   */
  private async searchStocksByCode(keyword: string, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // 精确匹配
    const exact = await this.prisma.stock.findUnique({
      where: { code: keyword },
    });

    if (exact) {
      results.push({
        type: 'stock',
        id: Number(exact.id),
        code: exact.code,
        name: exact.name,
        matchType: 'exact',
        priority: 1,
      });
    }

    // 前缀匹配（最多返回 limit - 1 条）
    const prefixStocks = await this.prisma.stock.findMany({
      where: {
        code: {
          startsWith: keyword,
        },
      },
      take: exact ? limit - 1 : limit,
    });

    for (const stock of prefixStocks) {
      if (exact && stock.id === exact.id) continue; // 跳过已添加的精确匹配

      results.push({
        type: 'stock',
        id: Number(stock.id),
        code: stock.code,
        name: stock.name,
        matchType: 'prefix',
        priority: 2,
      });
    }

    return results;
  }

  /**
   * 根据名称搜索股票
   */
  private async searchStocksByName(keyword: string, limit: number): Promise<SearchResult[]> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        name: {
          contains: keyword,
        },
      },
      take: limit,
    });

    return stocks.map((stock) => ({
      type: 'stock',
      id: Number(stock.id),
      code: stock.code,
      name: stock.name,
      matchType: 'fuzzy' as const,
      priority: 4,
    }));
  }

  /**
   * 搜索牛散
   */
  private async searchInvestors(keyword: string, limit: number): Promise<SearchResult[]> {
    const investors = await this.prisma.investor.findMany({
      where: {
        ...buildTrackedPersonalInvestorWhere(),
        name: {
          contains: keyword,
        },
      },
      take: limit * 5,
    });

    return investors
      .filter((investor) => isLikelyPersonalInvestorName(investor.name))
      .slice(0, limit)
      .map((investor) => ({
      type: 'investor',
      id: Number(investor.id),
      name: investor.name,
      matchType: 'fuzzy' as const,
      priority: 3,
      }));
  }
}
