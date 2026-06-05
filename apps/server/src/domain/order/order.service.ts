/**
 * OrderService - 订单业务逻辑层
 * 负责订单创建、支付、退款管理
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MemberPlan, OrderStatus, PaymentType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomBytes } from 'node:crypto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private orderRepository: OrderRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * 历史订单创建入口。
   * 当前数据服务已对登录用户开放，保留接口仅用于兼容旧前端/外部调用并明确拒绝创建。
   */
  async createOrder(
    _userId?: number,
    _plan?: MemberPlan,
    _paymentType?: PaymentType,
  ) {
    throw new BadRequestException('数据服务已对登录用户开放，无需创建会员订单');
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId: number, page: number = 1, pageSize: number = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(pageSize, 100));

    return this.orderRepository.findByUserId(userId, {
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });
  }

  /**
   * 管理员获取订单列表
   */
  async getAdminOrders(options: {
    page: number;
    pageSize: number;
    status?: OrderStatus;
    plan?: MemberPlan;
    keyword?: string;
  }) {
    const safePage = Math.max(1, options.page);
    const safePageSize = Math.max(1, Math.min(options.pageSize, 100));

    return this.orderRepository.findAllForAdmin({
      page: safePage,
      pageSize: safePageSize,
      status: options.status,
      plan: options.plan,
      keyword: options.keyword?.trim() || undefined,
    });
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(userId: number, id: number) {
    const order = await this.orderRepository.findById(id, userId);
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  /**
   * 根据订单号获取订单
   */
  async getOrderByNo(orderNo: string) {
    const order = await this.orderRepository.findByOrderNo(orderNo);
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  /**
   * 标记订单为已支付
   */
  async markOrderAsPaid(orderNo: string, paidAt: Date = new Date()): Promise<void> {
    const order = await this.orderRepository.findByOrderNo(orderNo);
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('订单状态不正确');
    }

    await this.orderRepository.updateStatus(order.id, 'PAID', paidAt);

    this.logger.log(`订单 ${orderNo} 已标记已支付，历史会员权益写入已停用`);
  }

  /**
   * 退款订单
   */
  async refundOrder(id: number): Promise<void> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException('订单状态不正确');
    }

    await this.orderRepository.markAsRefunded(id);

    this.logger.log(`订单 ${order.orderNo} 已退款`);
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  /**
   * 定时任务：过期待支付订单
   * 每 5 分钟执行一次
   */
  @Cron('*/5 * * * *')
  async expirePendingOrders(): Promise<void> {
    const pendingOrders = await this.orderRepository.getPendingOrders();
    const now = new Date();

    let expiredCount = 0;
    for (const order of pendingOrders) {
      if (order.expiresAt < now) {
        await this.orderRepository.updateStatus(order.id, 'EXPIRED');
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`过期 ${expiredCount} 个待支付订单`);
    }
  }
}
