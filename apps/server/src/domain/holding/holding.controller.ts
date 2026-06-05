/**
 * Holding Controller - 持仓路由控制层
 * 负责路由定义、参数验证、调用 Service、格式化响应
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HoldingService } from './holding.service';
import {
  HoldingNewViewMode,
  QueryHoldingChangeDto,
  QueryCommonHoldingDto,
} from './dto/query-holding.dto';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { VipGuard } from '@/common/guards/vip.guard';
import { formatResponse } from '@/common/utils/response';

@ApiTags('持仓分析')
@Controller('holdings')
export class HoldingController {
  constructor(private readonly holdingService: HoldingService) {}

  @Get('increase')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取增持榜单' })
  async getIncrease(@Query() query: QueryHoldingChangeDto) {
    const { page, page_size, keyword, reportDate } = query;
    const result = await this.holdingService.getIncreaseList({
      page: page!,
      pageSize: page_size!,
      keyword,
      reportDate,
    });

    return formatResponse({
      list: result.list.map(item => ({
        id: item.id,
        investorId: item.investorId,
        investorName: item.investorName,
        investorAvatar: item.investorAvatar,
        stockCode: item.stockCode,
        stockName: item.stockName,
        industry: item.industry,
        mainRevenue: item.mainRevenue,
        revenueReportDate: item.revenueReportDate,
        currentPrice: item.currentPrice,
        currentShares: item.holdCount,
        previousShares: item.previousCount,
        totalMarketValue: item.marketValue,
        changeShares: item.changeCount,
        changePercent: item.changeRate,
        changeMarketValue: item.changeMarketValue,
        averageChangePrice: item.averageChangePrice ?? null,
        averageChangePriceDate: item.averageChangePriceDate ?? null,
        reportDate: item.reportDate,
      })),
      meta: {
        total: result.total,
        page: page,
        page_size: page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }

  @Get('decrease')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取减持榜单' })
  async getDecrease(@Query() query: QueryHoldingChangeDto) {
    const { page, page_size, keyword, reportDate } = query;
    const result = await this.holdingService.getDecreaseList({
      page: page!,
      pageSize: page_size!,
      keyword,
      reportDate,
    });

    return formatResponse({
      list: result.list.map(item => ({
        id: item.id,
        investorId: item.investorId,
        investorName: item.investorName,
        investorAvatar: item.investorAvatar,
        stockCode: item.stockCode,
        stockName: item.stockName,
        industry: item.industry,
        mainRevenue: item.mainRevenue,
        revenueReportDate: item.revenueReportDate,
        currentPrice: item.currentPrice,
        currentShares: item.holdCount,
        previousShares: item.previousCount,
        totalMarketValue: item.marketValue,
        changeShares: item.changeCount,
        changePercent: item.changeRate,
        changeMarketValue: item.changeMarketValue,
        averageChangePrice: item.averageChangePrice ?? null,
        averageChangePriceDate: item.averageChangePriceDate ?? null,
        reportDate: item.reportDate,
      })),
      meta: {
        total: result.total,
        page: page,
        page_size: page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }

  @Get('new')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取新进榜单' })
  async getNew(@Query() query: QueryHoldingChangeDto) {
    const { page, page_size, keyword, reportDate, mode } = query;

    if (mode === HoldingNewViewMode.STOCK) {
      const result = await this.holdingService.getNewStockSummaryList({
        page: page!,
        pageSize: page_size!,
        keyword,
        reportDate,
      });

      return formatResponse({
        list: result.list.map(item => ({
          stockCode: item.stockCode,
          stockName: item.stockName,
          industry: item.industry,
          mainRevenue: item.mainRevenue,
          revenueReportDate: item.revenueReportDate,
          currentPrice: item.currentPrice,
          totalMarketValue: item.totalMarketValue,
          changeMarketValue: item.changeMarketValue,
          newInvestorCount: item.newInvestorCount,
          investorNames: item.investorNames,
          reportDate: item.reportDate,
        })),
        meta: {
          total: result.total,
          page: page,
          page_size: page_size,
          total_pages: Math.ceil(result.total / (page_size ?? 20)),
          mode: HoldingNewViewMode.STOCK,
        },
      });
    }

    const result = await this.holdingService.getNewList({
      page: page!,
      pageSize: page_size!,
      keyword,
      reportDate,
    });

    return formatResponse({
      list: result.list.map(item => ({
        id: item.id,
        investorId: item.investorId,
        investorName: item.investorName,
        investorAvatar: item.investorAvatar,
        stockCode: item.stockCode,
        stockName: item.stockName,
        industry: item.industry,
        mainRevenue: item.mainRevenue,
        revenueReportDate: item.revenueReportDate,
        currentPrice: item.currentPrice,
        currentShares: item.holdCount,
        previousShares: item.previousCount,
        totalMarketValue: item.marketValue,
        changeShares: item.changeCount,
        changePercent: item.changeRate,
        changeMarketValue: item.changeMarketValue,
        reportDate: item.reportDate,
      })),
      meta: {
        total: result.total,
        page: page,
        page_size: page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
        mode: HoldingNewViewMode.DETAIL,
      },
    });
  }

  @Get('common')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取共同持仓' })
  async getCommon(@Query() query: QueryCommonHoldingDto) {
    const { page, page_size, investorIds } = query;
    const result = await this.holdingService.getCommonHoldings({
      page: page!,
      pageSize: page_size!,
      investorIds,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page: page,
        page_size: page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }
}
