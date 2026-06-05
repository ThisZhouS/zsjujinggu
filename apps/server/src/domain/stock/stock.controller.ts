/**
 * Stock Controller - 股票路由控制层
 * 负责路由定义、参数验证、调用 Service、格式化响应
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { QueryStockDto } from './dto/query-stock.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { VipGuard } from '@/common/guards/vip.guard';
import { formatResponse } from '@/common/utils/response';

@ApiTags('股票管理')
@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: '获取股票列表' })
  async getList(@Query() query: QueryStockDto) {
    const { page, page_size, keyword, market, sort } = query;
    const result = await this.stockService.getList({
      page: page!,
      pageSize: page_size!,
      keyword,
      market: market as any,
      sortBy: sort,
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

  @Get('market/overview')
  @ApiOperation({ summary: '获取市场概览' })
  async getMarketOverview() {
    const overview = await this.stockService.getMarketOverview();
    return formatResponse(overview);
  }

  @Get('buffett-holdings')
  @ApiOperation({ summary: '获取巴菲特持仓列表' })
  async getBuffettHoldings(@Query('page') page = 1, @Query('page_size') pageSize = 20) {
    const result = await this.stockService.getBuffettHoldings({
      page: Number(page),
      pageSize: Number(pageSize),
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

  @Get('arkk-holdings')
  @ApiOperation({ summary: '获取木头姐 (ARKK) 持仓列表' })
  async getArkkHoldings(@Query('page') page = 1, @Query('page_size') pageSize = 20) {
    const result = await this.stockService.getArkkHoldings({
      page: Number(page),
      pageSize: Number(pageSize),
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

  @Get('top-increase')
  @UseGuards(OptionalJwtAuthGuard, VipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取十大股东增持列表' })
  async getTopIncrease(
    @Query('page') page = 1,
    @Query('page_size') pageSize = 20,
    @Query('keyword') keyword?: string,
    @Query('reportDate') reportDate?: string,
  ) {
    const result = await this.stockService.getTopIncrease({
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

  @Get(':code/quote')
  @ApiOperation({ summary: '获取股票最新行情摘要' })
  async getQuote(@Param('code') code: string) {
    const quote = await this.stockService.getQuote(code);
    return formatResponse(quote);
  }

  @Get(':code/kline')
  @ApiOperation({ summary: '获取股票日线 K 线' })
  async getKline(
    @Param('code') code: string,
    @Query('limit') limit = 120,
  ) {
    const result = await this.stockService.getKline(code, Number(limit));
    return formatResponse(result);
  }

  @Get(':code/performance')
  @ApiOperation({ summary: '获取股票历史涨幅摘要' })
  async getPerformance(@Param('code') code: string) {
    const result = await this.stockService.getPerformanceHistory(code);
    return formatResponse(result);
  }

  @Get(':code/limit-history')
  @ApiOperation({ summary: '获取股票历史涨跌停记录' })
  async getLimitHistory(
    @Param('code') code: string,
    @Query('limit') limit = 30,
  ) {
    const result = await this.stockService.getLimitHistory(code, Number(limit));
    return formatResponse(result);
  }

  @Get(':code/realtime')
  @ApiOperation({ summary: '获取股票实时数据接口预留信息' })
  async getRealtime(@Param('code') code: string) {
    const result = await this.stockService.getRealtimePayload(code);
    return formatResponse(result);
  }

  @Get(':code/holders')
  @ApiOperation({ summary: '获取股票关联牛散持仓列表' })
  async getTrackedHolders(@Param('code') code: string) {
    const result = await this.stockService.getTrackedHolders(code);
    return formatResponse(result);
  }

  @Get(':code')
  @ApiOperation({ summary: '获取股票详情' })
  async getDetail(@Param('code') code: string) {
    const stock = await this.stockService.getDetail(code);
    return formatResponse(stock);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建股票（管理员）' })
  async create(@Body() dto: any) {
    const stock = await this.stockService.create(dto);
    return formatResponse(stock);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新股票（管理员）' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    const stock = await this.stockService.update(id, dto);
    return formatResponse(stock);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除股票（管理员）' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.stockService.delete(id);
    return formatResponse(null);
  }
}
