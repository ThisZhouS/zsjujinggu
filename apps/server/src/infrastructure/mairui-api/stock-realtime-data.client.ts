/**
 * StockRealTimeDataClient - 股票实时数据 API 客户端
 *
 * 提供股票/基金实时交易数据 API 接口：
 * - 科创股票实时数据 (kc_stock_real_time_data)
 * - 沪深指数实时数据 (hs_index_real_time_data)
 * - 沪深基金实时数据 (hf_fund_real_time_data)
 * - 港股实时数据 (hk_stock_real_time_data)
 * - 京市股票实时数据 (bj_stock_real_time_data)
 *
 * API Base URL: http://api.mairuiapi.com
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface KcStockRealTimeData {
  dm: string;
  p?: number;
  o?: number;
  h?: number;
  l?: number;
  yc?: number;
  cje?: number;
  v?: number;
  pv?: number;
  ud?: number;
  pc?: number;
  zf?: number;
  t: Date;
  pe?: number;
  tr?: number;
  pbRatio?: number;
  tv?: number;
}

export interface HsIndexRealTimeData {
  dm: string;
  p?: number;
  o?: number;
  h?: number;
  l?: number;
  yc?: number;
  cje?: number;
  v?: number;
  pv?: number;
  ud?: number;
  pc?: number;
  zf?: number;
  t: Date;
}

export interface HfFundRealTimeData {
  dm: string;
  p?: number;
  o?: number;
  h?: number;
  l?: number;
  yc?: number;
  cje?: number;
  v?: number;
  pv?: number;
  ud?: number;
  pc?: number;
  zf?: number;
  t: Date;
  pe?: number;
  tr?: number;
  pbRatio?: number;
  tv?: number;
}

export interface HkStockRealTimeData {
  dm: string;
  p?: number;
  o?: number;
  h?: number;
  l?: number;
  yc?: number;
  cje?: number;
  v?: number;
  pv?: number;
  ud?: number;
  pc?: number;
  zf?: number;
  t: Date;
  pe?: number;
  tr?: number;
  pbRatio?: number;
  tv?: number;
  updatedAt?: Date;
}

export interface BjStockRealTimeData {
  dm: string;
  p?: number;
  o?: number;
  h?: number;
  l?: number;
  yc?: number;
  cje?: number;
  v?: number;
  pv?: number;
  ud?: number;
  pc?: number;
  zf?: number;
  t: Date;
  pe?: number;
  tr?: number;
  pbRatio?: number;
  tv?: number;
}

@Injectable()
export class StockRealTimeDataClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取科创股票实时数据
   * @param stockCode 股票代码（如 688001）
   * @returns 科创股票实时数据列表
   *
   * API 接口：http://api.mairuiapi.com/kc/real/time/股票代码 (如 688001)/您的 licence
   */
  async fetchKcStockRealTimeData(stockCode: string): Promise<KcStockRealTimeData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/kc/real/time/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: KcStockRealTimeData[] = [];
    for (const item of data) {
      const tValue = this.getField<string>(item, 't', 'T');
      if (!tValue) {
        this.logger.warn(`跳过无效数据：股票代码 ${stockCode} 的更新时间字段为空`);
        continue;
      }

      const parsedDate = this.parseDateTime(tValue);
      if (!parsedDate) {
        this.logger.warn(`跳过无效数据：股票代码 ${stockCode} 的更新时间格式错误`);
        continue;
      }

      result.push({
        dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
        p: this.toNumber(this.getField(item, 'p', 'P')),
        o: this.toNumber(this.getField(item, 'o', 'O')),
        h: this.toNumber(this.getField(item, 'h', 'H')),
        l: this.toNumber(this.getField(item, 'l', 'L')),
        yc: this.toNumber(this.getField(item, 'yc', 'YC')),
        cje: this.toNumber(this.getField(item, 'cje', 'CJE')),
        v: this.toNumber(this.getField(item, 'v', 'V')),
        pv: this.toNumber(this.getField(item, 'pv', 'PV')),
        ud: this.toNumber(this.getField(item, 'ud', 'UD')),
        pc: this.toNumber(this.getField(item, 'pc', 'PC')),
        zf: this.toNumber(this.getField(item, 'zf', 'ZF')),
        t: parsedDate,
        pe: this.toNumber(this.getField(item, 'pe', 'PE')),
        tr: this.toNumber(this.getField(item, 'tr', 'TR')),
        pbRatio: this.toNumber(this.getField(item, 'pb_ratio', 'Pb_ratio')),
        tv: this.toNumber(this.getField(item, 'tv', 'TV')),
      });
    }

    return result;
  }

  /**
   * 获取沪深指数实时数据
   * @param indexCode 指数代码（如 000001.SH）
   * @returns 沪深指数实时数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsindex/real/time/指数代码 (如：000001.SH)/您的 licence
   */
  async fetchHsIndexRealTimeData(indexCode: string): Promise<HsIndexRealTimeData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    const url = this.buildUrl(`/hsindex/real/time/${indexCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: HsIndexRealTimeData[] = [];
    for (const item of data) {
      const tValue = this.getField<string>(item, 't', 'T');
      if (!tValue) {
        this.logger.warn(`跳过无效数据：指数代码 ${indexCode} 的更新时间字段为空`);
        continue;
      }

      const parsedDate = this.parseDateTime(tValue);
      if (!parsedDate) {
        this.logger.warn(`跳过无效数据：指数代码 ${indexCode} 的更新时间格式错误`);
        continue;
      }

      result.push({
        dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
        p: this.toNumber(this.getField(item, 'p', 'P')),
        o: this.toNumber(this.getField(item, 'o', 'O')),
        h: this.toNumber(this.getField(item, 'h', 'H')),
        l: this.toNumber(this.getField(item, 'l', 'L')),
        yc: this.toNumber(this.getField(item, 'yc', 'YC')),
        cje: this.toNumber(this.getField(item, 'cje', 'CJE')),
        v: this.toNumber(this.getField(item, 'v', 'V')),
        pv: this.toNumber(this.getField(item, 'pv', 'PV')),
        ud: this.toNumber(this.getField(item, 'ud', 'UD')),
        pc: this.toNumber(this.getField(item, 'pc', 'PC')),
        zf: this.toNumber(this.getField(item, 'zf', 'ZF')),
        t: parsedDate,
      });
    }

    return result;
  }

  /**
   * 获取沪深基金实时数据
   * @param fundCode 基金代码（如 159001）
   * @returns 沪深基金实时数据列表
   *
   * API 接口：http://api.mairuiapi.com/hf/real/time/基金代码 (如 159001)/您的 licence
   */
  async fetchHfFundRealTimeData(fundCode: string): Promise<HfFundRealTimeData[]> {
    if (!fundCode) {
      throw new Error('基金代码不能为空');
    }

    const url = this.buildUrl(`/hf/real/time/${fundCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: HfFundRealTimeData[] = [];
    for (const item of data) {
      const tValue = this.getField<string>(item, 't', 'T');
      if (!tValue) {
        this.logger.warn(`跳过无效数据：基金代码 ${fundCode} 的更新时间字段为空`);
        continue;
      }

      const parsedDate = this.parseDateTime(tValue);
      if (!parsedDate) {
        this.logger.warn(`跳过无效数据：基金代码 ${fundCode} 的更新时间格式错误`);
        continue;
      }

      result.push({
        dm: this.getField<string>(item, 'dm', 'Dm') || fundCode,
        p: this.toNumber(this.getField(item, 'p', 'P')),
        o: this.toNumber(this.getField(item, 'o', 'O')),
        h: this.toNumber(this.getField(item, 'h', 'H')),
        l: this.toNumber(this.getField(item, 'l', 'L')),
        yc: this.toNumber(this.getField(item, 'yc', 'YC')),
        cje: this.toNumber(this.getField(item, 'cje', 'CJE')),
        v: this.toNumber(this.getField(item, 'v', 'V')),
        pv: this.toNumber(this.getField(item, 'pv', 'PV')),
        ud: this.toNumber(this.getField(item, 'ud', 'UD')),
        pc: this.toNumber(this.getField(item, 'pc', 'PC')),
        zf: this.toNumber(this.getField(item, 'zf', 'ZF')),
        t: parsedDate,
        pe: this.toNumber(this.getField(item, 'pe', 'PE')),
        tr: this.toNumber(this.getField(item, 'tr', 'TR')),
        pbRatio: this.toNumber(this.getField(item, 'pb_ratio', 'Pb_ratio')),
        tv: this.toNumber(this.getField(item, 'tv', 'TV')),
      });
    }

    return result;
  }

  /**
   * 获取港股实时数据
   * @param stockCode 股票代码（如 00001）
   * @returns 港股实时数据列表
   *
   * API 接口：http://api.mairuiapi.com/hk/stock/real/time/股票代码 (如 00001)/您的 licence
   */
  async fetchHkStockRealTimeData(stockCode: string): Promise<HkStockRealTimeData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hk/stock/real/time/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: HkStockRealTimeData[] = [];
    for (const item of data) {
      const tValue = this.getField<string>(item, 't', 'T');
      if (!tValue) {
        this.logger.warn(`跳过无效数据：股票代码 ${stockCode} 的更新时间字段为空`);
        continue;
      }

      const parsedDate = this.parseDateTime(tValue);
      if (!parsedDate) {
        this.logger.warn(`跳过无效数据：股票代码 ${stockCode} 的更新时间格式错误`);
        continue;
      }

      result.push({
        dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
        p: this.toNumber(this.getField(item, 'p', 'P')),
        o: this.toNumber(this.getField(item, 'o', 'O')),
        h: this.toNumber(this.getField(item, 'h', 'H')),
        l: this.toNumber(this.getField(item, 'l', 'L')),
        yc: this.toNumber(this.getField(item, 'yc', 'YC')),
        cje: this.toNumber(this.getField(item, 'cje', 'CJE')),
        v: this.toNumber(this.getField(item, 'v', 'V')),
        pv: this.toNumber(this.getField(item, 'pv', 'PV')),
        ud: this.toNumber(this.getField(item, 'ud', 'UD')),
        pc: this.toNumber(this.getField(item, 'pc', 'PC')),
        zf: this.toNumber(this.getField(item, 'zf', 'ZF')),
        t: parsedDate,
        pe: this.toNumber(this.getField(item, 'pe', 'PE')),
        tr: this.toNumber(this.getField(item, 'tr', 'TR')),
        pbRatio: this.toNumber(this.getField(item, 'pb_ratio', 'Pb_ratio')),
        tv: this.toNumber(this.getField(item, 'tv', 'TV')),
        updatedAt: this.parseDateTime(this.getField<string>(item, 'updated_at', 'Updated_at')),
      });
    }

    return result;
  }

  /**
   * 获取京市股票实时数据
   * @param stockCode 股票代码（如 430017）
   * @returns 京市股票实时数据列表
   *
   * API 接口：http://api.mairuiapi.com/bj/stock/real/time/股票代码 (如 430017)/您的 licence
   */
  async fetchBjStockRealTimeData(stockCode: string): Promise<BjStockRealTimeData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/bj/stock/real/time/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: BjStockRealTimeData[] = [];
    for (const item of data) {
      const tValue = this.getField<string>(item, 't', 'T');
      if (!tValue) {
        this.logger.warn(`跳过无效数据：股票代码 ${stockCode} 的更新时间字段为空`);
        continue;
      }

      const parsedDate = this.parseDateTime(tValue);
      if (!parsedDate) {
        this.logger.warn(`跳过无效数据：股票代码 ${stockCode} 的更新时间格式错误`);
        continue;
      }

      result.push({
        dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
        p: this.toNumber(this.getField(item, 'p', 'P')),
        o: this.toNumber(this.getField(item, 'o', 'O')),
        h: this.toNumber(this.getField(item, 'h', 'H')),
        l: this.toNumber(this.getField(item, 'l', 'L')),
        yc: this.toNumber(this.getField(item, 'yc', 'YC')),
        cje: this.toNumber(this.getField(item, 'cje', 'CJE')),
        v: this.toNumber(this.getField(item, 'v', 'V')),
        pv: this.toNumber(this.getField(item, 'pv', 'PV')),
        ud: this.toNumber(this.getField(item, 'ud', 'UD')),
        pc: this.toNumber(this.getField(item, 'pc', 'PC')),
        zf: this.toNumber(this.getField(item, 'zf', 'ZF')),
        t: parsedDate,
        pe: this.toNumber(this.getField(item, 'pe', 'PE')),
        tr: this.toNumber(this.getField(item, 'tr', 'TR')),
        pbRatio: this.toNumber(this.getField(item, 'pb_ratio', 'Pb_ratio')),
        tv: this.toNumber(this.getField(item, 'tv', 'TV')),
      });
    }

    return result;
  }
}
