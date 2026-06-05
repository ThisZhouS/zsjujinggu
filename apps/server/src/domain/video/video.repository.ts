import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Video, VideoAccessLevel } from '@prisma/client';

export interface VideoRow {
  id: number;
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
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(video: Video): VideoRow {
    return {
      id: Number(video.id),
      title: video.title,
      summary: video.summary,
      description: video.description,
      coverUrl: video.coverUrl,
      videoUrl: video.videoUrl,
      durationSec: video.durationSec,
      accessLevel: video.accessLevel,
      isActive: video.isActive,
      isFeatured: video.isFeatured,
      sortOrder: video.sortOrder,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  }

  async findAccessibleList(options: {
    accessLevels: VideoAccessLevel[];
    page: number;
    pageSize: number;
    featuredOnly?: boolean;
  }): Promise<{ list: VideoRow[]; total: number }> {
    const where = {
      isActive: true,
      accessLevel: { in: options.accessLevels },
      ...(options.featuredOnly ? { isFeatured: true } : {}),
    } as const;

    const [list, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      list: list.map((item) => this.mapRow(item)),
      total,
    };
  }

  async findById(id: number): Promise<VideoRow | null> {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    return video ? this.mapRow(video) : null;
  }

  async findAllAdmin(options?: {
    isActive?: boolean;
    accessLevel?: VideoAccessLevel;
  }): Promise<VideoRow[]> {
    const list = await this.prisma.video.findMany({
      where: {
        ...(typeof options?.isActive === 'boolean' ? { isActive: options.isActive } : {}),
        ...(options?.accessLevel ? { accessLevel: options.accessLevel } : {}),
      },
      orderBy: [
        { isActive: 'desc' },
        { isFeatured: 'desc' },
        { sortOrder: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return list.map((item) => this.mapRow(item));
  }

  async create(data: {
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
  }): Promise<VideoRow> {
    const video = await this.prisma.video.create({
      data,
    });

    return this.mapRow(video);
  }

  async update(
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
  ): Promise<VideoRow> {
    const video = await this.prisma.video.update({
      where: { id },
      data,
    });

    return this.mapRow(video);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.video.delete({
      where: { id },
    });
  }
}
