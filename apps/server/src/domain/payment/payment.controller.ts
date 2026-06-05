/**
 * PaymentController - 支付路由控制层
 */

import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'node:crypto';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { formatResponse } from '@/common/utils/response';
import { MemberPlan, PaymentType } from '@prisma/client';
import { PaymentCallbackDto } from './payment.dto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { diskStorage } = require('multer');

const paymentUploadDir = join(process.cwd(), 'uploads', 'payments');

function ensurePaymentUploadDir() {
  if (!existsSync(paymentUploadDir)) {
    mkdirSync(paymentUploadDir, { recursive: true });
  }
}

interface JwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
  };
}

@ApiTags('支付')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  private parsePaymentType(paymentType: string): PaymentType {
    const normalized = String(paymentType ?? '').trim().toUpperCase();
    if (normalized !== PaymentType.WECHAT && normalized !== PaymentType.ALIPAY) {
      throw new BadRequestException('不支持的支付方式');
    }

    return normalized as PaymentType;
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建支付订单' })
  async createPayment(
    @Req() req: JwtRequest,
    @Body('plan') plan: MemberPlan,
    @Body('paymentType') paymentType: PaymentType,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('未登录');
    }

    const order = await this.paymentService.createPayment(userId, plan, paymentType);
    return formatResponse(order);
  }

  @Get('status/:orderNo')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取支付状态' })
  async getPaymentStatus(@Param('orderNo') orderNo: string) {
    const result = await this.paymentService.getPaymentStatus(orderNo);
    return formatResponse(result);
  }

  @Get('settings')
  @ApiOperation({ summary: '获取启用中的收款配置' })
  async getActivePaymentSettings() {
    const result = await this.paymentService.getActivePaymentSettings();
    return formatResponse(result);
  }

  @Get('settings/:paymentType')
  @ApiOperation({ summary: '按支付方式获取启用中的收款配置' })
  async getActivePaymentSetting(@Param('paymentType') paymentType: string) {
    const result = await this.paymentService.getActivePaymentSetting(
      this.parsePaymentType(paymentType),
    );
    return formatResponse(result);
  }

  @Get('admin/settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取收款配置（管理员）' })
  async getAdminPaymentSettings() {
    const result = await this.paymentService.getAdminPaymentSettings();
    return formatResponse(result);
  }

  @Put('admin/settings/:paymentType')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新收款配置（管理员）' })
  async updatePaymentSetting(
    @Param('paymentType') paymentType: string,
    @Body()
    dto: {
      qrCodeUrl?: string | null;
      accountName?: string | null;
      instructions?: string | null;
      isActive?: boolean;
    },
  ) {
    const result = await this.paymentService.upsertPaymentSetting(
      this.parsePaymentType(paymentType),
      dto,
    );
    return formatResponse(result);
  }

  @Post('admin/qrcode/upload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensurePaymentUploadDir();
          callback(null, paymentUploadDir);
        },
        filename: (_req, file, callback) => {
          const extension = extname(file.originalname).toLowerCase() || '.png';
          const safeExtension = extension.length <= 10 ? extension : '.png';
          callback(
            null,
            `qrcode-${Date.now()}-${randomUUID()}${safeExtension}`,
          );
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('仅支持上传图片文件'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: '上传收款码图片（管理员）' })
  async uploadPaymentQrCode(@UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('请上传收款码图片');
    }

    return formatResponse({
      url: `/uploads/payments/${file.filename}`,
      filename: file.filename,
    });
  }

  @Post('callback')
  @ApiOperation({ summary: '支付回调（webhook）' })
  async handlePaymentCallback(@Body() dto: PaymentCallbackDto) {
    await this.paymentService.handlePaymentCallback(dto);
    return formatResponse({ success: true });
  }
}
