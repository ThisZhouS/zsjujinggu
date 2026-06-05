import { Injectable, Logger } from '@nestjs/common';
import { BusinessDataSlot, Prisma, TradeType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { MairuiService } from '@/infrastructure/external-api/mairui.service';
import { CompanyBasicInfoClient } from '@/infrastructure/mairui-api/company-basic-info.client';
import { CompanyHistoricalDataClient } from '@/infrastructure/mairui-api/company-historical-data.client';
import { ShareholderInfoClient } from '@/infrastructure/mairui-api/shareholder-info.client';
import { FinancialQuartersEventsClient } from '@/infrastructure/mairui-api/financial-quarters-events.client';
import {
  InvestorCategory,
  isLikelyPersonalInvestorName,
} from '@/common/utils/investor-name-filter';

interface StockMeta {
  code: string;
  name: string;
  currentPrice: number | null;
  totalMarketCap: number | null;
  totalShares: number | null;
}

interface HoldingSnapshotRow {
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdRatio: number | null;
  reportDate: string;
}

interface QualifiedInvestorRow {
  name: string;
  category: InvestorCategory;
  stockCount: number;
  maxQuartersInOneStock: number;
  totalMarketValue: number;
  holdings: HoldingSnapshotRow[];
}

interface QualifiedInvestorSnapshot {
  investorId: bigint;
  name: string;
  category: InvestorCategory;
  stockCount: number;
  totalMarketValue: number;
  isTracked: boolean;
}

interface InvestorHoldingSyncResult {
  managedStockCodes: string[];
  qualifiedInvestorCount: number;
  investorCreated: number;
  investorUpdated: number;
  investorDisabled: number;
  holdingRecordCount: number;
  managedInvestorIds: bigint[];
  qualifiedInvestorSnapshots: QualifiedInvestorSnapshot[];
  targetSlot: BusinessDataSlot;
}

interface DividendSyncResult {
  dividendRecordCount: number;
  cashDividendRecordCount: number;
  dividendYieldReadyRecordCount: number;
  totalDividendReadyRecordCount: number;
  targetSlot: BusinessDataSlot;
}

interface ExecutiveTradeSyncResult {
  executiveTradeRecordCount: number;
  targetSlot: BusinessDataSlot;
}

interface RawRefreshResult {
  refreshedStockCount: number;
  targetDateTouchedStockCount: number;
  rawTopHolderRecordCount: number;
  rawShareholderCountRecordCount: number;
  rawCompanyCapitalRecordCount: number;
  rawLiftRestrictionRecordCount: number;
  rawTopFlowHolderRecordCount: number;
  rawDividendRecordCount: number;
  executiveMemberRecordCount: number;
}

interface SourceDataAcquisitionResult {
  allAStockCodes: string[];
  rawRefreshResult: RawRefreshResult;
}

interface BusinessDataMaterializationResult {
  investorResult: InvestorHoldingSyncResult;
  dividendResult: DividendSyncResult;
  executiveResult: ExecutiveTradeSyncResult;
}

export interface BusinessDataSyncSummary {
  mode: 'full' | 'daily';
  targetDate: string;
  activeSlot: BusinessDataSlot;
  stagedSlot: BusinessDataSlot;
  skipped: boolean;
  managedStockCount: number;
  refreshedStockCount: number;
  targetDateTouchedStockCount: number;
  rawTopHolderRecordCount: number;
  rawShareholderCountRecordCount: number;
  rawCompanyCapitalRecordCount: number;
  rawLiftRestrictionRecordCount: number;
  rawTopFlowHolderRecordCount: number;
  rawDividendRecordCount: number;
  executiveMemberRecordCount: number;
  qualifiedInvestorCount: number;
  investorCreated: number;
  investorUpdated: number;
  investorDisabled: number;
  holdingRecordCount: number;
  dividendRecordCount: number;
  dividendYieldReadyRecordCount: number;
  totalDividendReadyRecordCount: number;
  executiveTradeRecordCount: number;
  totalChanged: number;
}

@Injectable()
export class BusinessDataSyncService {
  private readonly logger = new Logger(BusinessDataSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mairuiService: MairuiService,
    private readonly companyBasicInfoClient: CompanyBasicInfoClient,
    private readonly companyHistoricalDataClient: CompanyHistoricalDataClient,
    private readonly shareholderInfoClient: ShareholderInfoClient,
    private readonly financialQuartersEventsClient: FinancialQuartersEventsClient,
  ) {}

  async syncNightlyBusinessData(): Promise<BusinessDataSyncSummary> {
    const targetDate = this.getChinaDateString(-1);
    const state = await this.ensureBusinessDataSourceState();

    if (!state.latestFullSyncDate) {
      return this.syncAllBusinessData({
        mode: 'full',
        targetDate,
      });
    }

    if (
      state.latestFullSyncDate >= targetDate ||
      state.latestDailySyncDate === targetDate
    ) {
      return this.buildSkippedSummary({
        mode: 'daily',
        targetDate,
        activeSlot: state.activeSlot,
      });
    }

    return this.syncAllBusinessData({
      mode: 'daily',
      targetDate,
    });
  }

  async syncAllBusinessData(options?: {
    mode?: 'full' | 'daily';
    targetDate?: string;
  }): Promise<BusinessDataSyncSummary> {
    const mode = options?.mode ?? 'full';
    const targetDate = options?.targetDate ?? this.getChinaDateString(-1);
    const state = await this.ensureBusinessDataSourceState();
    const activeSlot = state.activeSlot;
    const stagedSlot = this.getInactiveBusinessDataSlot(activeSlot);

    if (
      mode === 'daily' &&
      (state.latestFullSyncDate ?? '') >= targetDate
    ) {
      return this.buildSkippedSummary({
        mode,
        targetDate,
        activeSlot,
      });
    }

    const { allAStockCodes, rawRefreshResult } = await this.runBusinessDataStage(
      '1/3 获取数据',
      async () => this.acquireBusinessSourceData({ mode, targetDate }),
    );

    const { investorResult, dividendResult, executiveResult } = await this.runBusinessDataStage(
      '2/3 同步业务数据',
      async () => this.materializeBusinessData({
        allAStockCodes,
        stagedSlot,
      }),
    );

    this.assertBusinessDataReadyForSwitch({
      investorResult,
      dividendResult,
      stagedSlot,
      mode,
      targetDate,
    });

    await this.runBusinessDataStage(
      '3/3 切换数据源',
      async () => this.switchBusinessDataSource({
        stagedSlot,
        mode,
        targetDate,
        managedInvestorIds: investorResult.managedInvestorIds,
        qualifiedInvestorSnapshots: investorResult.qualifiedInvestorSnapshots,
      }),
    );

    return {
      mode,
      targetDate,
      activeSlot: stagedSlot,
      stagedSlot,
      skipped: false,
      managedStockCount: allAStockCodes.length,
      refreshedStockCount: rawRefreshResult.refreshedStockCount,
      targetDateTouchedStockCount: rawRefreshResult.targetDateTouchedStockCount,
      rawTopHolderRecordCount: rawRefreshResult.rawTopHolderRecordCount,
      rawShareholderCountRecordCount:
        rawRefreshResult.rawShareholderCountRecordCount,
      rawCompanyCapitalRecordCount:
        rawRefreshResult.rawCompanyCapitalRecordCount,
      rawLiftRestrictionRecordCount:
        rawRefreshResult.rawLiftRestrictionRecordCount,
      rawTopFlowHolderRecordCount: rawRefreshResult.rawTopFlowHolderRecordCount,
      rawDividendRecordCount: rawRefreshResult.rawDividendRecordCount,
      executiveMemberRecordCount: rawRefreshResult.executiveMemberRecordCount,
      qualifiedInvestorCount: investorResult.qualifiedInvestorCount,
      investorCreated: investorResult.investorCreated,
      investorUpdated: investorResult.investorUpdated,
      investorDisabled: investorResult.investorDisabled,
      holdingRecordCount: investorResult.holdingRecordCount,
      dividendRecordCount: dividendResult.dividendRecordCount,
      dividendYieldReadyRecordCount: dividendResult.dividendYieldReadyRecordCount,
      totalDividendReadyRecordCount: dividendResult.totalDividendReadyRecordCount,
      executiveTradeRecordCount: executiveResult.executiveTradeRecordCount,
      totalChanged:
        rawRefreshResult.refreshedStockCount +
        rawRefreshResult.rawTopHolderRecordCount +
        rawRefreshResult.rawShareholderCountRecordCount +
        rawRefreshResult.rawCompanyCapitalRecordCount +
        rawRefreshResult.rawLiftRestrictionRecordCount +
        rawRefreshResult.rawTopFlowHolderRecordCount +
        rawRefreshResult.rawDividendRecordCount +
        rawRefreshResult.executiveMemberRecordCount +
        investorResult.investorCreated +
        investorResult.investorUpdated +
        investorResult.investorDisabled +
        investorResult.holdingRecordCount +
        dividendResult.dividendRecordCount +
        executiveResult.executiveTradeRecordCount,
    };
  }

  private async runBusinessDataStage<T>(
    stageName: string,
    task: () => Promise<T>,
  ): Promise<T> {
    const startedAt = Date.now();
    this.logger.log(`业务数据阶段开始：${stageName}`);

    try {
      const result = await task();
      this.logger.log(`业务数据阶段完成：${stageName}，耗时=${Date.now() - startedAt}ms`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`业务数据阶段失败：${stageName}，后续阶段已阻断：${message}`, error);
      throw error;
    }
  }

  private async acquireBusinessSourceData(options: {
    mode: 'full' | 'daily';
    targetDate: string;
  }): Promise<SourceDataAcquisitionResult> {
    const allAStockCodes = await this.ensureAStockUniverse();
    await this.backfillStockLatestPrices(allAStockCodes);
    const rawRefreshResult = await this.refreshRawDataForAStocks(allAStockCodes, options);
    await this.backfillStockLatestPrices(allAStockCodes);

    return {
      allAStockCodes,
      rawRefreshResult,
    };
  }

  private async materializeBusinessData(options: {
    allAStockCodes: string[];
    stagedSlot: BusinessDataSlot;
  }): Promise<BusinessDataMaterializationResult> {
    const investorResult = await this.syncInvestorsAndHoldingsFromRaw(options.stagedSlot);
    const dividendResult = await this.syncDividendsFromRaw(options.stagedSlot);
    const executiveResult = await this.syncExecutiveTradesFromMairui(
      options.allAStockCodes,
      options.stagedSlot,
    );

    return {
      investorResult,
      dividendResult,
      executiveResult,
    };
  }

  private assertBusinessDataReadyForSwitch(options: {
    investorResult: InvestorHoldingSyncResult;
    dividendResult: DividendSyncResult;
    stagedSlot: BusinessDataSlot;
    mode: 'full' | 'daily';
    targetDate: string;
  }): void {
    const { investorResult, dividendResult, stagedSlot, mode, targetDate } = options;
    const blockers: string[] = [];

    if (investorResult.qualifiedInvestorCount <= 0 || investorResult.holdingRecordCount <= 0) {
      blockers.push(
        `股东/持仓物化为空：qualified=${investorResult.qualifiedInvestorCount}, holdings=${investorResult.holdingRecordCount}`,
      );
    }

    if (dividendResult.dividendRecordCount <= 0) {
      blockers.push(`分红物化为空：dividends=${dividendResult.dividendRecordCount}`);
    }

    if (
      dividendResult.cashDividendRecordCount > 0 &&
      dividendResult.dividendYieldReadyRecordCount < dividendResult.cashDividendRecordCount
    ) {
      blockers.push(
        `股息率字段未补齐：cashDividend=${dividendResult.cashDividendRecordCount}, dividendYield=${dividendResult.dividendYieldReadyRecordCount}`,
      );
    }

    if (
      dividendResult.cashDividendRecordCount > 0 &&
      dividendResult.totalDividendReadyRecordCount < dividendResult.cashDividendRecordCount
    ) {
      blockers.push(
        `分红总额字段未补齐：cashDividend=${dividendResult.cashDividendRecordCount}, totalDividend=${dividendResult.totalDividendReadyRecordCount}`,
      );
    }

    if (blockers.length > 0) {
      throw new Error(
        `业务数据源切换已阻断：slot=${stagedSlot}, mode=${mode}, targetDate=${targetDate}, ${blockers.join('；')}`,
      );
    }
  }

  private getInactiveBusinessDataSlot(slot: BusinessDataSlot): BusinessDataSlot {
    return slot === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
  }

  private async ensureBusinessDataSourceState() {
    return this.prisma.businessDataSourceState.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        activeSlot: 'PRIMARY',
      },
    });
  }

  private buildSkippedSummary(options: {
    mode: 'full' | 'daily';
    targetDate: string;
    activeSlot: BusinessDataSlot;
  }): BusinessDataSyncSummary {
    return {
      mode: options.mode,
      targetDate: options.targetDate,
      activeSlot: options.activeSlot,
      stagedSlot: this.getInactiveBusinessDataSlot(options.activeSlot),
      skipped: true,
      managedStockCount: 0,
      refreshedStockCount: 0,
      targetDateTouchedStockCount: 0,
      rawTopHolderRecordCount: 0,
      rawShareholderCountRecordCount: 0,
      rawCompanyCapitalRecordCount: 0,
      rawLiftRestrictionRecordCount: 0,
      rawTopFlowHolderRecordCount: 0,
      rawDividendRecordCount: 0,
      executiveMemberRecordCount: 0,
      qualifiedInvestorCount: 0,
      investorCreated: 0,
      investorUpdated: 0,
      investorDisabled: 0,
      holdingRecordCount: 0,
      dividendRecordCount: 0,
      dividendYieldReadyRecordCount: 0,
      totalDividendReadyRecordCount: 0,
      executiveTradeRecordCount: 0,
      totalChanged: 0,
    };
  }

  private getChinaDateString(offsetDays: number = 0, now: Date = new Date()): string {
    const chinaNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    chinaNow.setUTCDate(chinaNow.getUTCDate() + offsetDays);
    return chinaNow.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private async switchBusinessDataSource(options: {
    stagedSlot: BusinessDataSlot;
    mode: 'full' | 'daily';
    targetDate: string;
    managedInvestorIds: bigint[];
    qualifiedInvestorSnapshots: QualifiedInvestorSnapshot[];
  }): Promise<void> {
    const {
      stagedSlot,
      mode,
      targetDate,
      managedInvestorIds,
      qualifiedInvestorSnapshots,
    } = options;

    const qualifiedSnapshotMap = new Map(
      qualifiedInvestorSnapshots.map((row) => [row.investorId.toString(), row]),
    );

    await this.prisma.$transaction(
      async (tx) => {
        for (const chunk of this.chunkArray(managedInvestorIds, 5000)) {
          if (chunk.length === 0) {
            continue;
          }

          await tx.investor.updateMany({
            where: {
              id: {
                in: chunk,
              },
            },
            data: {
              isTracked: false,
              totalMarketValue: 0,
              stockCount: 0,
            },
          });
        }

        for (const chunk of this.chunkArray(qualifiedInvestorSnapshots, 2000)) {
          if (chunk.length === 0) {
            continue;
          }

          const values = chunk.map((snapshot) => Prisma.sql`(
            ${snapshot.investorId}::bigint,
            ${snapshot.category}::varchar,
            ${snapshot.stockCount}::integer,
            ${snapshot.totalMarketValue}::numeric,
            ${snapshot.isTracked}::boolean
          )`);

          await tx.$executeRaw(Prisma.sql`
            UPDATE investors AS i
            SET
              category = v.category,
              "stockCount" = v."stockCount",
              "totalMarketValue" = v."totalMarketValue",
              "isTracked" = v."isTracked",
              "updatedAt" = NOW()
            FROM (VALUES ${Prisma.join(values)}) AS v(id, category, "stockCount", "totalMarketValue", "isTracked")
            WHERE i.id = v.id
          `);
        }

        await tx.businessDataSourceState.upsert({
          where: { id: 1 },
          update: {
            activeSlot: stagedSlot,
            lastPreparedSlot: stagedSlot,
            lastSwitchAt: new Date(),
            latestFullSyncDate:
              mode === 'full'
                ? targetDate
                : undefined,
            latestDailySyncDate:
              mode === 'daily'
                ? targetDate
                : undefined,
          },
          create: {
            id: 1,
            activeSlot: stagedSlot,
            lastPreparedSlot: stagedSlot,
            lastSwitchAt: new Date(),
            latestFullSyncDate: mode === 'full' ? targetDate : null,
            latestDailySyncDate: mode === 'daily' ? targetDate : null,
          },
        });
      },
      {
        maxWait: 30000,
        timeout: 300000,
      },
    );

    this.logger.log(
      `业务数据源已切换到 ${stagedSlot}，模式=${mode}，覆盖日期=${targetDate}，活跃牛散=${qualifiedSnapshotMap.size}`,
    );
  }

  private resolveInvestorCategory(
    holderType: string | null | undefined,
    shareholderName: string,
  ): InvestorCategory {
    const normalizedHolderType = holderType?.trim();

    if (normalizedHolderType === '自然人') {
      return isLikelyPersonalInvestorName(shareholderName)
        ? 'personal'
        : 'institution';
    }

    if (normalizedHolderType) {
      return 'institution';
    }

    return isLikelyPersonalInvestorName(shareholderName)
      ? 'personal'
      : 'institution';
  }

  private async ensureAStockUniverse(): Promise<string[]> {
    const mairuiStocks = await this.mairuiService.getStockList();
    const normalizedMairuiStocks = mairuiStocks
      .map((item) => this.normalizeAStockListItem(item))
      .filter(
        (item): item is { code: string; name: string } =>
          item !== null,
      );

    if (normalizedMairuiStocks.length > 0) {
      const uniqueStocks = Array.from(
        new Map(normalizedMairuiStocks.map((item) => [item.code, item])).values(),
      );

      await this.prisma.stock.createMany({
        data: uniqueStocks.map((stock) => ({
          code: stock.code,
          name: stock.name,
          market: 'A',
        })),
        skipDuplicates: true,
      });

      return uniqueStocks.map((stock) => stock.code).sort((a, b) => a.localeCompare(b));
    }

    const rawUniverse = await this.prisma.stockList.findMany({
      select: {
        dm: true,
        mc: true,
      },
      orderBy: {
        dm: 'asc',
      },
    });

    if (rawUniverse.length > 0) {
      const uniqueStocks = Array.from(
        new Map(
          rawUniverse
            .filter((stock) => Boolean(stock.dm))
            .map((stock) => [this.canonicalizeStockCode(stock.dm), stock]),
        ).values(),
      );

      await this.prisma.stock.createMany({
        data: uniqueStocks.map((stock) => ({
          code: this.canonicalizeStockCode(stock.dm),
          name: stock.mc || stock.dm,
          market: 'A',
        })),
        skipDuplicates: true,
      });

      return uniqueStocks.map((stock) => this.canonicalizeStockCode(stock.dm));
    }

    const stocks = await this.prisma.stock.findMany({
      where: {
        market: 'A',
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return stocks.map((stock) => stock.code).filter(Boolean);
  }

  private async refreshRawDataForAStocks(
    stockCodes: string[],
    options: {
      mode: 'full' | 'daily';
      targetDate: string;
    },
  ): Promise<RawRefreshResult> {
    if (stockCodes.length === 0) {
      return {
        refreshedStockCount: 0,
        targetDateTouchedStockCount: 0,
        rawTopHolderRecordCount: 0,
        rawShareholderCountRecordCount: 0,
        rawCompanyCapitalRecordCount: 0,
        rawLiftRestrictionRecordCount: 0,
        rawTopFlowHolderRecordCount: 0,
        rawDividendRecordCount: 0,
        executiveMemberRecordCount: 0,
      };
    }

    let refreshedStockCount = 0;
    let targetDateTouchedStockCount = 0;
    let rawTopHolderRecordCount = 0;
    let rawShareholderCountRecordCount = 0;
    let rawCompanyCapitalRecordCount = 0;
    let rawLiftRestrictionRecordCount = 0;
    let rawTopFlowHolderRecordCount = 0;
    let rawDividendRecordCount = 0;
    const concurrency = 4;

    for (const batch of this.chunkArray(stockCodes, concurrency)) {
      const batchResults = await Promise.all(
        batch.map((stockCode) =>
          this.refreshRawDataForSingleStock(stockCode, options),
        ),
      );

      for (const result of batchResults) {
        if (result.refreshed) {
          refreshedStockCount += 1;
        }
        if (result.touchedTargetDate) {
          targetDateTouchedStockCount += 1;
        }
        rawTopHolderRecordCount += result.rawTopHolderRecordCount;
        rawShareholderCountRecordCount += result.rawShareholderCountRecordCount;
        rawCompanyCapitalRecordCount += result.rawCompanyCapitalRecordCount;
        rawLiftRestrictionRecordCount += result.rawLiftRestrictionRecordCount;
        rawTopFlowHolderRecordCount += result.rawTopFlowHolderRecordCount;
        rawDividendRecordCount += result.rawDividendRecordCount;
      }

      await this.sleep(120);
    }

    const minRefreshCoverage = this.parseRatioEnv(
      'BUSINESS_DATA_MIN_REFRESH_COVERAGE',
      0.8,
    );
    const refreshCoverage = refreshedStockCount / stockCodes.length;
    if (refreshCoverage < minRefreshCoverage) {
      throw new Error(
        `全A股原始数据刷新覆盖率不足，已阻断业务数据切换：refreshed=${refreshedStockCount}, total=${stockCodes.length}, coverage=${(refreshCoverage * 100).toFixed(2)}%, min=${(minRefreshCoverage * 100).toFixed(2)}%`,
      );
    }
    this.assertTargetDateCoverage({
      mode: options.mode,
      targetDate: options.targetDate,
      stockCount: stockCodes.length,
      targetDateTouchedStockCount,
    });

    const executiveMemberRecordCount =
      await this.syncExecutiveMembersForCurrentCandidates();

    return {
      refreshedStockCount,
      targetDateTouchedStockCount,
      rawTopHolderRecordCount,
      rawShareholderCountRecordCount,
      rawCompanyCapitalRecordCount,
      rawLiftRestrictionRecordCount,
      rawTopFlowHolderRecordCount,
      rawDividendRecordCount,
      executiveMemberRecordCount,
    };
  }

  async syncExecutiveMembersForCurrentCandidates(limit?: number): Promise<number> {
    const candidateStockCodes =
      await this.findExecutiveMemberCandidateStockCodes();
    if (candidateStockCodes.length === 0) {
      return 0;
    }

    const existingRows = await this.prisma.executiveMember.findMany({
      where: {
        dm: {
          in: candidateStockCodes,
        },
      },
      select: {
        dm: true,
      },
    });
    const existingCodes = new Set(existingRows.map((row) => row.dm));
    const missingStockCodes = candidateStockCodes.filter(
      (stockCode) => !existingCodes.has(stockCode),
    );
    const syncLimit =
      limit && Number.isInteger(limit) && limit > 0
        ? limit
        : this.parsePositiveIntegerEnv(
            'BUSINESS_EXECUTIVE_MEMBER_SYNC_LIMIT',
            missingStockCodes.length,
          );
    const targetStockCodes = missingStockCodes.slice(0, syncLimit);

    let syncedRecordCount = 0;
    let failedStockCount = 0;
    const concurrency = 3;

    for (const batch of this.chunkArray(targetStockCodes, concurrency)) {
      const batchResults = await Promise.all(
        batch.map(async (stockCode) => {
          try {
            const members =
              await this.companyHistoricalDataClient.fetchExecutiveMember(stockCode);
            if (members.length === 0) {
              return 0;
            }

            const rows = members
              .filter((member) => member.name?.trim())
              .map((member) => ({
                dm: this.normalizeStockCode(member.dm || stockCode),
                name: member.name,
                title: member.title,
                sdate: member.sdate,
                edate: member.edate,
              }));
            if (rows.length === 0) {
              return 0;
            }

            const result = await this.prisma.executiveMember.createMany({
              data: rows,
              skipDuplicates: true,
            });

            return result.count;
          } catch (error) {
            failedStockCount += 1;
            this.logger.warn(
              `高管成员候选股票同步失败：${stockCode} - ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
            return 0;
          }
        }),
      );

      syncedRecordCount += batchResults.reduce((sum, count) => sum + count, 0);
      await this.sleep(150);
    }

    this.logger.log(
      `高管成员候选股票同步完成：候选=${candidateStockCodes.length}，缺失=${missingStockCodes.length}，本次股票=${targetStockCodes.length}，记录=${syncedRecordCount}，失败股票=${failedStockCount}`,
    );

    return syncedRecordCount;
  }

  private async findExecutiveMemberCandidateStockCodes(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ stockCode: string }>>(Prisma.sql`
      WITH report_date_counts AS (
        SELECT
          jzrq AS "reportDate",
          COUNT(*)::int AS "rowCount"
        FROM company_top_flow_holders
        WHERE gdlx = '自然人'
          AND jzrq IS NOT NULL
          AND "stockCode" IS NOT NULL
        GROUP BY jzrq
      ),
      max_count AS (
        SELECT COALESCE(MAX("rowCount"), 0)::int AS "value"
        FROM report_date_counts
      ),
      target_report_date AS (
        SELECT "reportDate"
        FROM report_date_counts, max_count
        WHERE "rowCount" >= GREATEST(1, FLOOR(max_count."value" * 0.3))
        ORDER BY "reportDate" DESC
        LIMIT 1
      )
      SELECT DISTINCT split_part("stockCode", '.', 1) AS "stockCode"
      FROM company_top_flow_holders
      WHERE gdlx = '自然人'
        AND jzrq = (SELECT "reportDate" FROM target_report_date)
        AND "stockCode" IS NOT NULL
      ORDER BY split_part("stockCode", '.', 1)
    `);

    return rows
      .map((row) => this.normalizeStockCode(row.stockCode))
      .filter(Boolean);
  }

  private async refreshRawDataForSingleStock(
    stockCode: string,
    options: {
      mode: 'full' | 'daily';
      targetDate: string;
    },
  ): Promise<{
    refreshed: boolean;
    touchedTargetDate: boolean;
    rawTopHolderRecordCount: number;
    rawShareholderCountRecordCount: number;
    rawCompanyCapitalRecordCount: number;
    rawLiftRestrictionRecordCount: number;
    rawTopFlowHolderRecordCount: number;
    rawDividendRecordCount: number;
  }> {
    const canonicalCode = this.canonicalizeStockCode(stockCode);
    const normalizedCode = this.normalizeStockCode(stockCode);
    const stockCodeCandidates = Array.from(
      new Set([stockCode, canonicalCode, normalizedCode].filter(Boolean)),
    );
    const isDailyMode = options.mode === 'daily';
    const startDate = isDailyMode ? options.targetDate : undefined;
    const endDate = isDailyMode ? options.targetDate : undefined;

    let refreshed = false;
    let touchedTargetDate = false;
    let rawTopHolderRecordCount = 0;
    let rawShareholderCountRecordCount = 0;
    let rawCompanyCapitalRecordCount = 0;
    let rawLiftRestrictionRecordCount = 0;
    let rawTopFlowHolderRecordCount = 0;
    let rawDividendRecordCount = 0;

    try {
      const topHolders =
        await this.shareholderInfoClient.fetchCompanyTopHolders(
          canonicalCode,
          startDate,
          endDate,
        );

      if (topHolders.length > 0) {
        touchedTargetDate =
          touchedTargetDate ||
          this.hasTargetDateRecord(topHolders, options.targetDate, ['jzrq', 'plrq']);
        if (isDailyMode) {
          const jzrqList = Array.from(
            new Set(topHolders.map((item) => item.jzrq).filter(Boolean)),
          );
          const deleteDateList = jzrqList.length > 0 ? jzrqList : [options.targetDate];

          await this.prisma.companyTopHolders.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
              jzrq: {
                in: deleteDateList,
              },
            },
          });
        } else {
          await this.prisma.companyTopHolders.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
            },
          });
        }

        await this.prisma.companyTopHolders.createMany({
          data: topHolders.map((item) => ({
            stockCode: this.canonicalizeStockCode(item.dm || canonicalCode),
            plrq: item.plrq,
            jzrq: item.jzrq,
            gdmc: item.gdmc,
            gdlx: item.gdlx,
            cgsl: item.cgsl ?? null,
            bdyy: item.bdyy,
            cgbl: item.cgbl ?? null,
            gfxz: item.gfxz,
            cgpm: item.cgpm ?? null,
          })),
        });
      }

      rawTopHolderRecordCount = topHolders.length;
      refreshed = true;
    } catch (error) {
      this.logger.warn(
        `刷新全A股十大股东原始数据失败：${canonicalCode} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const shareholderCounts =
        await this.shareholderInfoClient.fetchCompanyShareholderCount(
          canonicalCode,
          startDate,
          endDate,
        );

      if (shareholderCounts.length > 0) {
        touchedTargetDate =
          touchedTargetDate ||
          this.hasTargetDateRecord(shareholderCounts, options.targetDate, ['jzrq', 'plrq']);
        if (isDailyMode) {
          const jzrqList = Array.from(
            new Set(shareholderCounts.map((item) => item.jzrq).filter(Boolean)),
          );
          const deleteDateList = jzrqList.length > 0 ? jzrqList : [options.targetDate];

          await this.prisma.companyShareholderCount.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
              jzrq: {
                in: deleteDateList,
              },
            },
          });
        } else {
          await this.prisma.companyShareholderCount.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
            },
          });
        }

        await this.prisma.companyShareholderCount.createMany({
          data: shareholderCounts.map((item) => ({
            stockCode: this.canonicalizeStockCode(item.dm || canonicalCode),
            plrq: item.plrq,
            jzrq: item.jzrq,
            gdzs: item.gdzs ?? null,
            agdhs: item.agdhs ?? null,
            bgdhs: item.bgdhs ?? null,
            hgdhs: item.hgdhs ?? null,
            yltgdhs: item.yltgdhs ?? null,
            wltgdhs: item.wltgdhs ?? null,
          })),
        });
      }

      rawShareholderCountRecordCount = shareholderCounts.length;
      refreshed = true;
    } catch (error) {
      this.logger.warn(
        `刷新全A股股东户数原始数据失败：${canonicalCode} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const companyCapitals =
        await this.companyBasicInfoClient.fetchCompanyCapital(
          canonicalCode,
          startDate,
          endDate,
        );

      if (companyCapitals.length > 0) {
        touchedTargetDate =
          touchedTargetDate ||
          this.hasTargetDateRecord(companyCapitals, options.targetDate, ['plrq', 'bdrq']);
        if (isDailyMode) {
          const dateList = Array.from(
            new Set(
              companyCapitals.flatMap((item) => [item.plrq, item.bdrq]).filter(Boolean),
            ),
          );
          const deleteDateList = dateList.length > 0 ? dateList : [options.targetDate];

          await this.prisma.companyCapital.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
              OR: [
                {
                  plrq: {
                    in: deleteDateList,
                  },
                },
                {
                  bdrq: {
                    in: deleteDateList,
                  },
                },
              ],
            },
          });
        } else {
          await this.prisma.companyCapital.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
            },
          });
        }

        await this.prisma.companyCapital.createMany({
          data: companyCapitals.map((item) => ({
            stockCode: this.canonicalizeStockCode(item.dm || canonicalCode),
            zgb: item.zgb ?? null,
            ysltag: item.ysltag ?? null,
            xsltgf: item.xsltgf ?? null,
            bdrq: item.bdrq ?? null,
            plrq: item.plrq ?? null,
          })),
        });
      }

      rawCompanyCapitalRecordCount = companyCapitals.length;
      refreshed = true;
    } catch (error) {
      this.logger.warn(
        `刷新全A股公司股本原始数据失败：${canonicalCode} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const liftRestrictions =
        await this.companyBasicInfoClient.fetchLiftRestriction(normalizedCode);

      if (liftRestrictions.length > 0) {
        await this.prisma.liftRestriction.deleteMany({
          where: {
            stockCode: {
              in: stockCodeCandidates,
            },
          },
        });

        await this.prisma.liftRestriction.createMany({
          data: liftRestrictions.map((item) => ({
            stockCode: this.canonicalizeStockCode(item.dm || canonicalCode),
            rdate: item.rdate,
            ramount: item.ramount ?? null,
            rprice: item.rprice ?? null,
            batch: item.batch ? String(item.batch) : null,
            pdate: item.pdate,
          })),
        });
      }

      rawLiftRestrictionRecordCount = liftRestrictions.length;
      refreshed = true;
    } catch (error) {
      this.logger.warn(
        `刷新全A股解禁限售原始数据失败：${normalizedCode} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const topFlowHolders =
        await this.shareholderInfoClient.fetchCompanyTopFlowHolders(
          canonicalCode,
          startDate,
          endDate,
        );

      if (topFlowHolders.length > 0) {
        touchedTargetDate =
          touchedTargetDate ||
          this.hasTargetDateRecord(topFlowHolders, options.targetDate, ['jzrq', 'ggrq']);
        if (isDailyMode) {
          const jzrqList = Array.from(
            new Set(topFlowHolders.map((item) => item.jzrq).filter(Boolean)),
          );
          const deleteDateList = jzrqList.length > 0 ? jzrqList : [options.targetDate];

          await this.prisma.companyTopFlowHolders.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
              jzrq: {
                in: deleteDateList,
              },
            },
          });
        } else {
          await this.prisma.companyTopFlowHolders.deleteMany({
            where: {
              stockCode: {
                in: stockCodeCandidates,
              },
            },
          });
        }

        await this.prisma.companyTopFlowHolders.createMany({
          data: topFlowHolders.map((item) => ({
            stockCode: this.canonicalizeStockCode(item.dm || canonicalCode),
            ggrq: item.ggrq,
            jzrq: item.jzrq,
            gdmc: item.gdmc,
            gdlx: item.gdlx,
            cgsl: item.cgsl ?? null,
            bdyy: item.bdyy,
            cgbl: item.cgbl ?? null,
            gfxz: item.gfxz,
            cgpm: item.cgpm ? String(item.cgpm) : null,
          })),
        });
      }

      rawTopFlowHolderRecordCount = topFlowHolders.length;
      refreshed = true;
    } catch (error) {
      this.logger.warn(
        `刷新全A股十大流通股东原始数据失败：${canonicalCode} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const recentDividends =
        await this.financialQuartersEventsClient.fetchRecentDividend(normalizedCode);

      if (recentDividends.length > 0) {
        touchedTargetDate =
          touchedTargetDate ||
          this.hasTargetDateRecord(recentDividends, options.targetDate, ['jzrq', 'plrq', 'fhjzr']);
        if (isDailyMode) {
          const jzrqList = Array.from(
            new Set(recentDividends.map((item) => item.jzrq).filter(Boolean)),
          );
          const deleteDateList = jzrqList.length > 0 ? jzrqList : [options.targetDate];
          await this.prisma.recentDividend.deleteMany({
            where: {
              dm: {
                in: stockCodeCandidates,
              },
              jzrq: {
                in: deleteDateList,
              },
            },
          });
        } else {
          await this.prisma.recentDividend.deleteMany({
            where: {
              dm: {
                in: stockCodeCandidates,
              },
            },
          });
        }

        await this.prisma.recentDividend.createMany({
          data: recentDividends.map((item) => ({
            dm: this.normalizeStockCode(item.dm || normalizedCode),
            jzrq: item.jzrq,
            plrq: item.plrq,
            fhx: item.fhx,
            fhjyr: item.fhjyr,
            fhjzr: item.fhjzr,
            hf: item.hf,
            hfjyr: item.hfjyr,
            hfjzr: item.hfjzr,
            zf: item.zf,
            zfjyr: item.zfjyr,
            zfjzr: item.zfjzr,
          })),
        });
      }

      rawDividendRecordCount = recentDividends.length;
      refreshed = true;
    } catch (error) {
      this.logger.warn(
        `刷新全A股分红原始数据失败：${normalizedCode} - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      refreshed,
      touchedTargetDate,
      rawTopHolderRecordCount,
      rawShareholderCountRecordCount,
      rawCompanyCapitalRecordCount,
      rawLiftRestrictionRecordCount,
      rawTopFlowHolderRecordCount,
      rawDividendRecordCount,
    };
  }

  private assertTargetDateCoverage(options: {
    mode: 'full' | 'daily';
    targetDate: string;
    stockCount: number;
    targetDateTouchedStockCount: number;
  }): void {
    if (options.mode !== 'daily' || options.stockCount <= 0) {
      return;
    }

    const minTargetDateCoverage = this.parseRatioEnv(
      'BUSINESS_DATA_MIN_TARGET_DATE_COVERAGE',
      0,
    );
    if (minTargetDateCoverage <= 0) {
      return;
    }

    const coverage = options.targetDateTouchedStockCount / options.stockCount;
    if (coverage < minTargetDateCoverage) {
      throw new Error(
        `每日增量目标日期有效数据覆盖率不足，已阻断业务数据切换：targetDate=${options.targetDate}, touched=${options.targetDateTouchedStockCount}, total=${options.stockCount}, coverage=${(coverage * 100).toFixed(2)}%, min=${(minTargetDateCoverage * 100).toFixed(2)}%`,
      );
    }
  }

  private hasTargetDateRecord(
    rows: object[],
    targetDate: string,
    dateFields: string[],
  ): boolean {
    const normalizedTargetDate = this.normalizeDateKey(targetDate);
    return rows.some((row) =>
      dateFields.some((field) => this.normalizeDateKey(this.readObjectField(row, field)) === normalizedTargetDate),
    );
  }

  private readObjectField(row: object, field: string): unknown {
    return (row as Record<string, unknown>)[field];
  }

  private async syncInvestorsAndHoldingsFromRaw(
    targetSlot: BusinessDataSlot,
  ): Promise<InvestorHoldingSyncResult> {
    const minMarketValue = this.parseNonNegativeNumberEnv(
      'NATURAL_PERSON_MIN_MARKET_VALUE',
      0,
    );
    const minQuartersInOneStock = this.parsePositiveIntegerEnv(
      'NATURAL_PERSON_MIN_QUARTERS_IN_ONE_STOCK',
      1,
    );
    const minStockCount = this.parsePositiveIntegerEnv(
      'NATURAL_PERSON_MIN_STOCK_COUNT',
      1,
    );

    const rawRecords = await this.prisma.companyTopFlowHolders.findMany({
      where: {
        gdmc: { not: null },
        jzrq: { not: null },
        cgsl: { not: null },
      },
      select: {
        gdmc: true,
        gdlx: true,
        stockCode: true,
        jzrq: true,
        cgsl: true,
        cgbl: true,
      },
    });

    if (rawRecords.length === 0) {
      return {
        managedStockCodes: [],
        qualifiedInvestorCount: 0,
        investorCreated: 0,
        investorUpdated: 0,
        investorDisabled: 0,
        holdingRecordCount: 0,
        managedInvestorIds: [],
        qualifiedInvestorSnapshots: [],
        targetSlot,
      };
    }

    const managedStockCodes = new Set<string>();
    let skippedDirtyNameCount = 0;
    const categoryByName = new Map<string, InvestorCategory>();
    const grouped = new Map<
      string,
      Map<string, Map<string, { holdCount: number; holdRatio: number | null }>>
    >();

    for (const row of rawRecords) {
      const shareholderName = row.gdmc
        ?.replace(/\s+/gu, ' ')
        .trim();
      const reportDate = this.formatDateValue(row.jzrq);
      const canonicalStockCode = this.canonicalizeStockCode(row.stockCode);
      const holdCount = Math.max(0, Math.round(this.toNumber(row.cgsl) ?? 0));

      if (
        !shareholderName ||
        shareholderName.length > 100 ||
        !reportDate ||
        !canonicalStockCode ||
        holdCount <= 0
      ) {
        if (shareholderName && shareholderName.length > 100) {
          skippedDirtyNameCount += 1;
        }
        continue;
      }

      managedStockCodes.add(canonicalStockCode);
      const nextCategory = this.resolveInvestorCategory(
        row.gdlx,
        shareholderName,
      );
      const currentCategory = categoryByName.get(shareholderName);
      categoryByName.set(
        shareholderName,
        currentCategory === 'institution' || nextCategory === 'institution'
          ? 'institution'
          : 'personal',
      );

      if (!grouped.has(shareholderName)) {
        grouped.set(shareholderName, new Map());
      }

      const stockMap = grouped.get(shareholderName)!;
      if (!stockMap.has(canonicalStockCode)) {
        stockMap.set(canonicalStockCode, new Map());
      }

      const reportMap = stockMap.get(canonicalStockCode)!;
      const existing = reportMap.get(reportDate);
      const holdRatio = this.toNumber(row.cgbl);

      if (!existing || holdCount > existing.holdCount) {
        reportMap.set(reportDate, {
          holdCount,
          holdRatio,
        });
      }
    }

    if (skippedDirtyNameCount > 0) {
      this.logger.warn(
        `业务股东同步跳过超长/脏名称记录 ${skippedDirtyNameCount} 条，避免再次写入脏数据`,
      );
    }

    const stockMetaMap = await this.loadStockMeta(Array.from(managedStockCodes));
    const latestPriceMap = await this.loadLatestPriceMap(
      Array.from(managedStockCodes),
      stockMetaMap,
    );

    const qualified: QualifiedInvestorRow[] = [];
    for (const [name, stockMap] of grouped.entries()) {
      const holdings: HoldingSnapshotRow[] = [];
      let stockCount = 0;
      let maxQuartersInOneStock = 0;
      let totalMarketValue = 0;

      for (const [canonicalStockCode, reportMap] of stockMap.entries()) {
        const stockMeta = stockMetaMap.get(canonicalStockCode);
        if (!stockMeta) {
          continue;
        }

        const sortedReports = Array.from(reportMap.entries())
          .map(([reportDate, payload]) => ({
            stockCode: stockMeta.code,
            stockName: stockMeta.name,
            reportDate,
            holdCount: payload.holdCount,
            holdRatio: payload.holdRatio,
          }))
          .sort((a, b) => a.reportDate.localeCompare(b.reportDate));

        if (sortedReports.length === 0) {
          continue;
        }

        const latestHolding = sortedReports[sortedReports.length - 1];
        maxQuartersInOneStock = Math.max(maxQuartersInOneStock, sortedReports.length);

        if (latestHolding.holdCount > 0) {
          stockCount += 1;
          totalMarketValue +=
            latestHolding.holdCount * (latestPriceMap.get(canonicalStockCode) ?? 0);
        }

        holdings.push(...sortedReports);
      }

      if (
        maxQuartersInOneStock >= minQuartersInOneStock &&
        stockCount >= minStockCount &&
        totalMarketValue >= minMarketValue &&
        holdings.length > 0
      ) {
        qualified.push({
          name,
          category: categoryByName.get(name) ?? 'institution',
          stockCount,
          maxQuartersInOneStock,
          totalMarketValue: Number(totalMarketValue.toFixed(2)),
          holdings,
        });
      }
    }

    const managedNameList = Array.from(grouped.keys());
    const existingManagedInvestors = managedNameList.length
      ? await this.prisma.investor.findMany({
          where: {
            name: {
              in: managedNameList,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const existingByName = new Map(
      existingManagedInvestors.map((row) => [row.name, row.id]),
    );

    let investorCreated = 0;
    let investorUpdated = 0;
    const qualifiedInvestorIds = new Map<string, bigint>();

    for (const person of qualified) {
      const existingId = existingByName.get(person.name);

      if (existingId) {
        investorUpdated += 1;
        qualifiedInvestorIds.set(person.name, existingId);
        continue;
      }

      const created = await this.prisma.investor.create({
        data: {
          name: person.name,
          totalMarketValue: 0,
          stockCount: 0,
          category: person.category,
          isTracked: false,
        },
        select: {
          id: true,
        },
      });
      investorCreated += 1;
      qualifiedInvestorIds.set(person.name, created.id);
      existingByName.set(person.name, created.id);
    }

    const managedInvestorIds = Array.from(existingByName.values());
    const holdingRows = qualified.flatMap((person) => {
      const investorId = qualifiedInvestorIds.get(person.name);
      if (!investorId) {
        return [];
      }

      return person.holdings.flatMap((holding) => {
        const reportDate = this.parseDateValue(holding.reportDate);
        if (!reportDate) {
          return [];
        }

        return [
          {
            investorId,
            stockCode: holding.stockCode,
            stockName: holding.stockName,
            holdCount: BigInt(holding.holdCount),
            holdRatio: holding.holdRatio,
            reportDate,
            dataSlot: targetSlot,
          },
        ];
      });
    });

    await this.prisma.holding.deleteMany({
      where: {
        dataSlot: targetSlot,
      },
    });

    for (const chunk of this.chunkArray(holdingRows, 1000)) {
      if (chunk.length === 0) {
        continue;
      }

      await this.prisma.holding.createMany({
        data: chunk,
      });
    }

    return {
      managedStockCodes: Array.from(managedStockCodes),
      qualifiedInvestorCount: qualified.length,
      investorCreated,
      investorUpdated,
      investorDisabled: Math.max(0, managedInvestorIds.length - qualified.length),
      holdingRecordCount: holdingRows.length,
      managedInvestorIds,
      qualifiedInvestorSnapshots: qualified
        .map((person) => {
          const investorId = qualifiedInvestorIds.get(person.name);
          if (!investorId) {
            return null;
          }

          return {
            investorId,
            name: person.name,
            category: person.category,
            stockCount: person.stockCount,
            totalMarketValue: person.totalMarketValue,
            isTracked: true,
          };
        })
        .filter(
          (
            row,
          ): row is QualifiedInvestorSnapshot => row !== null,
        ),
      targetSlot,
    };
  }

  private async syncDividendsFromRaw(
    targetSlot: BusinessDataSlot,
  ): Promise<DividendSyncResult> {
    const rawDividends = await this.prisma.recentDividend.findMany({
      orderBy: [{ dm: 'asc' }, { jzrq: 'desc' }, { plrq: 'desc' }],
    });

    if (rawDividends.length === 0) {
      return {
        dividendRecordCount: 0,
        cashDividendRecordCount: 0,
        dividendYieldReadyRecordCount: 0,
        totalDividendReadyRecordCount: 0,
        targetSlot,
      };
    }

    const stockCodes = Array.from(
      new Set(rawDividends.map((row) => this.canonicalizeStockCode(row.dm))),
    );
    const stockMetaMap = await this.loadStockMeta(stockCodes);
    const latestPriceMap = await this.loadLatestPriceMap(stockCodes, stockMetaMap);

    const grouped = new Map<
      string,
      {
        stockCode: string;
        stockName: string;
        dividendYear: number;
        dividendDate: Date | null;
        cashDividend: number;
        bonusShare: number;
        transferShare: number;
        totalDividend: number | null;
        dividendYield: number | null;
        latestPrice: number | null;
      }
    >();

    for (const row of rawDividends) {
      const canonicalStockCode = this.canonicalizeStockCode(row.dm);
      const stockMeta = stockMetaMap.get(canonicalStockCode);
      if (!stockMeta) {
        continue;
      }

      const yearSource = row.jzrq || row.fhjzr || row.plrq;
      const dividendYear = yearSource ? parseInt(yearSource.slice(0, 4), 10) : 0;
      if (!this.isValidDividendYear(dividendYear)) {
        continue;
      }

      const dividendDate = this.parseDateValue(row.fhjzr || row.plrq || row.jzrq);
      const cashDividend = this.parseCashDividend(row.fhx);
      const bonusShare = this.parseBonusShare(row.hf);
      const transferShare = this.parseTransferShare(row.zf);
      if (
        (cashDividend ?? 0) <= 0 &&
        (bonusShare ?? 0) <= 0 &&
        (transferShare ?? 0) <= 0
      ) {
        continue;
      }

      const latestPrice =
        latestPriceMap.get(canonicalStockCode) ?? stockMeta.currentPrice ?? null;

      const key = `${stockMeta.code}::${dividendYear}`;
      const existing = grouped.get(key);
      const mergedCashDividend = Number(
        ((existing?.cashDividend ?? 0) + (cashDividend ?? 0)).toFixed(4),
      );
      const mergedBonusShare = Number(
        ((existing?.bonusShare ?? 0) + (bonusShare ?? 0)).toFixed(4),
      );
      const mergedTransferShare = Number(
        ((existing?.transferShare ?? 0) + (transferShare ?? 0)).toFixed(4),
      );
      const effectivePrice = latestPrice ?? existing?.latestPrice ?? null;
      const estimatedTotalShares =
        stockMeta.totalShares != null
          ? stockMeta.totalShares
          : effectivePrice && effectivePrice > 0 && stockMeta.totalMarketCap != null
            ? stockMeta.totalMarketCap / effectivePrice
          : null;
      const totalDividend =
        estimatedTotalShares != null
          ? Number((mergedCashDividend * estimatedTotalShares).toFixed(2))
          : null;
      const dividendYield =
        effectivePrice !== null && effectivePrice > 0
          ? Number(((mergedCashDividend / effectivePrice) * 100).toFixed(4))
          : null;

      grouped.set(key, {
        stockCode: stockMeta.code,
        stockName: stockMeta.name,
        dividendYear,
        dividendDate:
          existing?.dividendDate && dividendDate
            ? existing.dividendDate > dividendDate
              ? existing.dividendDate
              : dividendDate
            : existing?.dividendDate ?? dividendDate,
        cashDividend: mergedCashDividend,
        bonusShare: mergedBonusShare,
        transferShare: mergedTransferShare,
        totalDividend,
        dividendYield,
        latestPrice: effectivePrice,
      });
    }

    const rows = Array.from(grouped.values()).map(({ latestPrice: _latestPrice, ...row }) => row);
    if (rows.length === 0) {
      return {
        dividendRecordCount: 0,
        cashDividendRecordCount: 0,
        dividendYieldReadyRecordCount: 0,
        totalDividendReadyRecordCount: 0,
        targetSlot,
      };
    }

    await this.prisma.dividend.deleteMany({
      where: {
        dataSlot: targetSlot,
      },
    });

    for (const chunk of this.chunkArray(rows, 1000)) {
      if (chunk.length === 0) {
        continue;
      }

      await this.prisma.dividend.createMany({
        data: chunk.map((row) => ({
          ...row,
          dataSlot: targetSlot,
        })),
      });
    }

    await this.backfillDividendMetrics(targetSlot);
    const metricCoverage = await this.getDividendMetricCoverage(targetSlot);

    return {
      dividendRecordCount: rows.length,
      cashDividendRecordCount: metricCoverage.cashDividendRecordCount,
      dividendYieldReadyRecordCount: metricCoverage.dividendYieldReadyRecordCount,
      totalDividendReadyRecordCount: metricCoverage.totalDividendReadyRecordCount,
      targetSlot,
    };
  }

  private async getDividendMetricCoverage(targetSlot: BusinessDataSlot): Promise<{
    cashDividendRecordCount: number;
    dividendYieldReadyRecordCount: number;
    totalDividendReadyRecordCount: number;
  }> {
    const [coverage] = await this.prisma.$queryRaw<Array<{
      cashDividendRecordCount: bigint;
      dividendYieldReadyRecordCount: bigint;
      totalDividendReadyRecordCount: bigint;
    }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (
          WHERE "cashDividend" IS NOT NULL
            AND "cashDividend" > 0
        )::bigint AS "cashDividendRecordCount",
        COUNT(*) FILTER (
          WHERE "cashDividend" IS NOT NULL
            AND "cashDividend" > 0
            AND "dividendYield" IS NOT NULL
        )::bigint AS "dividendYieldReadyRecordCount",
        COUNT(*) FILTER (
          WHERE "cashDividend" IS NOT NULL
            AND "cashDividend" > 0
            AND "totalDividend" IS NOT NULL
            AND "totalDividend" > 0
        )::bigint AS "totalDividendReadyRecordCount"
      FROM dividends
      WHERE "dataSlot" = ${targetSlot}::"BusinessDataSlot"
    `);

    return {
      cashDividendRecordCount: Number(coverage?.cashDividendRecordCount ?? 0),
      dividendYieldReadyRecordCount: Number(coverage?.dividendYieldReadyRecordCount ?? 0),
      totalDividendReadyRecordCount: Number(coverage?.totalDividendReadyRecordCount ?? 0),
    };
  }

  private async backfillDividendMetrics(targetSlot: BusinessDataSlot): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      WITH latest_history_price AS (
        SELECT DISTINCT ON (split_part(h.dm, '.', 1))
          split_part(h.dm, '.', 1) AS "normalizedCode",
          h.c AS "currentPrice"
        FROM hs_stock_history_trading h
        WHERE h.model = 'n'
          AND h.c IS NOT NULL
        ORDER BY split_part(h.dm, '.', 1), split_part(h.t, ' ', 1) DESC, h.t DESC
      ),
      latest_capital AS (
        SELECT DISTINCT ON (split_part(cc."stockCode", '.', 1))
          split_part(cc."stockCode", '.', 1) AS "normalizedCode",
          cc.zgb AS "totalShares"
        FROM company_capitals cc
        WHERE cc.zgb IS NOT NULL
        ORDER BY split_part(cc."stockCode", '.', 1), cc.plrq DESC NULLS LAST, cc.bdrq DESC NULLS LAST, cc."createdAt" DESC
      ),
      price_meta AS (
        SELECT
          s.code AS "stockCode",
          split_part(s.code, '.', 1) AS "normalizedCode",
          COALESCE(lhp."currentPrice", s."currentPrice") AS "currentPrice",
          lc."totalShares" AS "totalShares",
          COALESCE(
            s."totalMarketCap",
            CASE
              WHEN lc."totalShares" IS NOT NULL
                AND COALESCE(lhp."currentPrice", s."currentPrice") IS NOT NULL
                THEN lc."totalShares" * COALESCE(lhp."currentPrice", s."currentPrice")
              ELSE NULL
            END
          ) AS "totalMarketCap"
        FROM stocks s
        LEFT JOIN latest_history_price lhp
          ON split_part(s.code, '.', 1) = lhp."normalizedCode"
        LEFT JOIN latest_capital lc
          ON split_part(s.code, '.', 1) = lc."normalizedCode"
      )
      UPDATE dividends d
      SET
        "dividendYield" = CASE
          WHEN pm."currentPrice" IS NOT NULL
            AND pm."currentPrice" > 0
            THEN ROUND((d."cashDividend" / pm."currentPrice" * 100)::numeric, 4)
          ELSE d."dividendYield"
        END,
        "totalDividend" = COALESCE(
          NULLIF(d."totalDividend", 0),
          CASE
            WHEN pm."totalShares" IS NOT NULL
              THEN ROUND((d."cashDividend" * pm."totalShares")::numeric, 2)
            WHEN pm."totalMarketCap" IS NOT NULL
              AND pm."currentPrice" IS NOT NULL
              AND pm."currentPrice" > 0
              THEN ROUND((d."cashDividend" * pm."totalMarketCap" / pm."currentPrice")::numeric, 2)
            ELSE NULL
          END
        ),
        "updatedAt" = now()
      FROM price_meta pm
      WHERE split_part(d."stockCode", '.', 1) = pm."normalizedCode"
        AND d."dataSlot" = ${targetSlot}::"BusinessDataSlot"
        AND d."cashDividend" IS NOT NULL
        AND (
          (pm."currentPrice" IS NOT NULL AND pm."currentPrice" > 0)
          OR pm."totalShares" IS NOT NULL
        )
    `);
  }

  private async syncExecutiveTradesFromMairui(
    sourceStockCodes: string[],
    targetSlot: BusinessDataSlot,
  ): Promise<ExecutiveTradeSyncResult> {
    if (sourceStockCodes.length === 0) {
      return {
        executiveTradeRecordCount: 0,
        targetSlot,
      };
    }

    const stockMetaMap = await this.loadStockMeta(sourceStockCodes);
    const parsedRows: Prisma.ExecutiveTradeCreateManyInput[] = [];
    const refreshedStockCodes = new Set<string>();
    const seen = new Set<string>();
    let failedStockCount = 0;
    let probedStockCount = 0;

    for (const sourceStockCode of sourceStockCodes) {
      const stockMeta = stockMetaMap.get(sourceStockCode);
      if (!stockMeta) {
        continue;
      }

      let trades: any[] = [];
      try {
        probedStockCount += 1;
        trades = await this.fetchExecutiveTradesWithFallbacks(sourceStockCode);
      } catch (error) {
        failedStockCount += 1;
        this.logger.warn(
          `高管交易同步失败：${sourceStockCode} - ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }

      if (!Array.isArray(trades) || trades.length === 0) {
        continue;
      }

      const stockRows = trades
        .map((trade) => this.mapExecutiveTradeRow(stockMeta, trade))
        .filter((row): row is Prisma.ExecutiveTradeCreateManyInput => row !== null);

      if (stockRows.length === 0) {
        continue;
      }

      refreshedStockCodes.add(stockMeta.code);
      for (const row of stockRows) {
        const dedupeKey = [
          row.stockCode,
          row.executiveName,
          row.executivePosition,
          row.tradeType,
          new Date(row.tradeDate).toISOString(),
          new Date(row.reportDate).toISOString(),
          row.tradeCount.toString(),
          row.tradeAmount ?? '',
        ].join('::');

        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          parsedRows.push(row);
        }
      }

      await this.sleep(150);
    }

    if (failedStockCount > 0) {
      this.logger.warn(`高管交易同步存在单股失败：failed=${failedStockCount}, total=${sourceStockCodes.length}`);
    }

    if (refreshedStockCodes.size === 0 || parsedRows.length === 0) {
      if (probedStockCount > 0 && failedStockCount === probedStockCount) {
        throw new Error(`高管交易接口全部请求失败，已阻断业务数据同步：failed=${failedStockCount}`);
      }

      const shouldBlockEmptyExecutiveTrades = this.parseBooleanEnv(
        'BUSINESS_DATA_BLOCK_EMPTY_EXECUTIVE_TRADES',
        false,
      );
      if (shouldBlockEmptyExecutiveTrades) {
        throw new Error(
          `高管交易同步结果为空，已阻断业务数据同步：probed=${probedStockCount}, failed=${failedStockCount}`,
        );
      }

      this.logger.warn(
        `高管交易同步结果为空，继续业务数据同步：probed=${probedStockCount}, failed=${failedStockCount}。如需生产强阻断，请设置 BUSINESS_DATA_BLOCK_EMPTY_EXECUTIVE_TRADES=true`,
      );

      return {
        executiveTradeRecordCount: 0,
        targetSlot,
      };
    }

    await this.prisma.executiveTrade.deleteMany({
      where: {
        dataSlot: targetSlot,
        stockCode: {
          in: Array.from(refreshedStockCodes),
        },
      },
    });

    for (const chunk of this.chunkArray(parsedRows, 500)) {
      if (chunk.length === 0) {
        continue;
      }

      await this.prisma.executiveTrade.createMany({
        data: chunk.map((row) => ({
          ...row,
          dataSlot: targetSlot,
        })),
      });
    }

    return {
      executiveTradeRecordCount: parsedRows.length,
      targetSlot,
    };
  }

  private async loadStockMeta(stockCodes: string[]): Promise<Map<string, StockMeta>> {
    const normalizedCodes = Array.from(
      new Set(stockCodes.map((code) => this.canonicalizeStockCode(code))),
    );
    const allCandidates = Array.from(
      new Set(normalizedCodes.flatMap((code) => this.getStockCodeCandidates(code))),
    );

    const [stocks, capitalRows] = await Promise.all([
      this.prisma.stock.findMany({
        where: {
          code: {
            in: allCandidates,
          },
        },
        select: {
          code: true,
          name: true,
          currentPrice: true,
          totalMarketCap: true,
        },
      }),
      allCandidates.length === 0
        ? Promise.resolve([])
        : this.prisma.companyCapital.findMany({
            where: {
              stockCode: {
                in: allCandidates,
              },
              zgb: {
                not: null,
              },
            },
            select: {
              stockCode: true,
              zgb: true,
              plrq: true,
              bdrq: true,
              createdAt: true,
            },
            orderBy: [
              { stockCode: 'asc' },
              { plrq: 'desc' },
              { bdrq: 'desc' },
              { createdAt: 'desc' },
            ],
          }),
    ]);

    const totalSharesByCode = new Map<string, number>();
    for (const row of capitalRows) {
      if (!totalSharesByCode.has(row.stockCode) && row.zgb != null) {
        totalSharesByCode.set(row.stockCode, Number(row.zgb));
      }
    }

    const stockByCode = new Map(
      stocks.map((stock) => [
        stock.code,
        {
          code: stock.code,
          name: stock.name,
          currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
          totalMarketCap: stock.totalMarketCap ? Number(stock.totalMarketCap) : null,
          totalShares: totalSharesByCode.get(stock.code) ?? null,
        },
      ]),
    );

    const result = new Map<string, StockMeta>();
    for (const stockCode of normalizedCodes) {
      const candidates = this.getStockCodeCandidates(stockCode);
      const matched = candidates
        .map((candidate) => stockByCode.get(candidate))
        .find((candidate): candidate is StockMeta => Boolean(candidate));

      if (matched) {
        result.set(stockCode, matched);
      }
    }

    return result;
  }

  private async backfillStockLatestPrices(stockCodes: string[]): Promise<number> {
    if (stockCodes.length === 0) {
      return 0;
    }

    const stockMetaMap = await this.loadStockMeta(stockCodes);
    const latestPriceMap = await this.loadLatestPriceMap(stockCodes, stockMetaMap);
    const updates = Array.from(latestPriceMap.entries())
      .map(([canonicalStockCode, currentPrice]) => {
        const stockMeta = stockMetaMap.get(canonicalStockCode);
        if (!stockMeta) {
          return null;
        }

        const totalMarketCap =
          stockMeta.totalMarketCap ??
          (stockMeta.totalShares != null
            ? Number((stockMeta.totalShares * currentPrice).toFixed(2))
            : null);

        return {
          code: stockMeta.code,
          currentPrice,
          totalMarketCap,
        };
      })
      .filter(
        (
          row,
        ): row is { code: string; currentPrice: number; totalMarketCap: number | null } =>
          Boolean(row),
      );

    if (updates.length === 0) {
      return 0;
    }

    const priceUpdatedAt = new Date();
    for (const chunk of this.chunkArray(updates, 500)) {
      await this.prisma.$transaction(
        chunk.map((row) =>
          this.prisma.stock.update({
            where: { code: row.code },
            data: {
              currentPrice: row.currentPrice,
              totalMarketCap: row.totalMarketCap,
              priceUpdatedAt,
            },
          }),
        ),
      );
    }

    return updates.length;
  }

  private async loadLatestPriceMap(
    stockCodes: string[],
    stockMetaMap: Map<string, StockMeta>,
  ): Promise<Map<string, number>> {
    const normalizedCodes = Array.from(
      new Set(stockCodes.map((code) => this.canonicalizeStockCode(code))),
    );
    const allCandidates = Array.from(
      new Set(normalizedCodes.flatMap((code) => this.getStockCodeCandidates(code))),
    );

    const latestRows =
      allCandidates.length === 0
        ? []
        : await this.prisma.$queryRaw<Array<{ dm: string; c: number | null }>>(Prisma.sql`
            SELECT DISTINCT ON (dm) dm, c
            FROM hs_stock_history_trading
            WHERE dm IN (${Prisma.join(allCandidates)})
              AND model = 'n'
              AND c IS NOT NULL
            ORDER BY dm, t DESC
          `);

    const latestByCode = new Map<string, number>();
    for (const row of latestRows) {
      if (row.c !== null && row.c !== undefined) {
        latestByCode.set(row.dm, Number(row.c));
      }
    }

    const priceMap = new Map<string, number>();
    for (const stockCode of normalizedCodes) {
      const candidates = this.getStockCodeCandidates(stockCode);
      const matched = candidates.find((candidate) => latestByCode.has(candidate));
      if (matched) {
        priceMap.set(stockCode, latestByCode.get(matched)!);
        continue;
      }

      const fallbackPrice = stockMetaMap.get(stockCode)?.currentPrice;
      if (fallbackPrice !== null && fallbackPrice !== undefined) {
        priceMap.set(stockCode, fallbackPrice);
      }
    }

    return priceMap;
  }

  private async fetchExecutiveTradesWithFallbacks(stockCode: string): Promise<any[]> {
    const candidates = Array.from(
      new Set([stockCode, this.normalizeStockCode(stockCode)].filter(Boolean)),
    );

    for (const candidate of candidates) {
      const data = await this.mairuiService.getExecutiveTradesStrict(candidate);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }

    return [];
  }

  private mapExecutiveTradeRow(
    stockMeta: StockMeta,
    raw: Record<string, unknown>,
  ): Prisma.ExecutiveTradeCreateManyInput | null {
    const executiveName = this.firstNonEmpty(
      raw.ggxm,
      raw.name,
      raw.executiveName,
      raw.xm,
    );
    if (!executiveName) {
      return null;
    }

    const executivePosition =
      this.firstNonEmpty(raw.ggzw, raw.title, raw.executivePosition, raw.zw) || '未知';

    const rawTradeCount = this.toNumber(
      raw.bdsj ?? raw.tradeCount ?? raw.count ?? raw.sl ?? raw.num,
    );
    const rawTradeAmount = this.toNumber(
      raw.bdje ?? raw.tradeAmount ?? raw.amount ?? raw.je ?? raw.money,
    );
    const tradePrice = this.toNumber(raw.bdjg ?? raw.tradePrice ?? raw.price ?? raw.jg);
    const tradeType = this.parseExecutiveTradeType(raw, rawTradeCount, rawTradeAmount);
    const tradeCount = Math.max(0, Math.round(Math.abs(rawTradeCount ?? 0)));
    const tradeAmount =
      rawTradeAmount !== null && rawTradeAmount !== undefined
        ? Number(Math.abs(rawTradeAmount).toFixed(2))
        : tradePrice !== null && tradeCount > 0
          ? Number((tradePrice * tradeCount).toFixed(2))
          : null;

    const tradeDate =
      this.parseDateValue(raw.bdrq ?? raw.tradeDate ?? raw.rq) ||
      this.parseRangeDate(raw.bdqj, 'start');
    const reportDate =
      this.parseDateValue(raw.ggrq ?? raw.reportDate ?? raw.plrq) ||
      this.parseRangeDate(raw.bdqj, 'end') ||
      tradeDate;

    if (!tradeDate || !reportDate) {
      return null;
    }

    if (tradeCount === 0 && (tradeAmount === null || tradeAmount === 0) && tradePrice === null) {
      return null;
    }

    return {
      stockCode: stockMeta.code,
      stockName: stockMeta.name,
      executiveName,
      executivePosition,
      tradeType,
      tradeCount: BigInt(tradeCount),
      tradePrice,
      tradeAmount,
      tradeDate,
      reportDate,
    };
  }

  private parseExecutiveTradeType(
    raw: Record<string, unknown>,
    tradeCount: number | null,
    tradeAmount: number | null,
  ): TradeType {
    const directionText = this.firstNonEmpty(
      raw.bdfx,
      raw.bdlx,
      raw.bdyy,
      raw.desc,
      raw.direction,
      raw.type,
    );

    if (directionText?.includes('减') || directionText?.includes('卖')) {
      return 'DECREASE';
    }

    if (directionText?.includes('平') || directionText?.includes('不变')) {
      return 'SAME';
    }

    if (directionText?.includes('增') || directionText?.includes('买')) {
      return 'INCREASE';
    }

    if ((tradeCount ?? 0) < 0 || (tradeAmount ?? 0) < 0) {
      return 'DECREASE';
    }

    if ((tradeCount ?? 0) === 0 && (tradeAmount ?? 0) === 0) {
      return 'SAME';
    }

    return 'INCREASE';
  }

  private parseCashDividend(value: string | null): number | null {
    return this.parsePerTenValue(value, ['派'], '元');
  }

  private isValidDividendYear(year: number): boolean {
    if (!Number.isInteger(year)) {
      return false;
    }

    const currentYear = new Date().getUTCFullYear();
    return year >= 1990 && year <= currentYear + 1;
  }

  private parseBonusShare(value: string | null): number | null {
    return this.parsePerTenValue(value, ['送'], '股');
  }

  private parseTransferShare(value: string | null): number | null {
    return this.parsePerTenValue(value, ['转增', '转'], '股');
  }

  private parsePerTenValue(
    value: string | null,
    verbs: string[],
    unit: string,
  ): number | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed === '--') {
      return null;
    }

    // 新迈瑞分红接口直接返回每 10 股的纯数字值，例如 "21.78"。
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number((parseFloat(trimmed) / 10).toFixed(4));
    }

    for (const verb of verbs) {
      const directPattern = new RegExp(
        `每\\s*10\\s*股\\s*${verb}\\s*([\\d.]+)\\s*${unit}`,
      );
      const shortPattern = new RegExp(`10\\s*${verb}\\s*([\\d.]+)\\s*${unit}`);
      const directMatch = trimmed.match(directPattern);
      const shortMatch = trimmed.match(shortPattern);
      const matched = directMatch?.[1] ?? shortMatch?.[1];

      if (matched) {
        return Number((parseFloat(matched) / 10).toFixed(4));
      }
    }

    return null;
  }

  private parseDateValue(value: unknown): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^\d{8}$/.test(trimmed)) {
      const year = Number(trimmed.slice(0, 4));
      const month = Number(trimmed.slice(4, 6));
      const day = Number(trimmed.slice(6, 8));
      const parsed = new Date(Date.UTC(year, month - 1, day));

      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
      ) {
        return null;
      }

      return parsed;
    }

    const normalized = trimmed.replace(/\//g, '-').slice(0, 10);
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized) && parsed.toISOString().slice(0, 10) !== normalized) {
      return null;
    }

    return parsed;
  }

  private formatDateValue(value: unknown): string | null {
    const parsed = this.parseDateValue(value);
    return parsed ? parsed.toISOString().slice(0, 10) : null;
  }

  private normalizeDateKey(value: unknown): string | null {
    const formatted = this.formatDateValue(value);
    return formatted ? formatted.replace(/-/g, '') : null;
  }

  private parseRangeDate(value: unknown, part: 'start' | 'end'): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const [start, end] = value.split('~').map((item) => item.trim());
    return this.parseDateValue(part === 'start' ? start : end || start);
  }

  private firstNonEmpty(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private normalizeAStockListItem(raw: Record<string, unknown>): { code: string; name: string } | null {
    const code = this.firstNonEmpty(raw.code, raw.dm, raw.symbol);
    if (!code) {
      return null;
    }

    const rawMarket = this.firstNonEmpty(raw.market, raw.jys, raw.exchange);
    if (rawMarket && (rawMarket.includes('HK') || rawMarket.includes('港') || rawMarket.includes('US') || rawMarket.includes('美'))) {
      return null;
    }

    const normalizedCode = this.canonicalizeStockCode(code);
    if (normalizedCode.endsWith('.HK') || normalizedCode.endsWith('.US')) {
      return null;
    }

    return {
      code: normalizedCode,
      name: this.firstNonEmpty(raw.name, raw.mc, raw.stockName) || normalizedCode,
    };
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'string') {
      const matched = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
      if (!matched) {
        return null;
      }

      const parsed = Number(matched[0]);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof value === 'object' && value && 'toNumber' in value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeStockCode(code: string): string {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      return '';
    }

    const parts = trimmed.split('.').filter(Boolean);
    const rawCode = parts[0] ?? trimmed;
    const normalizedRawCode = rawCode.replace(/^(SH|SZ|BJ|HK|US)/, '');
    if (/^\d+$/.test(normalizedRawCode)) {
      return normalizedRawCode;
    }

    if (parts.length > 1) {
      const suffixCandidate = parts[1].replace(/^(SH|SZ|BJ|HK|US)/, '');
      if (/^\d+$/.test(suffixCandidate)) {
        return suffixCandidate;
      }
    }

    return normalizedRawCode || rawCode;
  }

  private canonicalizeStockCode(code: string): string {
    const normalized = this.normalizeStockCode(code);
    return normalized ? this.addExchangeSuffix(normalized) : code.trim().toUpperCase();
  }

  private addExchangeSuffix(code: string): string {
    const normalized = this.normalizeStockCode(code);
    if (!normalized) {
      return code.trim().toUpperCase();
    }

    if (
      normalized.startsWith('43') ||
      normalized.startsWith('83') ||
      normalized.startsWith('87') ||
      normalized.startsWith('92')
    ) {
      return `${normalized}.BJ`;
    }

    if (normalized.startsWith('688') || normalized.startsWith('689')) {
      return `${normalized}.SH`;
    }

    if (normalized.startsWith('6') || normalized.startsWith('9')) {
      return `${normalized}.SH`;
    }

    return `${normalized}.SZ`;
  }

  private getStockCodeCandidates(code: string): string[] {
    const raw = code.trim().toUpperCase();
    const normalized = this.normalizeStockCode(code);
    const canonical = this.canonicalizeStockCode(code);

    return Array.from(
      new Set([raw, canonical, normalized, this.addExchangeSuffix(normalized)].filter(Boolean)),
    );
  }

  private parseNonNegativeNumberEnv(name: string, fallback: number): number {
    const rawValue = process.env[name];
    if (!rawValue) {
      return fallback;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.max(0, parsed);
  }

  private parsePositiveIntegerEnv(name: string, fallback: number): number {
    const rawValue = process.env[name];
    if (!rawValue) {
      return fallback;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.max(1, Math.floor(parsed));
  }

  private parseBooleanEnv(name: string, fallback: boolean): boolean {
    const rawValue = process.env[name];
    if (!rawValue) {
      return fallback;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }

    return fallback;
  }

  private parseRatioEnv(name: string, fallback: number): number {
    const parsed = this.parseNonNegativeNumberEnv(name, fallback);
    return Math.min(1, Math.max(0, parsed));
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
