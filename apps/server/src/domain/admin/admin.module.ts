/**
 * Admin Module - 管理员模块
 */

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SyncModule } from '@/infrastructure/scheduler/sync.module';
import { OrderModule } from '@/domain/order/order.module';
import { ApiKeyModule } from '@/domain/api-key/api-key.module';

@Module({
  imports: [SyncModule, OrderModule, ApiKeyModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
