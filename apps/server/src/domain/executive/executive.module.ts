/**
 * Executive Module - 高管交易模块
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExecutiveController } from './executive.controller';
import { ExecutiveService } from './executive.service';
import { ExecutiveRepository } from './executive.repository';
import { VipGuard } from '@/common/guards/vip.guard';
import { StockModule } from '@/domain/stock/stock.module';

@Module({
  imports: [JwtModule, StockModule],
  controllers: [ExecutiveController],
  providers: [ExecutiveService, ExecutiveRepository, VipGuard],
  exports: [ExecutiveService, ExecutiveRepository],
})
export class ExecutiveModule {}
