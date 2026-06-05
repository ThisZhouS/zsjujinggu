/**
 * TopGainer Controller - 涨幅榜路由控制层
 * 负责路由定义、参数验证、调用 Service、格式化响应
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TopGainerService } from './top-gainer.service';
import { QueryTopGainersDto } from './dto/top-gainer.dto';
import { formatResponse } from '@/common/utils/response';

@ApiTags('涨幅榜')
@Controller('top-gainers')
export class TopGainerController {
  constructor(private readonly topGainerService: TopGainerService) {}

  @Get()
  @ApiOperation({ summary: '获取涨幅榜列表' })
  async getList(@Query() query: QueryTopGainersDto) {
    const { page, page_size, period, keyword } = query;
    const result = await this.topGainerService.getList({
      page: page!,
      pageSize: page_size!,
      period,
      keyword,
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

  @Get('limitup')
  @ApiOperation({ summary: '获取涨停板数据' })
  async getLimitUp() {
    const data = await this.topGainerService.getLimitUp();
    return formatResponse(data);
  }

  @Get('limit-up-count')
  @ApiOperation({ summary: '获取涨停次数统计' })
  async getLimitUpCount(@Query('period') period?: string) {
    const data = await this.topGainerService.getLimitUpCountStats(period);
    return formatResponse({
      list: data,
      total: data.length,
    });
  }

  @Get('limit-down-count')
  @ApiOperation({ summary: '获取跌停次数统计' })
  async getLimitDownCount(@Query('period') period?: string) {
    const data = await this.topGainerService.getLimitDownCountStats(period);
    return formatResponse({
      list: data,
      total: data.length,
    });
  }
}
