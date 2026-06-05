/**
 * PriceAlertRepository - 价格提醒数据访问层
 * 负责价格提醒 CRUD 操作
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { PriceAlertType } from '@prisma/client';

export interface PriceAlertRow {
  id: number;
  userId: number;
  stockCode: string;
  stockName: string;
  alertType: PriceAlertType;
  targetPrice: number;
  isActive: boolean;
  triggeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PriceAlertRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据用户 ID 查找所有价格提醒
   */
  async findByUserId(userId: number): Promise<PriceAlertRow[]> {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((a) => ({
      id: Number(a.id),
      userId: Number(a.userId),
      stockCode: a.stockCode,
      stockName: a.stockName,
      alertType: a.alertType,
      targetPrice: Number(a.targetPrice),
      isActive: a.isActive,
      triggeredAt: a.triggeredAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  /**
   * 查找单个价格提醒记录
   */
  async findOne(id: number, userId: number): Promise<PriceAlertRow | null> {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      return null;
    }

    return {
      id: Number(alert.id),
      userId: Number(alert.userId),
      stockCode: alert.stockCode,
      stockName: alert.stockName,
      alertType: alert.alertType,
      targetPrice: Number(alert.targetPrice),
      isActive: alert.isActive,
      triggeredAt: alert.triggeredAt,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }

  /**
   * 创建价格提醒记录
   */
  async create(
    userId: number,
    stockCode: string,
    stockName: string,
    alertType: PriceAlertType,
    targetPrice: number,
  ): Promise<PriceAlertRow> {
    const alert = await this.prisma.priceAlert.create({
      data: {
        userId,
        stockCode,
        stockName,
        alertType,
        targetPrice,
        isActive: true,
      },
    });

    return {
      id: Number(alert.id),
      userId: Number(alert.userId),
      stockCode: alert.stockCode,
      stockName: alert.stockName,
      alertType: alert.alertType,
      targetPrice: Number(alert.targetPrice),
      isActive: alert.isActive,
      triggeredAt: alert.triggeredAt,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }

  /**
   * 删除价格提醒记录
   */
  async delete(id: number, userId: number): Promise<void> {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      throw new NotFoundException('价格提醒记录不存在');
    }

    await this.prisma.priceAlert.delete({
      where: { id },
    });
  }

  /**
   * 标记价格提醒为已触发
   */
  async markAsTriggered(id: number): Promise<void> {
    await this.prisma.priceAlert.update({
      where: { id },
      data: {
        triggeredAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * 获取所有活跃的价格提醒
   */
  async getActiveAlerts(): Promise<PriceAlertRow[]> {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { isActive: true },
    });

    return alerts.map((a) => ({
      id: Number(a.id),
      userId: Number(a.userId),
      stockCode: a.stockCode,
      stockName: a.stockName,
      alertType: a.alertType,
      targetPrice: Number(a.targetPrice),
      isActive: a.isActive,
      triggeredAt: a.triggeredAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  /**
   * 停用价格提醒
   */
  async deactivate(id: number, userId: number): Promise<void> {
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      throw new NotFoundException('价格提醒记录不存在');
    }

    await this.prisma.priceAlert.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
