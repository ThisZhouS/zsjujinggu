/**
 * Scheduler Task 样板
 * 职责：定时任务、后台同步任务
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Timeout, Interval } from '@nestjs/schedule';
import { StockRepository } from '@/domain/stock/stock.repository';
import { MairuiService } from '@/infrastructure/external-api/mairui.service';

/**
 * 基础同步任务抽象类
 */
@Injectable()
export abstract class BaseSyncTask {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * 执行同步
   */
  abstract sync(): Promise<void>;

  /**
   * 记录同步日志
   */
  protected async logSyncLog(taskName: string, status: string, details?: any) {
    // await syncLogRepository.create({ taskName, status, details, timestamp: new Date() });
    this.logger.log(`[${taskName}] ${status} - ${JSON.stringify(details)}`);
  }

  /**
   * 处理同步错误
   */
  protected async handleSyncError(taskName: string, error: any) {
    this.logger.error(`[${taskName}] Sync failed`, error);
    await this.logSyncLog(taskName, 'error', { message: error.message });
  }
}

/**
 * 股票列表同步任务
 * Cron: 30 16 * * 1-5 (工作日16:30)
 */
@Injectable()
export class StockSyncTask extends BaseSyncTask {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly mairuiService: MairuiService,
  ) {
    super();
  }

  @Cron('30 16 * * 1-5')
  async sync(): Promise<void> {
    this.logger.log('Starting stock list sync...');

    try {
      const stocks = await this.mairuiService.getStockList();

      let created = 0;
      let updated = 0;

      for (const stock of stocks) {
        const existing = await this.stockRepository.findByCode(stock.code);

        if (existing) {
          await this.stockRepository.update(existing.id, {
            name: stock.name,
            // ...
          });
          updated++;
        } else {
          await this.stockRepository.create(stock);
          created++;
        }
      }

      await this.logSyncLog('stock_list_sync', 'success', {
        created,
        updated,
        total: stocks.length,
      });

      this.logger.log(`Stock list sync completed: ${created} created, ${updated} updated`);
    } catch (error) {
      await this.handleSyncError('stock_list_sync', error);
    }
  }
}

/**
 * 实时行情同步任务
 * Cron: */5 9-15 * * 1-5 (工作日9:00-15:00，每5分钟)
 */
@Injectable()
export class RealtimeQuoteSyncTask extends BaseSyncTask {
  @Cron('*/5 9-15 * * 1-5')
  async sync(): Promise<void> {
    this.logger.log('Starting realtime quote sync...');

    try {
      // 获取所有需要同步的股票
      const stocks = await this.stockRepository.findAllActive();

      // 分批处理避免超时
      const batchSize = 50;
      for (let i = 0; i < stocks.length; i += batchSize) {
        const batch = stocks.slice(i, i + batchSize);
        const codes = batch.map((s) => s.code);

        // 批量获取行情
        const quotes = await this.mairuiService.getBatchQuotes(codes);

        // 更新行情
        for (const quote of quotes) {
          await this.stockRepository.updateQuote(quote.code, {
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            updatedAt: new Date(),
          });
        }

        // 避免请求过于频繁
        await this.sleep(1000);
      }

      await this.logSyncLog('realtime_quote_sync', 'success', {
        total: stocks.length,
      });
    } catch (error) {
      await this.handleSyncError('realtime_quote_sync', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * K线数据同步任务
 * Cron: 30 17 * * 1-5 (工作日17:30)
 */
@Injectable()
export class KlineSyncTask extends BaseSyncTask {
  @Cron('30 17 * * 1-5')
  async sync(): Promise<void> {
    this.logger.log('Starting K-line data sync...');

    try {
      // 同步今天的K线数据
      const today = new Date().toISOString().split('T')[0];

      const stocks = await this.stockRepository.findAllActive();

      for (const stock of stocks) {
        try {
          const klineData = await this.mairuiService.getKline(
            stock.code,
            '1d',
            '2024-01-01',
            today,
          );

          // 保存K线数据
          await this.saveKlineData(stock.id, klineData);

          this.logger.log(`K-line sync completed for ${stock.code}`);
        } catch (error) {
          this.logger.error(`Failed to sync K-line for ${stock.code}`, error);
        }
      }

      await this.logSyncLog('kline_sync', 'success', {
        total: stocks.length,
      });
    } catch (error) {
      await this.handleSyncError('kline_sync', error);
    }
  }

  private async saveKlineData(stockId: number, klineData: any[]): Promise<void> {
    // 保存到数据库
    // await klineRepository.upsertMany(stockId, klineData);
  }
}

/**
 * 订单过期检查任务
 * Interval: 每5秒
 */
@Injectable()
export class OrderExpiryTask {
  private readonly logger = new Logger(OrderExpiryTask.name);

  @Interval(5000)
  async checkPendingOrders(): Promise<void> {
    // 检查并过期未支付的订单
    // await orderService.expirePendingOrders();
  }
}

/**
 * 价格提醒任务
 * Cron: * 9-15 * * 1-5 (工作日9:00-15:00，每分钟)
 */
@Injectable()
export class PriceAlertTask {
  private readonly logger = new Logger(PriceAlertTask.name);

  @Cron('* 9-15 * * 1-5')
  async checkPriceAlerts(): Promise<void> {
    // 检查价格提醒并发送通知
    // await priceAlertService.checkAndSendAlerts();
  }
}
