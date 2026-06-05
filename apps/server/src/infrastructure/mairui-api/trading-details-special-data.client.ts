/**
 * TradingDetailsSpecialDataClient - 交易特色数据 API 客户端
 *
 * 提供交易特色数据相关的 API 接口：
 * - 资金流向 (money_flow)
 * - 今日分时成交 (today_tick_trade)
 * - 历史停牌 (stop_price_history)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface MoneyFlowData {
  dm: string;
  t: string;
  ljlr?: number;
  ljlc?: number;
  ddanl?: number;
  ddbb?: number;
}

export interface TodayTickTradeData {
  dm: string;
  t: string;
  p?: number;
  v?: number;
  bv?: number;
  sv?: number;
  bs?: string;
}

export interface StopPriceHistoryData {
  dm: string;
  t: string;
  tp?: string;
  sdrq?: string;
  edrq?: string;
  tpjc?: string;
  lxrq?: string;
  sdr?: string;
  ed?: string;
}

@Injectable()
export class TradingDetailsSpecialDataClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取资金流向数据
   * @param stockCode 股票代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 资金流向数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/moneyflow/股票代码/您的 licence
   */
  async fetchMoneyFlow(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<MoneyFlowData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hssj/moneyflow/${stockCode}`);
    const params: string[] = [];
    if (startDate) {
      params.push(`st=${startDate}`);
    }
    if (endDate) {
      params.push(`et=${endDate}`);
    }
    if (params.length > 0) {
      url += (url.includes('?') ? '&' : '?') + params.join('&');
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      ljlr: this.toNumber(this.getField(item, 'ljlr', 'Ljlr')),
      ljlc: this.toNumber(this.getField(item, 'ljlc', 'Ljlc')),
      ddanl: this.toNumber(this.getField(item, 'ddanl', 'Ddanl')),
      ddbb: this.toNumber(this.getField(item, 'ddbb', 'Ddbb')),
    }));
  }

  /**
   * 获取今日分时成交数据
   * @param stockCode 股票代码（如 000001）
   * @returns 今日分时成交数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/tick/股票代码/您的 licence
   */
  async fetchTodayTickTrade(stockCode: string): Promise<TodayTickTradeData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/tick/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      v: this.toNumber(this.getField(item, 'v', 'V')),
      bv: this.toNumber(this.getField(item, 'bv', 'Bv')),
      sv: this.toNumber(this.getField(item, 'sv', 'Sv')),
      bs: this.getField<string>(item, 'bs', 'Bs'),
    }));
  }

  /**
   * 获取历史停牌数据
   * @param stockCode 股票代码（如 000001）
   * @returns 历史停牌数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/stop/股票代码/您的 licence
   */
  async fetchStopPriceHistory(stockCode: string): Promise<StopPriceHistoryData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/stop/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      tp: this.getField<string>(item, 'tp', 'Tp'),
      sdrq: this.getField<string>(item, 'sdrq', 'Sdrq'),
      edrq: this.getField<string>(item, 'edrq', 'Edrq'),
      tpjc: this.getField<string>(item, 'tpjc', 'Tpjc'),
      lxrq: this.getField<string>(item, 'lxrq', 'Lxrq'),
      sdr: this.getField<string>(item, 'sdr', 'Sdr'),
      ed: this.getField<string>(item, 'ed', 'Ed'),
    }));
  }
}
