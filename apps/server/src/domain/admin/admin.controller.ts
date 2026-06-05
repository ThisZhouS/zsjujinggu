/**
 * Admin Controller - 管理员路由控制层
 * 负责同步管理、用户管理、订单管理
 */

import {
  BadRequestException,
  Controller,
  Body,
  Delete,
  Get,
  Post,
  Put,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { formatResponse } from '@/common/utils/response';
import { ApiPlan, MemberPlan, OrderStatus, UserRole } from '@prisma/client';

@ApiTags('管理后台')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取控制台概览数据' })
  async getDashboardSummary() {
    const result = await this.adminService.getDashboardSummary();
    return formatResponse(result);
  }

  @Get('sync/logs')
  @ApiOperation({ summary: '获取同步日志列表' })
  async getSyncLogs(
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
    @Query('taskName') taskName?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.adminService.getSyncLogs({
      page: Number(page),
      pageSize: Number(pageSize),
      taskName,
      status,
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

  @Get('orders')
  @ApiOperation({ summary: '获取订单列表（管理员）' })
  async getOrders(
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
    @Query('status') status?: OrderStatus,
    @Query('plan') plan?: MemberPlan,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.adminService.getOrders({
      page: Number(page),
      pageSize: Number(pageSize),
      status,
      plan,
      keyword,
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

  @Get('users')
  @ApiOperation({ summary: '获取用户列表（管理员）' })
  async getUsers(
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
    @Query('role') role?: UserRole,
    @Query('vipStatus') vipStatus?: 'ACTIVE' | 'EXPIRED' | 'NONE',
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.adminService.getUsers({
      page: Number(page),
      pageSize: Number(pageSize),
      role,
      vipStatus,
      keyword,
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

  @Put('users/:id/upload-permission')
  @ApiOperation({ summary: '设置用户文章上传权限（管理员）' })
  async updateArticleUploadPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body('canUploadArticles') canUploadArticles: boolean,
  ) {
    if (typeof canUploadArticles !== 'boolean') {
      throw new BadRequestException('canUploadArticles 必须为布尔值');
    }

    const result = await this.adminService.updateArticleUploadPermission(id, canUploadArticles);
    return formatResponse(result);
  }

  @Put('users/:id/video-permission')
  @ApiOperation({ summary: '设置用户视频访问权限（管理员）' })
  async updateVideoAccessPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body('canAccessVideos') canAccessVideos: boolean,
  ) {
    if (typeof canAccessVideos !== 'boolean') {
      throw new BadRequestException('canAccessVideos 必须为布尔值');
    }

    const result = await this.adminService.updateVideoAccessPermission(id, canAccessVideos);
    return formatResponse(result);
  }

  @Get('api-keys')
  @ApiOperation({ summary: '获取 API Key 列表（管理员）' })
  async getApiKeys(
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
    @Query('plan') plan?: ApiPlan,
    @Query('isActive') isActive?: string,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.adminService.getApiKeys({
      page: Number(page),
      pageSize: Number(pageSize),
      plan,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      keyword,
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

  @Post('orders/:id/refund')
  @ApiOperation({ summary: '退款订单（管理员）' })
  async refundOrder(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.refundOrder(id);
    return formatResponse({ success: true });
  }

  @Post('api-keys')
  @ApiOperation({ summary: '创建 API Key（管理员）' })
  async createApiKey(
    @Body('userId') userId: number,
    @Body('plan') plan?: ApiPlan,
  ) {
    const result = await this.adminService.createApiKey(Number(userId), plan);
    return formatResponse(result, 'API Key 创建成功，请立即保存明文密钥');
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: '删除 API Key（管理员）' })
  async deleteApiKey(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteApiKey(id);
    return formatResponse({ success: true });
  }

  @Put('api-keys/:id/toggle')
  @ApiOperation({ summary: '停用/启用 API Key（管理员）' })
  async toggleApiKey(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    await this.adminService.toggleApiKey(id, isActive);
    return formatResponse({ success: true });
  }

  @Post('sync/stock-list')
  @ApiOperation({ summary: '手动触发股票列表同步' })
  async triggerStockListSync() {
    const result = await this.adminService.triggerStockListSync();
    return formatResponse(result);
  }

  @Post('sync/realtime-quotes')
  @ApiOperation({ summary: '手动触发实时行情同步' })
  async triggerRealtimeQuotesSync() {
    const result = await this.adminService.triggerRealtimeQuotesSync();
    return formatResponse(result);
  }

  @Post('sync/limit-up')
  @ApiOperation({ summary: '手动触发涨停板同步' })
  async triggerLimitUpSync() {
    const result = await this.adminService.triggerLimitUpSync();
    return formatResponse(result);
  }

  @Post('sync/kline')
  @ApiOperation({ summary: '手动触发 K 线同步' })
  async triggerKlineSync() {
    const result = await this.adminService.triggerKlineSync();
    return formatResponse(result);
  }

  @Post('sync/gainers')
  @ApiOperation({ summary: '手动触发历史涨幅预计算' })
  async triggerGainersRecalc() {
    const result = await this.adminService.triggerGainersRecalc();
    return formatResponse(result);
  }

  @Post('sync/business-data')
  @ApiOperation({ summary: '手动触发业务数据同步' })
  async triggerBusinessDataSync() {
    const result = await this.adminService.triggerBusinessDataSync();
    return formatResponse(result);
  }

  @Post('sync/star-investor-holdings')
  @ApiOperation({ summary: '手动触发 TradingKey 明星投资人持仓同步' })
  async triggerStarInvestorHoldingsSync() {
    const result = await this.adminService.triggerStarInvestorHoldingsSync();
    return formatResponse(result);
  }
}
