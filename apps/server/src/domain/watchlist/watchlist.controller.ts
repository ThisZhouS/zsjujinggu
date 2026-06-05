/**
 * WatchlistController - 自选股路由控制层
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';
import { AddWatchlistDto, QueryWatchlistDto, ReorderWatchlistDto } from './dto/watchlist.dto';

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
  };
}

@ApiTags('自选股')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: '获取自选股列表' })
  async getWatchlist(
    @Req() req: JwtRequest,
    @Query() query: QueryWatchlistDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const currentPage = query.page;
    const currentPageSize = query.page_size;
    const result = await this.watchlistService.getWatchlist(userId, currentPage, currentPageSize);

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
  @ApiOperation({ summary: '添加自选股' })
  async addToWatchlist(
    @Req() req: JwtRequest,
    @Body() dto: AddWatchlistDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const result = await this.watchlistService.addToWatchlist(userId, dto.stockCode);
    return formatResponse(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除自选股' })
  async removeFromWatchlist(
    @Req() req: JwtRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.watchlistService.removeFromWatchlist(userId, Number(id));
    return formatResponse({ success: true });
  }

  @Post('reorder')
  @ApiOperation({ summary: '更新自选股排序' })
  async updateSortOrder(
    @Req() req: JwtRequest,
    @Body() dto: ReorderWatchlistDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.watchlistService.updateSortOrder(userId, dto.stockCodes);
    return formatResponse({ success: true });
  }
}
