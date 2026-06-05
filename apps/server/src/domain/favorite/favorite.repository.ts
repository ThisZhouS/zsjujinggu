/**
 * FavoriteRepository - 用户收藏数据访问层
 * 负责收藏牛散 CRUD 操作
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

export interface FavoriteRow {
  id: number;
  userId: number;
  investorId: number;
  investorName: string;
  investorAvatar?: string | null;
  totalMarketValue?: number | null;
  stockCount?: number | null;
  createdAt: Date;
}

@Injectable()
export class FavoriteRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据用户 ID 查找所有收藏
   */
  async findByUserId(userId: number): Promise<FavoriteRow[]> {
    const favorites = await this.prisma.userFavorite.findMany({
      where: { userId },
      include: {
        investor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      id: Number(f.id),
      userId: Number(f.userId),
      investorId: Number(f.investorId),
      investorName: f.investor.name,
      investorAvatar: f.investor.avatar,
      totalMarketValue: f.investor.totalMarketValue ? Number(f.investor.totalMarketValue) : null,
      stockCount: f.investor.stockCount ?? null,
      createdAt: f.createdAt,
    }));
  }

  /**
   * 查找单个收藏记录
   */
  async findOne(id: number, userId: number): Promise<FavoriteRow | null> {
    const favorite = await this.prisma.userFavorite.findFirst({
      where: { id, userId },
      include: {
        investor: true,
      },
    });

    if (!favorite) {
      return null;
    }

    return {
      id: Number(favorite.id),
      userId: Number(favorite.userId),
      investorId: Number(favorite.investorId),
      investorName: favorite.investor.name,
      investorAvatar: favorite.investor.avatar,
      totalMarketValue: favorite.investor.totalMarketValue ? Number(favorite.investor.totalMarketValue) : null,
      stockCount: favorite.investor.stockCount ?? null,
      createdAt: favorite.createdAt,
    };
  }

  /**
   * 检查用户是否已收藏某牛散
   */
  async isFavorite(userId: number, investorId: number): Promise<boolean> {
    const existing = await this.prisma.userFavorite.findUnique({
      where: {
        userId_investorId: {
          userId,
          investorId,
        },
      },
    });

    return !!existing;
  }

  /**
   * 创建收藏记录
   */
  async create(userId: number, investorId: number): Promise<FavoriteRow> {
    // 检查是否已存在
    const existing = await this.prisma.userFavorite.findUnique({
      where: {
        userId_investorId: {
          userId,
          investorId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('已收藏该牛散');
    }

    const investor = await this.prisma.investor.findUnique({
      where: { id: investorId },
    });

    if (!investor) {
      throw new NotFoundException('牛散不存在');
    }

    const favorite = await this.prisma.userFavorite.create({
      data: {
        userId,
        investorId,
      },
      include: {
        investor: true,
      },
    });

    return {
      id: Number(favorite.id),
      userId: Number(favorite.userId),
      investorId: Number(favorite.investorId),
      investorName: favorite.investor.name,
      investorAvatar: favorite.investor.avatar,
      totalMarketValue: favorite.investor.totalMarketValue ? Number(favorite.investor.totalMarketValue) : null,
      stockCount: favorite.investor.stockCount ?? null,
      createdAt: favorite.createdAt,
    };
  }

  /**
   * 删除收藏记录
   */
  async delete(userId: number, investorId: number): Promise<void> {
    const favorite = await this.prisma.userFavorite.findUnique({
      where: {
        userId_investorId: {
          userId,
          investorId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('收藏记录不存在');
    }

    await this.prisma.userFavorite.delete({
      where: {
        userId_investorId: {
          userId,
          investorId,
        },
      },
    });
  }
}
