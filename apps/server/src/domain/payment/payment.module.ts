/**
 * PaymentModule - 支付模块
 */

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrderModule } from '../order/order.module';
import { AdminGuard } from '@/common/guards/admin.guard';

@Module({
  imports: [OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, AdminGuard],
  exports: [PaymentService],
})
export class PaymentModule {}
