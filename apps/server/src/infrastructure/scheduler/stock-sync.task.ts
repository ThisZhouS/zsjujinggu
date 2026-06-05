/**
 * StockSyncTask - 股票同步任务
 * 负责股票列表、实时行情、涨停板数据同步
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MairuiService } from '@/infrastructure/external-api/mairui.service';
import { StockPoolClassificationClient } from '@/infrastructure/mairui-api/stock-pool-classification.client';
import { BaseSyncTask } from './base-sync.task';
import { RedisService } from '@/infrastructure/redis/redis.service';

@Injectable()
export class StockSyncTask extends BaseSyncTask {
  constructor(
    prisma: PrismaService,
    private mairuiService: MairuiService,
    private redisService: RedisService,
    private stockPoolClient: StockPoolClassificationClient,
  ) {
    super(prisma);
  }

  /**
   * 同步股票列表
   */
  async syncStockList(): Promise<number> {
    const stocks = await this.mairuiService.getStockList();

    const stockData = stocks.map((item: any) => ({
      code: item.code,
      name: item.name,
      industry: item.industry,
      market: this.parseMarket(item.market),
      listingDate: item.listingDate ? new Date(item.listingDate) : null,
    }));

    await this.prisma.stock.createMany({
      data: stockData,
      skipDuplicates: true,
    });

    return stockData.length;
  }

  /**
   * 同步实时行情
   */
  async syncRealtimeQuotes(): Promise<number> {
    const stocks = await this.prisma.stock.findMany({
      select: { code: true },
    });

    const codes = stocks.map((s) => s.code);
    const quotes = await this.mairuiService.getRealtimeQuotes(codes);

    const priceUpdatedAt = new Date();
    const quoteData = quotes
      .map((item: any) => ({
        code: typeof item.code === 'string' ? item.code : '',
        currentPrice: Number.parseFloat(item.currentPrice),
        totalMarketCap:
          item.totalMarketCap === null || item.totalMarketCap === undefined
            ? null
            : Number.parseFloat(item.totalMarketCap),
      }))
      .filter(
        (item) =>
          Boolean(item.code) &&
          Number.isFinite(item.currentPrice),
      );

    for (const chunk of this.chunkArray(quoteData, 200)) {
      await this.prisma.$transaction(
        chunk.map((quote) =>
          this.prisma.stock.updateMany({
            where: { code: quote.code },
            data: {
              currentPrice: quote.currentPrice,
              ...(Number.isFinite(quote.totalMarketCap)
                ? { totalMarketCap: quote.totalMarketCap }
                : {}),
              priceUpdatedAt,
            },
          }),
        ),
      );
    }

    return quoteData.length;
  }

  /**
   * 同步涨停板数据（Redis 缓存，兼容旧接口）
   */
  async syncLimitUp(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.stockPoolClient.fetchLimitUpPool(today);

    // 写入数据库
    for (const item of data) {
      try {
        await this.prisma.limitUpPool.upsert({
          where: { dm_date_fbt_lbt: { dm: item.dm, date: item.date, fbt: item.fbt, lbt: item.lbt } },
          update: {
            mc: item.mc,
            p: item.p,
            zf: item.zf,
            cje: item.cje,
            lt: item.lt,
            zsz: item.zsz,
            hs: item.hs,
            lbc: item.lbc,
            lbt: item.lbt,
            zj: item.zj,
            zbc: item.zbc,
            tj: item.tj,
            hy: item.hy,
          },
          create: {
            dm: item.dm,
            date: item.date,
            mc: item.mc,
            p: item.p,
            zf: item.zf,
            cje: item.cje,
            lt: item.lt,
            zsz: item.zsz,
            hs: item.hs,
            lbc: item.lbc,
            fbt: item.fbt,
            lbt: item.lbt,
            zj: item.zj,
            zbc: item.zbc,
            tj: item.tj,
            hy: item.hy,
          },
        });
      } catch {
        // ignore duplicate
      }
    }

    // 同时写入 Redis 缓存（兼容旧接口）
    const cacheKey = `limitup:${today}`;
    await this.redisService.safeSet(cacheKey, JSON.stringify(data), 600);

    return data.length;
  }

  /**
   * 同步跌停板数据（数据库持久化 + Redis 缓存）
   */
  async syncLimitDown(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.stockPoolClient.fetchLimitDownPool(today);

    // 写入数据库
    for (const item of data) {
      try {
        await this.prisma.limitDownPool.upsert({
          where: { dm_date_lbt: { dm: item.dm, date: item.date, lbt: item.lbt } },
          update: {
            mc: item.mc,
            p: item.p,
            zf: item.zf,
            cje: item.cje,
            lt: item.lt,
            zsz: item.zsz,
            pe: item.pe,
            hs: item.hs,
            lbc: item.lbc,
            zj: item.zj,
            fba: item.fba,
            zbc: item.zbc,
          },
          create: {
            dm: item.dm,
            date: item.date,
            mc: item.mc,
            p: item.p,
            zf: item.zf,
            cje: item.cje,
            lt: item.lt,
            zsz: item.zsz,
            pe: item.pe,
            hs: item.hs,
            lbc: item.lbc,
            lbt: item.lbt,
            zj: item.zj,
            fba: item.fba,
            zbc: item.zbc,
          },
        });
      } catch {
        // ignore duplicate
      }
    }

    return data.length;
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    if (size <= 0) {
      return [items];
    }

    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }

    return chunks;
  }

  /**
   * 解析市场类型
   */
  private parseMarket(marketStr: string): 'A' | 'HK' | 'US' {
    if (marketStr?.includes('HK') || marketStr?.includes('港')) {
      return 'HK';
    }
    if (marketStr?.includes('US') || marketStr?.includes('美')) {
      return 'US';
    }
    return 'A';
  }
}
