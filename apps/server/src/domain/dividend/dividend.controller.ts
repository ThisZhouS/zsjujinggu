/**
 * Dividend Controller - 分红路由控制层
 * 负责路由定义、参数验证、调用 Service、格式化响应
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessDataSlot } from '@prisma/client';
import { DividendService } from './dividend.service';
import { formatResponse } from '@/common/utils/response';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { VipGuard } from '@/common/guards/vip.guard';
import { DividendRankingMode } from './dividend.repository';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';

@ApiTags('分红股息')
@Controller('dividends')
export class DividendController {
  constructor(private readonly dividendService: DividendService) {}

  @Post('backfill-metrics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '补齐分红股息率与分红总额数据' })
  async backfillDividendMetrics(
    @Body('dataSlot') dataSlot?: BusinessDataSlot | 'ALL',
  ) {
    if (
      dataSlot !== undefined &&
      dataSlot !== null &&
      dataSlot !== 'ALL' &&
      dataSlot !== 'PRIMARY' &&
      dataSlot !== 'SECONDARY'
    ) {
      throw new BadRequestException('dataSlot 只能为 PRIMARY、SECONDARY 或 ALL');
    }

    if (dataSlot === 'ALL') {
      const slots: BusinessDataSlot[] = ['PRIMARY', 'SECONDARY'];
      const results = await Promise.all(
        slots.map((slot) => this.dividendService.backfillDividendMetrics(slot)),
      );

      return formatResponse({
        dataSlot: 'ALL',
        slots: results,
        mirroredRecords: results.reduce((sum, item) => sum + item.mirroredRecords, 0),
        updatedRecords: results.reduce((sum, item) => sum + item.updatedRecords, 0),
        totalRecords: results.reduce((sum, item) => sum + item.totalRecords, 0),
        yieldReadyRecords: results.reduce((sum, item) => sum + item.yieldReadyRecords, 0),
        totalDividendReadyRecords: results.reduce(
          (sum, item) => sum + item.totalDividendReadyRecords,
          0,
        ),
      });
    }

    const result = await this.dividendService.backfillDividendMetrics(dataSlot);
    return formatResponse(result);
  }

  @Get('yield-ranking')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取股息率排行榜' })
  async getDividendYieldRanking(
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
    @Query('year') year?: number,
    @Query('mode') mode: DividendRankingMode = 'rolling1y',
  ) {
    const numericPage = Number(page);
    const numericPageSize = Number(pageSize);
    const numericYear =
      year === undefined || year === null || Number.isNaN(Number(year))
        ? undefined
        : Number(year);
    const result = await this.dividendService.getDividendYieldRanking({
      page: numericPage,
      pageSize: numericPageSize,
      year: numericYear,
      mode,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page: numericPage,
        page_size: numericPageSize,
        total_pages: Math.ceil(result.total / numericPageSize),
        mode,
      },
    });
  }

  @Get('metrics/coverage')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询分红股息率与分红总额覆盖率' })
  async getDividendMetricCoverage(
    @Query('dataSlot') dataSlot?: BusinessDataSlot | 'ALL',
  ) {
    if (
      dataSlot !== undefined &&
      dataSlot !== null &&
      dataSlot !== 'ALL' &&
      dataSlot !== 'PRIMARY' &&
      dataSlot !== 'SECONDARY'
    ) {
      throw new BadRequestException('dataSlot 只能为 PRIMARY、SECONDARY 或 ALL');
    }

    if (dataSlot === 'ALL') {
      const slots: BusinessDataSlot[] = ['PRIMARY', 'SECONDARY'];
      const results = await Promise.all(
        slots.map((slot) => this.dividendService.getDividendMetricCoverage(slot)),
      );

      return formatResponse({
        dataSlot: 'ALL',
        slots: results,
        totalRecords: results.reduce((sum, item) => sum + item.totalRecords, 0),
        cashDividendRecords: results.reduce(
          (sum, item) => sum + item.cashDividendRecords,
          0,
        ),
        missingYieldRecords: results.reduce(
          (sum, item) => sum + item.missingYieldRecords,
          0,
        ),
        missingTotalDividendRecords: results.reduce(
          (sum, item) => sum + item.missingTotalDividendRecords,
          0,
        ),
        isComplete: results.every((item) => item.isComplete),
      });
    }

    const result = await this.dividendService.getDividendMetricCoverage(dataSlot);
    return formatResponse(result);
  }

  @Get('stock/:code')
  @ApiOperation({ summary: '获取股票分红历史' })
  async getStockDividends(@Param('code') code: string) {
    const dividends = await this.dividendService.getStockDividends(code);
    return formatResponse(dividends);
  }
}
