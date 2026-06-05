/**
 * OrderController - 订单路由控制层
 */

import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { formatResponse } from '@/common/utils/response';

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
  };
}

@ApiTags('订单')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: '获取订单列表' })
  async getOrders(
    @Req() req: JwtRequest,
    @Query('page') page: number = 1,
    @Query('page_size') pageSize: number = 20,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const result = await this.orderService.getUserOrders(
      userId,
      Number(page),
      Number(pageSize),
    );

    return formatResponse({
      list: result.list.map((order) => ({
        ...order,
        productName:
          order.plan === 'VIP_MONTHLY'
            ? '历史月度权益'
            : order.plan === 'VIP_YEARLY'
              ? '历史年度权益'
              : '历史长期权益',
      })),
      meta: {
        total: result.total,
        page: Number(page),
        page_size: Number(pageSize),
        total_pages: Math.ceil(result.total / Number(pageSize)),
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  async getOrderDetail(
    @Req() req: JwtRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const order = await this.orderService.getOrderDetail(userId, Number(id));
    return formatResponse(order);
  }

  @Get('status/:orderNo')
  @ApiOperation({ summary: '根据订单号获取订单状态' })
  async getOrderByNo(@Param('orderNo') orderNo: string) {
    const order = await this.orderService.getOrderByNo(orderNo);
    return formatResponse(order);
  }

  @Post()
  @ApiOperation({ summary: '创建订单' })
  async createOrder(@Req() req: JwtRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const order = await this.orderService.createOrder();
    return formatResponse(order);
  }
}
