/**
 * Executive Controller - 高管交易路由控制层
 * 负责路由定义、参数验证、调用 Service、格式化响应
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExecutiveService } from './executive.service';
import { formatResponse } from '@/common/utils/response';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { VipGuard } from '@/common/guards/vip.guard';

@ApiTags('高管交易')
@Controller('executives')
export class ExecutiveController {
  constructor(private readonly executiveService: ExecutiveService) {}

  @Get('increase')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取高管增持列表' })
  async getIncrease(
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
    @Query('keyword') keyword?: string,
    @Query('reportDate') reportDate?: string,
  ) {
    const result = await this.executiveService.getIncreaseList({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword,
      reportDate,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page: Number(page),
        page_size: Number(pageSize),
        total_pages: Math.ceil(result.total / Number(pageSize)),
        report_date: result.reportDate,
      },
    });
  }

  @Get('stock/:code')
  @ApiOperation({ summary: '获取股票高管交易历史' })
  async getStockTrades(@Param('code') code: string) {
    const trades = await this.executiveService.getStockTrades(code);
    return formatResponse(trades);
  }

  @Get('members')
  @ApiOperation({ summary: '获取历届高管成员列表' })
  async getMembers(
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.executiveService.getMemberList({
      page: Number(page),
      pageSize: Number(pageSize),
      keyword,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(result.total / pageSize),
      },
    });
  }
}
