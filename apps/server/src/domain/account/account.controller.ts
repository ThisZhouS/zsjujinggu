/**
 * AccountController - 用户账户路由控制层
 */

import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';
import { UpdateProfileDto } from './dto/account.dto';

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
    canUploadArticles?: boolean;
    canAccessVideos?: boolean;
  };
}

@ApiTags('账户')
@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取账户信息' })
  async getProfile(@Req() req: JwtRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const profile = await this.accountService.getProfile(userId);
    return formatResponse(profile);
  }

  @Put('profile')
  @ApiOperation({ summary: '更新账户信息' })
  async updateProfile(
    @Req() req: JwtRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const profile = await this.accountService.updateProfile(userId, dto);
    return formatResponse(profile);
  }
}
