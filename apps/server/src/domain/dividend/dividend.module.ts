/**
 * Dividend Module - 分红模块
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DividendController } from './dividend.controller';
import { DividendService } from './dividend.service';
import { DividendRepository } from './dividend.repository';
import { VipGuard } from '@/common/guards/vip.guard';
import { AdminGuard } from '@/common/guards/admin.guard';

@Module({
  imports: [JwtModule],
  controllers: [DividendController],
  providers: [DividendService, DividendRepository, VipGuard, AdminGuard],
  exports: [DividendService, DividendRepository],
})
export class DividendModule {}
