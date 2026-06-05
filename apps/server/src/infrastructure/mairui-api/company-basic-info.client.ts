/**
 * CompanyBasicInfoClient - 公司基本信息 API 客户端
 *
 * 提供公司基本信息相关的 API 接口：
 * - 公司简介 (company_intro)
 * - 公司股本 (company_capital)
 * - 股票基础信息 (stock_basic_info)
 * - 解禁限售 (lift_restriction)
 *
 * API Base URL: http://api.mairuiapi.com
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface CompanyIntroData {
  dm: string;
  name: string;
  ename?: string;
  market?: string;
  idea?: string;
  ldate?: string;
  sprice?: string;
  principal?: string;
  rdate?: string;
  rprice?: string;
  organ?: string;
  secre?: string;
  phone?: string;
  fax?: string;
  email?: string;
  site?: string;
  addr?: string;
  desc?: string;
  bscope?: string;
  pe?: string;
}

export interface CompanyCapitalData {
  dm: string;
  zgb?: number;
  ysltag?: number;
  xsltgf?: number;
  bdrq?: string;
  plrq?: string;
}

export interface LiftRestrictionData {
  dm: string;
  rdate?: string;
  ramount?: number;
  rprice?: number;
  batch?: string;
  pdate?: string;
}

@Injectable()
export class CompanyBasicInfoClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取公司简介数据
   * @param stockCode 股票代码（如 000001）
   * @returns 公司简介数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/gsjj/股票代码 (如 000001)/您的 licence
   */
  async fetchCompanyIntro(stockCode: string): Promise<CompanyIntroData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/gsjj/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      name: this.getField<string>(item, 'name', 'Name') || '',
      ename: this.getField<string>(item, 'ename', 'Ename'),
      market: this.getField<string>(item, 'market', 'Market'),
      idea: this.getField<string>(item, 'idea', 'Idea'),
      ldate: this.getField<string>(item, 'ldate', 'Ldate'),
      sprice: this.getField<string>(item, 'sprice', 'Sprice'),
      principal: this.getField<string>(item, 'principal', 'Principal'),
      rdate: this.getField<string>(item, 'rdate', 'Rdate'),
      rprice: this.getField<string>(item, 'rprice', 'Rprice'),
      organ: this.getField<string>(item, 'organ', 'Organ'),
      secre: this.getField<string>(item, 'secre', 'Secre'),
      phone: this.getField<string>(item, 'phone', 'Phone'),
      fax: this.getField<string>(item, 'fax', 'Fax'),
      email: this.getField<string>(item, 'email', 'Email'),
      site: this.getField<string>(item, 'site', 'Site'),
      addr: this.getField<string>(item, 'addr', 'Addr'),
      desc: this.getField<string>(item, 'desc', 'Desc'),
      bscope: this.getField<string>(item, 'bscope', 'Bscope'),
      pe: this.getField<string>(item, 'pe', 'Pe'),
    }));
  }

  /**
   * 获取公司股本表数据
   * @param stockCode 股票代码（如 000001.SZ）
   * @param startDate 开始日期（YYYYMMDD 格式，可选）
   * @param endDate 结束日期（YYYYMMDD 格式，可选）
   * @returns 公司股本表数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsstock/financial/capital/股票代码（如 000001.SZ）/您的 licence?st=开始时间&et=结束时间
   */
  async fetchCompanyCapital(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<CompanyCapitalData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/capital/${stockCode}`);
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
      zgb: this.toNumber(this.getField(item, 'zgb', 'ZGB')),
      ysltag: this.toNumber(this.getField(item, 'ysltag', 'YSLTAG')),
      xsltgf: this.toNumber(this.getField(item, 'xsltgf', 'XSLTGF')),
      bdrq: this.getField<string>(item, 'bdrq', 'BDRQ'),
      plrq: this.getField<string>(item, 'plrq', 'PLRQ'),
    }));
  }

  /**
   * 获取解禁限售数据
   * @param stockCode 股票代码（如 000001）
   * @returns 解禁限售数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/jjxs/股票代码 (如 000001)/您的 licence
   */
  async fetchLiftRestriction(stockCode: string): Promise<LiftRestrictionData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/jjxs/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      rdate: this.getField<string>(item, 'rdate', 'Rdate'),
      ramount: this.toNumber(this.getField(item, 'ramount', 'RAMOUNT')),
      rprice: this.toNumber(this.getField(item, 'rprice', 'RPRICE')),
      batch: this.getField<string>(item, 'batch', 'BATCH'),
      pdate: this.getField<string>(item, 'pdate', 'PDATE'),
    }));
  }
}
