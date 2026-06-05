/**
 * PriceAlertModule - 价格提醒模块
 */

import { Module } from '@nestjs/common';
import { PriceAlertController } from './price-alert.controller';
import { PriceAlertService } from './price-alert.service';
import { PriceAlertRepository } from './price-alert.repository';

@Module({
  controllers: [PriceAlertController],
  providers: [PriceAlertService, PriceAlertRepository],
  exports: [PriceAlertService, PriceAlertRepository],
})
export class PriceAlertModule {}
