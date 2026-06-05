/**
 * OrderRepository - 订单数据访问层
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { OrderStatus, MemberPlan, PaymentType } from '@prisma/client';
import { maskPhone } from '@/common/utils/data-sanitizer';

export interface OrderRow {
  id: number;
  orderNo: string;
  userId: number;
  plan: MemberPlan;
  amount: number;
  status: OrderStatus;
  paymentType: PaymentType;
  expiresAt: Date;
  paidAt?: Date | null;
  refundedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminOrderRow extends OrderRow {
  userPhone: string;
  userNickname: string | null;
  productName: string;
}

export interface FindAdminOrdersOptions {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  plan?: MemberPlan;
  keyword?: string;
}

export interface AdminOrderListResult {
  list: AdminOrderRow[];
  total: number;
}

export interface FindUserOrdersOptions {
  skip?: number;
  take?: number;
}

export interface UserOrderListResult {
  list: OrderRow[];
  total: number;
}

interface OrderWithUser {
  id: bigint;
  orderNo: string;
  userId: bigint;
  plan: MemberPlan;
  amount: unknown;
  status: OrderStatus;
  paymentType: PaymentType;
  expiresAt: Date;
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    phone: string;
    nickname: string | null;
  };
}

@Injectable()
export class OrderRepository {
  constructor(private prisma: PrismaService) {}

  private mapOrderRow(order: {
    id: bigint;
    orderNo: string;
    userId: bigint;
    plan: MemberPlan;
    amount: unknown;
    status: OrderStatus;
    paymentType: PaymentType;
    expiresAt: Date;
    paidAt: Date | null;
    refundedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): OrderRow {
    return {
      id: Number(order.id),
      orderNo: order.orderNo,
      userId: Number(order.userId),
      plan: order.plan,
      amount: Number(order.amount),
      status: order.status,
      paymentType: order.paymentType,
      expiresAt: order.expiresAt,
      paidAt: order.paidAt,
      refundedAt: order.refundedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private getProductName(plan: MemberPlan): string {
    const map: Record<MemberPlan, string> = {
      VIP_MONTHLY: '历史月度权益',
      VIP_YEARLY: '历史年度权益',
      LIFETIME: '历史长期权益',
    };
    return map[plan];
  }

  private mapAdminOrderRow(order: OrderWithUser): AdminOrderRow {
    const base = this.mapOrderRow(order);
    return {
      ...base,
      userPhone: maskPhone(order.user.phone),
      userNickname: order.user.nickname,
      productName: this.getProductName(order.plan),
    };
  }

  /**
   * 根据用户 ID 查找订单列表
   */
  async findByUserId(userId: number, options: FindUserOrdersOptions = {}): Promise<UserOrderListResult> {
    const { skip = 0, take = 20 } = options;
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({
        where: { userId },
      }),
    ]);

    return {
      list: orders.map((o) => this.mapOrderRow(o)),
      total,
    };
  }

  /**
   * 根据订单号查找订单
   */
  async findByOrderNo(orderNo: string): Promise<OrderRow | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      return null;
    }

    return this.mapOrderRow(order);
  }

  /**
   * 根据 ID 查找订单
   */
  async findById(id: number, userId?: number): Promise<OrderRow | null> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({ where });

    if (!order) {
      return null;
    }

    return this.mapOrderRow(order);
  }

  /**
   * 创建订单
   */
  async create(
    userId: number,
    orderNo: string,
    plan: MemberPlan,
    amount: number,
    paymentType: PaymentType,
    expiresAt: Date,
  ): Promise<OrderRow> {
    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNo,
        plan,
        amount,
        paymentType,
        expiresAt,
        status: 'PENDING',
      },
    });

    return this.mapOrderRow(order);
  }

  /**
   * 更新订单状态
   */
  async updateStatus(
    id: number,
    status: OrderStatus,
    paidAt?: Date,
  ): Promise<OrderRow> {
    const data: any = { status };
    if (paidAt) {
      data.paidAt = paidAt;
    }

    const order = await this.prisma.order.update({
      where: { id },
      data,
    });

    return this.mapOrderRow(order);
  }

  /**
   * 标记订单为已退款
   */
  async markAsRefunded(id: number): Promise<OrderRow> {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    return this.mapOrderRow(order);
  }

  /**
   * 获取待支付订单
   */
  async getPendingOrders(): Promise<OrderRow[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { expiresAt: 'asc' },
    });

    return orders.map((o) => this.mapOrderRow(o));
  }

  /**
   * 管理员查询订单列表
   */
  async findAllForAdmin(options: FindAdminOrdersOptions): Promise<AdminOrderListResult> {
    const { page, pageSize, status, plan, keyword } = options;
    const skip = (page - 1) * pageSize;

    const where: any = {
      ...(status ? { status } : {}),
      ...(plan ? { plan } : {}),
    };

    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword, mode: 'insensitive' } },
        { user: { phone: { contains: keyword } } },
        { user: { nickname: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              phone: true,
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      list: orders.map((order) => this.mapAdminOrderRow(order)),
      total,
    };
  }
}
