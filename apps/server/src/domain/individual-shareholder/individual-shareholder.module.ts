/**
 * IndividualShareholder Module - 个人股东模块
 */

import { Module } from '@nestjs/common';
import { IndividualShareholderController } from './individual-shareholder.controller';
import { IndividualShareholderService } from './individual-shareholder.service';
import { IndividualShareholderRepository } from './individual-shareholder.repository';

@Module({
  controllers: [IndividualShareholderController],
  providers: [IndividualShareholderService, IndividualShareholderRepository],
  exports: [IndividualShareholderService, IndividualShareholderRepository],
})
export class IndividualShareholderModule {}
