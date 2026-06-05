/**
 * DataSyncModule - 数据同步模块
 *
 * 提供数据同步相关的 Controller、Service、Infrastructure 服务
 */

import { Module } from '@nestjs/common';
import { DataSyncController } from './controller/data-sync.controller';
import { DataSyncService } from './service/data-sync.service';
import { MairuiApiClient } from '@/infrastructure/mairui-api/mairui-api.client';
import { CompanyBasicInfoClient } from '@/infrastructure/mairui-api/company-basic-info.client';
import { ShareholderInfoClient } from '@/infrastructure/mairui-api/shareholder-info.client';
import { StockRealTimeDataClient } from '@/infrastructure/mairui-api/stock-realtime-data.client';
import { HistoricalTradingDataClient } from '@/infrastructure/mairui-api/historical-trading-data.client';
import { FinancialCoreIndicatorsClient } from '@/infrastructure/mairui-api/financial-core-indicators.client';
import { StockPoolClassificationClient } from '@/infrastructure/mairui-api/stock-pool-classification.client';
import { MajorMarketListsClient } from '@/infrastructure/mairui-api/major-market-lists.client';
import { FinancialStatementsClient } from '@/infrastructure/mairui-api/financial-statements.client';
import { CompanyHistoricalDataClient } from '@/infrastructure/mairui-api/company-historical-data.client';
import { ShareholderDetailedDataClient } from '@/infrastructure/mairui-api/shareholder-detailed-data.client';
import { FinancialQuartersEventsClient } from '@/infrastructure/mairui-api/financial-quarters-events.client';
import { TradingDetailsSpecialDataClient } from '@/infrastructure/mairui-api/trading-details-special-data.client';
import { MarketDepthDataClient } from '@/infrastructure/mairui-api/market-depth-data.client';
import { IndexRealTimeDataClient } from '@/infrastructure/mairui-api/index-realtime-data.client';
import { ShanghaiShenzhenTechnicalIndicatorsClient } from '@/infrastructure/mairui-api/shanghai-shenzhen-technical-indicators.client';
import { IndexTechnicalIndicatorsClient } from '@/infrastructure/mairui-api/index-technical-indicators.client';
import { IndexRelationshipMappingClient } from '@/infrastructure/mairui-api/index-relationship-mapping.client';
import { RealTimeTradingInterfacesClient } from '@/infrastructure/mairui-api/realtime-trading-interfaces.client';
import { OtherMarketListsClient } from '@/infrastructure/mairui-api/other-market-lists.client';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { BusinessDataSyncService } from './service/business-data-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [DataSyncController],
  providers: [
    DataSyncService,
    BusinessDataSyncService,
    MairuiApiClient,
    CompanyBasicInfoClient,
    ShareholderInfoClient,
    StockRealTimeDataClient,
    HistoricalTradingDataClient,
    FinancialCoreIndicatorsClient,
    StockPoolClassificationClient,
    MajorMarketListsClient,
    FinancialStatementsClient,
    CompanyHistoricalDataClient,
    ShareholderDetailedDataClient,
    FinancialQuartersEventsClient,
    TradingDetailsSpecialDataClient,
    MarketDepthDataClient,
    IndexRealTimeDataClient,
    ShanghaiShenzhenTechnicalIndicatorsClient,
    IndexTechnicalIndicatorsClient,
    IndexRelationshipMappingClient,
    RealTimeTradingInterfacesClient,
    OtherMarketListsClient,
  ],
  exports: [
    DataSyncService,
    BusinessDataSyncService,
    MairuiApiClient,
    CompanyBasicInfoClient,
    ShareholderInfoClient,
    StockRealTimeDataClient,
    HistoricalTradingDataClient,
    FinancialCoreIndicatorsClient,
    StockPoolClassificationClient,
    MajorMarketListsClient,
    FinancialStatementsClient,
    CompanyHistoricalDataClient,
    ShareholderDetailedDataClient,
    FinancialQuartersEventsClient,
    TradingDetailsSpecialDataClient,
    MarketDepthDataClient,
    IndexRealTimeDataClient,
    ShanghaiShenzhenTechnicalIndicatorsClient,
    IndexTechnicalIndicatorsClient,
    IndexRelationshipMappingClient,
    RealTimeTradingInterfacesClient,
    OtherMarketListsClient,
  ],
})
export class DataSyncModule {}
