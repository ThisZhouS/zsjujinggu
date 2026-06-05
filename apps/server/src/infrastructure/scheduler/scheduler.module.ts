/**
 * SchedulerModule - 定时任务调度模块
 * 注册所有定时任务的 Cron 配置
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { ExternalApiModule } from '@/infrastructure/external-api/external-api.module';
import { SyncModule } from './sync.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    ExternalApiModule,
    SyncModule,
  ],
  providers: [],
})
export class SchedulerModule {}
