/**
 * OtherMarketListsClient - 其他市场列表 API 客户端
 *
 * 提供其他市场列表相关的 API 接口：
 * - 北证指数列表 (bj_index_list)
 * - 科创股票列表 (kc_stock_list)
 * - ETF 基金列表 (etf_fund_list)
 * - 北交所股票列表 (bj_stock_list)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface BjIndexListData {
  dm: string;
  name?: string;
  jc?: string;
  ssrq?: string;
  zgb?: number;
  lgb?: number;
}

export interface KcStockListData {
  dm: string;
  name?: string;
  jc?: string;
  ssrq?: string;
  zgb?: number;
  lgb?: number;
  hy?: string;
  dq?: string;
}

export interface EtfFundListData {
  dm: string;
  name?: string;
  jc?: string;
  ssrq?: string;
  jzrq?: string;
  jz?: number;
  lgb?: number;
}

export interface BjStockListData {
  dm: string;
  name?: string;
  jc?: string;
  ssrq?: string;
  zgb?: number;
  lgb?: number;
  hy?: string;
  dq?: string;
}

@Injectable()
export class OtherMarketListsClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取北证指数列表
   * @returns 北证指数列表数据
   *
   * API 接口：http://api.mairuiapi.com/bj/index/list/您的 licence
   */
  async fetchBjIndexList(): Promise<BjIndexListData[]> {
    const url = this.buildUrl('/bj/index/list');
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || '',
      name: this.getField<string>(item, 'name', 'Name'),
      jc: this.getField<string>(item, 'jc', 'Jc'),
      ssrq: this.getField<string>(item, 'ssrq', 'Ssrq'),
      zgb: this.toNumber(this.getField(item, 'zgb', 'Zgb')),
      lgb: this.toNumber(this.getField(item, 'lgb', 'Lgb')),
    }));
  }

  /**
   * 获取科创股票列表
   * @returns 科创股票列表数据
   *
   * API 接口：http://api.mairuiapi.com/kc/stock/list/您的 licence
   */
  async fetchKcStockList(): Promise<KcStockListData[]> {
    const url = this.buildUrl('/kc/stock/list');
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || '',
      name: this.getField<string>(item, 'name', 'Name'),
      jc: this.getField<string>(item, 'jc', 'Jc'),
      ssrq: this.getField<string>(item, 'ssrq', 'Ssrq'),
      zgb: this.toNumber(this.getField(item, 'zgb', 'Zgb')),
      lgb: this.toNumber(this.getField(item, 'lgb', 'Lgb')),
      hy: this.getField<string>(item, 'hy', 'Hy'),
      dq: this.getField<string>(item, 'dq', 'Dq'),
    }));
  }

  /**
   * 获取 ETF 基金列表
   * @returns ETF 基金列表数据
   *
   * API 接口：http://api.mairuiapi.com/etf/fund/list/您的 licence
   */
  async fetchEtfFundList(): Promise<EtfFundListData[]> {
    const url = this.buildUrl('/etf/fund/list');
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || '',
      name: this.getField<string>(item, 'name', 'Name'),
      jc: this.getField<string>(item, 'jc', 'Jc'),
      ssrq: this.getField<string>(item, 'ssrq', 'Ssrq'),
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq'),
      jz: this.toNumber(this.getField(item, 'jz', 'Jz')),
      lgb: this.toNumber(this.getField(item, 'lgb', 'Lgb')),
    }));
  }

  /**
   * 获取北交所股票列表
   * @returns 北交所股票列表数据
   *
   * API 接口：http://api.mairuiapi.com/bj/stock/list/您的 licence
   */
  async fetchBjStockList(): Promise<BjStockListData[]> {
    const url = this.buildUrl('/bj/stock/list');
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || '',
      name: this.getField<string>(item, 'name', 'Name'),
      jc: this.getField<string>(item, 'jc', 'Jc'),
      ssrq: this.getField<string>(item, 'ssrq', 'Ssrq'),
      zgb: this.toNumber(this.getField(item, 'zgb', 'Zgb')),
      lgb: this.toNumber(this.getField(item, 'lgb', 'Lgb')),
      hy: this.getField<string>(item, 'hy', 'Hy'),
      dq: this.getField<string>(item, 'dq', 'Dq'),
    }));
  }
}
