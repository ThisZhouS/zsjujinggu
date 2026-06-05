/**
 * IndividualShareholder Controller - 个人股东路由控制层
 */

import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IndividualShareholderService } from './individual-shareholder.service';
import { formatResponse } from '@/common/utils/response';
import { QueryIndividualShareholderDto } from './dto/query-individual-shareholder.dto';
import type { InvestorCategory } from '@/common/utils/investor-name-filter';

@ApiTags('个人股东')
@Controller('individual-shareholders')
export class IndividualShareholderController {
  constructor(private readonly individualShareholderService: IndividualShareholderService) {}

  @Get()
  @ApiOperation({ summary: '获取个人股东持仓排行' })
  async getRanking(@Query() query: QueryIndividualShareholderDto) {
    const { page, page_size, category, keyword } = query;
    const result = await this.individualShareholderService.getRanking({
      page: page!,
      pageSize: page_size!,
      category: category!,
      keyword,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page,
        page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }

  @Get('stock/:code')
  @ApiOperation({ summary: '获取股票个人股东列表' })
  async getStockShareholders(
    @Param('code') code: string,
    @Query('category') category: InvestorCategory = 'personal',
  ) {
    const shareholders = await this.individualShareholderService.getStockShareholders(
      code,
      category,
    );
    return formatResponse(shareholders);
  }
}
