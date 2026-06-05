/**
 * ShanghaiShenzhenTechnicalIndicatorsClient - 沪深技术指标 API 客户端
 *
 * 提供沪深股票技术指标相关的 API 接口：
 * - 沪深股票历史 MA (hs_stock_history_ma)
 * - 沪深股票历史 MACD (hs_stock_history_macd)
 * - 沪深股票历史 BOLL (hs_stock_history_boll)
 * - 沪深股票历史 KDJ (hs_stock_history_kdj)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface HistoryMaData {
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

export interface HistoryMacdData {
  dm: string;
  t: string;
  p?: number;
  dif?: number;
  dea?: number;
  macd?: number;
}

export interface HistoryBollData {
  dm: string;
  t: string;
  p?: number;
  up?: number;
  mid?: number;
  dn?: number;
}

export interface HistoryKdjData {
  dm: string;
  t: string;
  p?: number;
  k?: number;
  d?: number;
  j?: number;
}

@Injectable()
export class ShanghaiShenzhenTechnicalIndicatorsClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取沪深股票历史 MA 数据
   * @param stockCode 股票代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 历史 MA 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/history/ma/股票代码/您的 licence
   */
  async fetchHsStockHistoryMa(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HistoryMaData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hssj/history/ma/${stockCode}`);
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
   * 获取沪深股票历史 MACD 数据
   * @param stockCode 股票代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 历史 MACD 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/history/macd/股票代码/您的 licence
   */
  async fetchHsStockHistoryMacd(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HistoryMacdData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hssj/history/macd/${stockCode}`);
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
      p: this.toNumber(this.getField(item, 'p', 'P')),
      dif: this.toNumber(this.getField(item, 'dif', 'Dif')),
      dea: this.toNumber(this.getField(item, 'dea', 'Dea')),
      macd: this.toNumber(this.getField(item, 'macd', 'Macd')),
    }));
  }

  /**
   * 获取沪深股票历史 BOLL 数据
   * @param stockCode 股票代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 历史 BOLL 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/history/boll/股票代码/您的 licence
   */
  async fetchHsStockHistoryBoll(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HistoryBollData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hssj/history/boll/${stockCode}`);
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
      p: this.toNumber(this.getField(item, 'p', 'P')),
      up: this.toNumber(this.getField(item, 'up', 'Up')),
      mid: this.toNumber(this.getField(item, 'mid', 'Mid')),
      dn: this.toNumber(this.getField(item, 'dn', 'Dn')),
    }));
  }

  /**
   * 获取沪深股票历史 KDJ 数据
   * @param stockCode 股票代码（如 000001）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 历史 KDJ 数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/history/kdj/股票代码/您的 licence
   */
  async fetchHsStockHistoryKdj(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HistoryKdjData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hssj/history/kdj/${stockCode}`);
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
      p: this.toNumber(this.getField(item, 'p', 'P')),
      k: this.toNumber(this.getField(item, 'k', 'K')),
      d: this.toNumber(this.getField(item, 'd', 'D')),
      j: this.toNumber(this.getField(item, 'j', 'J')),
    }));
  }
}
