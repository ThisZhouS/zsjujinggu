/**
 * NotificationRepository - 通知数据访问层
 * 负责用户通知 CRUD 操作
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface NotificationRow {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedId?: number | null;
  createdAt: Date;
}

export interface NotificationListResult {
  list: NotificationRow[];
  total: number;
}

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据用户 ID 查找所有通知
   */
  async findByUserId(
    userId: number,
    options: { skip?: number; take?: number } = {},
  ): Promise<NotificationListResult> {
    const { skip = 0, take = 20 } = options;
    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId: BigInt(userId) },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({
        where: { userId: BigInt(userId) },
      }),
    ]);

    return {
      list: notifications.map((n) => ({
        id: Number(n.id),
        userId: Number(n.userId),
        type: n.type,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        relatedId: n.relatedId ? Number(n.relatedId) : null,
        createdAt: n.createdAt,
      })),
      total,
    };
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(id: number, userId: number): Promise<void> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('通知不存在');
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * 创建通知
   */
  async create(
    userId: number,
    type: NotificationType,
    title: string,
    content: string,
    relatedId?: number,
  ): Promise<NotificationRow> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        relatedId,
      },
    });

    return {
      id: Number(notification.id),
      userId: Number(notification.userId),
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      relatedId: notification.relatedId ? Number(notification.relatedId) : null,
      createdAt: notification.createdAt,
    };
  }

  /**
   * 删除通知
   */
  async delete(id: number, userId: number): Promise<void> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('通知不存在');
    }
  }
}
