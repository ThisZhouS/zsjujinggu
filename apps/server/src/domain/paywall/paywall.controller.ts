import { Controller, Get, NotFoundException, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';
import { PaywallService } from './paywall.service';

interface PaywallRequest extends Request {
  user?: {
    id: number;
    role: string;
    vipExpiresAt?: number | string | null;
  };
}

@ApiTags('数据墙权限预留')
@Controller('paywall')
export class PaywallController {
  constructor(private readonly paywallService: PaywallService) {}

  @Get('features')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取 Tetegu 数据墙预留功能列表' })
  async getFeatures(@Req() req: PaywallRequest) {
    return formatResponse(await this.paywallService.getFeatures(req.user));
  }

  @Get('features/:featureKey')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取单个 Tetegu 数据墙预留功能配置' })
  async getFeature(
    @Param('featureKey') featureKey: string,
    @Req() req: PaywallRequest,
  ) {
    const feature = await this.paywallService.getFeature(featureKey, req.user);
    if (!feature) {
      throw new NotFoundException('数据墙功能不存在');
    }

    return formatResponse(feature);
  }

  @Get('features/:featureKey/preview')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取 Tetegu 数据墙预留预览数据' })
  async getFeaturePreview(
    @Param('featureKey') featureKey: string,
    @Req() req: PaywallRequest,
  ) {
    const preview = await this.paywallService.getPreview(featureKey, req.user);
    if (!preview.feature) {
      throw new NotFoundException('数据墙功能不存在');
    }

    return formatResponse(preview);
  }
}
