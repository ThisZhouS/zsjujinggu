/**
 * FavoriteController - 用户收藏路由控制层
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
  };
}

@ApiTags('收藏')
@Controller('account/favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @ApiOperation({ summary: '获取收藏列表' })
  async getFavorites(@Req() req: JwtRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const favorites = await this.favoriteService.getFavorites(userId);
    return formatResponse(favorites);
  }

  @Post(':investorId')
  @ApiOperation({ summary: '收藏牛散' })
  async addToFavorites(
    @Req() req: JwtRequest,
    @Param('investorId', ParseIntPipe) investorId: number,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const result = await this.favoriteService.addToFavorites(userId, investorId);
    return formatResponse(result);
  }

  @Delete(':investorId')
  @ApiOperation({ summary: '取消收藏' })
  async removeFromFavorites(
    @Req() req: JwtRequest,
    @Param('investorId', ParseIntPipe) investorId: number,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.favoriteService.removeFromFavorites(userId, investorId);
    return formatResponse({ success: true });
  }
}
