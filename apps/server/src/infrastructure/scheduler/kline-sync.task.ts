/**
 * KlineSyncTask - K 线同步任务
 * 负责 K 线数据同步、历史涨幅预计算
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MairuiService } from '@/infrastructure/external-api/mairui.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { BaseSyncTask } from './base-sync.task';

@Injectable()
export class KlineSyncTask extends BaseSyncTask {
  constructor(
    prisma: PrismaService,
    private mairuiService: MairuiService,
    private redisService: RedisService,
  ) {
    super(prisma);
  }

  /**
   * 同步今日 K 线数据
   */
  async syncTodayKline(): Promise<number> {
    const stocks = await this.prisma.stock.findMany({
      select: { code: true },
    });

    let total = 0;
    for (const stock of stocks) {
      try {
        const klineData = await this.mairuiService.getKline(stock.code, 'daily');

        for (const item of klineData) {
          await this.prisma.klineDaily.upsert({
            where: {
              stockCode_tradeDate: {
                stockCode: stock.code,
                tradeDate: new Date(item.tradeDate),
              },
            },
            update: {
              open: parseFloat(item.open),
              high: parseFloat(item.high),
              low: parseFloat(item.low),
              close: parseFloat(item.close),
              volume: BigInt(item.volume),
              amount: parseFloat(item.amount),
              changePct: item.changePct ? parseFloat(item.changePct) : null,
              turnover: item.turnover ? parseFloat(item.turnover) : null,
            },
            create: {
              stockCode: stock.code,
              tradeDate: new Date(item.tradeDate),
              open: parseFloat(item.open),
              high: parseFloat(item.high),
              low: parseFloat(item.low),
              close: parseFloat(item.close),
              volume: BigInt(item.volume),
              amount: parseFloat(item.amount),
              changePct: item.changePct ? parseFloat(item.changePct) : null,
              turnover: item.turnover ? parseFloat(item.turnover) : null,
            },
          });
        }

        total += klineData.length;
      } catch (error) {
        console.error(`同步 ${stock.code} K 线失败`, error);
      }
    }

    return total;
  }

  /**
   * 重新计算所有周期的历史涨幅榜
   * 周期：1w/2w/1m/3m/6m/12m
   */
  async recalcAllPeriodGainers(): Promise<number> {
    const periods = [
      { key: '1w', days: 7 },
      { key: '2w', days: 14 },
      { key: '1m', days: 30 },
      { key: '3m', days: 90 },
      { key: '6m', days: 180 },
      { key: '12m', days: 365 },
    ];

    let total = 0;
    for (const period of periods) {
      const count = await this.recalcPeriodGainers(period.key, period.days);
      total += count;
    }

    return total;
  }

  /**
   * 重新计算单个周期的历史涨幅榜
   */
  private async recalcPeriodGainers(periodKey: string, days: number): Promise<number> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stocks = await this.prisma.stock.findMany({
      select: { code: true, currentPrice: true, name: true },
    });

    const gainers = await Promise.all(
      stocks.map(async (stock) => {
        const kline = await this.prisma.klineDaily.findFirst({
          where: {
            stockCode: stock.code,
            tradeDate: {
              lte: startDate,
            },
          },
          orderBy: {
            tradeDate: 'desc',
          },
        });

        if (!kline || !stock.currentPrice) {
          return null;
        }

        const startPrice = Number(kline.close);
        const currentPrice = Number(stock.currentPrice);
        const gainPercent = ((currentPrice - startPrice) / startPrice) * 100;

        return {
          code: stock.code,
          name: stock.name,
          currentPrice,
          gainPercent,
        };
      }),
    );

    const validGainers = gainers.filter((g): g is NonNullable<typeof g> => g !== null);
    validGainers.sort((a, b) => b.gainPercent - a.gainPercent);

    // 缓存到 Redis
    const cacheKey = `gainers:${periodKey}`;
    await this.redisService.safeSet(cacheKey, JSON.stringify(validGainers.slice(0, 100)), 86400);

    return validGainers.length;
  }
}
