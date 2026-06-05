import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ExternalApiModule } from './infrastructure/external-api/external-api.module';
import { SchedulerModule } from './infrastructure/scheduler/scheduler.module';

import { InvestorModule } from './domain/investor/investor.module';
import { StockModule } from './domain/stock/stock.module';
import { ArticleModule } from './domain/article/article.module';
import { AuthModule } from './domain/auth/auth.module';
import { AdminModule } from './domain/admin/admin.module';
import { AdModule } from './domain/ad/ad.module';
import { DividendModule } from './domain/dividend/dividend.module';
import { ExecutiveModule } from './domain/executive/executive.module';
import { TopGainerModule } from './domain/top-gainer/top-gainer.module';
import { HoldingModule } from './domain/holding/holding.module';
import { SearchModule } from './domain/search/search.module';
import { IndividualShareholderModule } from './domain/individual-shareholder/individual-shareholder.module';
import { ExportModule } from './domain/export/export.module';
import { WatchlistModule } from './domain/watchlist/watchlist.module';
import { PriceAlertModule } from './domain/price-alert/price-alert.module';
import { NotificationModule } from './domain/notification/notification.module';
import { FavoriteModule } from './domain/favorite/favorite.module';
import { ApiKeyModule } from './domain/api-key/api-key.module';
import { AccountModule } from './domain/account/account.module';
import { OrderModule } from './domain/order/order.module';
import { PaymentModule } from './domain/payment/payment.module';
import { DataSyncModule } from './domain/data-sync/data-sync.module';
import { NaturalPersonHolderModule } from './domain/natural-person-holder/natural-person-holder.module';
import { VideoModule } from './domain/video/video.module';
import { PaywallModule } from './domain/paywall/paywall.module';
import { StarInvestorModule } from './domain/star-investor/star-investor.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 基础设施模块
    PrismaModule,
    RedisModule,
    ExternalApiModule,
    SchedulerModule,

    // 领域模块
    InvestorModule,
    StockModule,
    ArticleModule,
    AuthModule,
    AdminModule,
    AdModule,
    DividendModule,
    ExecutiveModule,
    TopGainerModule,
    HoldingModule,
    SearchModule,
    IndividualShareholderModule,
    ExportModule,
    WatchlistModule,
    PriceAlertModule,
    NotificationModule,
    FavoriteModule,
    ApiKeyModule,
    AccountModule,
    OrderModule,
    PaymentModule,
    DataSyncModule,
    NaturalPersonHolderModule,
    VideoModule,
    PaywallModule,
    StarInvestorModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
