/**
 * ShareholderInfoClient - 股东基础信息 API 客户端
 *
 * 提供股东基础信息相关的 API 接口：
 * - 公司股东数 (company_shareholder_count)
 * - 公司十大股东 (company_top_holders)
 * - 公司十大流通股东 (company_top_flow_holders)
 *
 * API Base URL: http://api.mairuiapi.com
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface ShareholderCountData {
  dm: string;
  plrq?: string;
  jzrq?: string;
  gdzs?: number;
  agdhs?: number;
  bgdhs?: number;
  hgdhs?: number;
  yltgdhs?: number;
  wltgdhs?: number;
}

export interface TopHolderData {
  dm: string;
  plrq?: string;
  jzrq?: string;
  gdmc?: string;
  gdlx?: string;
  cgsl?: number;
  bdyy?: string;
  cgbl?: number;
  gfxz?: string;
  cgpm?: string;
}

export interface TopFlowHolderData {
  dm: string;
  ggrq?: string;
  jzrq?: string;
  gdmc?: string;
  gdlx?: string;
  cgsl?: number;
  bdyy?: string;
  cgbl?: number;
  gfxz?: string;
  cgpm?: string;
}

@Injectable()
export class ShareholderInfoClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  private toNullableString(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const text = String(value).trim();
    return text ? text : undefined;
  }

  /**
   * 获取公司股东数
   * @param stockCode 股票代码（如 000001.SZ）
   * @param startDate 开始日期（YYYYMMDD 格式，可选）
   * @param endDate 结束日期（YYYYMMDD 格式，可选）
   * @returns 公司股东数数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsstock/financial/hm/股票代码（如 000001.SZ）/您的 licence?st=开始时间&et=结束时间
   */
  async fetchCompanyShareholderCount(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ShareholderCountData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/hm/${stockCode}`);
    const params = this.buildDateParams(startDate, endDate);
    if (params) {
      url += (url.includes('?') ? '&' : '?') + params;
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      plrq: this.getField<string>(item, 'plrq', 'PLRQ'),
      jzrq: this.getField<string>(item, 'jzrq', 'JZRQ'),
      gdzs: this.toNumber(this.getField(item, 'gdzs', 'GDZS')),
      agdhs: this.toNumber(this.getField(item, 'agdhs', 'AGDHS')),
      bgdhs: this.toNumber(this.getField(item, 'bgdhs', 'BGDHS')),
      hgdhs: this.toNumber(this.getField(item, 'hgdhs', 'HGDHS')),
      yltgdhs: this.toNumber(this.getField(item, 'yltgdhs', 'YLTGDHS')),
      wltgdhs: this.toNumber(this.getField(item, 'wltgdhs', 'WLTGDHS')),
    }));
  }

  /**
   * 获取公司十大股东
   * @param stockCode 股票代码（如 000001.SZ）
   * @param startDate 开始日期（YYYYMMDD 格式，可选）
   * @param endDate 结束日期（YYYYMMDD 格式，可选）
   * @returns 公司十大股东数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsstock/financial/topholder/股票代码（如 000001.SZ）/您的 licence?st=开始时间&et=结束时间
   */
  async fetchCompanyTopHolders(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TopHolderData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/topholder/${stockCode}`);
    const params = this.buildDateParams(startDate, endDate);
    if (params) {
      url += (url.includes('?') ? '&' : '?') + params;
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      plrq: this.getField<string>(item, 'plrq', 'PLRQ'),
      jzrq: this.getField<string>(item, 'jzrq', 'JZRQ'),
      gdmc: this.getField<string>(item, 'gdmc', 'GDMC'),
      gdlx: this.getField<string>(item, 'gdlx', 'GDLX'),
      cgsl: this.toNumber(this.getField(item, 'cgsl', 'CGSL')),
      bdyy: this.getField<string>(item, 'bdyy', 'Bdyy', 'BDYY'),
      cgbl: this.toNumber(this.getField(item, 'cgbl', 'CGBL')),
      gfxz: this.getField<string>(item, 'gfxz', 'GFXZ'),
      cgpm: this.toNullableString(this.getField(item, 'cgpm', 'CGPM')),
    }));
  }

  /**
   * 获取公司十大流通股东
   * @param stockCode 股票代码（如 000001.SZ）
   * @param startDate 开始日期（YYYYMMDD 格式，可选）
   * @param endDate 结束日期（YYYYMMDD 格式，可选）
   * @returns 公司十大流通股东数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsstock/financial/flowholder/股票代码（如 000001.SZ）/您的 licence?st=开始时间&et=结束时间
   */
  async fetchCompanyTopFlowHolders(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TopFlowHolderData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/flowholder/${stockCode}`);
    const params = this.buildDateParams(startDate, endDate);
    if (params) {
      url += (url.includes('?') ? '&' : '?') + params;
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      ggrq: this.getField<string>(item, 'ggrq', 'GGRQ'),
      jzrq: this.getField<string>(item, 'jzrq', 'JZRQ'),
      gdmc: this.getField<string>(item, 'gdmc', 'GDMC'),
      gdlx: this.getField<string>(item, 'gdlx', 'Gdlx', 'GDLX'),
      cgsl: this.toNumber(this.getField(item, 'cgsl', 'CGSL')),
      bdyy: this.getField<string>(item, 'bdyy', 'Bdyy', 'BDYY'),
      cgbl: this.toNumber(this.getField(item, 'cgbl', 'CGBL')),
      gfxz: this.getField<string>(item, 'gfxz', 'GFXZ'),
      cgpm: this.toNullableString(this.getField(item, 'cgpm', 'CGPM')),
    }));
  }

  /**
   * 构建日期查询参数
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 查询参数字符串（不含前导?）
   */
  private buildDateParams(startDate?: string, endDate?: string): string {
    const params: string[] = [];
    if (startDate) {
      params.push(`st=${startDate}`);
    }
    if (endDate) {
      params.push(`et=${endDate}`);
    }
    return params.join('&');
  }
}
