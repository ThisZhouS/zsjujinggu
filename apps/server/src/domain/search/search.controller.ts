/**
 * Search Controller - 全局搜索路由控制层
 * 负责路由定义、参数验证、调用 Service、格式化响应
 */

import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { formatResponse } from '@/common/utils/response';

@ApiTags('全局搜索')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '全局搜索（股票代码/牛散姓名/股票名称）' })
  async search(@Query() dto: SearchDto) {
    const results = await this.searchService.search(dto.keyword, dto.limit);
    return formatResponse(results);
  }
}
