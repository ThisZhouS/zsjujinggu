/**
 * Stock Module - 股票模块
 * 负责依赖注入、模块导出
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { VipGuard } from '@/common/guards/vip.guard';
import { StockRealTimeDataClient } from '@/infrastructure/mairui-api/stock-realtime-data.client';
import { DividendModule } from '@/domain/dividend/dividend.module';

@Module({
  imports: [JwtModule, DividendModule],
  controllers: [StockController],
  providers: [StockService, StockRepository, StockRealTimeDataClient, VipGuard],
  exports: [StockService, StockRepository],
})
export class StockModule {}
