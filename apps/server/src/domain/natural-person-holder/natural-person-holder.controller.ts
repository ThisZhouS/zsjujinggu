/**
 * Natural Person Holder Controller - 自然人股东持仓路由控制层
 * 提供持仓历史、分红记录的查询接口
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NaturalPersonHolderService } from './natural-person-holder.service';
import { QueryShareholderListDto } from './dto/query-natural-person-holder.dto';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { VipGuard } from '@/common/guards/vip.guard';
import { formatResponse } from '@/common/utils/response';
import { GainerPeriod } from '@/domain/top-gainer/dto/top-gainer.dto';
import { InvestorCategory } from '@/common/utils/investor-name-filter';

@ApiTags('牛散持仓分析')
@Controller('natural-person-holders')
export class NaturalPersonHolderController {
  constructor(private readonly naturalPersonHolderService: NaturalPersonHolderService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取自然人股东列表' })
  async getShareholderList(@Query('page') page = 1, @Query('page_size') pageSize = 20, @Query('keyword') keyword?: string, @Query('minMarketValue') minMarketValue?: number) {
    const names = await this.naturalPersonHolderService.getShareholderList({ keyword, minMarketValue });

    return formatResponse({
      list: names,
      total: names.length,
    });
  }

  @Get('hidden-in-gainers')
  @ApiOperation({ summary: '获取近期强势股中隐藏的牛散' })
  async getHiddenShareholdersInGainers(
    @Query('period') period: GainerPeriod = GainerPeriod.ONE_MONTH,
    @Query('limit') limit = 12,
    @Query('stock_limit') stockLimit = 40,
    @Query('category') category: InvestorCategory = 'personal',
  ) {
    const result = await this.naturalPersonHolderService.getHiddenShareholdersInTopGainers({
      period,
      limit: Number(limit),
      stockLimit: Number(stockLimit),
      category,
    });

    return formatResponse(result);
  }

  @Get('hidden-in-limit-up')
  @ApiOperation({ summary: '获取近期涨停股中隐藏的牛散' })
  async getHiddenShareholdersInLimitUp(
    @Query('period') period = GainerPeriod.ONE_MONTH,
    @Query('limit') limit = 12,
    @Query('stock_limit') stockLimit = 40,
    @Query('category') category: InvestorCategory = 'personal',
  ) {
    const result = await this.naturalPersonHolderService.getHiddenShareholdersInLimitUp({
      period,
      limit: Number(limit),
      stockLimit: Number(stockLimit),
      category,
    });

    return formatResponse(result);
  }

  @Get(':name/holdings')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取牛散持仓历史' })
  async getHoldings(@Param('name') name: string) {
    const result = await this.naturalPersonHolderService.getHoldingsHistory(name);

    return formatResponse(result);
  }

  @Get(':name/dividends')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取牛散分红记录' })
  async getDividends(@Param('name') name: string) {
    const result = await this.naturalPersonHolderService.getDividendRecords(name);

    return formatResponse(result);
  }
}
