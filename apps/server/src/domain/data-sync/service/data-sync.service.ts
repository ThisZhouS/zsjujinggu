/**
 * DataSyncService - 数据同步服务
 *
 * 负责业务逻辑编排，调用 Infrastructure 层 Client 获取数据并存储
 * 遵循 3 层架构规范：Service → Repository/Infrastructure → Database
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
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
import { SyncResult } from '../service/data-sync.base';

export type SyncModuleType =
  | 'company_intro'
  | 'company_capital'
  | 'lift_restriction'
  | 'shareholder_count'
  | 'company_top_holders'
  | 'company_top_flow_holders'
  | 'kc_stock_realtime'
  | 'hs_index_realtime'
  | 'hf_fund_realtime'
  | 'hk_stock_realtime'
  | 'bj_stock_realtime'
  | 'hs_index_history_trading'
  | 'hs_index_latest_trading'
  | 'hs_stock_latest_trading'
  | 'hs_stock_history_trading'
  | 'financial_main_indicators'
  | 'financial_indicators'
  | 'performance_forecast'
  | 'limit_down_pool'
  | 'strong_pool'
  | 'limit_up_break_pool'
  | 'limit_up_pool'
  | 'sub_new_pool'
  | 'stock_list'
  | 'hs_fund_list'
  | 'hs_main_index_list'
  | 'new_stock_calendar'
  | 'hk_stock_list'
  | 'income_statement'
  | 'cash_flow_statement'
  | 'balance_sheet'
  | 'supervisory_board_member'
  | 'executive_member'
  | 'board_member'
  | 'shareholder_top10'
  | 'shareholder_top10_float'
  | 'shareholder_change_trend'
  | 'fund_holdings'
  | 'recent_dividend'
  | 'recent_additional_issue'
  | 'quarterly_profit'
  | 'quarterly_cash_flow'
  | 'money_flow'
  | 'today_tick_trade'
  | 'stop_price_history'
  | 'hs_stock_real_five'
  | 'kc_stock_real_five'
  | 'bj_stock_real_five'
  | 'hk_stock_real_five'
  | 'index_real_time_data'
  | 'hs_stock_history_ma'
  | 'hs_stock_history_macd'
  | 'hs_stock_history_boll'
  | 'hs_stock_history_kdj'
  | 'index_history_ma'
  | 'index_history_macd'
  | 'index_history_boll'
  | 'index_history_kdj'
  | 'market_indicator'
  | 'zg_tree'
  | 'related_code'
  | 'related_stock'
  | 'belonging_index'
  | 'realtime_trading_broker'
  | 'realtime_trading_network'
  | 'bj_index_list'
  | 'kc_stock_list'
  | 'etf_fund_list'
  | 'bj_stock_list';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    private prisma: PrismaService,
    private companyBasicInfoClient: CompanyBasicInfoClient,
    private shareholderInfoClient: ShareholderInfoClient,
    private stockRealtimeDataClient: StockRealTimeDataClient,
    private historicalTradingDataClient: HistoricalTradingDataClient,
    private financialCoreIndicatorsClient: FinancialCoreIndicatorsClient,
    private stockPoolClassificationClient: StockPoolClassificationClient,
    private majorMarketListsClient: MajorMarketListsClient,
    private financialStatementsClient: FinancialStatementsClient,
    private companyHistoricalDataClient: CompanyHistoricalDataClient,
    private shareholderDetailedDataClient: ShareholderDetailedDataClient,
    private financialQuartersEventsClient: FinancialQuartersEventsClient,
    private tradingDetailsSpecialDataClient: TradingDetailsSpecialDataClient,
    private marketDepthDataClient: MarketDepthDataClient,
    private indexRealTimeDataClient: IndexRealTimeDataClient,
    private shanghaiShenzhenTechnicalIndicatorsClient: ShanghaiShenzhenTechnicalIndicatorsClient,
    private indexTechnicalIndicatorsClient: IndexTechnicalIndicatorsClient,
    private indexRelationshipMappingClient: IndexRelationshipMappingClient,
    private realTimeTradingInterfacesClient: RealTimeTradingInterfacesClient,
    private otherMarketListsClient: OtherMarketListsClient,
  ) {}

  /**
   * 同步公司简介数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncCompanyIntro(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.companyBasicInfoClient.fetchCompanyIntro(stockCode);
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      // 使用 upsert 保存数据
      let count = 0;
      for (const item of data) {
        await this.prisma.companyIntro.upsert({
          where: { stockCode: item.dm },
          update: {
            name: item.name,
            ename: item.ename,
            market: item.market,
            idea: item.idea,
            ldate: item.ldate,
            sprice: item.sprice,
            principal: item.principal,
            rdate: item.rdate,
            rprice: item.rprice,
            organ: item.organ,
            secre: item.secre,
            phone: item.phone,
            fax: item.fax,
            email: item.email,
            site: item.site,
            addr: item.addr,
            desc: item.desc,
            bscope: item.bscope,
            pe: item.pe,
          },
          create: {
            stockCode: item.dm,
            name: item.name || '',
            ename: item.ename,
            market: item.market,
            idea: item.idea,
            ldate: item.ldate,
            sprice: item.sprice,
            principal: item.principal,
            rdate: item.rdate,
            rprice: item.rprice,
            organ: item.organ,
            secre: item.secre,
            phone: item.phone,
            fax: item.fax,
            email: item.email,
            site: item.site,
            addr: item.addr,
            desc: item.desc,
            bscope: item.bscope,
            pe: item.pe,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步公司简介失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步公司股本数据
   * @param stockCode 股票代码
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 同步结果
   */
  async syncCompanyCapital(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.companyBasicInfoClient.fetchCompanyCapital(
        stockCode,
        startDate,
        endDate,
      );
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.companyCapital.create({
          data: {
            stockCode: item.dm,
            zgb: item.zgb ? Number(item.zgb) : null,
            ysltag: item.ysltag ? Number(item.ysltag) : null,
            xsltgf: item.xsltgf ? Number(item.xsltgf) : null,
            bdrq: item.bdrq,
            plrq: item.plrq,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步公司股本失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步解禁限售数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncLiftRestriction(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.companyBasicInfoClient.fetchLiftRestriction(stockCode);
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.liftRestriction.create({
          data: {
            stockCode: item.dm,
            rdate: item.rdate,
            ramount: item.ramount ? Number(item.ramount) : null,
            rprice: item.rprice ? Number(item.rprice) : null,
            batch: item.batch ? String(item.batch) : null,
            pdate: item.pdate,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步解禁限售失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步公司股东数
   * @param stockCode 股票代码
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 同步结果
   */
  async syncShareholderCount(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shareholderInfoClient.fetchCompanyShareholderCount(
        stockCode,
        startDate,
        endDate,
      );
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.companyShareholderCount.create({
          data: {
            stockCode: item.dm,
            plrq: item.plrq,
            jzrq: item.jzrq,
            gdzs: item.gdzs ?? null,
            agdhs: item.agdhs ?? null,
            bgdhs: item.bgdhs ?? null,
            hgdhs: item.hgdhs ?? null,
            yltgdhs: item.yltgdhs ?? null,
            wltgdhs: item.wltgdhs ?? null,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步公司股东数失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步公司十大股东
   * @param stockCode 股票代码
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 同步结果
   */
  async syncCompanyTopHolders(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shareholderInfoClient.fetchCompanyTopHolders(
        stockCode,
        startDate,
        endDate,
      );
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.companyTopHolders.create({
          data: {
            stockCode: item.dm,
            plrq: item.plrq,
            jzrq: item.jzrq,
            gdmc: item.gdmc,
            gdlx: item.gdlx,
            cgsl: item.cgsl ? Number(item.cgsl) : null,
            bdyy: item.bdyy,
            cgbl: item.cgbl ? Number(item.cgbl) : null,
            gfxz: item.gfxz,
            cgpm: item.cgpm ? String(item.cgpm) : null,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步公司十大股东失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步公司十大流通股东
   * @param stockCode 股票代码
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 同步结果
   */
  async syncCompanyTopFlowHolders(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shareholderInfoClient.fetchCompanyTopFlowHolders(
        stockCode,
        startDate,
        endDate,
      );
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.companyTopFlowHolders.create({
          data: {
            stockCode: item.dm,
            ggrq: item.ggrq,
            jzrq: item.jzrq,
            gdmc: item.gdmc,
            gdlx: item.gdlx,
            cgsl: item.cgsl ? Number(item.cgsl) : null,
            bdyy: item.bdyy,
            cgbl: item.cgbl ? Number(item.cgbl) : null,
            gfxz: item.gfxz,
            cgpm: item.cgpm ? String(item.cgpm) : null,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步公司十大流通股东失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步科创股票实时数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncKcStockRealTimeData(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockRealtimeDataClient.fetchKcStockRealTimeData(stockCode);
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.kcStockRealTimeData.upsert({
          where: {
            stockCode_t: {
              stockCode: item.dm,
              t: item.t,
            },
          },
          update: {
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
          },
          create: {
            stockCode: item.dm,
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            t: item.t,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步科创股票实时数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深指数实时数据
   * @param indexCode 指数代码
   * @returns 同步结果
   */
  async syncHsIndexRealTimeData(indexCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockRealtimeDataClient.fetchHsIndexRealTimeData(indexCode);
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.hsIndexRealTimeData.upsert({
          where: {
            indexCode_t: {
              indexCode: item.dm,
              t: item.t,
            },
          },
          update: {
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
          },
          create: {
            indexCode: item.dm,
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            t: item.t,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步沪深指数实时数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深基金实时数据
   * @param fundCode 基金代码
   * @returns 同步结果
   */
  async syncHfFundRealTimeData(fundCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockRealtimeDataClient.fetchHfFundRealTimeData(fundCode);
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.hfFundRealTimeData.upsert({
          where: {
            fundCode_t: {
              fundCode: item.dm,
              t: item.t,
            },
          },
          update: {
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
          },
          create: {
            fundCode: item.dm,
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            t: item.t,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步沪深基金实时数据失败：${fundCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步港股实时数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncHkStockRealTimeData(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockRealtimeDataClient.fetchHkStockRealTimeData(stockCode);
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.hkStockRealTimeData.upsert({
          where: {
            stockCode_t: {
              stockCode: item.dm,
              t: item.t,
            },
          },
          update: {
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
            updatedAt: item.updatedAt,
          },
          create: {
            stockCode: item.dm,
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            t: item.t,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
            updatedAt: item.updatedAt,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步港股实时数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步京市股票实时数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncBjStockRealTimeData(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockRealtimeDataClient.fetchBjStockRealTimeData(stockCode);
      if (!data || data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      let count = 0;
      for (const item of data) {
        await this.prisma.bjStockRealTimeData.upsert({
          where: {
            stockCode_t: {
              stockCode: item.dm,
              t: item.t,
            },
          },
          update: {
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
          },
          create: {
            stockCode: item.dm,
            p: item.p ? Number(item.p) : null,
            o: item.o ? Number(item.o) : null,
            h: item.h ? Number(item.h) : null,
            l: item.l ? Number(item.l) : null,
            yc: item.yc ? Number(item.yc) : null,
            cje: item.cje ? Number(item.cje) : null,
            v: item.v ? Number(item.v) : null,
            pv: item.pv ? Number(item.pv) : null,
            ud: item.ud ? Number(item.ud) : null,
            pc: item.pc ? Number(item.pc) : null,
            zf: item.zf ? Number(item.zf) : null,
            t: item.t,
            pe: item.pe ? Number(item.pe) : null,
            tr: item.tr ? Number(item.tr) : null,
            pbRatio: item.pbRatio ? Number(item.pbRatio) : null,
            tv: item.tv ? Number(item.tv) : null,
          },
        });
        count++;
      }

      return {
        success: true,
        recordCount: count,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步京市股票实时数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步 HS 指数历史分时交易数据
   * @param indexCode 指数代码
   * @param level 分时级别
   * @param startDate 开始时间 (可选)
   * @param endDate 结束时间 (可选)
   * @returns 同步结果
   */
  async syncHsIndexHistoryTrading(
    indexCode: string,
    level: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.historicalTradingDataClient.fetchHsIndexHistoryTrading(
        indexCode,
        level,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      const records = data.map((item) => ({
        dm: item.dm,
        t: item.t,
        o: item.o,
        h: item.h,
        l: item.l,
        c: item.c,
        v: item.v,
        a: item.a,
        pc: item.pc,
        st: item.st,
        et: item.et,
      }));

      await this.prisma.hsIndexHistoryTrading.createMany({
        data: records,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: records.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步 HS 指数历史分时交易数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步 HS 指数最新分时交易数据
   * @param indexCode 指数代码
   * @param level 分时级别
   * @returns 同步结果
   */
  async syncHsIndexLatestTrading(indexCode: string, level: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.historicalTradingDataClient.fetchHsIndexLatestTrading(
        indexCode,
        level,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      const record = data[0];
      await this.prisma.hsIndexLatestTrading.upsert({
        where: { dm_t: { dm: record.dm, t: record.t } },
        update: record,
        create: record,
      });

      return {
        success: true,
        recordCount: 1,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步 HS 指数最新分时交易数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步 HS 股票最新分时交易数据
   * @param stockCode 股票代码
   * @param level 分时级别
   * @param adjustType 除权方式
   * @param latest 最新条数 (可选)
   * @returns 同步结果
   */
  async syncHsStockLatestTrading(
    stockCode: string,
    level: string,
    adjustType: string,
    latest?: number,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.historicalTradingDataClient.fetchHsStockLatestTrading(
        stockCode,
        level,
        adjustType,
        latest,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      // 使用 upsert 更新最新数据
      for (const record of data) {
        await this.prisma.hsStockLatestTrading.upsert({
          where: { dm_t: { dm: record.dm, t: record.t } },
          update: record,
          create: record,
        });
      }

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步 HS 股票最新分时交易数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步 HS 股票历史分时交易数据
   * @param stockCode 股票代码
   * @param level 分时级别
   * @param adjustType 除权方式
   * @param startDate 开始时间 (可选)
   * @param endDate 结束时间 (可选)
   * @param latest 最新条数 (可选)
   * @returns 同步结果
   */
  async syncHsStockHistoryTrading(
    stockCode: string,
    level: string,
    adjustType: string,
    startDate?: string,
    endDate?: string,
    latest?: number,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.historicalTradingDataClient.fetchHsStockHistoryTrading(
        stockCode,
        level,
        adjustType,
        startDate,
        endDate,
        latest,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.hsStockHistoryTrading.createMany({
        data: data,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步 HS 股票历史分时交易数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步财务主要指标数据
   * @param stockCode 股票代码
   * @param startDate 开始日期 (可选)
   * @param endDate 结束日期 (可选)
   * @returns 同步结果
   */
  async syncFinancialMainIndicators(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialCoreIndicatorsClient.fetchFinancialMainIndicators(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      const records = data.map((item) => ({
        dm: item.dm,
        jzrq: item.jzrq,
        plrq: item.plrq,
        mgjyhdxjl: item.mgjyhdxjl,
        mgjzc: item.mgjzc,
        jbmgsy: item.jbmgsy,
        xsmgsy: item.xsmgsy,
        mgwfplr: item.mgwfplr,
        mgzbgjj: item.mgzbgjj,
        kfmgsy: item.kfmgsy,
        jzcsyl: item.jzcsyl,
        xsmlv: item.xsmlv,
        zyyrsrzz: item.zyyrsrzz,
        jlrzz: item.jlrzz,
        gsmgsyzzdjlrzz: item.gsmgsyzzdjlrzz,
        kfjlrzz: item.kfjlrzz,
        yyzsrgdhbzz: item.yyzsrgdhbzz,
        sljlrjqhbzz: item.sljlrjqhbzz,
        kfjlrgdhbzz: item.kfjlrgdhbzz,
        jqjzcsyl: item.jqjzcsyl,
        tbjzcsyl: item.tbjzcsyl,
        tbzzcsyl: item.tbzzcsyl,
        mlv: item.mlv,
        jlv: item.jlv,
        sjslv: item.sjslv,
        yskyysr: item.yskyysr,
        xsxjlyysr: item.xsxjlyysr,
        zcfzl: item.zcfzl,
        chzzl: item.chzzl,
      }));

      await this.prisma.financialMainIndicators.createMany({
        data: records,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: records.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步财务主要指标数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步财务指标数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncFinancialIndicators(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialCoreIndicatorsClient.fetchFinancialIndicators(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      const records = data.map((item) => ({
        dm: item.dm,
        date: item.date,
        tbmg: item.tbmg,
        jqmg: item.jqmg,
        mgsy: item.mgsy,
        kfmg: item.kfmg,
        mgjz: item.mgjz,
        mgjzad: item.mgjzad,
        mgjy: item.mgjy,
        mggjj: item.mggjj,
        mgwly: item.mgwly,
        zclr: item.zclr,
        zylr: item.zylr,
        zzlr: item.zzlr,
        cblr: item.cblr,
        yylr: item.yylr,
        zycb: item.zycb,
        xsjl: item.xsjl,
        gbbc: item.gbbc,
        jzbc: item.jzbc,
        zcbc: item.zcbc,
        xsml: item.xsml,
        xxbz: item.xxbz,
        fzy: item.fzy,
        zybz: item.zybz,
        gxff: item.gxff,
        tzsy: item.tzsy,
        zyyw: item.zyyw,
        jzsy: item.jzsy,
        jqjz: item.jqjz,
        kflr: item.kflr,
        zysr: item.zysr,
        jlzz: item.jlzz,
        jzzz: item.jzzz,
        zzzz: item.zzzz,
        yszz: item.yszz,
        yszzt: item.yszzt,
        chzz: item.chzz,
        chzzl: item.chzzl,
        gzzz: item.gzzz,
        zzzzl: item.zzzzl,
        zzzzt: item.zzzzt,
        ldzz: item.ldzz,
        ldzzt: item.ldzzt,
        gdzz: item.gdzz,
        ldbl: item.ldbl,
        sdbl: item.sdbl,
        xjbl: item.xjbl,
        lxzf: item.lxzf,
        zjbl: item.zjbl,
        gdqy: item.gdqy,
        cqfz: item.cqfz,
        gdgd: item.gdgd,
        fzqy: item.fzqy,
        zczjbl: item.zczjbl,
        zblv: item.zblv,
        gdzcjz: item.gdzcjz,
        zbgdh: item.zbgdh,
        cqbl: item.cqbl,
        qxjzb: item.qxjzb,
        gdzcbz: item.gdzcbz,
        zcfzl: item.zcfzl,
        zzc: item.zzc,
        jyxj: item.jyxj,
        zcjyxj: item.zcjyxj,
        jylrb: item.jylrb,
        jyfzl: item.jyfzl,
        xjlbl: item.xjlbl,
        dqgptz: item.dqgptz,
        dqzctz: item.dqzctz,
        dqjytz: item.dqjytz,
        qcgptz: item.qcgptz,
        cqzqtz: item.cqzqtz,
        cqjyxtz: item.cqjyxtz,
        yszk1: item.yszk1,
        yszk12: item.yszk12,
        yszk23: item.yszk23,
        yszk3: item.yszk3,
        yfhk1: item.yfhk1,
        yfhk12: item.yfhk12,
        yfhk23: item.yfhk23,
        yfhk3: item.yfhk3,
        ysk1: item.ysk1,
        ysk12: item.ysk12,
        ysk23: item.ysk23,
        ysk3: item.ysk3,
      }));

      await this.prisma.financialIndicators.createMany({
        data: records,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: records.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步财务指标数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步近年业绩预告数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncPerformanceForecast(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialCoreIndicatorsClient.fetchPerformanceForecast(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      const records = data.map((item) => ({
        dm: item.dm,
        pdate: item.pdate,
        rdate: item.rdate,
        type: item.type,
        abs: item.abs,
        old: item.old,
      }));

      await this.prisma.performanceForecast.createMany({
        data: records,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: records.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步近年业绩预告数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步跌停股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 同步结果
   */
  async syncLimitDownPool(date: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockPoolClassificationClient.fetchLimitDownPool(date);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.limitDownPool.createMany({
        data: data,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步跌停股池数据失败：${date}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步强势股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 同步结果
   */
  async syncStrongPool(date: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockPoolClassificationClient.fetchStrongPool(date);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.strongPool.createMany({
        data: data,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步强势股池数据失败：${date}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步炸板股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 同步结果
   */
  async syncLimitUpBreakPool(date: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockPoolClassificationClient.fetchLimitUpBreakPool(date);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.limitUpBreakPool.createMany({
        data: data,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步炸板股池数据失败：${date}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步涨停股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 同步结果
   */
  async syncLimitUpPool(date: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockPoolClassificationClient.fetchLimitUpPool(date);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.limitUpPool.createMany({
        data: data,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步涨停股池数据失败：${date}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步次新股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 同步结果
   */
  async syncSubNewPool(date: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.stockPoolClassificationClient.fetchSubNewPool(date);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.subNewPool.createMany({
        data: data,
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步次新股池数据失败：${date}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步股票列表数据
   * @returns 同步结果
   */
  async syncStockList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.majorMarketListsClient.fetchStockList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      // 使用 upsert 更新数据（股票列表需要定期更新）
      for (const item of data) {
        await this.prisma.stockList.upsert({
          where: { dm: item.dm },
          update: { mc: item.mc, jys: item.jys },
          create: { dm: item.dm, mc: item.mc, jys: item.jys },
        });
      }

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步股票列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深基金列表数据
   * @returns 同步结果
   */
  async syncHsFundList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.majorMarketListsClient.fetchHsFundList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      for (const item of data) {
        await this.prisma.hsFundList.upsert({
          where: { dm: item.dm },
          update: { mc: item.mc, jys: item.jys },
          create: { dm: item.dm, mc: item.mc, jys: item.jys },
        });
      }

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步沪深基金列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深主要指数列表数据
   * @returns 同步结果
   */
  async syncHsMainIndexList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.majorMarketListsClient.fetchHsMainIndexList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      for (const item of data) {
        await this.prisma.hsMainIndexList.upsert({
          where: { dm: item.dm },
          update: { mc: item.mc, jys: item.jys },
          create: { dm: item.dm, mc: item.mc, jys: item.jys },
        });
      }

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步沪深主要指数列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步新股日历数据
   * @returns 同步结果
   */
  async syncNewStockCalendar(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.majorMarketListsClient.fetchNewStockCalendar();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      const validRecords = data.filter((item) => item.zqdm != null);
      for (const item of validRecords) {
        await this.prisma.newStockCalendar.upsert({
          where: { zqdm: item.zqdm! },
          update: {
            zqjc: item.zqjc,
            sgdm: item.sgdm,
            fxsl: item.fxsl,
            swfxsl: item.swfxsl,
            sgsx: item.sgsx,
            dgsz: item.dgsz,
            sgrq: item.sgrq,
            fxjg: item.fxjg,
            zxj: item.zxj,
            srspj: item.srspj,
            zqgbrq: item.zqgbrq,
            zqjkrq: item.zqjkrq,
            ssrq: item.ssrq,
            syl: item.syl,
            hysyl: item.hysyl,
            wszql: item.wszql,
            yzbsl: item.yzbsl,
            zf: item.zf,
            yqhl: item.yqhl,
            zyyw: item.zyyw,
          },
          create: {
            zqdm: item.zqdm!,
            zqjc: item.zqjc,
            sgdm: item.sgdm,
            fxsl: item.fxsl,
            swfxsl: item.swfxsl,
            sgsx: item.sgsx,
            dgsz: item.dgsz,
            sgrq: item.sgrq,
            fxjg: item.fxjg,
            zxj: item.zxj,
            srspj: item.srspj,
            zqgbrq: item.zqgbrq,
            zqjkrq: item.zqjkrq,
            ssrq: item.ssrq,
            syl: item.syl,
            hysyl: item.hysyl,
            wszql: item.wszql,
            yzbsl: item.yzbsl,
            zf: item.zf,
            yqhl: item.yqhl,
            zyyw: item.zyyw,
          },
        });
      }

      return {
        success: true,
        recordCount: validRecords.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步新股日历数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步港股股票列表数据
   * @returns 同步结果
   */
  async syncHkStockList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.majorMarketListsClient.fetchHkStockList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      for (const item of data) {
        await this.prisma.hkStockList.upsert({
          where: { dm: item.dm },
          update: { mc: item.mc, jys: item.jys },
          create: { dm: item.dm, mc: item.mc, jys: item.jys },
        });
      }

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步港股股票列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步利润表数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncIncomeStatement(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialStatementsClient.fetchIncomeStatement(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.incomeStatement.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          plrq: item.plrq,
          yysr: item.yysr,
          yzbf: item.yzbf,
          fdczssr: item.fdczssr,
          yyzcb: item.yyzcb,
          fdczscb: item.fdczscb,
          yffy: item.yffy,
          tbj: item.tbj,
          pczjje: item.pczjje,
          tqbxhtzbjje: item.tqbxhtzbjje,
          bdhlzc: item.bdhlzc,
          fbfy: item.fbfy,
          gyjzbdsy: item.gyjzbdsy,
          qhsy: item.qhsy,
          tgsy: item.tgsy,
          btsr: item.btsr,
          qtywlr: item.qtywlr,
          bhbfzhbqsljlr: item.bhbfzhbqsljlr,
          lxsr: item.lxsr,
          sxfjyjsr: item.sxfjyjsr,
          sxfjyjzc: item.sxfjyjzc,
          qtywcb: item.qtywcb,
          hdsy: item.hdsy,
          fldzcczsy: item.fldzcczsy,
          sdsfy: item.sdsfy,
          wqrtzss: item.wqrtzss,
          gsmgsyzzdjlr: item.gsmgsyzzdjlr,
          lxzc: item.lxzc,
          qtywsr: item.qtywsr,
          yyzsr: item.yyzsr,
          yycb: item.yycb,
          yysjjfj: item.yysjjfj,
          xsfy: item.xsfy,
          glfy: item.glfy,
          cwfy: item.cwfy,
          zcjzss: item.zcjzss,
          tzsy: item.tzsy,
          lyqyhhhqydtzsy: item.lyqyhhhqydtzsy,
          yylr: item.yylr,
          ywsr: item.ywsr,
          ywzc: item.ywzc,
          lze: item.lze,
          jlr: item.jlr,
          jlrhfcjcx: item.jlrhfcjcx,
          ssgdsy: item.ssgdsy,
          jbmgsy: item.jbmgsy,
          xsmgsy: item.xsmgsy,
          zhsyz: item.zhsyz,
          gsssgdzhsyz: item.gsssgdzhsyz,
          qtsy: item.qtsy,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步利润表数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步现金流量表数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncCashFlowStatement(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialStatementsClient.fetchCashFlowStatement(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.cashFlowStatement.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          plrq: item.plrq,
          sdydbxbfqdxj: item.sdydbxbfqdxj,
          sdzbxywxjjje: item.sdzbxywxjjje,
          bhcjjtkkjzje: item.bhcjjtkkjzje,
          czjyxjrzcjzje: item.czjyxjrzcjzje,
          sqlxsxfjyjdxj: item.sqlxsxfjyjdxj,
          hgywzjjzje: item.hgywzjjzje,
          zfybxhtpfkxdj: item.zfybxhtpfkxdj,
          zfbdhldxj: item.zfbdhldxj,
          czfzgsjqtsddxj: item.czfzgsjqtsddxj,
          jszyhdqckssddxj: item.jszyhdqckssddxj,
          tzszfdxj: item.tzszfdxj,
          zydkjzje: item.zydkjzje,
          qdfzgsjqtywdwzfdxjje: item.qdfzgsjqtywdwzfdxjje,
          zjzyhdqckszfdxj: item.zjzyhdqckszfdxj,
          qzfzgsxrxj: item.qzfzgsxrxj,
          qz_fzgszfgsssgdglr: item.qz_fzgszfgsssgdglr,
          ssgdsy: item.ssgdsy,
          wqrdtzss: item.wqrdtzss,
          dysyzj_j_js: item.dysyzj_j_js,
          yjfz: item.yjfz,
          jxyyfxmdzj: item.jxyyfxmdzj,
          ywgwswjskdjs_j_zj: item.ywgwswjskdjs_j_zj,
          yjswgwgdjz_j_js: item.yjswgwgdjz_j_js,
          xssptglwsddxj: item.xssptglwsddxj,
          khckhtyckxkjzje: item.khckhtyckxkjzje,
          xzyhyhkjzje: item.xzyhyhkjzje,
          xtjrgjqjcrzjjzje: item.xtjrgjqjcrzjjzje,
          sddsfyfh: item.sddsfyfh,
          tzzfdxj: item.tzzfdxj,
          sdqtyjyghdxj: item.sdqtyjyghdxj,
          jyhdxjlrxj: item.jyhdxjlrxj,
          gmspjslwzfdxj: item.gmspjslwzfdxj,
          khdkjdknzje: item.khdkjdknzje,
          cfzyxhytckxkjzje: item.cfzyxhytckxkjzje,
          zflxsxfjyjdxj: item.zflxsxfjyjdxj,
          zfgzyjwzgzfdxj: item.zfgzyjwzgzfdxj,
          zfdgxsf: item.zfdgxsf,
          zfqtyjyghdxj: item.zfqtyjyghdxj,
          jyhdxjlcxj: item.jyhdxjlcxj,
          jyhdcsdxjlje: item.jyhdcsdxjlje,
          shtzssddxj: item.shtzssddxj,
          qdtzsysddxj: item.qdtzsysddxj,
          czgdzcwxzhqtqctzssddxj: item.czgdzcwxzhqtqctzssddxj,
          sdqtytzghdxj: item.sdqtytzghdxj,
          tzhdxjlrxj: item.tzhdxjlrxj,
          gjgdzcwxzhqtqctzzfdxj: item.gjgdzcwxzhqtqctzzfdxj,
          tzhdxjlcxj: item.tzhdxjlcxj,
          tzhdcsdxjlxj: item.tzhdcsdxjlxj,
          xstzsdj: item.xstzsdj,
          qdjkjddxj: item.qdjkjddxj,
          fxzjsddxj: item.fxzjsddxj,
          sdqtczghdxj: item.sdqtczghdxj,
          czhdxjlrxj: item.czhdxjlrxj,
          chzwzfxj: item.chzwzfxj,
          fpglrlhcllxzfdxj: item.fpglrlhcllxzfdxj,
          zfqtczdxj: item.zfqtczdxj,
          czhdxjlcxj: item.czhdxjlcxj,
          czhdcsdxjlxj: item.czhdcsdxjlxj,
          hlbddxjdxy: item.hlbddxjdxy,
          xjxjdhwjzje: item.xjxjdhwjzje,
          qcxjjxjdhwye: item.qcxjjxjdhwye,
          qmxjjxjdhwye: item.qmxjjxjdhwye,
          jlr: item.jlr,
          zcjzzb: item.zcjzzb,
          gdzczjyqzcshscxwzczj: item.gdzczjyqzcshscxwzczj,
          wxzctx: item.wxzctx,
          cqdtfytx: item.cqdtfytx,
          dtfydjs: item.dtfydjs,
          ytfydzj: item.ytfydzj,
          czgdzcwxzhqtqctzss: item.czgdzcwxzhqtqctzss,
          gdzcgbss: item.gdzcgbss,
          gyjzbds: item.gyjzbds,
          cwfy: item.cwfy,
          tzss: item.tzss,
          dysdszcjs: item.dysdszcjs,
          dysdsfzzj: item.dysdsfzzj,
          chdjs: item.chdjs,
          jxyysxmdjs: item.jxyysxmdjs,
          qt: item.qt,
          jyhdcsdxjlxj: item.jyhdcsdxjlxj,
          zwzwzb: item.zwzwzb,
          ynndqdkzhgzq: item.ynndqdkzhgzq,
          rzrgdzc: item.rzrgdzc,
          xjdqmye: item.xjdqmye,
          xjdqcye: item.xjdqcye,
          xjdhwdqmye: item.xjdhwdqmye,
          xjdhwdqcye: item.xjdhwdqcye,
          xjxjdhwdjzje: item.xjxjdhwdjzje,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步现金流量表数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步资产负债表数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncBalanceSheet(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialStatementsClient.fetchBalanceSheet(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.balanceSheet.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          plrq: item.plrq,
          nbysk: item.nbysk,
          gdzcql: item.gdzcql,
          yffbzk: item.yffbzk,
          jsbfj: item.jsbfj,
          ysbf: item.ysbf,
          ysfbzk: item.ysfbzk,
          ysfbhtzbj: item.ysfbhtzbj,
          ysgl: item.ysgl,
          ysckts: item.ysckts,
          ysbtk: item.ysbtk,
          ysbzj: item.ysbzj,
          dfy: item.dfy,
          dclldzcsy: item.dclldzcsy,
          ynndqdfldzc: item.ynndqdfldzc,
          cqysk: item.cqysk,
          qtcqtz: item.qtcqtz,
          gdzcyz: item.gdzcyz,
          gdzcjz: item.gdzcjz,
          gdzcjzzbj: item.gdzcjzzbj,
          scxswzc: item.scxswzc,
          gyxswzc: item.gyxswzc,
          yqzc: item.yqzc,
          kfzc: item.kfzc,
          gqfzltq: item.gqfzltq,
          qtfldzc: item.qtfldzc,
          yfsxfyj: item.yfsxfyj,
          qtjyk: item.qtjyk,
          yfbzj: item.yfbzj,
          nbyfk: item.nbyfk,
          ytfy: item.ytfy,
          bxhtzbj: item.bxhtzbj,
          dlmmzqk: item.dlmmzqk,
          dlcxzqk: item.dlcxzqk,
          gjpjjs: item.gjpjjs,
          gnpjjs: item.gnpjjs,
          dysr: item.dysr,
          yfdqzq: item.yfdqzq,
          cqdysr: item.cqdysr,
          wqddtzss: item.wqddtzss,
          nfpxjgl: item.nfpxjgl,
          yjfz: item.yjfz,
          xsckjtycf: item.xsckjtycf,
          yjldfz: item.yjldfz,
          j_kcg: item.j_kcg,
          hbzj: item.hbzj,
          cczj: item.cczj,
          jyxjrzc: item.jyxjrzc,
          ysjrzc: item.ysjrzc,
          yspj: item.yspj,
          yszk: item.yszk,
          yfkx: item.yfkx,
          yslx: item.yslx,
          qtysk: item.qtysk,
          mrfsjrzck: item.mrfsjrzck,
          gyjzjzbdqjsrdq: item.gyjzjzbdqjsrdq,
          ch: item.ch,
          qtldzc: item.qtldzc,
          ldzchj: item.ldzchj,
          ffdkjjd: item.ffdkjjd,
          kkgsjrzc: item.kkgsjrzc,
          cyzdqtz: item.cyzdqtz,
          cqgqtz: item.cqgqtz,
          tzxfd: item.tzxfd,
          ljzj: item.ljzj,
          gdzc: item.gdzc,
          zjgc: item.zjgc,
          gcwz: item.gcwz,
          wxzc: item.wxzc,
          sy: item.sy,
          cqdtfy: item.cqdtfy,
          dysdszc: item.dysdszc,
          fldzchj: item.fldzchj,
          zczj: item.zczj,
          dqjk: item.dqjk,
          xzyhyhk: item.xzyhyhk,
          crzj: item.crzj,
          jyxjrfz: item.jyxjrfz,
          ysjrfz: item.ysjrfz,
          yfpj: item.yfpj,
          yfzk: item.yfzk,
          ysk: item.ysk,
          mchgjrzck: item.mchgjrzck,
          yfgzxc: item.yfgzxc,
          yjsf: item.yjsf,
          yflx: item.yflx,
          yfgl: item.yfgl,
          qtfzk: item.qtfzk,
          ynndqdfldfz: item.ynndqdfldfz,
          qtldfz: item.qtldfz,
          ldfzhj: item.ldfzhj,
          cqjk: item.cqjk,
          yfzq: item.yfzq,
          cqyfk: item.cqyfk,
          zxyfk: item.zxyfk,
          dysdsfz: item.dysdsfz,
          qtfldfz: item.qtfldfz,
          fldfzhj: item.fldfzhj,
          fzhj: item.fzhj,
          sszb: item.sszb,
          zbgj: item.zbgj,
          zxzb: item.zxzb,
          ylgj: item.ylgj,
          ybfxzb: item.ybfxzb,
          wfplr: item.wfplr,
          wbbzbzhc: item.wbbzbzhc,
          gsmgdqsyhj: item.gsmgdqsyhj,
          ssgdqy: item.ssgdqy,
          syzqyhj: item.syzqyhj,
          fzhgdqyzj: item.fzhgdqyzj,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步资产负债表数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步监事会成员数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncSupervisoryBoardMember(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.companyHistoricalDataClient.fetchSupervisoryBoardMember(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.supervisoryBoardMember.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          name: item.name,
          title: item.title,
          sdate: item.sdate,
          edate: item.edate,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步监事会成员数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步高管成员数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncExecutiveMember(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.companyHistoricalDataClient.fetchExecutiveMember(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.executiveMember.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          name: item.name,
          title: item.title,
          sdate: item.sdate,
          edate: item.edate,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步高管成员数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步董事会成员数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncBoardMember(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.companyHistoricalDataClient.fetchBoardMember(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.boardMember.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          name: item.name,
          title: item.title,
          sdate: item.sdate,
          edate: item.edate,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步董事会成员数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步十大股东数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncShareholderTop10(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shareholderDetailedDataClient.fetchTop10Shareholders(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.shareholderTop10.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          ggrq: item.ggrq,
          gdsm: item.gdsm,
          gdzs: item.gdzs,
          pjcg: item.pjcg,
          sdgdJson: item.sdgdJson,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步十大股东数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步十大流通股东数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncShareholderTop10Float(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shareholderDetailedDataClient.fetchTop10FloatShareholders(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.shareholderTop10Float.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          ggrq: item.ggrq,
          sdgdJson: item.sdgdJson,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步十大流通股东数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步股东变化趋势数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncShareholderChangeTrend(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shareholderDetailedDataClient.fetchShareholderChangeTrend(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.shareholderChangeTrend.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          gdhs: item.gdhs,
          bh: item.bh,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步股东变化趋势数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步基金持股数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncFundHoldings(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shareholderDetailedDataClient.fetchFundHoldings(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.fundHolding.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          jjdm: item.jjdm,
          jjmc: item.jjmc,
          ccsl: item.ccsl,
          ltbl: item.ltbl,
          cgsz: item.cgsz,
          jzbl: item.jzbl,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步基金持股数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步近期分红数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncRecentDividend(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialQuartersEventsClient.fetchRecentDividend(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.recentDividend.createMany({
        data: data.map((item) => ({
          dm: item.dm,
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
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步近期分红数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步近期增发数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncRecentAdditionalIssue(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialQuartersEventsClient.fetchRecentAdditionalIssue(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.recentAdditionalIssue.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          plrq: item.plrq,
          zfx: item.zfx,
          zfrq: item.zfrq,
          zfxz: item.zfxz,
          zxj: item.zxj,
          zxr: item.zxr,
          zxsl: item.zxsl,
          zje: item.zje,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步近期增发数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步季度利润数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncQuarterlyProfit(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialQuartersEventsClient.fetchQuarterlyProfit(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.quarterlyProfit.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          plrq: item.plrq,
          jlr: item.jlr,
          jlrzz: item.jlrzz,
          yysr: item.yysr,
          yysrzz: item.yysrzz,
          jlrhfe: item.jlrhfe,
          yysrhfe: item.yysrhfe,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步季度利润数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步季度现金流数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncQuarterlyCashFlow(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.financialQuartersEventsClient.fetchQuarterlyCashFlow(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.quarterlyCashFlow.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          jzrq: item.jzrq,
          plrq: item.plrq,
          jydxjlr: item.jydxjlr,
          tzdxjlr: item.tzdxjlr,
          czdxjlr: item.czdxjlr,
          xjjze: item.xjjze,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步季度现金流数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步资金流向数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncMoneyFlow(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.tradingDetailsSpecialDataClient.fetchMoneyFlow(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.moneyFlow.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          ljlr: item.ljlr,
          ljlc: item.ljlc,
          ddanl: item.ddanl,
          ddbb: item.ddbb,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步资金流向数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步今日分时成交数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncTodayTickTrade(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.tradingDetailsSpecialDataClient.fetchTodayTickTrade(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.todayTickTrade.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          v: item.v,
          bv: item.bv,
          sv: item.sv,
          bs: item.bs,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步今日分时成交数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步历史停牌数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncStopPriceHistory(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.tradingDetailsSpecialDataClient.fetchStopPriceHistory(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.stopPriceHistory.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          tp: item.tp,
          sdrq: item.sdrq,
          edrq: item.edrq,
          tpjc: item.tpjc,
          lxrq: item.lxrq,
          sdr: item.sdr,
          ed: item.ed,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步历史停牌数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深个股实时五档数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncHsStockRealFive(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.marketDepthDataClient.fetchHsStockRealFive(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.hsStockRealFive.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          bj1p: item.bj1p,
          bj1v: item.bj1v,
          bj2p: item.bj2p,
          bj2v: item.bj2v,
          bj3p: item.bj3p,
          bj3v: item.bj3v,
          bj4p: item.bj4p,
          bj4v: item.bj4v,
          bj5p: item.bj5p,
          bj5v: item.bj5v,
          sj1p: item.sj1p,
          sj1v: item.sj1v,
          sj2p: item.sj2p,
          sj2v: item.sj2v,
          sj3p: item.sj3p,
          sj3v: item.sj3v,
          sj4p: item.sj4p,
          sj4v: item.sj4v,
          sj5p: item.sj5p,
          sj5v: item.sj5v,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步沪深个股实时五档数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步科创个股实时五档数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncKcStockRealFive(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.marketDepthDataClient.fetchKcStockRealFive(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.kcStockRealFive.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          bj1p: item.bj1p,
          bj1v: item.bj1v,
          bj2p: item.bj2p,
          bj2v: item.bj2v,
          bj3p: item.bj3p,
          bj3v: item.bj3v,
          bj4p: item.bj4p,
          bj4v: item.bj4v,
          bj5p: item.bj5p,
          bj5v: item.bj5v,
          sj1p: item.sj1p,
          sj1v: item.sj1v,
          sj2p: item.sj2p,
          sj2v: item.sj2v,
          sj3p: item.sj3p,
          sj3v: item.sj3v,
          sj4p: item.sj4p,
          sj4v: item.sj4v,
          sj5p: item.sj5p,
          sj5v: item.sj5v,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步科创个股实时五档数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步北交所个股实时五档数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncBjStockRealFive(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.marketDepthDataClient.fetchBjStockRealFive(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.bjStockRealFive.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          bj1p: item.bj1p,
          bj1v: item.bj1v,
          bj2p: item.bj2p,
          bj2v: item.bj2v,
          bj3p: item.bj3p,
          bj3v: item.bj3v,
          bj4p: item.bj4p,
          bj4v: item.bj4v,
          bj5p: item.bj5p,
          bj5v: item.bj5v,
          sj1p: item.sj1p,
          sj1v: item.sj1v,
          sj2p: item.sj2p,
          sj2v: item.sj2v,
          sj3p: item.sj3p,
          sj3v: item.sj3v,
          sj4p: item.sj4p,
          sj4v: item.sj4v,
          sj5p: item.sj5p,
          sj5v: item.sj5v,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步北交所个股实时五档数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步港股个股实时五档数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncHkStockRealFive(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.marketDepthDataClient.fetchHkStockRealFive(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.hkStockRealFive.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          bj1p: item.bj1p,
          bj1v: item.bj1v,
          bj2p: item.bj2p,
          bj2v: item.bj2v,
          bj3p: item.bj3p,
          bj3v: item.bj3v,
          bj4p: item.bj4p,
          bj4v: item.bj4v,
          bj5p: item.bj5p,
          bj5v: item.bj5v,
          sj1p: item.sj1p,
          sj1v: item.sj1v,
          sj2p: item.sj2p,
          sj2v: item.sj2v,
          sj3p: item.sj3p,
          sj3v: item.sj3v,
          sj4p: item.sj4p,
          sj4v: item.sj4v,
          sj5p: item.sj5p,
          sj5v: item.sj5v,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步港股个股实时五档数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步指数实时行情数据
   * @param indexCode 指数代码
   * @returns 同步结果
   */
  async syncIndexRealTimeData(indexCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexRealTimeDataClient.fetchIndexRealTimeData(indexCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.indexRealTimeData.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          o: item.o,
          h: item.h,
          l: item.l,
          pc: item.pc,
          v: item.v,
          a: item.a,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步指数实时行情数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深股票历史 MA 数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncHsStockHistoryMa(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shanghaiShenzhenTechnicalIndicatorsClient.fetchHsStockHistoryMa(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyMa.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          ma5: item.ma5,
          ma10: item.ma10,
          ma20: item.ma20,
          ma30: item.ma50,
          ma60: item.ma100,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步沪深股票历史 MA 数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深股票历史 MACD 数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncHsStockHistoryMacd(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shanghaiShenzhenTechnicalIndicatorsClient.fetchHsStockHistoryMacd(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyMacd.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          dif: item.dif,
          dea: item.dea,
          macd: item.macd,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步沪深股票历史 MACD 数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深股票历史 BOLL 数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncHsStockHistoryBoll(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shanghaiShenzhenTechnicalIndicatorsClient.fetchHsStockHistoryBoll(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyBoll.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          up: item.up,
          mid: item.mid,
          dn: item.dn,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步沪深股票历史 BOLL 数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步沪深股票历史 KDJ 数据
   * @param stockCode 股票代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncHsStockHistoryKdj(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.shanghaiShenzhenTechnicalIndicatorsClient.fetchHsStockHistoryKdj(
        stockCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyKdj.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          k: item.k,
          d: item.d,
          j: item.j,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步沪深股票历史 KDJ 数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步指数历史 MA 数据
   * @param indexCode 指数代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncIndexHistoryMa(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexTechnicalIndicatorsClient.fetchIndexHistoryMa(
        indexCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyMa.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          ma5: item.ma5,
          ma10: item.ma10,
          ma20: item.ma20,
          ma30: item.ma50,
          ma60: item.ma100,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步指数历史 MA 数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步指数历史 MACD 数据
   * @param indexCode 指数代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncIndexHistoryMacd(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexTechnicalIndicatorsClient.fetchIndexHistoryMacd(
        indexCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyMacd.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          dif: item.dif,
          dea: item.dea,
          macd: item.macd,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步指数历史 MACD 数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步指数历史 BOLL 数据
   * @param indexCode 指数代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncIndexHistoryBoll(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexTechnicalIndicatorsClient.fetchIndexHistoryBoll(
        indexCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyBoll.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          up: item.up,
          mid: item.mid,
          dn: item.dn,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步指数历史 BOLL 数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步指数历史 KDJ 数据
   * @param indexCode 指数代码
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 同步结果
   */
  async syncIndexHistoryKdj(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexTechnicalIndicatorsClient.fetchIndexHistoryKdj(
        indexCode,
        startDate,
        endDate,
      );

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.historyKdj.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          k: item.k,
          d: item.d,
          j: item.j,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步指数历史 KDJ 数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步大盘指标数据
   * @param indexCode 指数代码
   * @returns 同步结果
   */
  async syncMarketIndicator(indexCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexTechnicalIndicatorsClient.fetchMarketIndicator(indexCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.marketIndicator.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          zsl: item.zdl,
          zl: item.zl,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步大盘指标数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步指数成分股树数据
   * @param indexCode 指数代码
   * @returns 同步结果
   */
  async syncZgTree(indexCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexRelationshipMappingClient.fetchZgTree(indexCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.zgTree.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          mc: item.name,
          parentId: item.parentDm,
          level: item.level,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步指数成分股树数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步指数相关股票数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncRelatedCode(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexRelationshipMappingClient.fetchRelatedCodesByStock(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.relatedCode.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          zsdm: item.indexDm ?? '',
          zsmc: item.indexName,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步指数相关股票数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步股票相关指数数据
   * @param indexCode 指数代码
   * @returns 同步结果
   */
  async syncRelatedStock(indexCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexRelationshipMappingClient.fetchRelatedStocksByCode(indexCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.relatedStock.createMany({
        data: data.map((item) => ({
          zsdm: item.dm,
          zsmc: item.t,
          dm: item.stockDm ?? '',
          mc: item.stockName,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步股票相关指数数据失败：${indexCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步所属指数数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncBelongingIndex(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.indexRelationshipMappingClient.fetchBelongingIndices(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.belongingIndex.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          zsdm: item.indexDm ?? '',
          zsmc: item.indexName,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步所属指数数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步券商实时交易数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncRealtimeTradingBroker(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.realTimeTradingInterfacesClient.fetchRealtimeTradingAllBroker(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.realtimeTradingBroker.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          v: item.v,
          bs: item.bs,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步券商实时交易数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步网络实时交易数据
   * @param stockCode 股票代码
   * @returns 同步结果
   */
  async syncRealtimeTradingNetwork(stockCode: string): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.realTimeTradingInterfacesClient.fetchRealtimeTradingAllNetwork(stockCode);

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.realtimeTradingNetwork.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          t: item.t,
          p: item.p,
          v: item.v,
          bs: item.bs,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步网络实时交易数据失败：${stockCode}`, error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步北证指数列表数据
   * @returns 同步结果
   */
  async syncBjIndexList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.otherMarketListsClient.fetchBjIndexList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.bjIndexList.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          mc: item.name,
          jys: item.jc,
          updatedAt: item.ssrq ? new Date(item.ssrq) : null,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步北证指数列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步科创股票列表数据
   * @returns 同步结果
   */
  async syncKcStockList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.otherMarketListsClient.fetchKcStockList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.kcStockList.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          mc: item.name,
          jys: item.jc,
          updatedAt: item.ssrq ? new Date(item.ssrq) : null,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步科创股票列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步 ETF 基金列表数据
   * @returns 同步结果
   */
  async syncEtfFundList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.otherMarketListsClient.fetchEtfFundList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.etfFundList.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          mc: item.name,
          jys: item.jc,
          updatedAt: item.ssrq ? new Date(item.ssrq) : null,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步 ETF 基金列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 同步北交所股票列表数据
   * @returns 同步结果
   */
  async syncBjStockList(): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const data = await this.otherMarketListsClient.fetchBjStockList();

      if (data.length === 0) {
        return { success: true, recordCount: 0, duration: Date.now() - startTime };
      }

      await this.prisma.bjStockList.createMany({
        data: data.map((item) => ({
          dm: item.dm,
          mc: item.name,
          jys: item.jc,
          updatedAt: item.ssrq ? new Date(item.ssrq) : null,
        })),
        skipDuplicates: true,
      });

      return {
        success: true,
        recordCount: data.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('同步北交所股票列表数据失败', error);
      return {
        success: false,
        recordCount: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }
}
