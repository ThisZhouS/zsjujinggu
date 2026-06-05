/**
 * IndexTechnicalIndicatorsClient - 指数技术指标 API 客户端
 *
 * 提供指数技术指标相关的 API 接口：
 * - 指数历史 MA (index_history_ma)
 * - 指数历史 MACD (index_history_macd)
 * - 指数历史 BOLL (index_history_boll)
 * - 指数历史 KDJ (index_history_kdj)
 * - 大盘指标 (market_indicator)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface IndexHistoryMaData {
  dm: string;
  t: string;
  p?: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma50?: number;
  ma100?: number;
  ma200?: number;
}

export interface IndexHistoryMacdData {
  dm: string;
  t: string;
  p?: number;
  dif?: number;
  dea?: number;
  macd?: number;
}

export interface IndexHistoryBollData {
  dm: string;
  t: string;
  p?: number;
  up?: number;
  mid?: number;
  dn?: number;
}

export interface IndexHistoryKdjData {
  dm: string;
  t: string;
  p?: number;
  k?: number;
  d?: number;
  j?: number;
}

export interface MarketIndicatorData {
  dm: string;
  t: string;
  p?: number;
  zdl?: number;
  zdlRate?: number;
  zl?: number;
  lr?: number;
  dyRate?: number;
  lbi?: number;
  vr?: number;
}

@Injectable()
export class IndexTechnicalIndicatorsClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取指数历史 MA 数据
   * @param indexCode 指数代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 指数历史 MA 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/index/history/ma/指数代码/您的 licence
   */
  async fetchIndexHistoryMa(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<IndexHistoryMaData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    let url = this.buildUrl(`/hssj/index/history/ma/${indexCode}`);
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
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      ma5: this.toNumber(this.getField(item, 'ma5', 'Ma5')),
      ma10: this.toNumber(this.getField(item, 'ma10', 'Ma10')),
      ma20: this.toNumber(this.getField(item, 'ma20', 'Ma20')),
      ma50: this.toNumber(this.getField(item, 'ma50', 'Ma50')),
      ma100: this.toNumber(this.getField(item, 'ma100', 'Ma100')),
      ma200: this.toNumber(this.getField(item, 'ma200', 'Ma200')),
    }));
  }

  /**
   * 获取指数历史 MACD 数据
   * @param indexCode 指数代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 指数历史 MACD 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/index/history/macd/指数代码/您的 licence
   */
  async fetchIndexHistoryMacd(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<IndexHistoryMacdData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    let url = this.buildUrl(`/hssj/index/history/macd/${indexCode}`);
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
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      dif: this.toNumber(this.getField(item, 'dif', 'Dif')),
      dea: this.toNumber(this.getField(item, 'dea', 'Dea')),
      macd: this.toNumber(this.getField(item, 'macd', 'Macd')),
    }));
  }

  /**
   * 获取指数历史 BOLL 数据
   * @param indexCode 指数代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 指数历史 BOLL 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/index/history/boll/指数代码/您的 licence
   */
  async fetchIndexHistoryBoll(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<IndexHistoryBollData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    let url = this.buildUrl(`/hssj/index/history/boll/${indexCode}`);
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
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      up: this.toNumber(this.getField(item, 'up', 'Up')),
      mid: this.toNumber(this.getField(item, 'mid', 'Mid')),
      dn: this.toNumber(this.getField(item, 'dn', 'Dn')),
    }));
  }

  /**
   * 获取指数历史 KDJ 数据
   * @param indexCode 指数代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 指数历史 KDJ 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/index/history/kdj/指数代码/您的 licence
   */
  async fetchIndexHistoryKdj(
    indexCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<IndexHistoryKdjData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    let url = this.buildUrl(`/hssj/index/history/kdj/${indexCode}`);
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
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      k: this.toNumber(this.getField(item, 'k', 'K')),
      d: this.toNumber(this.getField(item, 'd', 'D')),
      j: this.toNumber(this.getField(item, 'j', 'J')),
    }));
  }

  /**
   * 获取大盘指标数据
   * @param indexCode 指数代码（如 000001）
   * @returns 大盘指标数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/index/market/指数代码/您的 licence
   */
  async fetchMarketIndicator(indexCode: string): Promise<MarketIndicatorData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    const url = this.buildUrl(`/hssj/index/market/${indexCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      zdl: this.toNumber(this.getField(item, 'zdl', 'Zdl')),
      zdlRate: this.toNumber(this.getField(item, 'zdl_rate', 'Zdl_rate')),
      zl: this.toNumber(this.getField(item, 'zl', 'Zl')),
      lr: this.toNumber(this.getField(item, 'lr', 'Lr')),
      dyRate: this.toNumber(this.getField(item, 'dy_rate', 'Dy_rate')),
      lbi: this.toNumber(this.getField(item, 'lbi', 'Lbi')),
      vr: this.toNumber(this.getField(item, 'vr', 'Vr')),
    }));
  }
}
