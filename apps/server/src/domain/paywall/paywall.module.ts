import { Module } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { PaywallController } from './paywall.controller';
import { PaywallService } from './paywall.service';

@Module({
  controllers: [PaywallController],
  providers: [PaywallService, OptionalJwtAuthGuard],
})
export class PaywallModule {}
