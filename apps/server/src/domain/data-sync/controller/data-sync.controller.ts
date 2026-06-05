/**
 * DataSyncController - 数据同步控制器
 *
 * 提供手动触发同步、查询同步状态、查询同步历史的 API 端点
 * 遵循 3 层架构规范：Controller → Service → Repository/Infrastructure
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataSyncService } from '../service/data-sync.service';
import { BusinessDataSyncService } from '../service/business-data-sync.service';
import { SyncParamsDto } from '../dto/sync-params.dto';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';

interface SyncResponse {
  success: boolean;
  recordCount: number;
  duration: number;
  error?: string;
  message?: string;
}

interface SyncStatusResponse {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  recordCount?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface SyncHistoryResponse {
  list: any[];
  total: number;
  page: number;
  pageSize: number;
}

@ApiTags('DataSync')
@Controller('data-sync')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class DataSyncController {
  private readonly logger = new Logger(DataSyncController.name);

  constructor(
    private readonly dataSyncService: DataSyncService,
    private readonly businessDataSyncService: BusinessDataSyncService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动触发数据同步' })
  @ApiResponse({
    status: 200,
    description: '同步成功',
    type: Object,
  })
  async sync(
    @Body() body: { module?: string; params?: SyncParamsDto },
  ): Promise<SyncResponse> {
    const { module, params } = body;
    const startedAt = Date.now();
    this.logger.log(`手动触发同步：module=${module}, params=${JSON.stringify(params)}`);

    try {
      let result: SyncResponse;

      switch (module) {
        // 公司基本信息模块
        case 'company_intro':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncCompanyIntro(params.stockCode);
          break;

        case 'company_capital':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncCompanyCapital(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'lift_restriction':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncLiftRestriction(params.stockCode);
          break;

        // 股东信息模块
        case 'shareholder_count':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncShareholderCount(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'company_top_holders':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncCompanyTopHolders(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'company_top_flow_holders':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncCompanyTopFlowHolders(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        // 实时数据模块
        case 'kc_stock_realtime':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncKcStockRealTimeData(params.stockCode);
          break;

        case 'hs_index_realtime':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncHsIndexRealTimeData(params.indexCode);
          break;

        case 'hf_fund_realtime':
          if (!params?.fundCode) {
            return { success: false, recordCount: 0, duration: 0, message: '基金代码不能为空' };
          }
          result = await this.dataSyncService.syncHfFundRealTimeData(params.fundCode);
          break;

        case 'hk_stock_realtime':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncHkStockRealTimeData(params.stockCode);
          break;

        case 'bj_stock_realtime':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncBjStockRealTimeData(params.stockCode);
          break;

        // 历史交易数据模块
        case 'hs_index_history_trading':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          if (!params?.level) {
            return { success: false, recordCount: 0, duration: 0, message: '分时级别不能为空' };
          }
          result = await this.dataSyncService.syncHsIndexHistoryTrading(
            params.indexCode,
            params.level,
            params.startDate,
            params.endDate,
          );
          break;

        case 'hs_index_latest_trading':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          if (!params?.level) {
            return { success: false, recordCount: 0, duration: 0, message: '分时级别不能为空' };
          }
          result = await this.dataSyncService.syncHsIndexLatestTrading(params.indexCode, params.level);
          break;

        case 'hs_stock_latest_trading':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          if (!params?.level) {
            return { success: false, recordCount: 0, duration: 0, message: '分时级别不能为空' };
          }
          if (!params?.adjustType) {
            return { success: false, recordCount: 0, duration: 0, message: '除权方式不能为空' };
          }
          result = await this.dataSyncService.syncHsStockLatestTrading(
            params.stockCode,
            params.level,
            params.adjustType,
            params.latest,
          );
          break;

        case 'hs_stock_history_trading':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          if (!params?.level) {
            return { success: false, recordCount: 0, duration: 0, message: '分时级别不能为空' };
          }
          if (!params?.adjustType) {
            return { success: false, recordCount: 0, duration: 0, message: '除权方式不能为空' };
          }
          result = await this.dataSyncService.syncHsStockHistoryTrading(
            params.stockCode,
            params.level,
            params.adjustType,
            params.startDate,
            params.endDate,
            params.latest,
          );
          break;

        // 财务核心指标模块
        case 'financial_main_indicators':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncFinancialMainIndicators(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'financial_indicators':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncFinancialIndicators(params.stockCode);
          break;

        case 'performance_forecast':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncPerformanceForecast(params.stockCode);
          break;

        // 股票池分类模块
        case 'limit_down_pool':
          if (!params?.date) {
            return { success: false, recordCount: 0, duration: 0, message: '日期参数不能为空' };
          }
          result = await this.dataSyncService.syncLimitDownPool(params.date);
          break;

        case 'strong_pool':
          if (!params?.date) {
            return { success: false, recordCount: 0, duration: 0, message: '日期参数不能为空' };
          }
          result = await this.dataSyncService.syncStrongPool(params.date);
          break;

        case 'limit_up_break_pool':
          if (!params?.date) {
            return { success: false, recordCount: 0, duration: 0, message: '日期参数不能为空' };
          }
          result = await this.dataSyncService.syncLimitUpBreakPool(params.date);
          break;

        case 'limit_up_pool':
          if (!params?.date) {
            return { success: false, recordCount: 0, duration: 0, message: '日期参数不能为空' };
          }
          result = await this.dataSyncService.syncLimitUpPool(params.date);
          break;

        case 'sub_new_pool':
          if (!params?.date) {
            return { success: false, recordCount: 0, duration: 0, message: '日期参数不能为空' };
          }
          result = await this.dataSyncService.syncSubNewPool(params.date);
          break;

        // 主要市场列表模块
        case 'stock_list':
          result = await this.dataSyncService.syncStockList();
          break;

        case 'hs_fund_list':
          result = await this.dataSyncService.syncHsFundList();
          break;

        case 'hs_main_index_list':
          result = await this.dataSyncService.syncHsMainIndexList();
          break;

        case 'new_stock_calendar':
          result = await this.dataSyncService.syncNewStockCalendar();
          break;

        case 'hk_stock_list':
          result = await this.dataSyncService.syncHkStockList();
          break;

        // 财务报表模块
        case 'income_statement':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncIncomeStatement(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'cash_flow_statement':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncCashFlowStatement(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'balance_sheet':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncBalanceSheet(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        // 公司历史数据模块
        case 'supervisory_board_member':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncSupervisoryBoardMember(params.stockCode);
          break;

        case 'executive_member':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncExecutiveMember(params.stockCode);
          break;

        case 'executive_member_candidates': {
          const limitValue = Number((params as any)?.limit);
          const recordCount =
            await this.businessDataSyncService.syncExecutiveMembersForCurrentCandidates(
              Number.isInteger(limitValue) && limitValue > 0 ? limitValue : undefined,
            );
          result = {
            success: true,
            recordCount,
            duration: Date.now() - startedAt,
            message: '候选高管成员同步成功',
          };
          break;
        }

        case 'board_member':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncBoardMember(params.stockCode);
          break;

        // 股东明细数据模块
        case 'shareholder_top10':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncShareholderTop10(params.stockCode);
          break;

        case 'shareholder_top10_float':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncShareholderTop10Float(params.stockCode);
          break;

        case 'shareholder_change_trend':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncShareholderChangeTrend(params.stockCode);
          break;

        case 'fund_holdings':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncFundHoldings(params.stockCode);
          break;

        // 季度财务事件模块
        case 'recent_dividend':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncRecentDividend(params.stockCode);
          break;

        case 'recent_additional_issue':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncRecentAdditionalIssue(params.stockCode);
          break;

        case 'quarterly_profit':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncQuarterlyProfit(params.stockCode);
          break;

        case 'quarterly_cash_flow':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncQuarterlyCashFlow(params.stockCode);
          break;

        // 交易特色数据模块
        case 'money_flow':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncMoneyFlow(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'today_tick_trade':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncTodayTickTrade(params.stockCode);
          break;

        case 'stop_price_history':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncStopPriceHistory(params.stockCode);
          break;

        // 市场深度数据模块
        case 'hs_stock_real_five':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncHsStockRealFive(params.stockCode);
          break;

        case 'kc_stock_real_five':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncKcStockRealFive(params.stockCode);
          break;

        case 'bj_stock_real_five':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncBjStockRealFive(params.stockCode);
          break;

        case 'hk_stock_real_five':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncHkStockRealFive(params.stockCode);
          break;

        // 指数实时行情模块
        case 'index_real_time_data':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncIndexRealTimeData(params.indexCode);
          break;

        // 沪深技术指标模块
        case 'hs_stock_history_ma':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncHsStockHistoryMa(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'hs_stock_history_macd':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncHsStockHistoryMacd(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'hs_stock_history_boll':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncHsStockHistoryBoll(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'hs_stock_history_kdj':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncHsStockHistoryKdj(
            params.stockCode,
            params.startDate,
            params.endDate,
          );
          break;

        // 指数技术指标模块
        case 'index_history_ma':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncIndexHistoryMa(
            params.indexCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'index_history_macd':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncIndexHistoryMacd(
            params.indexCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'index_history_boll':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncIndexHistoryBoll(
            params.indexCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'index_history_kdj':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncIndexHistoryKdj(
            params.indexCode,
            params.startDate,
            params.endDate,
          );
          break;

        case 'market_indicator':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncMarketIndicator(params.indexCode);
          break;

        // 指数关系映射模块
        case 'zg_tree':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncZgTree(params.indexCode);
          break;

        case 'related_code':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncRelatedCode(params.stockCode);
          break;

        case 'related_stock':
          if (!params?.indexCode) {
            return { success: false, recordCount: 0, duration: 0, message: '指数代码不能为空' };
          }
          result = await this.dataSyncService.syncRelatedStock(params.indexCode);
          break;

        case 'belonging_index':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncBelongingIndex(params.stockCode);
          break;

        // 实时交易接口模块
        case 'realtime_trading_broker':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncRealtimeTradingBroker(params.stockCode);
          break;

        case 'realtime_trading_network':
          if (!params?.stockCode) {
            return { success: false, recordCount: 0, duration: 0, message: '股票代码不能为空' };
          }
          result = await this.dataSyncService.syncRealtimeTradingNetwork(params.stockCode);
          break;

        // 其他市场列表模块
        case 'bj_index_list':
          result = await this.dataSyncService.syncBjIndexList();
          break;

        case 'kc_stock_list':
          result = await this.dataSyncService.syncKcStockList();
          break;

        case 'etf_fund_list':
          result = await this.dataSyncService.syncEtfFundList();
          break;

        case 'bj_stock_list':
          result = await this.dataSyncService.syncBjStockList();
          break;

        default:
          return {
            success: false,
            recordCount: 0,
            duration: 0,
            message: `未知的同步模块：${module}`,
          };
      }

      return {
        ...result,
        message: result.success ? '同步成功' : result.error,
      };
    } catch (error) {
      this.logger.error('同步失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: 0,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Get('status/:taskId')
  @ApiOperation({ summary: '查询同步任务状态' })
  @ApiResponse({
    status: 200,
    description: '返回任务状态',
    type: Object,
  })
  async getStatus(@Param('taskId') taskId: string): Promise<SyncStatusResponse> {
    const syncLog = await this.findSyncLog(taskId);
    if (!syncLog) {
      return {
        taskId,
        status: 'pending',
        progress: 0,
      };
    }

    const statusMap = {
      RUNNING: 'running',
      SUCCESS: 'completed',
      FAILED: 'failed',
    } as const;

    return {
      taskId: syncLog.id.toString(),
      status: statusMap[syncLog.status],
      progress: syncLog.status === 'RUNNING' ? 50 : 100,
      recordCount: syncLog.recordCount ?? undefined,
      error: syncLog.status === 'FAILED' ? syncLog.message ?? undefined : undefined,
      startedAt: syncLog.startTime.toISOString(),
      completedAt: syncLog.endTime?.toISOString(),
    };
  }

  @Get('history')
  @ApiOperation({ summary: '查询同步历史' })
  @ApiResponse({
    status: 200,
    description: '返回同步历史记录',
    type: Object,
  })
  async getHistory(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('module') module?: string,
    @Query('status') status?: 'RUNNING' | 'SUCCESS' | 'FAILED',
  ): Promise<SyncHistoryResponse> {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.max(1, Math.min(Number(pageSize) || 20, 100));
    const where = {
      ...(module ? { taskName: module } : {}),
      ...(status ? { status } : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.syncLog.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      this.prisma.syncLog.count({ where }),
    ]);

    return {
      list: list.map((item) => ({
        id: Number(item.id),
        taskId: item.id.toString(),
        taskName: item.taskName,
        status: item.status,
        message: item.message,
        startTime: item.startTime,
        endTime: item.endTime,
        recordCount: item.recordCount,
        createdAt: item.createdAt,
      })),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  private async findSyncLog(taskId: string) {
    const numericId = Number(taskId);
    if (Number.isInteger(numericId) && numericId > 0) {
      return this.prisma.syncLog.findUnique({
        where: { id: BigInt(numericId) },
      });
    }

    return this.prisma.syncLog.findFirst({
      where: { taskName: taskId },
      orderBy: { startTime: 'desc' },
    });
  }
}
