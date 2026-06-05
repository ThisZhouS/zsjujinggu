import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BaseSyncTask } from './base-sync.task';
import { BusinessDataSyncService } from '@/domain/data-sync/service/business-data-sync.service';

@Injectable()
export class BusinessDataSyncTask extends BaseSyncTask {
  constructor(
    prisma: PrismaService,
    private readonly businessDataSyncService: BusinessDataSyncService,
  ) {
    super(prisma);
  }

  async syncBusinessData(): Promise<number> {
    const summary = await this.businessDataSyncService.syncAllBusinessData({
      mode: 'full',
    });

    this.logger.log(
      `全A股业务数据同步完成：模式=${summary.mode}，目标日期=${summary.targetDate}，活动源=${summary.activeSlot}，股票=${summary.managedStockCount}，原始十大股东=${summary.rawTopHolderRecordCount}，原始流通股东=${summary.rawTopFlowHolderRecordCount}，原始股东户数=${summary.rawShareholderCountRecordCount}，原始公司股本=${summary.rawCompanyCapitalRecordCount}，原始解禁限售=${summary.rawLiftRestrictionRecordCount}，原始分红=${summary.rawDividendRecordCount}，牛散=${summary.qualifiedInvestorCount}，持仓=${summary.holdingRecordCount}，分红=${summary.dividendRecordCount}，高管交易=${summary.executiveTradeRecordCount}`,
    );

    return summary.totalChanged;
  }

  @Cron('0 4 * * *', { timeZone: 'Asia/Shanghai' })
  async syncBusinessDataNightly() {
    await this.execute('business-data', async () => {
      const summary = await this.businessDataSyncService.syncNightlyBusinessData();
      if (summary.skipped) {
        this.logger.log(
          `业务数据夜间任务跳过：模式=${summary.mode}，目标日期=${summary.targetDate}，当前活动源=${summary.activeSlot}`,
        );
      }
      return summary.totalChanged;
    });
  }
}
