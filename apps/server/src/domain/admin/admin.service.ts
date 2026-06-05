/**
 * Admin Service - 管理员业务逻辑层
 * 负责同步管理、用户管理、订单管理
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { maskPhone } from '@/common/utils/data-sanitizer';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { StockSyncTask } from '@/infrastructure/scheduler/stock-sync.task';
import { KlineSyncTask } from '@/infrastructure/scheduler/kline-sync.task';
import { BusinessDataSyncTask } from '@/infrastructure/scheduler/business-data-sync.task';
import { DataSyncTask } from '@/infrastructure/scheduler/data-sync.task';
import { buildTrackedPersonalInvestorWhere } from '@/common/utils/investor-name-filter';
import { OrderService } from '@/domain/order/order.service';
import { ApiKeyService } from '@/domain/api-key/api-key.service';
import { ApiPlan, MemberPlan, OrderStatus, Prisma, UserRole } from '@prisma/client';

export interface SyncLogResult {
  list: SyncLogItem[];
  total: number;
}

export interface SyncLogItem {
  id: number;
  taskName: string;
  status: string;
  message: string | null;
  startTime: Date;
  endTime: Date | null;
  recordCount: number | null;
  createdAt: Date;
}

export interface AdminOrderListResult {
  list: any[];
  total: number;
}

export interface AdminApiKeyListResult {
  list: any[];
  total: number;
}

export interface AdminDashboardSummary {
  totalUsers: number;
  adminUsers: number;
  activeVipUsers: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalAds: number;
  activeAds: number;
  totalArticles: number;
  trackedInvestors: number;
  latestSync: {
    taskName: string;
    status: string;
    startTime: Date;
    endTime: Date | null;
    recordCount: number | null;
  } | null;
}

export interface AdminUserListResult {
  list: AdminUserItem[];
  total: number;
}

export interface AdminUserItem {
  id: number;
  phoneMasked: string;
  username: string | null;
  nickname: string | null;
  role: UserRole;
  canUploadArticles: boolean;
  vipExpiresAt: Date | null;
  vipStatus: 'ACTIVE' | 'EXPIRED' | 'NONE';
  avatar: string | null;
  orderCount: number;
  apiKeyCount: number;
  watchlistCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private stockSyncTask: StockSyncTask,
    private klineSyncTask: KlineSyncTask,
    private businessDataSyncTask: BusinessDataSyncTask,
    private dataSyncTask: DataSyncTask,
    private orderService: OrderService,
    private apiKeyService: ApiKeyService,
  ) {}

  /**
   * 获取同步日志列表
   */
  async getSyncLogs(options: {
    page: number;
    pageSize: number;
    taskName?: string;
    status?: string;
  }): Promise<SyncLogResult> {
    const { page, pageSize, taskName, status } = options;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (taskName) {
      where.taskName = taskName;
    }

    if (status) {
      where.status = status;
    }

    const [logs, total] = await Promise.all([
      this.prisma.syncLog.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.syncLog.count({ where }),
    ]);

    return {
      list: logs.map((log) => ({
        id: Number(log.id),
        taskName: log.taskName,
        status: log.status,
        message: log.message,
        startTime: log.startTime,
        endTime: log.endTime,
        recordCount: log.recordCount ?? null,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  /**
   * 获取控制台概览数据
   */
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const now = new Date();
    const [
      totalUsers,
      adminUsers,
      activeVipUsers,
      totalOrders,
      paidOrders,
      revenueAggregate,
      totalApiKeys,
      activeApiKeys,
      totalAds,
      activeAds,
      totalArticles,
      trackedInvestors,
      latestSync,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { vipExpiresAt: { gt: now } } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.apiKey.count(),
      this.prisma.apiKey.count({ where: { isActive: true } }),
      this.prisma.ad.count(),
      this.prisma.ad.count({ where: { isActive: true } }),
      this.prisma.article.count(),
      this.prisma.investor.count({ where: buildTrackedPersonalInvestorWhere() }),
      this.prisma.syncLog.findFirst({
        orderBy: { startTime: 'desc' },
        select: {
          taskName: true,
          status: true,
          startTime: true,
          endTime: true,
          recordCount: true,
        },
      }),
    ]);

    return {
      totalUsers,
      adminUsers,
      activeVipUsers,
      totalOrders,
      paidOrders,
      totalRevenue: Number(revenueAggregate._sum.amount ?? 0),
      totalApiKeys,
      activeApiKeys,
      totalAds,
      activeAds,
      totalArticles,
      trackedInvestors,
      latestSync: latestSync
        ? {
            taskName: latestSync.taskName,
            status: latestSync.status,
            startTime: latestSync.startTime,
            endTime: latestSync.endTime,
            recordCount: latestSync.recordCount ?? null,
          }
        : null,
    };
  }

  /**
   * 手动触发股票列表同步
   */
  async triggerStockListSync(): Promise<{ success: boolean; recordCount?: number }> {
    const result = await this.stockSyncTask.execute('stock-list', () =>
      this.stockSyncTask.syncStockList(),
    );

    return result;
  }

  /**
   * 手动触发实时行情同步
   */
  async triggerRealtimeQuotesSync(): Promise<{ success: boolean; recordCount?: number }> {
    const result = await this.stockSyncTask.execute('realtime-quotes', () =>
      this.stockSyncTask.syncRealtimeQuotes(),
    );

    return result;
  }

  /**
   * 手动触发涨停板同步
   */
  async triggerLimitUpSync(): Promise<{ success: boolean; recordCount?: number }> {
    const result = await this.stockSyncTask.execute('limit-up', () =>
      this.stockSyncTask.syncLimitUp(),
    );

    return result;
  }

  /**
   * 手动触发 K 线同步
   */
  async triggerKlineSync(): Promise<{ success: boolean; recordCount?: number }> {
    const result = await this.klineSyncTask.execute('kline-daily', () =>
      this.klineSyncTask.syncTodayKline(),
    );

    return result;
  }

  /**
   * 手动触发历史涨幅预计算
   */
  async triggerGainersRecalc(): Promise<{ success: boolean; recordCount?: number }> {
    const result = await this.klineSyncTask.execute('gainers-recalc', () =>
      this.klineSyncTask.recalcAllPeriodGainers(),
    );

    return result;
  }

  /**
   * 手动触发业务数据同步
   */
  async triggerBusinessDataSync(): Promise<{ success: boolean; recordCount?: number }> {
    const result = await this.businessDataSyncTask.execute('business-data', () =>
      this.businessDataSyncTask.syncBusinessData(),
    );

    return result;
  }

  /**
   * 手动触发 TradingKey 明星投资人持仓同步
   */
  async triggerStarInvestorHoldingsSync(): Promise<{ success: boolean; recordCount?: number; message?: string }> {
    const result = await this.dataSyncTask.triggerManualSync('star_investor_holdings');
    return {
      success: result.success,
      recordCount: result.recordCount,
      message: result.message,
    };
  }

  /**
   * 管理员获取订单列表
   */
  async getOrders(options: {
    page: number;
    pageSize: number;
    status?: OrderStatus;
    plan?: MemberPlan;
    keyword?: string;
  }): Promise<AdminOrderListResult> {
    return this.orderService.getAdminOrders(options);
  }

  /**
   * 管理员获取用户列表
   */
  async getUsers(options: {
    page: number;
    pageSize: number;
    role?: UserRole;
    vipStatus?: 'ACTIVE' | 'EXPIRED' | 'NONE';
    keyword?: string;
  }): Promise<AdminUserListResult> {
    const { page, pageSize, role, vipStatus, keyword } = options;
    const skip = (page - 1) * pageSize;
    const now = new Date();
    const keywordText = keyword?.trim();
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (vipStatus === 'ACTIVE') {
      where.vipExpiresAt = { gt: now };
    } else if (vipStatus === 'EXPIRED') {
      where.vipExpiresAt = { lte: now };
    } else if (vipStatus === 'NONE') {
      where.vipExpiresAt = null;
    }

    if (keywordText) {
      where.OR = [
        { phone: { contains: keywordText } },
        { username: { contains: keywordText, mode: 'insensitive' } },
        { nickname: { contains: keywordText, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          username: true,
          nickname: true,
          role: true,
          canUploadArticles: true,
          canAccessVideos: true,
          vipExpiresAt: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
              apiKeys: true,
              watchlists: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: users.map((user) => ({
        id: Number(user.id),
        phoneMasked: maskPhone(user.phone),
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        canUploadArticles: user.canUploadArticles,
        canAccessVideos: user.canAccessVideos,
        vipExpiresAt: user.vipExpiresAt,
        vipStatus: !user.vipExpiresAt
          ? 'NONE'
          : user.vipExpiresAt > now
            ? 'ACTIVE'
            : 'EXPIRED',
        avatar: user.avatar,
        orderCount: user._count.orders,
        apiKeyCount: user._count.apiKeys,
        watchlistCount: user._count.watchlists,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
    };
  }

  /**
   * 管理员设置用户文章上传权限
   */
  async updateArticleUploadPermission(
    userId: number,
    canUploadArticles: boolean,
  ): Promise<{ id: number; canUploadArticles: boolean }> {
    await this.assertMutableRegularUser(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { canUploadArticles },
      select: {
        id: true,
        canUploadArticles: true,
      },
    });

    return {
      id: Number(user.id),
      canUploadArticles: user.canUploadArticles,
    };
  }

  async updateVideoAccessPermission(
    userId: number,
    canAccessVideos: boolean,
  ): Promise<{ id: number; canAccessVideos: boolean }> {
    await this.assertMutableRegularUser(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { canAccessVideos },
      select: {
        id: true,
        canAccessVideos: true,
      },
    });

    return {
      id: Number(user.id),
      canAccessVideos: user.canAccessVideos,
    };
  }

  private async assertMutableRegularUser(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      throw new BadRequestException('管理员账号权限由角色控制，不能通过普通用户权限接口修改');
    }
  }

  /**
   * 管理员退款
   */
  async refundOrder(id: number): Promise<void> {
    await this.orderService.refundOrder(id);
  }

  /**
   * 管理员获取 API Key 列表
   */
  async getApiKeys(options: {
    page: number;
    pageSize: number;
    plan?: ApiPlan;
    isActive?: boolean;
    keyword?: string;
  }): Promise<AdminApiKeyListResult> {
    return this.apiKeyService.getAdminApiKeys(options);
  }

  /**
   * 管理员创建 API Key
   */
  async createApiKey(userId: number, plan?: ApiPlan) {
    return this.apiKeyService.generateApiKeyAsAdmin(userId, plan || 'FREE');
  }

  /**
   * 管理员删除 API Key
   */
  async deleteApiKey(id: number): Promise<void> {
    await this.apiKeyService.deleteApiKeyAsAdmin(id);
  }

  /**
   * 管理员停用/启用 API Key
   */
  async toggleApiKey(id: number, isActive: boolean): Promise<void> {
    await this.apiKeyService.toggleApiKeyAsAdmin(id, isActive);
  }
}
