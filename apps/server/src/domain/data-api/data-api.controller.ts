/**
 * DataApi Controller - 对外数据 API 路由控制层
 * 为第三方开发者提供数据接口（需 API Key 认证）
 */

import {
  Controller,
  Get,
  Param,
  Headers,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { DataApiService } from './data-api.service';
import { formatResponse } from '@/common/utils/response';
import { ApiUsageInterceptor } from '@/common/interceptors/api-usage.interceptor';

@ApiTags('开放 API')
@Controller('open')
@UseInterceptors(ApiUsageInterceptor)
export class DataApiController {
  constructor(private readonly dataApiService: DataApiService) {}

  @Get('stocks/:code')
  @ApiOperation({ summary: '获取股票数据（需 API Key）' })
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'API Key' })
  async getStockData(
    @Param('code') code: string,
    @Headers('x-api-key') apiKey: string,
    @Request() req: any,
  ) {
    const validated = await this.dataApiService.validateApiKey(apiKey);
    if (!validated) {
      return formatResponse(null, '无效的 API Key 或配额已用尽', 403);
    }

    req.apiKey = validated;
    const stock = await this.dataApiService.getStockData(code);
    return formatResponse(stock);
  }

  @Get('investors/:id')
  @ApiOperation({ summary: '获取牛散数据（需 API Key）' })
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'API Key' })
  async getInvestorData(
    @Param('id') idStr: string,
    @Headers('x-api-key') apiKey: string,
    @Request() req: any,
  ) {
    const id = parseInt(idStr, 10);
    const validated = await this.dataApiService.validateApiKey(apiKey);
    if (!validated) {
      return formatResponse(null, '无效的 API Key 或配额已用尽', 403);
    }

    req.apiKey = validated;
    const investor = await this.dataApiService.getInvestorData(id);
    return formatResponse(investor);
  }
}
