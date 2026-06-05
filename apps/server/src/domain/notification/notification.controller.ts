/**
 * NotificationController - 通知路由控制层
 */

import {
  Controller,
  Get,
  Put,
  Delete,
  UseGuards,
  Req,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';
import { QueryNotificationDto } from './dto/notification.dto';

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
  };
}

@ApiTags('通知')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  async getNotifications(
    @Req() req: JwtRequest,
    @Query() query: QueryNotificationDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const result = await this.notificationService.getNotifications(
      userId,
      query.page,
      query.page_size,
    );
    const unreadCount = await this.notificationService.getUnreadCount(userId);

    return formatResponse({
      list: result.list,
      unreadCount,
      meta: {
        total: result.total,
        page: query.page,
        page_size: query.page_size,
        total_pages: Math.ceil(result.total / query.page_size),
      },
    });
  }

  @Put('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  async markAllAsRead(@Req() req: JwtRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.notificationService.markAllAsRead(userId);
    return formatResponse({ success: true });
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记单个通知为已读' })
  async markAsRead(
    @Req() req: JwtRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.notificationService.markAsRead(userId, Number(id));
    return formatResponse({ success: true });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  async deleteNotification(
    @Req() req: JwtRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    await this.notificationService.deleteNotification(userId, Number(id));
    return formatResponse({ success: true });
  }
}
