/**
 * DataSyncTask - 数据同步定时任务
 *
 * 负责调度所有数据模块的定时同步任务
 * 支持手动触发和自动调度
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { BaseSyncTask } from './base-sync.task';
import { StockSyncTask } from './stock-sync.task';
import { KlineSyncTask } from './kline-sync.task';
import { BusinessDataSyncTask } from './business-data-sync.task';
import { StarInvestorService } from '@/domain/star-investor/star-investor.service';

export type DataSyncModule =
  | 'company_basic_info'
  | 'shareholder_info'
  | 'stock_realtime'
  | 'historical_trading'
  | 'financial_indicators'
  | 'financial_statements'
  | 'index_realtime'
  | 'major_market_lists'
  | 'stock_list'
  | 'business_data'
  | 'star_investor_holdings';

@Injectable()
export class DataSyncTask extends BaseSyncTask {
  protected readonly logger = new Logger(DataSyncTask.name);

  constructor(
    protected prisma: PrismaService,
    private readonly stockSyncTask: StockSyncTask,
    private readonly klineSyncTask: KlineSyncTask,
    private readonly businessDataSyncTask: BusinessDataSyncTask,
    private readonly starInvestorService: StarInvestorService,
  ) {
    super(prisma);
  }

  /**
   * 股票列表同步 - 交易日 9:30
   */
  @Cron('30 9 * * 1-5', { timeZone: 'Asia/Shanghai' })
  async syncStockList() {
    await this.execute('stock_list', () => this.stockSyncTask.syncStockList());
  }

  /**
   * 实时行情同步 - 交易时段每 5 分钟
   */
  @Cron('*/5 9-15 * * 1-5', { timeZone: 'Asia/Shanghai' })
  async syncRealtimeQuotes() {
    await this.execute('stock_realtime', () => this.stockSyncTask.syncRealtimeQuotes());
  }

  /**
   * 公司基本信息同步
   *
   * 该数据已纳入凌晨 4 点业务双源同步，避免额外晚间定时全量重跑。
   * 如需立即刷新，可通过手动触发 `company_basic_info` 执行。
   */
  async syncCompanyBasicInfo() {
    await this.execute('company_basic_info', async () => {
      return this.businessDataSyncTask.syncBusinessData();
    });
  }

  /**
   * 股东信息同步
   *
   * 该数据已纳入凌晨 4 点业务双源同步，避免额外晚间定时全量重跑。
   * 如需立即刷新，可通过手动触发 `shareholder_info` 执行。
   */
  async syncShareholderInfo() {
    await this.execute('shareholder_info', async () => {
      return this.businessDataSyncTask.syncBusinessData();
    });
  }

  /**
   * 财务指标同步
   *
   * 该数据已纳入凌晨 4 点业务双源同步，避免额外晚间定时全量重跑。
   * 如需立即刷新，可通过手动触发 `financial_indicators` 执行。
   */
  async syncFinancialIndicators() {
    await this.execute('financial_indicators', async () => {
      return this.businessDataSyncTask.syncBusinessData();
    });
  }

  /**
   * 历史交易数据同步 - 交易日 17:30
   */
  @Cron('30 17 * * 1-5', { timeZone: 'Asia/Shanghai' })
  async syncHistoricalTrading() {
    await this.execute('historical_trading', async () => {
      const klineCount = await this.klineSyncTask.syncTodayKline();
      const gainerCount = await this.klineSyncTask.recalcAllPeriodGainers();
      return klineCount + gainerCount;
    });
  }

  /**
   * 主要市场榜单同步 - 交易日 16:00
   */
  @Cron('0 16 * * 1-5', { timeZone: 'Asia/Shanghai' })
  async syncMajorMarketLists() {
    await this.execute('major_market_lists', async () => {
      const [limitUpCount, limitDownCount] = await Promise.all([
        this.stockSyncTask.syncLimitUp(),
        this.stockSyncTask.syncLimitDown(),
      ]);
      return limitUpCount + limitDownCount;
    });
  }

  /**
   * TradingKey 明星投资人同步 - 每天 5:10 单次
   *
   * 新报告期自动全量获取持仓；同报告期只获取股票买卖记录并增量更新当前持仓。
   */
  @Cron('10 5 * * *', { timeZone: 'Asia/Shanghai' })
  async syncStarInvestorHoldings() {
    await this.execute('star_investor_holdings', () => this.starInvestorService.syncAll());
  }

  /**
   * 手动触发指定模块的同步
   * @param module 模块名称
   * @param params 同步参数
   */
  async triggerManualSync(module: DataSyncModule, params?: any): Promise<{
    success: boolean;
    taskId?: string;
    recordCount?: number;
    message?: string;
  }> {
    this.logger.log(`手动触发同步任务：${module}`);

    try {
      const taskId = `${module}_${Date.now()}`;

      const recordCount = await this.executeManualModule(module);

      return {
        success: true,
        taskId,
        recordCount,
        message: `同步任务已完成：${module}，记录数=${recordCount}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`手动触发同步失败：${module}`, error);

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  private async executeManualModule(module: DataSyncModule): Promise<number> {
    const result = await this.execute(module, () => this.runManualModule(module));
    if (!result.success) {
      throw new Error(result.message || `同步任务失败：${module}`);
    }
    return result.recordCount ?? 0;
  }

  private async runManualModule(module: DataSyncModule): Promise<number> {
    switch (module) {
      case 'stock_list':
        return this.stockSyncTask.syncStockList();
      case 'stock_realtime':
        return this.stockSyncTask.syncRealtimeQuotes();
      case 'historical_trading': {
        const klineCount = await this.klineSyncTask.syncTodayKline();
        const gainerCount = await this.klineSyncTask.recalcAllPeriodGainers();
        return klineCount + gainerCount;
      }
      case 'major_market_lists': {
        const [limitUpCount, limitDownCount] = await Promise.all([
          this.stockSyncTask.syncLimitUp(),
          this.stockSyncTask.syncLimitDown(),
        ]);
        return limitUpCount + limitDownCount;
      }
      case 'company_basic_info':
      case 'shareholder_info':
      case 'financial_indicators':
      case 'financial_statements':
      case 'business_data':
        return this.businessDataSyncTask.syncBusinessData();
      case 'star_investor_holdings':
        return this.starInvestorService.syncAll();
      case 'index_realtime':
        this.logger.warn('index_realtime 尚未接入独立定时服务，已跳过');
        return 0;
      default: {
        const exhaustiveCheck: never = module;
        throw new Error(`不支持的同步模块：${exhaustiveCheck}`);
      }
    }
  }

  /**
   * 查询同步任务状态
   * @param taskId 任务 ID
   */
  async getSyncStatus(taskId: string): Promise<{
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    recordCount?: number;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }> {
    const startedAtMatch = taskId.match(/_(\d+)$/);
    const startedAt = startedAtMatch ? new Date(Number(startedAtMatch[1])) : null;
    const module = taskId.replace(/_\d+$/, '');
    const log = await this.prisma.syncLog.findFirst({
      where: {
        taskName: module,
        ...(startedAt ? { startTime: { gte: startedAt } } : {}),
      },
      orderBy: { startTime: 'desc' },
    });

    if (log) {
      return {
        status:
          log.status === 'RUNNING'
            ? 'running'
            : log.status === 'SUCCESS'
              ? 'completed'
              : 'failed',
        progress: log.status === 'RUNNING' ? 50 : 100,
        recordCount: log.recordCount ?? undefined,
        error: log.status === 'FAILED' ? log.message ?? undefined : undefined,
        startedAt: log.startTime,
        completedAt: log.endTime ?? undefined,
      };
    }

    return {
      status: 'pending',
      progress: 0,
    };
  }

  /**
   * 查询同步历史
   * @param page 页码
   * @param pageSize 每页数量
   * @param module 模块名称（可选）
   * @param status 状态（可选）
   */
  async getSyncHistory(
    page: number,
    pageSize: number,
    module?: string,
    status?: 'SUCCESS' | 'FAILED',
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: any = {};

    if (module) {
      where.taskName = module;
    }

    if (status) {
      where.status = status;
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.syncLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.syncLog.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }
}
