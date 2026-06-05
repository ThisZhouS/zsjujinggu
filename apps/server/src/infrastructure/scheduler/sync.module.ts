/**
 * SyncModule - 同步任务模块
 * 注册所有定时同步任务
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { ExternalApiModule } from '@/infrastructure/external-api/external-api.module';
import { DataSyncModule } from '@/domain/data-sync/data-sync.module';
import { StarInvestorModule } from '@/domain/star-investor/star-investor.module';
import { StockSyncTask } from './stock-sync.task';
import { KlineSyncTask } from './kline-sync.task';
import { BusinessDataSyncTask } from './business-data-sync.task';
import { DataSyncTask } from './data-sync.task';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, ExternalApiModule, DataSyncModule, StarInvestorModule],
  providers: [StockSyncTask, KlineSyncTask, BusinessDataSyncTask, DataSyncTask],
  exports: [StockSyncTask, KlineSyncTask, BusinessDataSyncTask, DataSyncTask],
})
export class SyncModule {}
