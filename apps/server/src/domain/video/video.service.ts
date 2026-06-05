import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { VideoAccessLevel } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { VideoRepository } from './video.repository';

interface VideoViewer {
  id?: number;
  role?: string;
  vipExpiresAt?: number | string | null;
  canAccessVideos?: boolean;
}

@Injectable()
export class VideoService {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly prisma: PrismaService,
  ) {}

  private readonly accessOrder: Record<VideoAccessLevel, number> = {
    PUBLIC: 0,
    USER: 1,
    VIP: 1,
    VIDEO: 2,
  };

  private async getFreshViewer(user?: VideoViewer | null): Promise<VideoViewer | null> {
    if (!user?.id) {
      return null;
    }

    const freshUser = await this.prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      select: {
        id: true,
        role: true,
        vipExpiresAt: true,
        canAccessVideos: true,
      },
    });

    return freshUser
      ? {
          id: Number(freshUser.id),
          role: freshUser.role,
          vipExpiresAt: freshUser.vipExpiresAt ? Number(freshUser.vipExpiresAt) : null,
          canAccessVideos: freshUser.canAccessVideos,
        }
      : null;
  }

  private async getEffectiveAccessLevel(user?: VideoViewer | null): Promise<VideoAccessLevel> {
    const freshUser = await this.getFreshViewer(user);
    if (freshUser?.canAccessVideos || String(freshUser?.role).toUpperCase() === 'ADMIN') {
      return 'VIDEO';
    }

    if (freshUser?.id) {
      return 'USER';
    }

    return 'PUBLIC';
  }

  private async getAllowedAccessLevels(user?: VideoViewer | null): Promise<VideoAccessLevel[]> {
    const viewerLevel = await this.getEffectiveAccessLevel(user);
    return (Object.keys(this.accessOrder) as VideoAccessLevel[]).filter(
      (level) => this.accessOrder[level] <= this.accessOrder[viewerLevel],
    );
  }

  private async ensureVideoAccessible(requiredLevel: VideoAccessLevel, user?: VideoViewer | null) {
    const currentLevel = await this.getEffectiveAccessLevel(user);
    if (this.accessOrder[currentLevel] >= this.accessOrder[requiredLevel]) {
      return;
    }

    const payloadByLevel: Record<
      VideoAccessLevel,
      { message: string; requiredPlan: string }
    > = {
      PUBLIC: {
        message: '该视频当前不可访问',
        requiredPlan: 'public',
      },
      USER: {
        message: '该视频需要登录后观看',
        requiredPlan: 'user',
      },
      VIDEO: {
        message: '该视频需要视频专属权限',
        requiredPlan: 'video',
      },
      VIP: {
        message: '该视频需要登录后观看',
        requiredPlan: 'user',
      },
    };

    const payload = payloadByLevel[requiredLevel];
    throw new HttpException(
      {
        code: 403,
        message: payload.message,
        data: {
          requiredPlan: payload.requiredPlan,
        },
      },
      200,
    );
  }

  async getList(
    user: VideoViewer | null | undefined,
    options: { page: number; pageSize: number; featuredOnly?: boolean },
  ) {
    return this.videoRepository.findAccessibleList({
      accessLevels: await this.getAllowedAccessLevels(user),
      page: options.page,
      pageSize: options.pageSize,
      featuredOnly: options.featuredOnly,
    });
  }

  async getDetail(id: number, user?: VideoViewer | null) {
    const video = await this.videoRepository.findById(id);
    if (!video || !video.isActive) {
      throw new NotFoundException('视频不存在');
    }

    await this.ensureVideoAccessible(video.accessLevel, user);
    return video;
  }

  async getAdminList(options?: {
    isActive?: boolean;
    accessLevel?: VideoAccessLevel;
  }) {
    return this.videoRepository.findAllAdmin(options);
  }

  async createVideo(data: {
    title: string;
    summary?: string | null;
    description?: string | null;
    coverUrl?: string | null;
    videoUrl: string;
    durationSec?: number | null;
    accessLevel?: VideoAccessLevel;
    isActive?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
  }) {
    return this.videoRepository.create(data);
  }

  async updateVideo(
    id: number,
    data: Partial<{
      title: string;
      summary: string | null;
      description: string | null;
      coverUrl: string | null;
      videoUrl: string;
      durationSec: number | null;
      accessLevel: VideoAccessLevel;
      isActive: boolean;
      isFeatured: boolean;
      sortOrder: number;
    }>,
  ) {
    const existing = await this.videoRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('视频不存在');
    }

    return this.videoRepository.update(id, data);
  }

  async deleteVideo(id: number) {
    const existing = await this.videoRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('视频不存在');
    }

    await this.videoRepository.delete(id);
  }
}
