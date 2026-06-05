/**
 * Export Controller - 数据导出路由控制层
 * 支持导出 CSV 格式数据
 */

import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExportService, ExportType } from './export.service';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { VipGuard } from '@/common/guards/vip.guard';
import { Response } from 'express';

@ApiTags('数据导出')
@Controller('export')
@UseGuards(OptionalJwtAuthGuard, VipGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  @ApiOperation({ summary: '导出数据' })
  async exportData(
    @Query('type') type: ExportType,
    @Query('investorId') investorId?: number,
    @Query('period') period?: string,
    @Query('year') year?: number,
    @Res() res?: Response,
  ) {
    const params = { investorId: investorId ? Number(investorId) : undefined, period, year };
    const result = await this.exportService.exportData(type, params);

    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res!.send(result.content);
  }
}
