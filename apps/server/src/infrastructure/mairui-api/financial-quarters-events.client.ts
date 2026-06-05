/**
 * FinancialQuartersEventsClient - 季度财务事件 API 客户端
 *
 * 提供季度财务事件相关的 API 接口：
 * - 近期分红 (recent_dividend)
 * - 近期增发 (recent_additional_issue)
 * - 季度利润 (quarterly_profit)
 * - 季度现金流 (quarterly_cash_flow)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface RecentDividendData {
  dm: string;
  jzrq: string;
  plrq: string;
  fhx?: string;
  fhjyr?: string;
  fhjzr?: string;
  hf?: string;
  hfjyr?: string;
  hfjzr?: string;
  zf?: string;
  zfjyr?: string;
  zfjzr?: string;
}

export interface RecentAdditionalIssueData {
  dm: string;
  jzrq: string;
  plrq: string;
  zfx?: string;
  zfrq?: string;
  zfxz?: string;
  zxj?: number;
  zxr?: number;
  zxsl?: number;
  zje?: number;
}

export interface QuarterlyProfitData {
  dm: string;
  jzrq: string;
  plrq: string;
  jlr?: number;
  jlrzz?: number;
  yysr?: number;
  yysrzz?: number;
  jlrhfe?: number;
  yysrhfe?: number;
}

export interface QuarterlyCashFlowData {
  dm: string;
  jzrq: string;
  plrq: string;
  jydxjlr?: number;
  tzdxjlr?: number;
  czdxjlr?: number;
  xjjze?: number;
}

@Injectable()
export class FinancialQuartersEventsClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  private toOptionalText(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const text = String(value).trim();
    if (
      !text ||
      text === '--' ||
      text.includes('暂时没有数据') ||
      text.toLowerCase() === 'null'
    ) {
      return undefined;
    }

    return text;
  }

  private normalizeDateText(value: unknown): string | undefined {
    const text = this.toOptionalText(value);
    if (!text) {
      return undefined;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }

    if (/^\d{8}$/.test(text)) {
      return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
    }

    return undefined;
  }

  /**
   * 获取近期分红数据
   * @param stockCode 股票代码（如 000001）
   * @returns 近期分红数据列表
   *
   * API 接口：https://api.mairuiapi.com/hscp/jnfh/股票代码/您的 licence
   */
  async fetchRecentDividend(stockCode: string): Promise<RecentDividendData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = `https://api.mairuiapi.com/hscp/jnfh/${stockCode}/${this.apiKey}`;
    const data = await this.getRequest<Record<string, any>>(url);

    return data
      .map((item): RecentDividendData | null => {
        const status = this.toOptionalText(this.getField(item, 'line', 'Line', 'status'));
        if (status && status !== '实施') {
          return null;
        }

        const jzrq = this.normalizeDateText(
          this.getField(item, 'jzrq', 'Jzrq', 'sdate', 'Sdate', 'edate', 'Edate'),
        );
        const plrq = this.normalizeDateText(
          this.getField(item, 'plrq', 'Plrq', 'cdate', 'Cdate', 'sdate', 'Sdate'),
        );
        const fhx = this.toOptionalText(this.getField(item, 'fhx', 'Fhx', 'send', 'Send'));
        const hf = this.toOptionalText(this.getField(item, 'hf', 'Hf', 'give', 'Give'));
        const zf = this.toOptionalText(
          this.getField(item, 'zf', 'Zf', 'change', 'Change'),
        );

        if (!jzrq || !plrq || (!fhx && !hf && !zf)) {
          return null;
        }

        return {
          dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
          jzrq,
          plrq,
          fhx,
          fhjyr: this.normalizeDateText(
            this.getField(item, 'fhjyr', 'Fhjyr', 'hdate', 'Hdate', 'cdate', 'Cdate'),
          ),
          fhjzr: this.normalizeDateText(
            this.getField(item, 'fhjzr', 'Fhjzr', 'edate', 'Edate'),
          ),
          hf,
          hfjyr: this.normalizeDateText(
            this.getField(item, 'hfjyr', 'Hfjyr', 'hdate', 'Hdate'),
          ),
          hfjzr: this.normalizeDateText(
            this.getField(item, 'hfjzr', 'Hfjzr', 'edate', 'Edate'),
          ),
          zf,
          zfjyr: this.normalizeDateText(
            this.getField(item, 'zfjyr', 'Zfjyr', 'hdate', 'Hdate'),
          ),
          zfjzr: this.normalizeDateText(
            this.getField(item, 'zfjzr', 'Zfjzr', 'edate', 'Edate'),
          ),
        };
      })
      .filter((item): item is RecentDividendData => item !== null);
  }

  /**
   * 获取近期增发数据
   * @param stockCode 股票代码（如 000001）
   * @returns 近期增发数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/ zf/股票代码/您的 licence
   */
  async fetchRecentAdditionalIssue(stockCode: string): Promise<RecentAdditionalIssueData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/zf/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      plrq: this.getField<string>(item, 'plrq', 'Plrq') || '',
      zfx: this.getField<string>(item, 'zfx', 'Zfx'),
      zfrq: this.getField<string>(item, 'zfrq', 'Zfrq'),
      zfxz: this.getField<string>(item, 'zfxz', 'Zfxz'),
      zxj: this.toNumber(this.getField(item, 'zxj', 'Zxj')),
      zxr: this.toNumber(this.getField(item, 'zxr', 'Zxr')),
      zxsl: this.toNumber(this.getField(item, 'zxsl', 'Zxsl')),
      zje: this.toNumber(this.getField(item, 'zje', 'Zje')),
    }));
  }

  /**
   * 获取季度利润数据
   * @param stockCode 股票代码（如 000001）
   * @returns 季度利润数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/quarterprofit/股票代码/您的 licence
   */
  async fetchQuarterlyProfit(stockCode: string): Promise<QuarterlyProfitData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/quarterprofit/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      plrq: this.getField<string>(item, 'plrq', 'Plrq') || '',
      jlr: this.toNumber(this.getField(item, 'jlr', 'Jlr')),
      jlrzz: this.toNumber(this.getField(item, 'jlrzz', 'Jlrzz')),
      yysr: this.toNumber(this.getField(item, 'yysr', 'Yysr')),
      yysrzz: this.toNumber(this.getField(item, 'yysrzz', 'Yysrzz')),
      jlrhfe: this.toNumber(this.getField(item, 'jlrhfe', 'Jlrhfe')),
      yysrhfe: this.toNumber(this.getField(item, 'yysrhfe', 'Yysrhfe')),
    }));
  }

  /**
   * 获取季度现金流数据
   * @param stockCode 股票代码（如 000001）
   * @returns 季度现金流数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/quartercashflow/股票代码/您的 licence
   */
  async fetchQuarterlyCashFlow(stockCode: string): Promise<QuarterlyCashFlowData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/quartercashflow/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      plrq: this.getField<string>(item, 'plrq', 'Plrq') || '',
      jydxjlr: this.toNumber(this.getField(item, 'jydxjlr', 'Jydxjlr')),
      tzdxjlr: this.toNumber(this.getField(item, 'tzdxjlr', 'Tzdxjlr')),
      czdxjlr: this.toNumber(this.getField(item, 'czdxjlr', 'Czdxjlr')),
      xjjze: this.toNumber(this.getField(item, 'xjjze', 'Xjjze')),
    }));
  }
}
