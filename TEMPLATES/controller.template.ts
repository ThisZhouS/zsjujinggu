/**
 * Controller 样板
 * 职责：路由定义、请求验证、调用Service、格式化响应
 * 禁止：数据库操作、业务逻辑
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { VipGuard } from '@/common/guards/vip.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/shared/types';
import { XxxService } from './xxx.service';

@ApiTags('XXX模块')
@Controller('xxx')
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  /**
   * 获取列表（公开）
   */
  @Get()
  @ApiOperation({ summary: '获取XXX列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，从1开始', example: 1 })
  @ApiQuery({ name: 'page_size', required: false, description: '每页数量，默认20，最大100', example: 20 })
  @ApiResponse({ status: 200, description: '成功' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '20',
    @Query('keyword') keyword?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const size = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

    const result = await this.xxxService.findAll(pageNum, size, keyword);

    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  /**
   * 获取详情（公开）
   */
  @Get(':id')
  @ApiOperation({ summary: '获取XXX详情' })
  @ApiParam({ name: 'id', description: 'ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '不存在' })
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    }

    const result = await this.xxxService.findOne(numericId);

    if (!result) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  /**
   * 创建（需要登录）
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建XXX' })
  @ApiResponse({ status: 200, description: '成功' })
  async create(@Body() createDto: CreateXxxDto, @Request() req: any) {
    // R21: IDOR保护 - 从JWT获取当前用户ID
    const userId = req.user.id;

    const result = await this.xxxService.create(userId, createDto);

    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  /**
   * 更新（需要登录 + 权限验证）
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新XXX' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateXxxDto,
    @Request() req: any,
  ) {
    const numericId = parseInt(id, 10);
    const userId = req.user.id;

    const result = await this.xxxService.update(numericId, userId, updateDto);

    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  /**
   * 删除（需要登录 + 权限验证）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除XXX' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const numericId = parseInt(id, 10);
    const userId = req.user.id;

    await this.xxxService.delete(numericId, userId);

    return {
      code: 200,
      message: 'success',
      data: null,
    };
  }

  /**
   * VIP功能（需要VIP会员）
   * R12: VIP拦截返回HTTP 200 + code:403
   */
  @Get('vip-feature')
  @UseGuards(JwtAuthGuard, VipGuard)
  @ApiOperation({ summary: 'VIP功能' })
  async getVipFeature(@Request() req: any) {
    // VipGuard会自动检查用户VIP状态，非VIP会拦截并返回统一格式

    const result = await this.xxxService.getVipData(req.user.id);

    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  /**
   * 管理员功能（需要管理员权限）
   * R20: /admin/*路由需要 JwtAuthGuard + AdminGuard
   */
  @Post('admin/xxx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '管理员操作' })
  async adminAction(
    @Body() adminDto: AdminXxxDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;

    // R23: 管理员写操作需要记录审计日志
    const result = await this.xxxService.adminAction(adminId, adminDto);

    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }
}
