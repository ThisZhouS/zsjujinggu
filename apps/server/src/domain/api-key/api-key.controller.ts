/**
 * ApiKeyController - API Key 路由控制层
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
  };
}

@ApiTags('API Key')
@Controller('account/api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @ApiOperation({ summary: '获取 API Key 列表' })
  async getApiKeys(
    @Req() req: JwtRequest,
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '20',
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const currentPage = Number(page) || 1;
    const currentPageSize = Number(pageSize) || 20;
    const result = await this.apiKeyService.getUserApiKeys(userId, currentPage, currentPageSize);

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page: currentPage,
        page_size: currentPageSize,
        total_pages: Math.ceil(result.total / currentPageSize),
      },
    });
  }

  @Post()
  @ApiOperation({ summary: '创建新的 API Key' })
  async createApiKey(@Req() req: JwtRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const result = await this.apiKeyService.generateApiKey(userId, 'FREE');
    return formatResponse(result, 'API Key 创建成功，请妥善保管（只会显示一次）');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 API Key' })
  async deleteApiKey(
    @Req() req: JwtRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.apiKeyService.deleteApiKey(userId, Number(id));
    return formatResponse({ success: true });
  }

  @Put(':id/toggle')
  @ApiOperation({ summary: '停用/启用 API Key' })
  async toggleApiKey(
    @Req() req: JwtRequest,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.apiKeyService.toggleApiKey(userId, Number(id), isActive);
    return formatResponse({ success: true });
  }
}
