/**
 * PriceAlertController - 价格提醒路由控制层
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PriceAlertService } from './price-alert.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';
import { CreatePriceAlertDto } from './dto/price-alert.dto';

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
  };
}

@ApiTags('价格提醒')
@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
export class PriceAlertController {
  constructor(private readonly priceAlertService: PriceAlertService) {}

  @Get()
  @ApiOperation({ summary: '获取价格提醒列表' })
  async getAlerts(@Req() req: JwtRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const alerts = await this.priceAlertService.getAlerts(userId);
    return formatResponse(alerts);
  }

  @Post()
  @ApiOperation({ summary: '创建价格提醒' })
  async createAlert(
    @Req() req: JwtRequest,
    @Body() dto: CreatePriceAlertDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const result = await this.priceAlertService.createAlert(
      userId,
      dto.stockCode,
      dto.alertType,
      dto.targetPrice,
    );
    return formatResponse(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除价格提醒' })
  async deleteAlert(
    @Req() req: JwtRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.priceAlertService.deleteAlert(userId, Number(id));
    return formatResponse({ success: true });
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '停用价格提醒' })
  async deactivateAlert(
    @Req() req: JwtRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.priceAlertService.deactivateAlert(userId, Number(id));
    return formatResponse({ success: true });
  }
}
