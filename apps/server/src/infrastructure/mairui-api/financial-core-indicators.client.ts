/**
 * FinancialCoreIndicatorsClient - 财务核心指标 API 客户端
 *
 * 提供财务核心指标相关的 API 接口：
 * - 财务主要指标 (financial_main_indicators)
 * - 财务指标 (financial_indicators)
 * - 近年业绩预告 (performance_forecast)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface FinancialMainIndicatorsData {
  dm: string;
  jzrq: string;
  plrq: string | null;
  mgjyhdxjl: number | null;
  mgjzc: number | null;
  jbmgsy: number | null;
  xsmgsy: number | null;
  mgwfplr: number | null;
  mgzbgjj: number | null;
  kfmgsy: number | null;
  jzcsyl: number | null;
  xsmlv: number | null;
  zyyrsrzz: number | null;
  jlrzz: number | null;
  gsmgsyzzdjlrzz: number | null;
  kfjlrzz: number | null;
  yyzsrgdhbzz: number | null;
  sljlrjqhbzz: number | null;
  kfjlrgdhbzz: number | null;
  jqjzcsyl: number | null;
  tbjzcsyl: number | null;
  tbzzcsyl: number | null;
  mlv: number | null;
  jlv: number | null;
  sjslv: number | null;
  yskyysr: number | null;
  xsxjlyysr: number | null;
  zcfzl: number | null;
  chzzl: number | null;
}

export interface FinancialIndicatorsData {
  dm: string;
  date: string;
  tbmg: string | null;
  jqmg: string | null;
  mgsy: string | null;
  kfmg: string | null;
  mgjz: string | null;
  mgjzad: string | null;
  mgjy: string | null;
  mggjj: string | null;
  mgwly: string | null;
  zclr: string | null;
  zylr: string | null;
  zzlr: string | null;
  cblr: string | null;
  yylr: string | null;
  zycb: string | null;
  xsjl: string | null;
  gbbc: string | null;
  jzbc: string | null;
  zcbc: string | null;
  xsml: string | null;
  xxbz: string | null;
  fzy: string | null;
  zybz: string | null;
  gxff: string | null;
  tzsy: string | null;
  zyyw: string | null;
  jzsy: string | null;
  jqjz: string | null;
  kflr: string | null;
  zysr: string | null;
  jlzz: string | null;
  jzzz: string | null;
  zzzz: string | null;
  yszz: string | null;
  yszzt: string | null;
  chzz: string | null;
  chzzl: string | null;
  gzzz: string | null;
  zzzzl: string | null;
  zzzzt: string | null;
  ldzz: string | null;
  ldzzt: string | null;
  gdzz: string | null;
  ldbl: string | null;
  sdbl: string | null;
  xjbl: string | null;
  lxzf: string | null;
  zjbl: string | null;
  gdqy: string | null;
  cqfz: string | null;
  gdgd: string | null;
  fzqy: string | null;
  zczjbl: string | null;
  zblv: string | null;
  gdzcjz: string | null;
  zbgdh: string | null;
  cqbl: string | null;
  qxjzb: string | null;
  gdzcbz: string | null;
  zcfzl: string | null;
  zzc: string | null;
  jyxj: string | null;
  zcjyxj: string | null;
  jylrb: string | null;
  jyfzl: string | null;
  xjlbl: string | null;
  dqgptz: string | null;
  dqzctz: string | null;
  dqjytz: string | null;
  qcgptz: string | null;
  cqzqtz: string | null;
  cqjyxtz: string | null;
  yszk1: string | null;
  yszk12: string | null;
  yszk23: string | null;
  yszk3: string | null;
  yfhk1: string | null;
  yfhk12: string | null;
  yfhk23: string | null;
  yfhk3: string | null;
  ysk1: string | null;
  ysk12: string | null;
  ysk23: string | null;
  ysk3: string | null;
}

export interface PerformanceForecastData {
  dm: string;
  pdate: string;
  rdate: string | null;
  type: string | null;
  abs: string | null;
  old: string | null;
}

@Injectable()
export class FinancialCoreIndicatorsClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取财务主要指标数据
   * @param stockCode 股票代码
   * @param startDate 开始时间 (可选)
   * @param endDate 结束时间 (可选)
   * @returns 财务主要指标数据列表
   *
   * API: /hsstock/financial/pershareindex/{stockCode}/{licence}
   */
  async fetchFinancialMainIndicators(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialMainIndicatorsData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/pershareindex/${stockCode}`);
    const params: string[] = [];
    if (startDate) params.push(`st=${startDate}`);
    if (endDate) params.push(`et=${endDate}`);
    if (params.length > 0) {
      url += (url.includes('?') ? '&' : '?') + params.join('&');
    }

    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: item['dm'] ?? stockCode,
      jzrq: item['jzrq'] ?? '',
      plrq: item['plrq'] ?? null,
      mgjyhdxjl: this.toNumber(item['Mgjyhdxjl']),
      mgjzc: this.toNumber(item['mgjzc']),
      jbmgsy: this.toNumber(item['jbmgsy']),
      xsmgsy: this.toNumber(item['xsmgsy']),
      mgwfplr: this.toNumber(item['mgwfplr']),
      mgzbgjj: this.toNumber(item['mgzbgjj']),
      kfmgsy: this.toNumber(item['kfmgsy']),
      jzcsyl: this.toNumber(item['jzcsyl']),
      xsmlv: this.toNumber(item['xsmlv']),
      zyyrsrzz: this.toNumber(item['zyyrsrzz']),
      jlrzz: this.toNumber(item['jlrzz']),
      gsmgsyzzdjlrzz: this.toNumber(item['gsmgsyzzdjlrzz']),
      kfjlrzz: this.toNumber(item['kfjlrzz']),
      yyzsrgdhbzz: this.toNumber(item['yyzsrgdhbzz']),
      sljlrjqhbzz: this.toNumber(item['sljlrjqhbzz']),
      kfjlrgdhbzz: this.toNumber(item['kfjlrgdhbzz']),
      jqjzcsyl: this.toNumber(item['jqjzcsyl']),
      tbjzcsyl: this.toNumber(item['tbjzcsyl']),
      tbzzcsyl: this.toNumber(item['tbzzcsyl']),
      mlv: this.toNumber(item['mlv']),
      jlv: this.toNumber(item['jlv']),
      sjslv: this.toNumber(item['Sjslv']),
      yskyysr: this.toNumber(item['yskyysr']),
      xsxjlyysr: this.toNumber(item['xsxjlyysr']),
      zcfzl: this.toNumber(item['zcfzl']),
      chzzl: this.toNumber(item['chzzl']),
    }));
  }

  /**
   * 获取财务指标数据
   * @param stockCode 股票代码，如"000001"
   * @returns 财务指标数据列表
   *
   * API: /hscp/cwzb/{stockCode}/{licence}
   */
  async fetchFinancialIndicators(stockCode: string): Promise<FinancialIndicatorsData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/cwzb/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: item['dm'] ?? stockCode,
      date: item['date'] ?? '',
      tbmg: item['tbmg'] ?? null,
      jqmg: item['jqmg'] ?? null,
      mgsy: item['mgsy'] ?? null,
      kfmg: item['kfmg'] ?? null,
      mgjz: item['Mgjz'] ?? null,
      mgjzad: item['mgjzad'] ?? null,
      mgjy: item['Mgjy'] ?? null,
      mggjj: item['mggjj'] ?? null,
      mgwly: item['mgwly'] ?? null,
      zclr: item['zclr'] ?? null,
      zylr: item['zylr'] ?? null,
      zzlr: item['zzlr'] ?? null,
      cblr: item['cblr'] ?? null,
      yylr: item['yylr'] ?? null,
      zycb: item['zycb'] ?? null,
      xsjl: item['xsjl'] ?? null,
      gbbc: item['gbbc'] ?? null,
      jzbc: item['jzbc'] ?? null,
      zcbc: item['zcbc'] ?? null,
      xsml: item['xsml'] ?? null,
      xxbz: item['xxbz'] ?? null,
      fzy: item['fzy'] ?? null,
      zybz: item['zybz'] ?? null,
      gxff: item['gxff'] ?? null,
      tzsy: item['tzsy'] ?? null,
      zyyw: item['zyyw'] ?? null,
      jzsy: item['jzsy'] ?? null,
      jqjz: item['jqjz'] ?? null,
      kflr: item['kflr'] ?? null,
      zysr: item['zysr'] ?? null,
      jlzz: item['Jlzz'] ?? null,
      jzzz: item['jzzz'] ?? null,
      zzzz: item['zzzz'] ?? null,
      yszz: item['yszz'] ?? null,
      yszzt: item['yszzt'] ?? null,
      chzz: item['chzz'] ?? null,
      chzzl: item['chzzl'] ?? null,
      gzzz: item['gzzz'] ?? null,
      zzzzl: item['zzzzl'] ?? null,
      zzzzt: item['zzzzt'] ?? null,
      ldzz: item['ldzz'] ?? null,
      ldzzt: item['ldzzt'] ?? null,
      gdzz: item['Gdzz'] ?? null,
      ldbl: item['ldbl'] ?? null,
      sdbl: item['Sdbl'] ?? null,
      xjbl: item['xjbl'] ?? null,
      lxzf: item['lxzf'] ?? null,
      zjbl: item['zjbl'] ?? null,
      gdqy: item['gdqy'] ?? null,
      cqfz: item['Cqfz'] ?? null,
      gdgd: item['Gdgd'] ?? null,
      fzqy: item['fzqy'] ?? null,
      zczjbl: item['zczjbl'] ?? null,
      zblv: item['zblv'] ?? null,
      gdzcjz: item['gdzcjz'] ?? null,
      zbgdh: item['zbgdh'] ?? null,
      cqbl: item['cqbl'] ?? null,
      qxjzb: item['qxjzb'] ?? null,
      gdzcbz: item['gdzcbz'] ?? null,
      zcfzl: item['zcfzl'] ?? null,
      zzc: item['zzc'] ?? null,
      jyxj: item['jyxj'] ?? null,
      zcjyxj: item['zcjyxj'] ?? null,
      jylrb: item['jylrb'] ?? null,
      jyfzl: item['jyfzl'] ?? null,
      xjlbl: item['xjlbl'] ?? null,
      dqgptz: item['dqgptz'] ?? null,
      dqzctz: item['dqzctz'] ?? null,
      dqjytz: item['dqjytz'] ?? null,
      qcgptz: item['qcgptz'] ?? null,
      cqzqtz: item['cqzqtz'] ?? null,
      cqjyxtz: item['cqjyxtz'] ?? null,
      yszk1: item['yszk1'] ?? null,
      yszk12: item['yszk12'] ?? null,
      yszk23: item['yszk23'] ?? null,
      yszk3: item['yszk3'] ?? null,
      yfhk1: item['yfhk1'] ?? null,
      yfhk12: item['yfhk12'] ?? null,
      yfhk23: item['yfhk23'] ?? null,
      yfhk3: item['yfhk3'] ?? null,
      ysk1: item['ysk1'] ?? null,
      ysk12: item['ysk12'] ?? null,
      ysk23: item['ysk23'] ?? null,
      ysk3: item['ysk3'] ?? null,
    }));
  }

  /**
   * 获取近年业绩预告数据
   * @param stockCode 股票代码，如"000001"
   * @returns 近年业绩预告数据列表
   *
   * API: /hscp/yjyg/{stockCode}/{licence}
   */
  async fetchPerformanceForecast(stockCode: string): Promise<PerformanceForecastData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/yjyg/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: item['dm'] ?? stockCode,
      pdate: item['pdate'] ?? '',
      rdate: item['rdate'] ?? null,
      type: item['type'] ?? null,
      abs: item['abs'] ?? null,
      old: item['old'] ?? null,
    }));
  }
}
