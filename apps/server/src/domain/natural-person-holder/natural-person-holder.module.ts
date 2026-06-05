/**
 * Natural Person Holder Module - 自然人股东持仓模块
 * 负责依赖注入、模块导出
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NaturalPersonHolderController } from './natural-person-holder.controller';
import { NaturalPersonHolderService } from './natural-person-holder.service';
import { NaturalPersonHolderRepository } from './natural-person-holder.repository';
import { VipGuard } from '@/common/guards/vip.guard';
import { HoldingModule } from '@/domain/holding/holding.module';
import { TopGainerModule } from '@/domain/top-gainer/top-gainer.module';

@Module({
  imports: [JwtModule, TopGainerModule, HoldingModule],
  controllers: [NaturalPersonHolderController],
  providers: [
    NaturalPersonHolderService,
    NaturalPersonHolderRepository,
    VipGuard,
  ],
  exports: [NaturalPersonHolderService, NaturalPersonHolderRepository],
})
export class NaturalPersonHolderModule {}
