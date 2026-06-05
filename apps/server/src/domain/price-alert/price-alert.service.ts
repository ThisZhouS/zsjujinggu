/**
 * PriceAlertService - 价格提醒业务逻辑层
 * 负责价格提醒管理、触发检查
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PriceAlertRepository } from './price-alert.repository';
import { MairuiService } from '@/infrastructure/external-api/mairui.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PriceAlertType } from '@prisma/client';

@Injectable()
export class PriceAlertService {
  private readonly logger = new Logger(PriceAlertService.name);

  constructor(
    private priceAlertRepository: PriceAlertRepository,
    private mairuiService: MairuiService,
    private prisma: PrismaService,
  ) {}

  /**
   * 获取用户的价格提醒列表
   */
  async getAlerts(userId: number) {
    return this.priceAlertRepository.findByUserId(userId);
  }

  /**
   * 创建价格提醒
   */
  async createAlert(
    userId: number,
    stockCode: string,
    alertType: PriceAlertType,
    targetPrice: number,
  ) {
    const normalizedCode = this.normalizeStockCode(stockCode);
    const stock = await this.prisma.stock.findUnique({
      where: { code: normalizedCode },
      select: {
        code: true,
        name: true,
      },
    });
    if (!stock) {
      throw new NotFoundException('股票代码不存在');
    }

    return this.priceAlertRepository.create(
      userId,
      stock.code,
      stock.name,
      alertType,
      targetPrice,
    );
  }

  private normalizeStockCode(code: string): string {
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

  /**
   * 删除价格提醒
   */
  async deleteAlert(userId: number, id: number): Promise<void> {
    return this.priceAlertRepository.delete(id, userId);
  }

  /**
   * 停用价格提醒
   */
  async deactivateAlert(userId: number, id: number): Promise<void> {
    return this.priceAlertRepository.deactivate(id, userId);
  }

  /**
   * 定时检查价格提醒（每分钟执行一次）
   * R23: 触发时发送通知
   */
  @Cron('*/1 9-15 * * 1-5', { timeZone: 'Asia/Shanghai' })
  async checkPriceAlerts(): Promise<void> {
    this.logger.log('开始检查价格提醒...');

    const alerts = await this.priceAlertRepository.getActiveAlerts();

    if (alerts.length === 0) {
      return;
    }

    // 按股票代码分组
    const stockCodes = [...new Set(alerts.map((a) => a.stockCode))];
    const quotes = await this.mairuiService.getRealtimeQuotes(stockCodes);

    const quoteMap = new Map(quotes.map((q) => [q.code, q]));

    for (const alert of alerts) {
      const quote = quoteMap.get(alert.stockCode);
      if (!quote?.currentPrice) {
        continue;
      }

      const currentPrice = Number(quote.currentPrice);
      let triggered = false;

      if (alert.alertType === 'ABOVE' && currentPrice >= alert.targetPrice) {
        triggered = true;
      } else if (alert.alertType === 'BELOW' && currentPrice <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        await this.priceAlertRepository.markAsTriggered(alert.id);

        // 创建通知
        await this.prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'PRICE_ALERT',
            title: `股价${alert.alertType === 'ABOVE' ? '突破' : '跌破'}提醒`,
            content: `${alert.stockName}(${alert.stockCode}) 当前价格：${currentPrice}，目标价格：${alert.targetPrice}`,
            relatedId: alert.id,
          },
        });

        this.logger.log(
          `价格提醒触发：${alert.stockName}(${alert.stockCode}) ${alert.alertType === 'ABOVE' ? '突破' : '跌破'} ${alert.targetPrice}`,
        );
      }
    }
  }
}
