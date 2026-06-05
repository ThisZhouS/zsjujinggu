/**
 * RealTimeTradingInterfacesClient - 实时交易接口 API 客户端
 *
 * 提供实时交易相关的 API 接口：
 * - 全券商实时交易 (realtime_trading_all_broker)
 * - 全网络实时交易 (realtime_trading_all_network)
 * - 券商实时交易 (realtime_trading_broker)
 * - 网络实时交易 (realtime_trading_network)
 * - 多股票实时交易 (realtime_trading_multi_stock)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface RealtimeTradingData {
  dm: string;
  t: string;
  p?: number;
  v?: number;
  bs?: string;
  brokerId?: string;
  networkId?: string;
}

export interface RealtimeTradingBrokerData {
  dm: string;
  t: string;
  p?: number;
  v?: number;
  bs?: string;
  brokerId?: string;
}

export interface RealtimeTradingNetworkData {
  dm: string;
  t: string;
  p?: number;
  v?: number;
  bs?: string;
  networkId?: string;
}

export interface RealtimeTradingMultiStockData {
  dm: string;
  t: string;
  p?: number;
  v?: number;
  bs?: string;
}

@Injectable()
export class RealTimeTradingInterfacesClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取全券商实时交易数据
   * @param stockCode 股票代码（如 000001）
   * @returns 全券商实时交易数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/broker/all/股票代码/您的 licence
   */
  async fetchRealtimeTradingAllBroker(stockCode: string): Promise<RealtimeTradingData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/broker/all/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      v: this.toNumber(this.getField(item, 'v', 'V')),
      bs: this.getField<string>(item, 'bs', 'Bs'),
      brokerId: this.getField<string>(item, 'broker_id', 'Broker_id'),
      networkId: this.getField<string>(item, 'network_id', 'Network_id'),
    }));
  }

  /**
   * 获取全网络实时交易数据
   * @param stockCode 股票代码（如 000001）
   * @returns 全网络实时交易数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/network/all/股票代码/您的 licence
   */
  async fetchRealtimeTradingAllNetwork(stockCode: string): Promise<RealtimeTradingData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/network/all/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      v: this.toNumber(this.getField(item, 'v', 'V')),
      bs: this.getField<string>(item, 'bs', 'Bs'),
      brokerId: this.getField<string>(item, 'broker_id', 'Broker_id'),
      networkId: this.getField<string>(item, 'network_id', 'Network_id'),
    }));
  }

  /**
   * 获取券商实时交易数据
   * @param stockCode 股票代码（如 000001）
   * @param brokerId 券商 ID
   * @returns 券商实时交易数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/broker/股票代码/券商 ID/您的 licence
   */
  async fetchRealtimeTradingBroker(
    stockCode: string,
    brokerId: string,
  ): Promise<RealtimeTradingBrokerData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    if (!brokerId) {
      throw new Error('券商 ID 不能为空');
    }

    const url = this.buildUrl(`/hssj/broker/${stockCode}/${brokerId}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      v: this.toNumber(this.getField(item, 'v', 'V')),
      bs: this.getField<string>(item, 'bs', 'Bs'),
      brokerId: this.getField<string>(item, 'broker_id', 'Broker_id') || brokerId,
    }));
  }

  /**
   * 获取网络实时交易数据
   * @param stockCode 股票代码（如 000001）
   * @param networkId 网络 ID
   * @returns 网络实时交易数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/network/股票代码/网络 ID/您的 licence
   */
  async fetchRealtimeTradingNetwork(
    stockCode: string,
    networkId: string,
  ): Promise<RealtimeTradingNetworkData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    if (!networkId) {
      throw new Error('网络 ID 不能为空');
    }

    const url = this.buildUrl(`/hssj/network/${stockCode}/${networkId}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      v: this.toNumber(this.getField(item, 'v', 'V')),
      bs: this.getField<string>(item, 'bs', 'Bs'),
      networkId: this.getField<string>(item, 'network_id', 'Network_id') || networkId,
    }));
  }

  /**
   * 获取多股票实时交易数据
   * @param stockCodes 股票代码数组（如 ['000001', '000002']）
   * @returns 多股票实时交易数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/multi/股票代码 1,股票代码 2/您的 licence
   */
  async fetchRealtimeTradingMultiStock(stockCodes: string[]): Promise<RealtimeTradingMultiStockData[]> {
    if (!stockCodes || stockCodes.length === 0) {
      throw new Error('股票代码数组不能为空');
    }

    const url = this.buildUrl(`/hssj/multi/${stockCodes.join(',')}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || '',
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      v: this.toNumber(this.getField(item, 'v', 'V')),
      bs: this.getField<string>(item, 'bs', 'Bs'),
    }));
  }
}
