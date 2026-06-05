/**
 * HistoricalTradingDataClient - 历史分时交易数据 API 客户端
 *
 * 提供历史/最新分时交易相关的 API 接口：
 * - HS 指数历史分时交易 (hsindex/history)
 * - HS 指数最新分时交易 (hsindex/latest)
 * - HS 股票最新分时交易 (hsstock/latest)
 * - HS 股票历史分时交易 (hsstock/history)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface HsIndexHistoryTradingData {
  dm: string;    // 代码
  t: string;     // 时间
  o: number | null;     // 开盘
  h: number | null;     // 最高
  l: number | null;     // 最低
  c: number | null;     // 收盘
  v: number | null;     // 成交量
  a: number | null;     // 成交额
  pc: number | null;    // 昨收
  st: string | null;    // 开始时间
  et: string | null;    // 结束时间
}

export interface HsIndexLatestTradingData {
  dm: string;    // 代码
  t: string;     // 时间
  o: number | null;     // 开盘
  h: number | null;     // 最高
  l: number | null;     // 最低
  c: number | null;     // 收盘
  v: number | null;     // 成交量
  a: number | null;     // 成交额
  pc: number | null;    // 昨收
}

export interface HsStockLatestTradingData {
  dm: string;    // 代码
  t: string;     // 时间
  model: string; // 除权方式
  o: number | null;     // 开盘
  h: number | null;     // 最高
  l: number | null;     // 最低
  c: number | null;     // 收盘
  v: number | null;     // 成交量
  a: number | null;     // 成交额
  pc: number | null;    // 昨收
  sf: number | null;    // 复权因子
}

export interface HsStockHistoryTradingData {
  dm: string;    // 代码
  t: string;     // 时间
  model: string; // 除权方式
  o: number | null;     // 开盘
  h: number | null;     // 最高
  l: number | null;     // 最低
  c: number | null;     // 收盘
  v: number | null;     // 成交量
  a: number | null;     // 成交额
  pc: number | null;    // 昨收
  sf: number | null;    // 复权因子
}

@Injectable()
export class HistoricalTradingDataClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取 HS 指数历史分时交易数据
   * @param indexCode 指数代码。市场，如 "000001.SH"
   * @param level 分时级别，如 5/15/30/60/d/w/m/y
   * @param startDate 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss (可选)
   * @param endDate 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss (可选)
   * @returns 历史交易数据列表
   *
   * API: /hsindex/history/{indexCode}/{level}/{licence}
   */
  async fetchHsIndexHistoryTrading(
    indexCode: string,
    level: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HsIndexHistoryTradingData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }
    if (!level) {
      throw new Error('分时级别不能为空');
    }

    let url = this.buildUrl(`/hsindex/history/${indexCode}/${level}`);
    const params: string[] = [];
    if (startDate) params.push(`st=${startDate}`);
    if (endDate) params.push(`et=${endDate}`);
    if (params.length > 0) {
      url += (url.includes('?') ? '&' : '?') + params.join('&');
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: item['dm'] ?? indexCode,
      t: item['t'] ?? '',
      o: this.toNumber(item['o']),
      h: this.toNumber(item['h']),
      l: this.toNumber(item['l']),
      c: this.toNumber(item['c']),
      v: this.toNumber(item['v']),
      a: this.toNumber(item['a']),
      pc: this.toNumber(item['pc']),
      st: item['st'] ?? startDate ?? null,
      et: item['et'] ?? endDate ?? null,
    }));
  }

  /**
   * 获取 HS 指数最新分时交易数据
   * @param indexCode 指数代码。市场，如 "000001.SH"
   * @param level 分时级别，如 5/15/30/60/d/w/m/y
   * @returns 最新交易数据列表
   *
   * API: /hsindex/latest/{indexCode}/{level}/{licence}
   */
  async fetchHsIndexLatestTrading(
    indexCode: string,
    level: string,
  ): Promise<HsIndexLatestTradingData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }
    if (!level) {
      throw new Error('分时级别不能为空');
    }

    const url = this.buildUrl(`/hsindex/latest/${indexCode}/${level}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: item['dm'] ?? indexCode,
      t: item['t'] ?? '',
      o: this.toNumber(item['o']),
      h: this.toNumber(item['h']),
      l: this.toNumber(item['l']),
      c: this.toNumber(item['c']),
      v: this.toNumber(item['v']),
      a: this.toNumber(item['a']),
      pc: this.toNumber(item['pc']),
    }));
  }

  /**
   * 获取 HS 股票最新分时交易数据
   * @param stockCode 股票代码。市场，如 "000001.SZ"
   * @param level 分时级别，如 5/15/30/60/d/w/m/y
   * @param adjustType 除权方式 n/f/b/fr/br (分钟级仅 n)
   * @param latest 最新条数 (可选)
   * @returns 最新分时交易数据列表
   *
   * API: /hsstock/latest/{stockCode}/{level}/{adjustType}/{licence}
   */
  async fetchHsStockLatestTrading(
    stockCode: string,
    level: string,
    adjustType: string,
    latest?: number,
  ): Promise<HsStockLatestTradingData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }
    if (!level) {
      throw new Error('分时级别不能为空');
    }
    if (!adjustType) {
      throw new Error('除权方式不能为空');
    }

    let url = this.buildUrl(`/hsstock/latest/${stockCode}/${level}/${adjustType}`);
    if (latest !== undefined) {
      url += (url.includes('?') ? '&' : '?') + `lt=${latest}`;
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: item['dm'] ?? stockCode,
      t: item['t'] ?? '',
      model: item['model'] ?? adjustType,
      o: this.toNumber(item['o']),
      h: this.toNumber(item['h']),
      l: this.toNumber(item['l']),
      c: this.toNumber(item['c']),
      v: this.toNumber(item['v']),
      a: this.toNumber(item['a']),
      pc: this.toNumber(item['pc']),
      sf: this.toNumber(item['sf']),
    }));
  }

  /**
   * 获取 HS 股票历史分时交易数据
   * @param stockCode 股票代码。市场，如 "000001.SZ"
   * @param level 分时级别，如 5/15/30/60/d/w/m/y
   * @param adjustType 除权方式 n/f/b/fr/br (分钟级仅 n)
   * @param startDate 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss (可选)
   * @param endDate 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss (可选)
   * @param latest 最新条数 (可选)
   * @returns 历史分时交易数据列表
   *
   * API: /hsstock/history/{stockCode}/{level}/{adjustType}/{licence}
   */
  async fetchHsStockHistoryTrading(
    stockCode: string,
    level: string,
    adjustType: string,
    startDate?: string,
    endDate?: string,
    latest?: number,
  ): Promise<HsStockHistoryTradingData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }
    if (!level) {
      throw new Error('分时级别不能为空');
    }
    if (!adjustType) {
      throw new Error('除权方式不能为空');
    }

    let url = this.buildUrl(`/hsstock/history/${stockCode}/${level}/${adjustType}`);
    const params: string[] = [];
    if (startDate) params.push(`st=${startDate}`);
    if (endDate) params.push(`et=${endDate}`);
    if (latest !== undefined) params.push(`lt=${latest}`);
    if (params.length > 0) {
      url += (url.includes('?') ? '&' : '?') + params.join('&');
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: item['dm'] ?? stockCode,
      t: item['t'] ?? '',
      model: item['model'] ?? adjustType,
      o: this.toNumber(item['o']),
      h: this.toNumber(item['h']),
      l: this.toNumber(item['l']),
      c: this.toNumber(item['c']),
      v: this.toNumber(item['v']),
      a: this.toNumber(item['a']),
      pc: this.toNumber(item['pc']),
      sf: this.toNumber(item['sf']),
    }));
  }
}
