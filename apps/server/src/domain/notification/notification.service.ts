/**
 * NotificationService - 通知业务逻辑层
 * 负责用户通知管理
 */

import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  /**
   * 获取用户的通知列表
   */
  async getNotifications(userId: number, page: number = 1, pageSize: number = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(pageSize, 100));
    return this.notificationRepository.findByUserId(userId, {
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(userId: number, id: number): Promise<void> {
    return this.notificationRepository.markAsRead(id, userId);
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: number): Promise<void> {
    return this.notificationRepository.markAllAsRead(userId);
  }

  /**
   * 创建通知
   */
  async createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    content: string,
    relatedId?: number,
  ) {
    return this.notificationRepository.create(userId, type, title, content, relatedId);
  }

  /**
   * 删除通知
   */
  async deleteNotification(userId: number, id: number): Promise<void> {
    return this.notificationRepository.delete(id, userId);
  }
}
