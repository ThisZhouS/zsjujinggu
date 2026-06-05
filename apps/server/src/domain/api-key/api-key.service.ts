/**
 * ApiKeyService - API Key 业务逻辑层
 * 负责 API Key 的生成、验证、管理
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiKeyRepository } from './api-key.repository';
import { ApiPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(
    private apiKeyRepository: ApiKeyRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * 生成新的 API Key
   * R19: API Key 存储为 bcrypt hash
   */
  async generateApiKey(userId: number, plan: ApiPlan = 'FREE'): Promise<{ apiKey: string; keyPrefix: string }> {
    // 生成随机 API Key（32 字节十六进制）
    const rawKey = randomBytes(32).toString('hex');

    // bcrypt hash 存储
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.slice(0, 8);

    const quotaMap: Record<ApiPlan, number> = {
      FREE: 1000,
      BASIC: 10000,
      PRO: 100000,
      ENTERPRISE: 1000000,
    };

    const expiresAtMap: Record<ApiPlan, Date | undefined> = {
      FREE: undefined,
      BASIC: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天
      PRO: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 天
      ENTERPRISE: undefined,
    };

    await this.apiKeyRepository.create(
      userId,
      keyHash,
      keyPrefix,
      plan,
      quotaMap[plan],
      expiresAtMap[plan],
    );

    return {
      apiKey: rawKey,
      keyPrefix,
    };
  }

  /**
   * 获取用户的 API Key 列表
   */
  async getUserApiKeys(userId: number, page: number = 1, pageSize: number = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(pageSize, 100));

    return this.apiKeyRepository.findByUserId(userId, {
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });
  }

  /**
   * 管理员获取 API Key 列表
   */
  async getAdminApiKeys(options: {
    page: number;
    pageSize: number;
    plan?: ApiPlan;
    isActive?: boolean;
    keyword?: string;
  }) {
    const safePage = Math.max(1, options.page);
    const safePageSize = Math.max(1, Math.min(options.pageSize, 100));

    return this.apiKeyRepository.findAllForAdmin({
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      plan: options.plan,
      isActive: options.isActive,
      keyword: options.keyword?.trim() || undefined,
    });
  }

  /**
   * 删除 API Key
   */
  async deleteApiKey(userId: number, id: number): Promise<void> {
    return this.apiKeyRepository.delete(id, userId);
  }

  /**
   * 管理员删除 API Key
   */
  async deleteApiKeyAsAdmin(id: number): Promise<void> {
    return this.apiKeyRepository.deleteAsAdmin(id);
  }

  /**
   * 停用/启用 API Key
   */
  async toggleApiKey(userId: number, id: number, isActive: boolean): Promise<void> {
    await this.apiKeyRepository.updateStatus(id, userId, isActive);
  }

  /**
   * 管理员停用/启用 API Key
   */
  async toggleApiKeyAsAdmin(id: number, isActive: boolean): Promise<void> {
    await this.apiKeyRepository.updateStatusAsAdmin(id, isActive);
  }

  /**
   * 管理员为指定用户生成 API Key
   */
  async generateApiKeyAsAdmin(userId: number, plan: ApiPlan = 'FREE') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.generateApiKey(userId, plan);
  }

  /**
   * 验证 API Key
   */
  async validateApiKey(key: string) {
    return this.apiKeyRepository.validateApiKey(key);
  }

  /**
   * 记录 API 使用
   */
  async recordUsage(apiKeyId: number, endpoint: string, method: string, statusCode: number, responseTime: number, ip?: string) {
    await this.prisma.$transaction([
      this.prisma.apiUsageLog.create({
        data: {
          apiKeyId,
          endpoint,
          method,
          statusCode,
          responseTime,
          ip,
        },
      }),
      this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          used: {
            increment: 1,
          },
        },
      }),
    ]);
  }
}
