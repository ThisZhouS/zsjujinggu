/**
 * MarketDepthDataClient - 市场深度数据 API 客户端
 *
 * 提供市场深度数据相关的 API 接口：
 * - 沪深个股实时五档 (hs_stock_real_five)
 * - 科创个股实时五档 (kc_stock_real_five)
 * - 北交所个股实时五档 (bj_stock_real_five)
 * - 港股个股实时五档 (hk_stock_real_five)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface StockRealFiveData {
  dm: string;
  t: string;
  p?: number;
  bj1p?: number;
  bj1v?: number;
  bj2p?: number;
  bj2v?: number;
  bj3p?: number;
  bj3v?: number;
  bj4p?: number;
  bj4v?: number;
  bj5p?: number;
  bj5v?: number;
  sj1p?: number;
  sj1v?: number;
  sj2p?: number;
  sj2v?: number;
  sj3p?: number;
  sj3v?: number;
  sj4p?: number;
  sj4v?: number;
  sj5p?: number;
  sj5v?: number;
}

@Injectable()
export class MarketDepthDataClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取沪深个股实时五档数据
   * @param stockCode 股票代码（如 000001）
   * @returns 实时五档数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/realfive/股票代码/您的 licence
   */
  async fetchHsStockRealFive(stockCode: string): Promise<StockRealFiveData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/realfive/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      bj1p: this.toNumber(this.getField(item, 'bj1p', 'Bj1p')),
      bj1v: this.toNumber(this.getField(item, 'bj1v', 'Bj1v')),
      bj2p: this.toNumber(this.getField(item, 'bj2p', 'Bj2p')),
      bj2v: this.toNumber(this.getField(item, 'bj2v', 'Bj2v')),
      bj3p: this.toNumber(this.getField(item, 'bj3p', 'Bj3p')),
      bj3v: this.toNumber(this.getField(item, 'bj3v', 'Bj3v')),
      bj4p: this.toNumber(this.getField(item, 'bj4p', 'Bj4p')),
      bj4v: this.toNumber(this.getField(item, 'bj4v', 'Bj4v')),
      bj5p: this.toNumber(this.getField(item, 'bj5p', 'Bj5p')),
      bj5v: this.toNumber(this.getField(item, 'bj5v', 'Bj5v')),
      sj1p: this.toNumber(this.getField(item, 'sj1p', 'Sj1p')),
      sj1v: this.toNumber(this.getField(item, 'sj1v', 'Sj1v')),
      sj2p: this.toNumber(this.getField(item, 'sj2p', 'Sj2p')),
      sj2v: this.toNumber(this.getField(item, 'sj2v', 'Sj2v')),
      sj3p: this.toNumber(this.getField(item, 'sj3p', 'Sj3p')),
      sj3v: this.toNumber(this.getField(item, 'sj3v', 'Sj3v')),
      sj4p: this.toNumber(this.getField(item, 'sj4p', 'Sj4p')),
      sj4v: this.toNumber(this.getField(item, 'sj4v', 'Sj4v')),
      sj5p: this.toNumber(this.getField(item, 'sj5p', 'Sj5p')),
      sj5v: this.toNumber(this.getField(item, 'sj5v', 'Sj5v')),
    }));
  }

  /**
   * 获取科创个股实时五档数据
   * @param stockCode 股票代码（如 000001）
   * @returns 实时五档数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/kcrealfive/股票代码/您的 licence
   */
  async fetchKcStockRealFive(stockCode: string): Promise<StockRealFiveData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/kcrealfive/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      bj1p: this.toNumber(this.getField(item, 'bj1p', 'Bj1p')),
      bj1v: this.toNumber(this.getField(item, 'bj1v', 'Bj1v')),
      bj2p: this.toNumber(this.getField(item, 'bj2p', 'Bj2p')),
      bj2v: this.toNumber(this.getField(item, 'bj2v', 'Bj2v')),
      bj3p: this.toNumber(this.getField(item, 'bj3p', 'Bj3p')),
      bj3v: this.toNumber(this.getField(item, 'bj3v', 'Bj3v')),
      bj4p: this.toNumber(this.getField(item, 'bj4p', 'Bj4p')),
      bj4v: this.toNumber(this.getField(item, 'bj4v', 'Bj4v')),
      bj5p: this.toNumber(this.getField(item, 'bj5p', 'Bj5p')),
      bj5v: this.toNumber(this.getField(item, 'bj5v', 'Bj5v')),
      sj1p: this.toNumber(this.getField(item, 'sj1p', 'Sj1p')),
      sj1v: this.toNumber(this.getField(item, 'sj1v', 'Sj1v')),
      sj2p: this.toNumber(this.getField(item, 'sj2p', 'Sj2p')),
      sj2v: this.toNumber(this.getField(item, 'sj2v', 'Sj2v')),
      sj3p: this.toNumber(this.getField(item, 'sj3p', 'Sj3p')),
      sj3v: this.toNumber(this.getField(item, 'sj3v', 'Sj3v')),
      sj4p: this.toNumber(this.getField(item, 'sj4p', 'Sj4p')),
      sj4v: this.toNumber(this.getField(item, 'sj4v', 'Sj4v')),
      sj5p: this.toNumber(this.getField(item, 'sj5p', 'Sj5p')),
      sj5v: this.toNumber(this.getField(item, 'sj5v', 'Sj5v')),
    }));
  }

  /**
   * 获取北交所个股实时五档数据
   * @param stockCode 股票代码（如 000001）
   * @returns 实时五档数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/bjrealfive/股票代码/您的 licence
   */
  async fetchBjStockRealFive(stockCode: string): Promise<StockRealFiveData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/bjrealfive/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      bj1p: this.toNumber(this.getField(item, 'bj1p', 'Bj1p')),
      bj1v: this.toNumber(this.getField(item, 'bj1v', 'Bj1v')),
      bj2p: this.toNumber(this.getField(item, 'bj2p', 'Bj2p')),
      bj2v: this.toNumber(this.getField(item, 'bj2v', 'Bj2v')),
      bj3p: this.toNumber(this.getField(item, 'bj3p', 'Bj3p')),
      bj3v: this.toNumber(this.getField(item, 'bj3v', 'Bj3v')),
      bj4p: this.toNumber(this.getField(item, 'bj4p', 'Bj4p')),
      bj4v: this.toNumber(this.getField(item, 'bj4v', 'Bj4v')),
      bj5p: this.toNumber(this.getField(item, 'bj5p', 'Bj5p')),
      bj5v: this.toNumber(this.getField(item, 'bj5v', 'Bj5v')),
      sj1p: this.toNumber(this.getField(item, 'sj1p', 'Sj1p')),
      sj1v: this.toNumber(this.getField(item, 'sj1v', 'Sj1v')),
      sj2p: this.toNumber(this.getField(item, 'sj2p', 'Sj2p')),
      sj2v: this.toNumber(this.getField(item, 'sj2v', 'Sj2v')),
      sj3p: this.toNumber(this.getField(item, 'sj3p', 'Sj3p')),
      sj3v: this.toNumber(this.getField(item, 'sj3v', 'Sj3v')),
      sj4p: this.toNumber(this.getField(item, 'sj4p', 'Sj4p')),
      sj4v: this.toNumber(this.getField(item, 'sj4v', 'Sj4v')),
      sj5p: this.toNumber(this.getField(item, 'sj5p', 'Sj5p')),
      sj5v: this.toNumber(this.getField(item, 'sj5v', 'Sj5v')),
    }));
  }

  /**
   * 获取港股个股实时五档数据
   * @param stockCode 股票代码（如 000001）
   * @returns 实时五档数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/hkrealfive/股票代码/您的 licence
   */
  async fetchHkStockRealFive(stockCode: string): Promise<StockRealFiveData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/hkrealfive/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      bj1p: this.toNumber(this.getField(item, 'bj1p', 'Bj1p')),
      bj1v: this.toNumber(this.getField(item, 'bj1v', 'Bj1v')),
      bj2p: this.toNumber(this.getField(item, 'bj2p', 'Bj2p')),
      bj2v: this.toNumber(this.getField(item, 'bj2v', 'Bj2v')),
      bj3p: this.toNumber(this.getField(item, 'bj3p', 'Bj3p')),
      bj3v: this.toNumber(this.getField(item, 'bj3v', 'Bj3v')),
      bj4p: this.toNumber(this.getField(item, 'bj4p', 'Bj4p')),
      bj4v: this.toNumber(this.getField(item, 'bj4v', 'Bj4v')),
      bj5p: this.toNumber(this.getField(item, 'bj5p', 'Bj5p')),
      bj5v: this.toNumber(this.getField(item, 'bj5v', 'Bj5v')),
      sj1p: this.toNumber(this.getField(item, 'sj1p', 'Sj1p')),
      sj1v: this.toNumber(this.getField(item, 'sj1v', 'Sj1v')),
      sj2p: this.toNumber(this.getField(item, 'sj2p', 'Sj2p')),
      sj2v: this.toNumber(this.getField(item, 'sj2v', 'Sj2v')),
      sj3p: this.toNumber(this.getField(item, 'sj3p', 'Sj3p')),
      sj3v: this.toNumber(this.getField(item, 'sj3v', 'Sj3v')),
      sj4p: this.toNumber(this.getField(item, 'sj4p', 'Sj4p')),
      sj4v: this.toNumber(this.getField(item, 'sj4v', 'Sj4v')),
      sj5p: this.toNumber(this.getField(item, 'sj5p', 'Sj5p')),
      sj5v: this.toNumber(this.getField(item, 'sj5v', 'Sj5v')),
    }));
  }
}
