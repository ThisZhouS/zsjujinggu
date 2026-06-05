/**
 * ShareholderDetailedDataClient - 股东明细数据 API 客户端
 *
 * 提供股东明细相关的 API 接口：
 * - 十大股东 (shareholder_top10)
 * - 十大流通股东 (shareholder_top10_float)
 * - 股东变化趋势 (shareholder_change_trend)
 * - 基金持股 (fund_holdings)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface ShareholderTop10Data {
  dm: string;
  jzrq: string;
  ggrq: string;
  gdsm?: string;
  gdzs?: number;
  pjcg?: number;
  sdgdJson?: string;
}

export interface ShareholderTop10FloatData {
  dm: string;
  jzrq: string;
  ggrq: string;
  sdgdJson?: string;
}

export interface ShareholderChangeTrendData {
  dm: string;
  jzrq: string;
  gdhs?: string;
  bh?: string;
}

export interface FundHoldingData {
  dm: string;
  jzrq: string;
  jjdm: string;
  jjmc?: string;
  ccsl?: number;
  ltbl?: number;
  cgsz?: number;
  jzbl?: number;
}

@Injectable()
export class ShareholderDetailedDataClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取十大股东数据
   * @param stockCode 股票代码（如 000001）
   * @returns 十大股东数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/tenholder/股票代码/您的 licence
   */
  async fetchTop10Shareholders(stockCode: string): Promise<ShareholderTop10Data[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/tenholder/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => {
      const sdgd = item['sdgd'] ?? item['SDGD'];
      return {
        dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
        jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
        ggrq: this.getField<string>(item, 'ggrq', 'Ggrq') || '',
        gdsm: this.getField<string>(item, 'gdsm', 'Gdsm'),
        gdzs: this.toNumber(this.getField(item, 'gdzs', 'Gdzs')),
        pjcg: this.toNumber(this.getField(item, 'pjcg', 'Pjcg')),
        sdgdJson: sdgd ? (typeof sdgd === 'string' ? sdgd : JSON.stringify(sdgd)) : undefined,
      };
    });
  }

  /**
   * 获取十大流通股东数据
   * @param stockCode 股票代码（如 000001）
   * @returns 十大流通股东数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/tenflowholder/股票代码/您的 licence
   */
  async fetchTop10FloatShareholders(stockCode: string): Promise<ShareholderTop10FloatData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/tenflowholder/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => {
      const sdgd = item['sdgd'] ?? item['SDGD'];
      return {
        dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
        jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
        ggrq: this.getField<string>(item, 'ggrq', 'Ggrq') || '',
        sdgdJson: sdgd ? (typeof sdgd === 'string' ? sdgd : JSON.stringify(sdgd)) : undefined,
      };
    });
  }

  /**
   * 获取股东变化趋势数据
   * @param stockCode 股票代码（如 000001）
   * @returns 股东变化趋势数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/holdertrend/股票代码/您的 licence
   */
  async fetchShareholderChangeTrend(stockCode: string): Promise<ShareholderChangeTrendData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/holdertrend/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      gdhs: this.getField<string>(item, 'gdhs', 'Gdhs'),
      bh: this.getField<string>(item, 'bh', 'Bh'),
    }));
  }

  /**
   * 获取基金持股数据
   * @param stockCode 股票代码（如 000001）
   * @returns 基金持股数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/fundhold/股票代码/您的 licence
   */
  async fetchFundHoldings(stockCode: string): Promise<FundHoldingData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/fundhold/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      jjdm: this.getField<string>(item, 'jjdm', 'Jjdm') || '',
      jjmc: this.getField<string>(item, 'jjmc', 'Jjmc'),
      ccsl: this.toNumber(this.getField(item, 'ccsl', 'Ccsl')),
      ltbl: this.toNumber(this.getField(item, 'ltbl', 'Ltbl')),
      cgsz: this.toNumber(this.getField(item, 'cgsz', 'Cgsz')),
      jzbl: this.toNumber(this.getField(item, 'jzbl', 'Jzbl')),
    }));
  }
}
