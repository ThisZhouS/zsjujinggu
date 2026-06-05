/**
 * FinancialStatementsClient - 财务报表 API 客户端
 *
 * 提供财务报表相关的 API 接口：
 * - 利润表 (income_statement)
 * - 现金流量表 (cashflow_statement)
 * - 资产负债表 (balance_sheet)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface IncomeStatementData {
  dm: string;
  jzrq: string;
  plrq: string;
  yysr?: number;
  yzbf?: number;
  fdczssr?: number;
  yyzcb?: number;
  fdczscb?: number;
  yffy?: number;
  tbj?: number;
  pczjje?: number;
  tqbxhtzbjje?: number;
  bdhlzc?: number;
  fbfy?: number;
  gyjzbdsy?: number;
  qhsy?: number;
  tgsy?: number;
  btsr?: number;
  qtywlr?: number;
  bhbfzhbqsljlr?: number;
  lxsr?: number;
  sxfjyjsr?: number;
  sxfjyjzc?: number;
  qtywcb?: number;
  hdsy?: number;
  fldzcczsy?: number;
  sdsfy?: number;
  wqrtzss?: number;
  gsmgsyzzdjlr?: number;
  lxzc?: number;
  qtywsr?: number;
  yyzsr?: number;
  yycb?: number;
  yysjjfj?: number;
  xsfy?: number;
  glfy?: number;
  cwfy?: number;
  zcjzss?: number;
  tzsy?: number;
  lyqyhhhqydtzsy?: number;
  yylr?: number;
  ywsr?: number;
  ywzc?: number;
  lze?: number;
  jlr?: number;
  jlrhfcjcx?: number;
  ssgdsy?: number;
  jbmgsy?: number;
  xsmgsy?: number;
  zhsyz?: number;
  gsssgdzhsyz?: number;
  qtsy?: number;
}

export interface CashFlowStatementData {
  dm: string;
  jzrq: string;
  plrq: string;
  sdydbxbfqdxj?: number;
  sdzbxywxjjje?: number;
  bhcjjtkkjzje?: number;
  czjyxjrzcjzje?: number;
  sqlxsxfjyjdxj?: number;
  hgywzjjzje?: number;
  zfybxhtpfkxdj?: number;
  zfbdhldxj?: number;
  czfzgsjqtsddxj?: number;
  jszyhdqckssddxj?: number;
  tzszfdxj?: number;
  zydkjzje?: number;
  qdfzgsjqtywdwzfdxjje?: number;
  zjzyhdqckszfdxj?: number;
  qzfzgsxrxj?: number;
  qz_fzgszfgsssgdglr?: number;
  ssgdsy?: number;
  wqrdtzss?: number;
  dysyzj_j_js?: number;
  yjfz?: number;
  jxyyfxmdzj?: number;
  ywgwswjskdjs_j_zj?: number;
  yjswgwgdjz_j_js?: number;
  xssptglwsddxj?: number;
  khckhtyckxkjzje?: number;
  xzyhyhkjzje?: number;
  xtjrgjqjcrzjjzje?: number;
  sddsfyfh?: number;
  tzzfdxj?: number;
  sdqtyjyghdxj?: number;
  jyhdxjlrxj?: number;
  gmspjslwzfdxj?: number;
  khdkjdknzje?: number;
  cfzyxhytckxkjzje?: number;
  zflxsxfjyjdxj?: number;
  zfgzyjwzgzfdxj?: number;
  zfdgxsf?: number;
  zfqtyjyghdxj?: number;
  jyhdxjlcxj?: number;
  jyhdcsdxjlje?: number;
  shtzssddxj?: number;
  qdtzsysddxj?: number;
  czgdzcwxzhqtqctzssddxj?: number;
  sdqtytzghdxj?: number;
  tzhdxjlrxj?: number;
  gjgdzcwxzhqtqctzzfdxj?: number;
  tzhdxjlcxj?: number;
  tzhdcsdxjlxj?: number;
  xstzsdj?: number;
  qdjkjddxj?: number;
  fxzjsddxj?: number;
  sdqtczghdxj?: number;
  czhdxjlrxj?: number;
  chzwzfxj?: number;
  fpglrlhcllxzfdxj?: number;
  zfqtczdxj?: number;
  czhdxjlcxj?: number;
  czhdcsdxjlxj?: number;
  hlbddxjdxy?: number;
  xjxjdhwjzje?: number;
  qcxjjxjdhwye?: number;
  qmxjjxjdhwye?: number;
  jlr?: number;
  zcjzzb?: number;
  gdzczjyqzcshscxwzczj?: number;
  wxzctx?: number;
  cqdtfytx?: number;
  dtfydjs?: number;
  ytfydzj?: number;
  czgdzcwxzhqtqctzss?: number;
  gdzcgbss?: number;
  gyjzbds?: number;
  cwfy?: number;
  tzss?: number;
  dysdszcjs?: number;
  dysdsfzzj?: number;
  chdjs?: number;
  jxyysxmdjs?: number;
  qt?: number;
  jyhdcsdxjlxj?: number;
  zwzwzb?: number;
  ynndqdkzhgzq?: number;
  rzrgdzc?: number;
  xjdqmye?: number;
  xjdqcye?: number;
  xjdhwdqmye?: number;
  xjdhwdqcye?: number;
  xjxjdhwdjzje?: number;
}

export interface BalanceSheetData {
  dm: string;
  jzrq: string;
  plrq: string;
  nbysk?: number;
  gdzcql?: number;
  yffbzk?: number;
  jsbfj?: number;
  ysbf?: number;
  ysfbzk?: number;
  ysfbhtzbj?: number;
  ysgl?: number;
  ysckts?: number;
  ysbtk?: number;
  ysbzj?: number;
  dfy?: number;
  dclldzcsy?: number;
  ynndqdfldzc?: number;
  cqysk?: number;
  qtcqtz?: number;
  gdzcyz?: number;
  gdzcjz?: number;
  gdzcjzzbj?: number;
  scxswzc?: number;
  gyxswzc?: number;
  yqzc?: number;
  kfzc?: number;
  gqfzltq?: number;
  qtfldzc?: number;
  yfsxfyj?: number;
  qtjyk?: number;
  yfbzj?: number;
  nbyfk?: number;
  ytfy?: number;
  bxhtzbj?: number;
  dlmmzqk?: number;
  dlcxzqk?: number;
  gjpjjs?: number;
  gnpjjs?: number;
  dysr?: number;
  yfdqzq?: number;
  cqdysr?: number;
  wqddtzss?: number;
  nfpxjgl?: number;
  yjfz?: number;
  xsckjtycf?: number;
  yjldfz?: number;
  j_kcg?: number;
  hbzj?: number;
  cczj?: number;
  jyxjrzc?: number;
  ysjrzc?: number;
  yspj?: number;
  yszk?: number;
  yfkx?: number;
  yslx?: number;
  qtysk?: number;
  mrfsjrzck?: number;
  gyjzjzbdqjsrdq?: number;
  ch?: number;
  qtldzc?: number;
  ldzchj?: number;
  ffdkjjd?: number;
  kkgsjrzc?: number;
  cyzdqtz?: number;
  cqgqtz?: number;
  tzxfd?: number;
  ljzj?: number;
  gdzc?: number;
  zjgc?: number;
  gcwz?: number;
  wxzc?: number;
  sy?: number;
  cqdtfy?: number;
  dysdszc?: number;
  fldzchj?: number;
  zczj?: number;
  dqjk?: number;
  xzyhyhk?: number;
  crzj?: number;
  jyxjrfz?: number;
  ysjrfz?: number;
  yfpj?: number;
  yfzk?: number;
  ysk?: number;
  mchgjrzck?: number;
  yfgzxc?: number;
  yjsf?: number;
  yflx?: number;
  yfgl?: number;
  qtfzk?: number;
  ynndqdfldfz?: number;
  qtldfz?: number;
  ldfzhj?: number;
  cqjk?: number;
  yfzq?: number;
  cqyfk?: number;
  zxyfk?: number;
  dysdsfz?: number;
  qtfldfz?: number;
  fldfzhj?: number;
  fzhj?: number;
  sszb?: number;
  zbgj?: number;
  zxzb?: number;
  ylgj?: number;
  ybfxzb?: number;
  wfplr?: number;
  wbbzbzhc?: number;
  gsmgdqsyhj?: number;
  ssgdqy?: number;
  syzqyhj?: number;
  fzhgdqyzj?: number;
}

@Injectable()
export class FinancialStatementsClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取利润表数据
   * @param stockCode 股票代码（如 000001.SZ）
   * @param startDate 开始日期（YYYYMMDD 格式，可选）
   * @param endDate 结束日期（YYYYMMDD 格式，可选）
   * @returns 利润表数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsstock/financial/income/股票代码/您的 licence?st=开始时间&et=结束时间
   */
  async fetchIncomeStatement(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<IncomeStatementData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/income/${stockCode}`);
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
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      plrq: this.getField<string>(item, 'plrq', 'Plrq') || '',
      yysr: this.toNumber(this.getField(item, 'yysr', 'Yysr')),
      yzbf: this.toNumber(this.getField(item, 'yzbf', 'Yzbf')),
      fdczssr: this.toNumber(this.getField(item, 'fdczssr', 'Fdczssr')),
      yyzcb: this.toNumber(this.getField(item, 'yyzcb', 'Yyzcb')),
      fdczscb: this.toNumber(this.getField(item, 'fdczscb', 'Fdczscb')),
      yffy: this.toNumber(this.getField(item, 'yffy', 'Yffy')),
      tbj: this.toNumber(this.getField(item, 'tbj', 'Tbj')),
      pczjje: this.toNumber(this.getField(item, 'pczjje', 'Pczjje')),
      tqbxhtzbjje: this.toNumber(this.getField(item, 'tqbxhtzbjje', 'Tqbxhtzbjje')),
      bdhlzc: this.toNumber(this.getField(item, 'bdhlzc', 'Bdhlzc')),
      fbfy: this.toNumber(this.getField(item, 'fbfy', 'Fbfy')),
      gyjzbdsy: this.toNumber(this.getField(item, 'gyjzbdsy', 'Gyjzbdsy')),
      qhsy: this.toNumber(this.getField(item, 'qhsy', 'Qhsy')),
      tgsy: this.toNumber(this.getField(item, 'tgsy', 'Tgsy')),
      btsr: this.toNumber(this.getField(item, 'btsr', 'Btsr')),
      qtywlr: this.toNumber(this.getField(item, 'qtywlr', 'Qtywlr')),
      bhbfzhbqsljlr: this.toNumber(this.getField(item, 'bhbfzhbqsljlr', 'Bhbfzhbqsljlr')),
      lxsr: this.toNumber(this.getField(item, 'lxsr', 'Lxsr')),
      sxfjyjsr: this.toNumber(this.getField(item, 'sxfjyjsr', 'Sxfjyjsr')),
      sxfjyjzc: this.toNumber(this.getField(item, 'sxfjyjzc', 'Sxfjyjzc')),
      qtywcb: this.toNumber(this.getField(item, 'qtywcb', 'Qtywcb')),
      hdsy: this.toNumber(this.getField(item, 'hdsy', 'Hdsy')),
      fldzcczsy: this.toNumber(this.getField(item, 'fldzcczsy', 'Fldzcczsy')),
      sdsfy: this.toNumber(this.getField(item, 'sdsfy', 'Sdsfy')),
      wqrtzss: this.toNumber(this.getField(item, 'wqrtzss', 'Wqrtzss')),
      gsmgsyzzdjlr: this.toNumber(this.getField(item, 'gsmgsyzzdjlr', 'Gsmgsyzzdjlr')),
      lxzc: this.toNumber(this.getField(item, 'lxzc', 'Lxzc')),
      qtywsr: this.toNumber(this.getField(item, 'qtywsr', 'Qtywsr')),
      yyzsr: this.toNumber(this.getField(item, 'yyzsr', 'Yyzsr')),
      yycb: this.toNumber(this.getField(item, 'yycb', 'Yycb')),
      yysjjfj: this.toNumber(this.getField(item, 'yysjjfj', 'Yysjjfj')),
      xsfy: this.toNumber(this.getField(item, 'xsfy', 'Xsfy')),
      glfy: this.toNumber(this.getField(item, 'glfy', 'Glfy')),
      cwfy: this.toNumber(this.getField(item, 'cwfy', 'Cwfy')),
      zcjzss: this.toNumber(this.getField(item, 'zcjzss', 'Zcjzss')),
      tzsy: this.toNumber(this.getField(item, 'tzsy', 'Tzsy')),
      lyqyhhhqydtzsy: this.toNumber(this.getField(item, 'lyqyhhhqydtzsy', 'Lyqyhhhqydtzsy')),
      yylr: this.toNumber(this.getField(item, 'yylr', 'Yylr')),
      ywsr: this.toNumber(this.getField(item, 'ywsr', 'Ywsr')),
      ywzc: this.toNumber(this.getField(item, 'ywzc', 'Ywzc')),
      lze: this.toNumber(this.getField(item, 'lze', 'Lze')),
      jlr: this.toNumber(this.getField(item, 'jlr', 'Jlr')),
      jlrhfcjcx: this.toNumber(this.getField(item, 'jlrhfcjcx', 'Jlrhfcjcx')),
      ssgdsy: this.toNumber(this.getField(item, 'ssgdsy', 'Ssgdsy')),
      jbmgsy: this.toNumber(this.getField(item, 'jbmgsy', 'Jbmgsy')),
      xsmgsy: this.toNumber(this.getField(item, 'xsmgsy', 'Xsmgsy')),
      zhsyz: this.toNumber(this.getField(item, 'zhsyz', 'Zhsyz')),
      gsssgdzhsyz: this.toNumber(this.getField(item, 'gsssgdzhsyz', 'Gsssgdzhsyz')),
      qtsy: this.toNumber(this.getField(item, 'qtsy', 'Qtsy')),
    }));
  }

  /**
   * 获取现金流量表数据
   * @param stockCode 股票代码（如 000001.SZ）
   * @param startDate 开始日期（YYYYMMDD 格式，可选）
   * @param endDate 结束日期（YYYYMMDD 格式，可选）
   * @returns 现金流量表数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsstock/financial/cashflow/股票代码/您的 licence?st=开始时间&et=结束时间
   */
  async fetchCashFlowStatement(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<CashFlowStatementData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/cashflow/${stockCode}`);
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
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      plrq: this.getField<string>(item, 'plrq', 'Plrq') || '',
      sdydbxbfqdxj: this.toNumber(this.getField(item, 'sdydbxbfqdxj', 'Sdydbxbfqdxj')),
      sdzbxywxjjje: this.toNumber(this.getField(item, 'sdzbxywxjjje', 'Sdzbxywxjjje')),
      bhcjjtkkjzje: this.toNumber(this.getField(item, 'bhcjjtkkjzje', 'Bhcjjtkkjzje')),
      czjyxjrzcjzje: this.toNumber(this.getField(item, 'czjyxjrzcjzje', 'Czjyxjrzcjzje')),
      sqlxsxfjyjdxj: this.toNumber(this.getField(item, 'sqlxsxfjyjdxj', 'Sqlxsxfjyjdxj')),
      hgywzjjzje: this.toNumber(this.getField(item, 'hgywzjjzje', 'Hgywzjjzje')),
      zfybxhtpfkxdj: this.toNumber(this.getField(item, 'zfybxhtpfkxdj', 'Zfybxhtpfkxdj')),
      zfbdhldxj: this.toNumber(this.getField(item, 'zfbdhldxj', 'Zfbdhldxj')),
      czfzgsjqtsddxj: this.toNumber(this.getField(item, 'czfzgsjqtsddxj', 'Czfzgsjqtsddxj')),
      jszyhdqckssddxj: this.toNumber(this.getField(item, 'jszyhdqckssddxj', 'Jszyhdqckssddxj')),
      tzszfdxj: this.toNumber(this.getField(item, 'tzszfdxj', 'Tzszfdxj')),
      zydkjzje: this.toNumber(this.getField(item, 'zydkjzje', 'Zydkjzje')),
      qdfzgsjqtywdwzfdxjje: this.toNumber(this.getField(item, 'qdfzgsjqtywdwzfdxjje', 'Qdfzgsjqtywdwzfdxjje')),
      zjzyhdqckszfdxj: this.toNumber(this.getField(item, 'zjzyhdqckszfdxj', 'Zjzyhdqckszfdxj')),
      qzfzgsxrxj: this.toNumber(this.getField(item, 'Qzfzgsxrxj', 'qzfzgsxrxj')),
      qz_fzgszfgsssgdglr: this.toNumber(this.getField(item, 'qz:fzgszfgsssgdglr', 'qz_fzgszfgsssgdglr')),
      ssgdsy: this.toNumber(this.getField(item, 'ssgdsy', 'Ssgdsy')),
      wqrdtzss: this.toNumber(this.getField(item, 'wqrdtzss', 'Wqrdtzss')),
      dysyzj_j_js: this.toNumber(this.getField(item, 'dysyzj(j:js)', 'dysyzj_j_js')),
      yjfz: this.toNumber(this.getField(item, 'yjfz', 'Yjfz')),
      jxyyfxmdzj: this.toNumber(this.getField(item, 'jxyyfxmdzj', 'Jxyyfxmdzj')),
      ywgwswjskdjs_j_zj: this.toNumber(this.getField(item, 'ywgwswjskdjs(j:zj)', 'ywgwswjskdjs_j_zj')),
      yjswgwgdjz_j_js: this.toNumber(this.getField(item, 'yjswgwgdjz(j:js)', 'yjswgwgdjz_j_js')),
      xssptglwsddxj: this.toNumber(this.getField(item, 'xssptglwsddxj', 'Xssptglwsddxj')),
      khckhtyckxkjzje: this.toNumber(this.getField(item, 'khckhtyckxkjzje', 'Khckhtyckxkjzje')),
      xzyhyhkjzje: this.toNumber(this.getField(item, 'xzyhyhkjzje', 'Xzyhyhkjzje')),
      xtjrgjqjcrzjjzje: this.toNumber(this.getField(item, 'xtjrgjqjcrzjjzje', 'Xtjrgjqjcrzjjzje')),
      sddsfyfh: this.toNumber(this.getField(item, 'sddsfyfh', 'Sddsfyfh')),
      tzzfdxj: this.toNumber(this.getField(item, 'tzzfdxj', 'Tzzfdxj')),
      sdqtyjyghdxj: this.toNumber(this.getField(item, 'sdqtyjyghdxj', 'Sdqtyjyghdxj')),
      jyhdxjlrxj: this.toNumber(this.getField(item, 'jyhdxjlrxj', 'Jyhdxjlrxj')),
      gmspjslwzfdxj: this.toNumber(this.getField(item, 'gmspjslwzfdxj', 'Gmspjslwzfdxj')),
      khdkjdknzje: this.toNumber(this.getField(item, 'khdkjdknzje', 'Khdkjdknzje')),
      cfzyxhytckxkjzje: this.toNumber(this.getField(item, 'cfzyxhytckxkjzje', 'Cfzyxhytckxkjzje')),
      zflxsxfjyjdxj: this.toNumber(this.getField(item, 'zflxsxfjyjdxj', 'Zflxsxfjyjdxj')),
      zfgzyjwzgzfdxj: this.toNumber(this.getField(item, 'zfgzyjwzgzfdxj', 'Zfgzyjwzgzfdxj')),
      zfdgxsf: this.toNumber(this.getField(item, 'zfdgxsf', 'Zfdgxsf')),
      zfqtyjyghdxj: this.toNumber(this.getField(item, 'zfqtyjyghdxj', 'Zfqtyjyghdxj')),
      jyhdxjlcxj: this.toNumber(this.getField(item, 'jyhdxjlcxj', 'Jyhdxjlcxj')),
      jyhdcsdxjlje: this.toNumber(this.getField(item, 'jyhdcsdxjlje', 'Jyhdcsdxjlje')),
      shtzssddxj: this.toNumber(this.getField(item, 'shtzssddxj', 'Shtzssddxj')),
      qdtzsysddxj: this.toNumber(this.getField(item, 'qdtzsysddxj', 'Qdtzsysddxj')),
      czgdzcwxzhqtqctzssddxj: this.toNumber(this.getField(item, 'czgdzcwxzhqtqctzssddxj', 'Czgdzcwxzhqtqctzssddxj')),
      sdqtytzghdxj: this.toNumber(this.getField(item, 'sdqtytzghdxj', 'Sdqtytzghdxj')),
      tzhdxjlrxj: this.toNumber(this.getField(item, 'tzhdxjlrxj', 'Tzhdxjlrxj')),
      gjgdzcwxzhqtqctzzfdxj: this.toNumber(this.getField(item, 'gjgdzcwxzhqtqctzzfdxj', 'Gjgdzcwxzhqtqctzzfdxj')),
      tzhdxjlcxj: this.toNumber(this.getField(item, 'tzhdxjlcxj', 'Tzhdxjlcxj')),
      tzhdcsdxjlxj: this.toNumber(this.getField(item, 'tzhdcsdxjlxj', 'Tzhdcsdxjlxj')),
      xstzsdj: this.toNumber(this.getField(item, 'xstzsdj', 'Xstzsdj')),
      qdjkjddxj: this.toNumber(this.getField(item, 'qdjkjddxj', 'Qdjkjddxj')),
      fxzjsddxj: this.toNumber(this.getField(item, 'fxzjsddxj', 'Fxzjsddxj')),
      sdqtczghdxj: this.toNumber(this.getField(item, 'sdqtczghdxj', 'Sdqtczghdxj')),
      czhdxjlrxj: this.toNumber(this.getField(item, 'Czhdxjlrxj', 'czhdxjlrxj')),
      chzwzfxj: this.toNumber(this.getField(item, 'chzwzfxj', 'Chzwzfxj')),
      fpglrlhcllxzfdxj: this.toNumber(this.getField(item, 'fpglrlhcllxzfdxj', 'Fpglrlhcllxzfdxj')),
      zfqtczdxj: this.toNumber(this.getField(item, 'zfqtczdxj', 'Zfqtczdxj')),
      czhdxjlcxj: this.toNumber(this.getField(item, 'Czhdxjlcxj', 'czhdxjlcxj')),
      czhdcsdxjlxj: this.toNumber(this.getField(item, 'czhdcsdxjlxj', 'Czhdcsdxjlxj')),
      hlbddxjdxy: this.toNumber(this.getField(item, 'hlbddxjdxy', 'Hlbddxjdxy')),
      xjxjdhwjzje: this.toNumber(this.getField(item, 'xjxjdhwjzje', 'Xjxjdhwjzje')),
      qcxjjxjdhwye: this.toNumber(this.getField(item, 'qcxjjxjdhwye', 'Qcxjjxjdhwye')),
      qmxjjxjdhwye: this.toNumber(this.getField(item, 'qmxjjxjdhwye', 'Qmxjjxjdhwye')),
      jlr: this.toNumber(this.getField(item, 'jlr', 'Jlr')),
      zcjzzb: this.toNumber(this.getField(item, 'zcjzzb', 'Zcjzzb')),
      gdzczjyqzcshscxwzczj: this.toNumber(this.getField(item, 'gdzczjyqzcshscxwzczj', 'Gdzczjyqzcshscxwzczj')),
      wxzctx: this.toNumber(this.getField(item, 'wxzctx', 'Wxzctx')),
      cqdtfytx: this.toNumber(this.getField(item, 'cqdtfytx', 'Cqdtfytx')),
      dtfydjs: this.toNumber(this.getField(item, 'dtfydjs', 'Dtfydjs')),
      ytfydzj: this.toNumber(this.getField(item, 'ytfydzj', 'Ytfydzj')),
      czgdzcwxzhqtqctzss: this.toNumber(this.getField(item, 'czgdzcwxzhqtqctzss', 'Czgdzcwxzhqtqctzss')),
      gdzcgbss: this.toNumber(this.getField(item, 'gdzcgbss', 'Gdzcgbss')),
      gyjzbds: this.toNumber(this.getField(item, 'gyjzbds', 'Gyjzbds')),
      cwfy: this.toNumber(this.getField(item, 'Cwfy', 'cwfy')),
      tzss: this.toNumber(this.getField(item, 'Tzss', 'tzss')),
      dysdszcjs: this.toNumber(this.getField(item, 'dysdszcjs', 'Dysdszcjs')),
      dysdsfzzj: this.toNumber(this.getField(item, 'dysdsfzzj', 'Dysdsfzzj')),
      chdjs: this.toNumber(this.getField(item, 'chdjs', 'Chdjs')),
      jxyysxmdjs: this.toNumber(this.getField(item, 'jxyysxmdjs', 'Jxyysxmdjs')),
      qt: this.toNumber(this.getField(item, 'qt', 'Qt')),
      jyhdcsdxjlxj: this.toNumber(this.getField(item, 'jyhdcsdxjlxj', 'Jyhdcsdxjlxj')),
      zwzwzb: this.toNumber(this.getField(item, 'zwzwzb', 'Zwzwzb')),
      ynndqdkzhgzq: this.toNumber(this.getField(item, 'ynndqdkzhgzq', 'Ynndqdkzhgzq')),
      rzrgdzc: this.toNumber(this.getField(item, 'rzrgdzc', 'Rzrgdzc')),
      xjdqmye: this.toNumber(this.getField(item, 'xjdqmye', 'Xjdqmye')),
      xjdqcye: this.toNumber(this.getField(item, 'xjdqcye', 'Xjdqcye')),
      xjdhwdqmye: this.toNumber(this.getField(item, 'xjdhwdqmye', 'Xjdhwdqmye')),
      xjdhwdqcye: this.toNumber(this.getField(item, 'xjdhwdqcye', 'Xjdhwdqcye')),
      xjxjdhwdjzje: this.toNumber(this.getField(item, 'xjxjdhwdjzje', 'Xjxjdhwdjzje')),
    }));
  }

  /**
   * 获取资产负债表数据
   * @param stockCode 股票代码（如 000001.SZ）
   * @param startDate 开始日期（YYYYMMDD 格式，可选）
   * @param endDate 结束日期（YYYYMMDD 格式，可选）
   * @returns 资产负债表数据列表
   *
   * API 接口：http://api.mairuiapi.com/hsstock/financial/balance/股票代码/您的 licence?st=开始时间&et=结束时间
   */
  async fetchBalanceSheet(
    stockCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<BalanceSheetData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    let url = this.buildUrl(`/hsstock/financial/balance/${stockCode}`);
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
      jzrq: this.getField<string>(item, 'jzrq', 'Jzrq') || '',
      plrq: this.getField<string>(item, 'plrq', 'Plrq') || '',
      nbysk: this.toNumber(this.getField(item, 'nbysk', 'Nbysk')),
      gdzcql: this.toNumber(this.getField(item, 'gdzcql', 'Gdzcql')),
      yffbzk: this.toNumber(this.getField(item, 'yffbzk', 'Yffbzk')),
      jsbfj: this.toNumber(this.getField(item, 'jsbfj', 'Jsbfj')),
      ysbf: this.toNumber(this.getField(item, 'ysbf', 'Ysbf')),
      ysfbzk: this.toNumber(this.getField(item, 'ysfbzk', 'Ysfbzk')),
      ysfbhtzbj: this.toNumber(this.getField(item, 'Ysfbhtzbj', 'ysfbhtzbj')),
      ysgl: this.toNumber(this.getField(item, 'Ysgl', 'ysgl')),
      ysckts: this.toNumber(this.getField(item, 'ysckts', 'Ysckts')),
      ysbtk: this.toNumber(this.getField(item, 'ysbtk', 'Ysbtk')),
      ysbzj: this.toNumber(this.getField(item, 'ysbzj', 'Ysbzj')),
      dfy: this.toNumber(this.getField(item, 'dfy', 'Dfy')),
      dclldzcsy: this.toNumber(this.getField(item, 'dclldzcsy', 'Dclldzcsy')),
      ynndqdfldzc: this.toNumber(this.getField(item, 'ynndqdfldzc', 'Ynndqdfldzc')),
      cqysk: this.toNumber(this.getField(item, 'cqysk', 'Cqysk')),
      qtcqtz: this.toNumber(this.getField(item, 'qtcqtz', 'Qtcqtz')),
      gdzcyz: this.toNumber(this.getField(item, 'gdzcyz', 'Gdzcyz')),
      gdzcjz: this.toNumber(this.getField(item, 'gdzcjz', 'Gdzcjz')),
      gdzcjzzbj: this.toNumber(this.getField(item, 'gdzcjzzbj', 'Gdzcjzzbj')),
      scxswzc: this.toNumber(this.getField(item, 'scxswzc', 'Scxswzc')),
      gyxswzc: this.toNumber(this.getField(item, 'gyxswzc', 'Gyxswzc')),
      yqzc: this.toNumber(this.getField(item, 'yqzc', 'Yqzc')),
      kfzc: this.toNumber(this.getField(item, 'kfzc', 'Kfzc')),
      gqfzltq: this.toNumber(this.getField(item, 'gqfzltq', 'Gqfzltq')),
      qtfldzc: this.toNumber(this.getField(item, 'qtfldzc', 'Qtfldzc')),
      yfsxfyj: this.toNumber(this.getField(item, 'yfsxfyj', 'Yfsxfyj')),
      qtjyk: this.toNumber(this.getField(item, 'qtjyk', 'Qtjyk')),
      yfbzj: this.toNumber(this.getField(item, 'yfbzj', 'Yfbzj')),
      nbyfk: this.toNumber(this.getField(item, 'nbyfk', 'Nbyfk')),
      ytfy: this.toNumber(this.getField(item, 'ytfy', 'Ytfy')),
      bxhtzbj: this.toNumber(this.getField(item, 'bxhtzbj', 'Bxhtzbj')),
      dlmmzqk: this.toNumber(this.getField(item, 'dlmmzqk', 'Dlmmzqk')),
      dlcxzqk: this.toNumber(this.getField(item, 'dlcxzqk', 'Dlcxzqk')),
      gjpjjs: this.toNumber(this.getField(item, 'gjpjjs', 'Gjpjjs')),
      gnpjjs: this.toNumber(this.getField(item, 'gnpjjs', 'Gnpjjs')),
      dysr: this.toNumber(this.getField(item, 'dysr', 'Dysr')),
      yfdqzq: this.toNumber(this.getField(item, 'yfdqzq', 'Yfdqzq')),
      cqdysr: this.toNumber(this.getField(item, 'cqdysr', 'Cqdysr')),
      wqddtzss: this.toNumber(this.getField(item, 'wqddtzss', 'Wqddtzss')),
      nfpxjgl: this.toNumber(this.getField(item, 'nfpxjgl', 'Nfpxjgl')),
      yjfz: this.toNumber(this.getField(item, 'yjfz', 'Yjfz')),
      xsckjtycf: this.toNumber(this.getField(item, 'xsckjtycf', 'Xsckjtycf')),
      yjldfz: this.toNumber(this.getField(item, 'yjldfz', 'Yjldfz')),
      j_kcg: this.toNumber(this.getField(item, 'j_kcg', 'J_kcg')),
      hbzj: this.toNumber(this.getField(item, 'Hbzj', 'hbzj')),
      cczj: this.toNumber(this.getField(item, 'cczj', 'Cczj')),
      jyxjrzc: this.toNumber(this.getField(item, 'jyxjrzc', 'Jyxjrzc')),
      ysjrzc: this.toNumber(this.getField(item, 'ysjrzc', 'Ysjrzc')),
      yspj: this.toNumber(this.getField(item, 'yspj', 'Yspj')),
      yszk: this.toNumber(this.getField(item, 'yszk', 'Yszk')),
      yfkx: this.toNumber(this.getField(item, 'yfkx', 'Yfkx')),
      yslx: this.toNumber(this.getField(item, 'yslx', 'Yslx')),
      qtysk: this.toNumber(this.getField(item, 'qtysk', 'Qtysk')),
      mrfsjrzck: this.toNumber(this.getField(item, 'Mrfsjrzck', 'mrfsjrzck')),
      gyjzjzbdqjsrdq: this.toNumber(this.getField(item, 'gyjzjzbdqjsrdq', 'Gyjzjzbdqjsrdq')),
      ch: this.toNumber(this.getField(item, 'ch', 'Ch')),
      qtldzc: this.toNumber(this.getField(item, 'qtldzc', 'Qtldzc')),
      ldzchj: this.toNumber(this.getField(item, 'ldzchj', 'Ldzchj')),
      ffdkjjd: this.toNumber(this.getField(item, 'ffdkjjd', 'Ffdkjjd')),
      kkgsjrzc: this.toNumber(this.getField(item, 'kkgsjrzc', 'Kkgsjrzc')),
      cyzdqtz: this.toNumber(this.getField(item, 'cyzdqtz', 'Cyzdqtz')),
      cqgqtz: this.toNumber(this.getField(item, 'cqgqtz', 'Cqgqtz')),
      tzxfd: this.toNumber(this.getField(item, 'Tzxfd', 'tzxfd')),
      ljzj: this.toNumber(this.getField(item, 'ljzj', 'Ljzj')),
      gdzc: this.toNumber(this.getField(item, 'Gdzc', 'gdzc')),
      zjgc: this.toNumber(this.getField(item, 'zjgc', 'Zjgc')),
      gcwz: this.toNumber(this.getField(item, 'Gcwz', 'gcwz')),
      wxzc: this.toNumber(this.getField(item, 'wxzc', 'Wxzc')),
      sy: this.toNumber(this.getField(item, 'sy', 'Sy')),
      cqdtfy: this.toNumber(this.getField(item, 'cqdtfy', 'Cqdtfy')),
      dysdszc: this.toNumber(this.getField(item, 'dysdszc', 'Dysdszc')),
      fldzchj: this.toNumber(this.getField(item, 'fldzchj', 'Fldzchj')),
      zczj: this.toNumber(this.getField(item, 'zczj', 'Zczj')),
      dqjk: this.toNumber(this.getField(item, 'dqjk', 'Dqjk')),
      xzyhyhk: this.toNumber(this.getField(item, 'xzyhyhk', 'Xzyhyhk')),
      crzj: this.toNumber(this.getField(item, 'crzj', 'Crzj')),
      jyxjrfz: this.toNumber(this.getField(item, 'jyxjrfz', 'Jyxjrfz')),
      ysjrfz: this.toNumber(this.getField(item, 'ysjrfz', 'Ysjrfz')),
      yfpj: this.toNumber(this.getField(item, 'yfpj', 'Yfpj')),
      yfzk: this.toNumber(this.getField(item, 'yfzk', 'Yfzk')),
      ysk: this.toNumber(this.getField(item, 'Ysk', 'ysk')),
      mchgjrzck: this.toNumber(this.getField(item, 'mchgjrzck', 'Mchgjrzck')),
      yfgzxc: this.toNumber(this.getField(item, 'yfgzxc', 'Yfgzxc')),
      yjsf: this.toNumber(this.getField(item, 'yjsf', 'Yjsf')),
      yflx: this.toNumber(this.getField(item, 'yflx', 'Yflx')),
      yfgl: this.toNumber(this.getField(item, 'yfgl', 'Yfgl')),
      qtfzk: this.toNumber(this.getField(item, 'qtfzk', 'Qtfzk')),
      ynndqdfldfz: this.toNumber(this.getField(item, 'ynndqdfldfz', 'Ynndqdfldfz')),
      qtldfz: this.toNumber(this.getField(item, 'qtldfz', 'Qtldfz')),
      ldfzhj: this.toNumber(this.getField(item, 'ldfzhj', 'Ldfzhj')),
      cqjk: this.toNumber(this.getField(item, 'cqjk', 'Cqjk')),
      yfzq: this.toNumber(this.getField(item, 'yfzq', 'Yfzq')),
      cqyfk: this.toNumber(this.getField(item, 'cqyfk', 'Cqyfk')),
      zxyfk: this.toNumber(this.getField(item, 'zxyfk', 'Zxyfk')),
      dysdsfz: this.toNumber(this.getField(item, 'dysdsfz', 'Dysdsfz')),
      qtfldfz: this.toNumber(this.getField(item, 'qtfldfz', 'Qtfldfz')),
      fldfzhj: this.toNumber(this.getField(item, 'fldfzhj', 'Fldfzhj')),
      fzhj: this.toNumber(this.getField(item, 'fzhj', 'Fzhj')),
      sszb: this.toNumber(this.getField(item, 'sszb', 'Sszb')),
      zbgj: this.toNumber(this.getField(item, 'zbgj', 'Zbgj')),
      zxzb: this.toNumber(this.getField(item, 'Zxzb', 'zxzb')),
      ylgj: this.toNumber(this.getField(item, 'ylgj', 'Ylgj')),
      ybfxzb: this.toNumber(this.getField(item, 'ybfxzb', 'Ybfxzb')),
      wfplr: this.toNumber(this.getField(item, 'wfplr', 'Wfplr')),
      wbbzbzhc: this.toNumber(this.getField(item, 'wbbzbzhc', 'Wbbzbzhc')),
      gsmgdqsyhj: this.toNumber(this.getField(item, 'gsmgdqsyhj', 'Gsmgdqsyhj')),
      ssgdqy: this.toNumber(this.getField(item, 'ssgdqy', 'Ssgdqy')),
      syzqyhj: this.toNumber(this.getField(item, 'syzqyhj', 'Syzqyhj')),
      fzhgdqyzj: this.toNumber(this.getField(item, 'fzhgdqyzj', 'Fzhgdqyzj')),
    }));
  }
}
