/**
 * Ad Module - 广告模块
 */

import { Module } from '@nestjs/common';
import { AdController } from './ad.controller';
import { AdService } from './ad.service';
import { AdRepository } from './ad.repository';

@Module({
  controllers: [AdController],
  providers: [AdService, AdRepository],
  exports: [AdService, AdRepository],
})
export class AdModule {}
