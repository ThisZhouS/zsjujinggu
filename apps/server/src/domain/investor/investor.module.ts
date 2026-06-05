/**
 * Investor Module - 牛散模块
 * 负责依赖注入、模块导出
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvestorController } from './investor.controller';
import { InvestorService } from './investor.service';
import { InvestorRepository } from './investor.repository';
import { HoldingRepository } from '@/domain/holding/holding.repository';
import { NaturalPersonHolderModule } from '@/domain/natural-person-holder/natural-person-holder.module';
import { VipGuard } from '@/common/guards/vip.guard';

@Module({
  imports: [JwtModule, NaturalPersonHolderModule],
  controllers: [InvestorController],
  providers: [InvestorService, InvestorRepository, HoldingRepository, VipGuard],
  exports: [InvestorService, InvestorRepository],
})
export class InvestorModule {}
