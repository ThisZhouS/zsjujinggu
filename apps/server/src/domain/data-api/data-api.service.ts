/**
 * DataApi Service - 对外数据 API 服务
 * 为第三方开发者提供数据接口（需 API Key 认证）
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DataApiService {
  constructor(private prisma: PrismaService) {}

  /**
   * 验证 API Key
   */
  async validateApiKey(
    key: string,
  ): Promise<{ apiKeyId: number; userId: number; plan: string; quota: number; used: number } | null> {
    // 简单验证：遍历所有 key 进行比对
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { isActive: true },
    });

    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(key, apiKey.keyHash);
      if (isValid) {
        // 检查配额
        if (apiKey.used >= apiKey.quota) {
          return null;
        }

        // 检查过期
        if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
          return null;
        }

        return {
          apiKeyId: Number(apiKey.id),
          userId: Number(apiKey.userId),
          plan: apiKey.plan,
          quota: apiKey.quota,
          used: apiKey.used,
        };
      }
    }

    return null;
  }

  /**
   * 获取股票数据（对外 API）
   */
  async getStockData(code: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { code },
    });

    if (!stock) {
      throw new NotFoundException('股票不存在');
    }

    return {
      code: stock.code,
      name: stock.name,
      currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
      changePercent: 0,
      totalMarketCap: stock.totalMarketCap ? Number(stock.totalMarketCap) : null,
      industry: stock.industry,
      updatedAt: stock.priceUpdatedAt,
    };
  }

  /**
   * 获取牛散数据（对外 API）
   */
  async getInvestorData(id: number) {
    const investor = await this.prisma.investor.findUnique({
      where: { id },
    });

    if (!investor) {
      throw new NotFoundException('牛散不存在');
    }

    return {
      id: investor.id,
      name: investor.name,
      totalMarketValue: investor.totalMarketValue ? Number(investor.totalMarketValue) : null,
      stockCount: investor.stockCount,
    };
  }
}
