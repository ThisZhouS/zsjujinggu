/**
 * MajorMarketListsClient - 主要市场列表 API 客户端
 *
 * 提供市场基础信息相关的 API 接口：
 * - 股票列表 (stock_list)
 * - 沪深基金列表 (hs_fund_list)
 * - 沪深主要指数列表 (hs_main_index_list)
 * - 新股日历 (new_stock_calendar)
 * - 港股股票列表 (hk_stock_list)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface StockListData {
  dm: string;    // 股票代码
  mc: string;    // 股票名称
  jys: string;   // 交易所
  updatedAt?: string;  // 更新时间
}

export interface HsFundListData {
  dm: string;    // 基金代码
  mc: string;    // 基金名称
  jys: string;   // 交易所
  updatedAt?: string;  // 更新时间
}

export interface HsMainIndexListData {
  dm: string;    // 指数代码
  mc: string;    // 指数名称
  jys: string;   // 交易所
  updatedAt?: string;  // 更新时间
}

export interface NewStockCalendarData {
  zqdm: string | null;   // 股票代码
  zqjc: string | null;   // 股票简称
  sgdm: string | null;   // 申购代码
  fxsl: number | null;   // 发行总数（股）
  swfxsl: number | null; // 网上发行（股）
  sgsx: number | null;   // 申购上限（股）
  dgsz: number | null;   // 顶格申购需配市值 (元)
  sgrq: string | null;   // 申购日期
  fxjg: number | null;   // 发行价格（元）
  zxj: number | null;    // 最新价（元）
  srspj: number | null;  // 首日收盘价（元）
  zqgbrq: string | null; // 中签号公布日
  zqjkrq: string | null; // 中签缴款日
  ssrq: string | null;   // 上市日期
  syl: number | null;    // 发行市盈率
  hysyl: number | null;  // 行业市盈率
  wszql: number | null;  // 中签率（%）
  yzbsl: number | null;  // 连续一字板数量
  zf: number | null;     // 涨幅（%）
  yqhl: number | null;   // 每中一签获利（元）
  zyyw: string | null;   // 主营业务
  updatedAt?: string;    // 更新时间
}

export interface HkStockListData {
  dm: string;    // 股票代码
  mc: string;    // 股票名称
  jys: string;   // 交易所
  updatedAt?: string;  // 更新时间
}

@Injectable()
export class MajorMarketListsClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取股票列表数据
   * @returns 股票列表数据
   *
   * API: /hslt/list/{licence}
   */
  async fetchStockList(): Promise<StockListData[]> {
    const url = this.buildUrl('/hslt/list');
    const data = await this.getRequest<Record<string, any>>(url);

    const result: StockListData[] = [];
    for (const item of data) {
      const dm = item['Dm'] ?? item['dm'] ?? item['code'] ?? item['stock_code'];
      if (!dm) {
        this.logger.warn(`股票列表数据缺少 dm 字段，跳过该记录：${JSON.stringify(item)}`);
        continue;
      }
      result.push({
        dm,
        mc: item['mc'] ?? item['Mc'] ?? '',
        jys: item['jys'] ?? item['Jys'] ?? '',
        updatedAt: item['updated_at'],
      });
    }
    return result;
  }

  /**
   * 获取沪深基金列表数据
   * @returns 沪深基金列表数据
   *
   * API: /fd/list/all/{licence}
   */
  async fetchHsFundList(): Promise<HsFundListData[]> {
    const url = this.buildUrl('/fd/list/all');
    const data = await this.getRequest<Record<string, any>>(url);

    const result: HsFundListData[] = [];
    for (const item of data) {
      const dm = item['Dm'] ?? item['dm'] ?? item['code'] ?? item['stock_code'];
      if (!dm) {
        this.logger.warn(`沪深基金列表数据缺少 dm 字段，跳过该记录：${JSON.stringify(item)}`);
        continue;
      }
      result.push({
        dm,
        mc: item['mc'] ?? item['Mc'] ?? '',
        jys: item['jys'] ?? item['Jys'] ?? '',
        updatedAt: item['updated_at'],
      });
    }
    return result;
  }

  /**
   * 获取沪深主要指数列表数据
   * @returns 沪深主要指数列表数据
   *
   * API: /hsindex/list/{licence}
   */
  async fetchHsMainIndexList(): Promise<HsMainIndexListData[]> {
    const url = this.buildUrl('/hsindex/list');
    const data = await this.getRequest<Record<string, any>>(url);

    const result: HsMainIndexListData[] = [];
    for (const item of data) {
      const dm = item['Dm'] ?? item['dm'] ?? item['code'] ?? item['stock_code'];
      if (!dm) {
        this.logger.warn(`沪深主要指数列表数据缺少 dm 字段，跳过该记录：${JSON.stringify(item)}`);
        continue;
      }
      result.push({
        dm,
        mc: item['mc'] ?? item['Mc'] ?? '',
        jys: item['jys'] ?? item['Jys'] ?? '',
        updatedAt: item['updated_at'],
      });
    }
    return result;
  }

  /**
   * 获取新股日历数据
   * @returns 新股日历数据
   *
   * API: /hslt/new/{licence}
   */
  async fetchNewStockCalendar(): Promise<NewStockCalendarData[]> {
    const url = this.buildUrl('/hslt/new');
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      zqdm: item['zqdm'] ?? null,
      zqjc: item['zqjc'] ?? null,
      sgdm: item['sgdm'] ?? null,
      fxsl: this.toNumber(item['fxsl']),
      swfxsl: this.toNumber(item['swfxsl']),
      sgsx: this.toNumber(item['sgsx']),
      dgsz: this.toNumber(item['dgsz']),
      sgrq: item['sgrq'] ?? null,
      fxjg: this.toNumber(item['fxjg']),
      zxj: this.toNumber(item['zxj']),
      srspj: this.toNumber(item['srspj']),
      zqgbrq: item['zqgbrq'] ?? null,
      zqjkrq: item['zqjkrq'] ?? null,
      ssrq: item['ssrq'] ?? null,
      syl: this.toNumber(item['syl']),
      hysyl: this.toNumber(item['hysyl']),
      wszql: this.toNumber(item['wszql']),
      yzbsl: this.toNumber(item['Yzbsl'] ?? item['yzbsl']),
      zf: this.toNumber(item['zf']),
      yqhl: this.toNumber(item['Yqhl'] ?? item['yqhl']),
      zyyw: item['zyyw'] ?? null,
      updatedAt: item['updated_at'],
    }));
  }

  /**
   * 获取港股股票列表数据
   * @returns 港股股票列表数据
   *
   * API: /hk/list/all/{licence}
   */
  async fetchHkStockList(): Promise<HkStockListData[]> {
    const url = this.buildUrl('/hk/list/all');
    const data = await this.getRequest<Record<string, any>>(url);

    const result: HkStockListData[] = [];
    for (const item of data) {
      const dm = item['Dm'] ?? item['dm'] ?? item['code'] ?? item['stock_code'];
      if (!dm) {
        this.logger.warn(`港股股票列表数据缺少 dm 字段，跳过该记录：${JSON.stringify(item)}`);
        continue;
      }
      result.push({
        dm,
        mc: item['mc'] ?? item['Mc'] ?? '',
        jys: item['jys'] ?? item['Jys'] ?? '',
        updatedAt: item['updated_at'],
      });
    }
    return result;
  }
}
