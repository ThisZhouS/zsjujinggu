/**
 * TopGainer Module - 涨幅榜模块
 * 负责依赖注入、模块导出
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TopGainerController } from './top-gainer.controller';
import { TopGainerService } from './top-gainer.service';
import { TopGainerRepository } from './top-gainer.repository';
import { VipGuard } from '@/common/guards/vip.guard';

@Module({
  imports: [JwtModule],
  controllers: [TopGainerController],
  providers: [TopGainerService, TopGainerRepository, VipGuard],
  exports: [TopGainerService, TopGainerRepository],
})
export class TopGainerModule {}
