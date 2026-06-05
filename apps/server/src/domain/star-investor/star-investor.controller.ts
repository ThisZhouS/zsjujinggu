import { BadRequestException, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '@/common/guards/admin.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';
import { StarInvestorService } from './star-investor.service';

@ApiTags('明星投资人持仓')
@Controller('star-investors')
export class StarInvestorController {
  constructor(private readonly starInvestorService: StarInvestorService) {}

  private parsePagination(pageInput: unknown, pageSizeInput: unknown) {
    const page = Number(pageInput ?? 1);
    const pageSize = Number(pageSizeInput ?? 20);

    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page 必须为大于等于 1 的整数');
    }

    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('page_size 必须为 1-100 的整数');
    }

    return { page, pageSize };
  }

  private parseHoldingType(value?: string) {
    if (!value || value === 'ALL') {
      return value;
    }

    if (!['INCREASE', 'DECREASE', 'KEEP', 'UNKNOWN'].includes(value)) {
      throw new BadRequestException('holdingType 必须为 ALL|INCREASE|DECREASE|KEEP|UNKNOWN');
    }

    return value;
  }

  @Get(':investor/summary')
  @ApiOperation({ summary: '获取明星投资人最新持仓摘要' })
  async getSummary(@Param('investor') investor: string) {
    const result = await this.starInvestorService.getSummary(investor);
    return formatResponse(result);
  }

  @Get(':investor/holdings')
  @ApiOperation({ summary: '获取明星投资人最新持仓明细' })
  async getHoldings(
    @Param('investor') investor: string,
    @Query('page') page = 1,
    @Query('page_size') pageSize = 20,
    @Query('holdingType') holdingType?: string,
    @Query('keyword') keyword?: string,
  ) {
    const pagination = this.parsePagination(page, pageSize);
    const parsedHoldingType = this.parseHoldingType(holdingType);
    const result = await this.starInvestorService.getHoldings(investor, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      holdingType: parsedHoldingType,
      keyword,
    });

    return formatResponse({
      investor: result.investor,
      list: result.list,
      meta: {
        total: result.total,
        page: pagination.page,
        page_size: pagination.pageSize,
        total_pages: Math.ceil(result.total / pagination.pageSize),
      },
    });
  }

  @Get(':investor/trades')
  @ApiOperation({ summary: '获取明星投资人最新报告期股票买卖记录' })
  async getTrades(
    @Param('investor') investor: string,
    @Query('page') page = 1,
    @Query('page_size') pageSize = 20,
    @Query('holdingType') holdingType?: string,
    @Query('keyword') keyword?: string,
  ) {
    const pagination = this.parsePagination(page, pageSize);
    const parsedHoldingType = this.parseHoldingType(holdingType);
    const result = await this.starInvestorService.getTrades(investor, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      holdingType: parsedHoldingType,
      keyword,
    });

    return formatResponse({
      investor: result.investor,
      list: result.list,
      meta: {
        total: result.total,
        page: pagination.page,
        page_size: pagination.pageSize,
        total_pages: Math.ceil(result.total / pagination.pageSize),
      },
    });
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '手动同步 TradingKey 明星投资人持仓' })
  async syncAll() {
    const count = await this.starInvestorService.syncAll();
    return formatResponse({ count });
  }
}
