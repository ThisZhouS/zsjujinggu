import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'node:crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdMediaType, VideoAccessLevel } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { formatResponse } from '@/common/utils/response';
import { VideoService } from './video.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { diskStorage } = require('multer');

const videoUploadDir = join(process.cwd(), 'uploads', 'videos');

interface VideoJwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
    vipExpiresAt?: number | string | null;
    canAccessVideos?: boolean;
  };
}

function ensureVideoUploadDir() {
  if (!existsSync(videoUploadDir)) {
    mkdirSync(videoUploadDir, { recursive: true });
  }
}

@ApiTags('视频')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取视频列表' })
  async getList(
    @Req() req: VideoJwtRequest,
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 12,
    @Query('featured') featured?: string,
  ) {
    const result = await this.videoService.getList(req.user, {
      page: Number(page),
      pageSize: Number(pageSize),
      featuredOnly: featured === 'true',
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page: Number(page),
        page_size: Number(pageSize),
        total_pages: Math.ceil(result.total / Number(pageSize)),
      },
    });
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取视频列表（管理员）' })
  async getAdminList(
    @Query('isActive') isActive?: string,
    @Query('accessLevel') accessLevel?: VideoAccessLevel,
  ) {
    const list = await this.videoService.getAdminList({
      isActive: isActive === undefined ? undefined : isActive === 'true',
      accessLevel,
    });

    return formatResponse(list);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取视频详情' })
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: VideoJwtRequest,
  ) {
    const video = await this.videoService.getDetail(id, req.user);
    return formatResponse(video);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureVideoUploadDir();
          callback(null, videoUploadDir);
        },
        filename: (_req, file, callback) => {
          const extension = extname(file.originalname).toLowerCase() || '.mp4';
          const safeExtension = extension.length <= 10 ? extension : '.mp4';
          callback(
            null,
            `video-${Date.now()}-${randomUUID()}${safeExtension}`,
          );
        },
      }),
      limits: {
        fileSize: 300 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('video/')) {
          callback(new BadRequestException('仅支持上传视频文件'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: '上传视频文件（管理员）' })
  async uploadVideo(@UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('请上传视频文件');
    }

    return formatResponse({
      url: `/uploads/videos/${file.filename}`,
      filename: file.filename,
      mediaType: AdMediaType.VIDEO,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建视频（管理员）' })
  async create(
    @Body()
    dto: {
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
    },
  ) {
    const video = await this.videoService.createVideo(dto);
    return formatResponse(video);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新视频（管理员）' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: Partial<{
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
    const video = await this.videoService.updateVideo(id, dto);
    return formatResponse(video);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除视频（管理员）' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.videoService.deleteVideo(id);
    return formatResponse(null);
  }
}
