/**
 * Export Module - 数据导出模块
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { VipGuard } from '@/common/guards/vip.guard';
import { DividendModule } from '@/domain/dividend/dividend.module';

@Module({
  imports: [JwtModule, DividendModule],
  controllers: [ExportController],
  providers: [ExportService, VipGuard],
  exports: [ExportService],
})
export class ExportModule {}
