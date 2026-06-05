/**
 * Investor Controller - 牛散路由控制层
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
import { InvestorService } from './investor.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { QueryInvestorDto } from './dto/query-investor.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { formatResponse } from '@/common/utils/response';

@ApiTags('牛散管理')
@Controller('investors')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  @Get()
  @ApiOperation({ summary: '获取牛散列表' })
  async getList(@Query() query: QueryInvestorDto) {
    const { page, page_size, keyword, sort, order, category } = query;
    const result = await this.investorService.getList({
      page: page!,
      pageSize: page_size!,
      keyword,
      sortBy: sort,
      order,
      category,
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

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取牛散列表（管理员，含隐藏项）' })
  async getAdminList(@Query() query: QueryInvestorDto) {
    const { page, page_size, keyword, sort, order, category } = query;
    const result = await this.investorService.getList({
      page: page!,
      pageSize: page_size!,
      keyword,
      sortBy: sort,
      order,
      category,
      includeUntracked: true,
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

  @Get('same-surname-groups')
  @ApiOperation({ summary: '获取同姓牛散分组' })
  async getSameSurnameGroups(@Query() query: QueryInvestorDto) {
    const { page, page_size, keyword, sort, order } = query;
    const result = await this.investorService.getSameSurnameGroups({
      page: page!,
      pageSize: page_size!,
      keyword,
      sortBy: sort,
      order,
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

  @Get(':id/holdings-history')
  @ApiOperation({ summary: '获取牛散持股历史记录（含成本/收益）' })
  async getHoldingsHistory(@Param('id', ParseIntPipe) id: number) {
    const history = await this.investorService.getHoldingsHistory(id);
    return formatResponse(history);
  }

  @Get(':id/top-flow-tracking')
  @ApiOperation({ summary: '获取牛散进入十大流通股东后的连续期次追踪记录' })
  async getTopFlowTracking(
    @Param('id', ParseIntPipe) id: number,
    @Query('stockCode') stockCode?: string,
  ) {
    const tracking = await this.investorService.getTopFlowTracking(id, stockCode);
    return formatResponse(tracking);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取牛散详情' })
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    const detail = await this.investorService.getDetail(id);
    return formatResponse(detail);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建牛散（管理员）' })
  async create(@Body() dto: CreateInvestorDto) {
    const investor = await this.investorService.create(dto);
    return formatResponse(investor);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新牛散（管理员）' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvestorDto,
  ) {
    const investor = await this.investorService.update(id, dto);
    return formatResponse(investor);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除牛散（管理员）' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.investorService.delete(id);
    return formatResponse(null);
  }
}
