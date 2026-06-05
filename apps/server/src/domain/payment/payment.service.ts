/**
 * PaymentService - 支付业务逻辑层
 * 负责支付订单处理、支付状态回调
 */

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PaymentType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { OrderService } from '../order/order.service';
import { PaymentCallbackDto } from './payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private orderService: OrderService,
    private prisma: PrismaService,
  ) {}

  /**
   * 创建支付订单
   */
  async createPayment(
    userId: number,
    plan: 'VIP_MONTHLY' | 'VIP_YEARLY' | 'LIFETIME',
    paymentType: 'WECHAT' | 'ALIPAY',
  ) {
    return this.orderService.createOrder(userId, plan, paymentType);
  }

  /**
   * 处理支付回调。
   * 当前数据服务已降级为登录用户可访问，会员支付链路停用。
   */
  async handlePaymentCallback(payload: PaymentCallbackDto): Promise<void> {
    void payload;
    throw new BadRequestException('付费购买已停用，不再处理会员支付回调');
  }

  /**
   * 获取支付状态
   */
  async getPaymentStatus(orderNo: string) {
    const order = await this.orderService.getOrderByNo(orderNo);
    return {
      orderNo: order.orderNo,
      status: order.status,
      amount: order.amount,
      paidAt: order.paidAt,
    };
  }

  async getActivePaymentSettings() {
    const settings = await this.prisma.paymentSetting.findMany({
      where: { isActive: true },
      orderBy: { paymentType: 'asc' },
    });

    return settings.map((setting) => this.mapPaymentSetting(setting));
  }

  async getActivePaymentSetting(paymentType: PaymentType) {
    const setting = await this.prisma.paymentSetting.findUnique({
      where: { paymentType },
    });

    if (!setting || !setting.isActive) {
      return null;
    }

    return this.mapPaymentSetting(setting);
  }

  async getAdminPaymentSettings() {
    const settings = await this.prisma.paymentSetting.findMany({
      orderBy: { paymentType: 'asc' },
    });

    const existingTypes = new Set(settings.map((setting) => setting.paymentType));
    const defaults = Object.values(PaymentType)
      .filter((paymentType) => !existingTypes.has(paymentType))
      .map((paymentType) => ({
        id: null,
        paymentType,
        qrCodeUrl: null,
        accountName: null,
        instructions: null,
        isActive: false,
        createdAt: null,
        updatedAt: null,
      }));

    return [...settings.map((setting) => this.mapPaymentSetting(setting)), ...defaults];
  }

  async upsertPaymentSetting(
    paymentType: PaymentType,
    data: {
      qrCodeUrl?: string | null;
      accountName?: string | null;
      instructions?: string | null;
      isActive?: boolean;
    },
  ) {
    const setting = await this.prisma.paymentSetting.upsert({
      where: { paymentType },
      create: {
        paymentType,
        qrCodeUrl: this.normalizeNullableText(data.qrCodeUrl),
        accountName: this.normalizeNullableText(data.accountName),
        instructions: this.normalizeNullableText(data.instructions),
        isActive: data.isActive ?? true,
      },
      update: {
        qrCodeUrl: this.normalizeNullableText(data.qrCodeUrl),
        accountName: this.normalizeNullableText(data.accountName),
        instructions: this.normalizeNullableText(data.instructions),
        isActive: data.isActive ?? true,
      },
    });

    return this.mapPaymentSetting(setting);
  }

  /**
   * 处理退款
   */
  async processRefund(orderId: number): Promise<void> {
    await this.orderService.refundOrder(orderId);
  }

  private mapPaymentSetting(setting: {
    id: bigint;
    paymentType: PaymentType;
    qrCodeUrl: string | null;
    accountName: string | null;
    instructions: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: Number(setting.id),
      paymentType: setting.paymentType,
      qrCodeUrl: setting.qrCodeUrl,
      accountName: setting.accountName,
      instructions: setting.instructions,
      isActive: setting.isActive,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  private normalizeNullableText(value?: string | null): string | null {
    const normalized = String(value ?? '').trim();
    return normalized || null;
  }
}
