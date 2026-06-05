/**
 * Ad Repository - 广告数据访问层
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AdMediaType, AdPosition } from '@prisma/client';

export interface AdRow {
  id: number;
  position: AdPosition;
  mediaType: AdMediaType;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  linkUrl: string;
  isActive: boolean;
  priority: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AdWithCount {
  id: bigint;
  position: AdPosition;
  mediaType: AdMediaType;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  linkUrl: string;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    adLogs: number;
  };
}

@Injectable()
export class AdRepository {
  constructor(private prisma: PrismaService) {}

  private mapAdRow(ad: AdWithCount): AdRow {
    return {
      id: Number(ad.id),
      position: ad.position,
      mediaType: ad.mediaType,
      title: ad.title,
      content: ad.content,
      imageUrl: ad.imageUrl,
      videoUrl: ad.videoUrl,
      linkUrl: ad.linkUrl,
      isActive: ad.isActive,
      priority: ad.priority,
      clickCount: ad._count?.adLogs ?? 0,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
    };
  }

  /**
   * 根据广告位获取广告列表
   */
  async findByPosition(position: AdPosition): Promise<AdRow[]> {
    const ads = await this.prisma.ad.findMany({
      where: {
        position,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            adLogs: true,
          },
        },
      },
      orderBy: { priority: 'desc' },
    });

    return ads.map((ad) => this.mapAdRow(ad));
  }

  /**
   * 获取所有活跃广告
   */
  async findAllActive(): Promise<AdRow[]> {
    const ads = await this.prisma.ad.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            adLogs: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { priority: 'desc' }],
    });

    return ads.map((ad) => this.mapAdRow(ad));
  }

  /**
   * 获取所有广告（管理员）
   */
  async findAll(options: { position?: AdPosition; isActive?: boolean } = {}): Promise<AdRow[]> {
    const ads = await this.prisma.ad.findMany({
      where: {
        ...(options.position ? { position: options.position } : {}),
        ...(typeof options.isActive === 'boolean' ? { isActive: options.isActive } : {}),
      },
      include: {
        _count: {
          select: {
            adLogs: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { position: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return ads.map((ad) => this.mapAdRow(ad));
  }

  /**
   * 根据 ID 查找广告
   */
  async findById(id: number): Promise<AdRow | null> {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            adLogs: true,
          },
        },
      },
    });

    return ad ? this.mapAdRow(ad) : null;
  }

  /**
   * 创建广告
   */
  async create(data: {
    position: AdPosition;
    mediaType?: AdMediaType;
    title: string;
    content: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    linkUrl: string;
    priority?: number;
    isActive?: boolean;
  }): Promise<AdRow> {
    const ad = await this.prisma.ad.create({
      data,
      include: {
        _count: {
          select: {
            adLogs: true,
          },
        },
      },
    });

    return this.mapAdRow(ad);
  }

  /**
   * 更新广告
   */
  async update(
    id: number,
    data: Partial<{
      position: AdPosition;
      mediaType: AdMediaType;
      title: string;
      content: string;
      imageUrl: string | null;
      videoUrl: string | null;
      linkUrl: string;
      priority: number;
      isActive: boolean;
    }>,
  ): Promise<AdRow> {
    const ad = await this.prisma.ad.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            adLogs: true,
          },
        },
      },
    });

    return this.mapAdRow(ad);
  }

  /**
   * 删除广告
   */
  async delete(id: number): Promise<void> {
    await this.prisma.ad.delete({
      where: { id },
    });
  }

  /**
   * 记录广告点击
   */
  async logClick(adId: number, userId?: number, ip?: string, userAgent?: string): Promise<void> {
    await this.prisma.adLog.create({
      data: {
        adId,
        userId,
        ip,
        userAgent,
      },
    });
  }
}
