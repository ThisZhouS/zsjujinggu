import { Module } from '@nestjs/common';
import { StarInvestorController } from './star-investor.controller';
import { StarInvestorService } from './star-investor.service';

@Module({
  controllers: [StarInvestorController],
  providers: [StarInvestorService],
  exports: [StarInvestorService],
})
export class StarInvestorModule {}
