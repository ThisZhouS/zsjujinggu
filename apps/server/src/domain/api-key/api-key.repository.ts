/**
 * ApiKeyRepository - API Key 数据访问层
 * 负责 API Key 的 CRUD 操作
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ApiPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { maskPhone } from '@/common/utils/data-sanitizer';

export interface ApiKeyRow {
  id: number;
  userId: number;
  keyPrefix: string | null;
  plan: ApiPlan;
  quota: number;
  used: number;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FindApiKeysOptions {
  skip?: number;
  take?: number;
}

export interface ApiKeyListResult {
  list: ApiKeyRow[];
  total: number;
}

export interface AdminApiKeyRow extends ApiKeyRow {
  userPhone: string;
  userNickname: string | null;
}

export interface FindAdminApiKeysOptions {
  skip?: number;
  take?: number;
  plan?: ApiPlan;
  isActive?: boolean;
  keyword?: string;
}

export interface AdminApiKeyListResult {
  list: AdminApiKeyRow[];
  total: number;
}

interface ApiKeyWithUser {
  id: bigint;
  userId: bigint;
  keyPrefix?: string | null;
  plan: ApiPlan;
  quota: number;
  used: number;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    phone: string;
    nickname: string | null;
  };
}

@Injectable()
export class ApiKeyRepository {
  constructor(private prisma: PrismaService) {}

  private mapApiKeyRow(apiKey: {
    id: bigint;
    userId: bigint;
    keyPrefix?: string | null;
    plan: ApiPlan;
    quota: number;
    used: number;
    expiresAt?: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ApiKeyRow {
    return {
      id: Number(apiKey.id),
      userId: Number(apiKey.userId),
      keyPrefix: apiKey.keyPrefix ?? null,
      plan: apiKey.plan,
      quota: apiKey.quota,
      used: apiKey.used,
      expiresAt: apiKey.expiresAt,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  }

  private mapAdminApiKeyRow(apiKey: ApiKeyWithUser): AdminApiKeyRow {
    return {
      ...this.mapApiKeyRow(apiKey),
      userPhone: maskPhone(apiKey.user.phone),
      userNickname: apiKey.user.nickname,
    };
  }

  /**
   * 根据用户 ID 查找所有 API Key
   */
  async findByUserId(userId: number, options: FindApiKeysOptions = {}): Promise<ApiKeyListResult> {
    const { skip = 0, take = 20 } = options;
    const [apiKeys, total] = await this.prisma.$transaction([
      this.prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.apiKey.count({
        where: { userId },
      }),
    ]);

    return {
      list: apiKeys.map((k) => this.mapApiKeyRow(k)),
      total,
    };
  }

  /**
   * 查找单个 API Key
   */
  async findOne(id: number, userId: number): Promise<ApiKeyRow | null> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      return null;
    }

    return this.mapApiKeyRow(apiKey);
  }

  /**
   * 通过 keyHash 查找 API Key
   */
  async findByKeyHash(keyHash: string): Promise<ApiKeyRow | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey) {
      return null;
    }

    return this.mapApiKeyRow(apiKey);
  }

  /**
   * 创建 API Key
   */
  async create(
    userId: number,
    keyHash: string,
    keyPrefix: string,
    plan: ApiPlan = 'FREE',
    quota: number = 1000,
    expiresAt?: Date,
  ): Promise<ApiKeyRow> {
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        keyHash,
        keyPrefix,
        plan,
        quota,
        expiresAt,
      },
    });

    return this.mapApiKeyRow(apiKey);
  }

  /**
   * 删除 API Key
   */
  async delete(id: number, userId: number): Promise<void> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * 更新 API Key 状态
   */
  async updateStatus(id: number, userId: number, isActive: boolean): Promise<ApiKeyRow> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });

    return this.mapApiKeyRow(updated);
  }

  /**
   * 增加使用次数
   */
  async incrementUsed(id: number): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { used: { increment: 1 } },
    });
  }

  /**
   * 验证 API Key
   */
  async validateApiKey(key: string): Promise<ApiKeyRow | null> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { isActive: true },
    });

    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(key, apiKey.keyHash);
      if (isValid) {
        return {
          ...this.mapApiKeyRow(apiKey),
        };
      }
    }

    return null;
  }

  /**
   * 管理员查询 API Key 列表
   */
  async findAllForAdmin(options: FindAdminApiKeysOptions = {}): Promise<AdminApiKeyListResult> {
    const { skip = 0, take = 20, plan, isActive, keyword } = options;
    const where: any = {
      ...(plan ? { plan } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    };

    if (keyword) {
      where.OR = [
        { user: { phone: { contains: keyword } } },
        { user: { nickname: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [apiKeys, total] = await this.prisma.$transaction([
      this.prisma.apiKey.findMany({
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
        take,
      }),
      this.prisma.apiKey.count({ where }),
    ]);

    return {
      list: apiKeys.map((key) => this.mapAdminApiKeyRow(key)),
      total,
    };
  }

  /**
   * 管理员删除 API Key
   */
  async deleteAsAdmin(id: number): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * 管理员更新 API Key 状态
   */
  async updateStatusAsAdmin(id: number, isActive: boolean): Promise<ApiKeyRow> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });

    return this.mapApiKeyRow(updated);
  }
}
