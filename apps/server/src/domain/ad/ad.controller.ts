/**
 * Ad Controller - 广告路由控制层
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Headers,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdService } from './ad.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { formatResponse } from '@/common/utils/response';
import { AdMediaType, AdPosition } from '@prisma/client';

@ApiTags('广告管理')
@Controller('ads')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取广告列表（管理员）' })
  async getAdminAds(
    @Query('position') position?: AdPosition,
    @Query('isActive') isActive?: string,
  ) {
    const ads = await this.adService.getAllAds({
      position,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
    return formatResponse(ads);
  }

  @Get()
  @ApiOperation({ summary: '获取所有活跃广告' })
  async getAllAds() {
    const ads = await this.adService.getAllActiveAds();
    return formatResponse(ads);
  }

  @Get(':position')
  @ApiOperation({ summary: '根据广告位获取广告' })
  async getAdsByPosition(@Param('position') position: string) {
    const ads = await this.adService.getAdsByPosition(position as any);
    return formatResponse(ads);
  }

  @Post(':id/click')
  @ApiOperation({ summary: '记录广告点击' })
  async recordClick(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Headers('x-forwarded-for') forwardedFor: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const userId = req.user?.id;
    const ip = forwardedFor?.split(',')[0] || req.ip;

    await this.adService.recordClick(id, userId, ip, userAgent);
    return formatResponse(null);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建广告（管理员）' })
  async createAd(
    @Body() dto: {
      position: AdPosition;
      mediaType?: AdMediaType;
      title: string;
      content: string;
      imageUrl?: string | null;
      videoUrl?: string | null;
      linkUrl: string;
      priority?: number;
      isActive?: boolean;
    },
  ) {
    const ad = await this.adService.createAd(dto);
    return formatResponse(ad);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新广告（管理员）' })
  async updateAd(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<{
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
  ) {
    const ad = await this.adService.updateAd(id, dto);
    return formatResponse(ad);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除广告（管理员）' })
  async deleteAd(@Param('id', ParseIntPipe) id: number) {
    await this.adService.deleteAd(id);
    return formatResponse(null);
  }
}
