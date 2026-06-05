/**
 * Holding Module - 持仓模块
 * 负责依赖注入、模块导出
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HoldingController } from './holding.controller';
import { HoldingService } from './holding.service';
import { HoldingRepository } from './holding.repository';
import { StockRepository } from '@/domain/stock/stock.repository';
import { VipGuard } from '@/common/guards/vip.guard';

@Module({
  imports: [JwtModule],
  controllers: [HoldingController],
  providers: [HoldingService, HoldingRepository, StockRepository, VipGuard],
  exports: [HoldingService, HoldingRepository],
})
export class HoldingModule {}
