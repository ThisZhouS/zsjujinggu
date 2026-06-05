/**
 * StockPoolClassificationClient - 股票池分类 API 客户端
 *
 * 提供股票池分类相关的 API 接口：
 * - 跌停股池 (limit_down_pool)
 * - 强势股池 (strong_pool)
 * - 炸板股池 (limit_up_break_pool)
 * - 涨停股池 (limit_up_pool)
 * - 次新股池 (sub_new_pool)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface LimitDownPoolData {
  dm: string;    // 代码
  date: string;  // 日期参数
  mc: string;    // 名称
  p: number | null;     // 价格（元）
  zf: number | null;    // 跌幅（%）
  cje: number | null;   // 成交额（元）
  lt: number | null;    // 流通市值（元）
  zsz: number | null;   // 总市值（元）
  pe: number | null;    // 动态市盈率
  hs: number | null;    // 换手率（%）
  lbc: number | null;   // 连续跌停次数
  lbt: string;  // 最后封板时间（HH:mm:ss）
  zj: number | null;    // 封单资金（元）
  fba: number | null;   // 板上成交额（元）
  zbc: number | null;   // 开板次数
}

export interface StrongPoolData {
  dm: string;    // 代码
  date: string;  // 日期参数
  mc: string;    // 名称
  p: number | null;     // 价格（元）
  ztp: number | null;   // 涨停价（元）
  zf: number | null;    // 涨幅（%）
  cje: number | null;   // 成交额（元）
  lt: number | null;    // 流通市值（元）
  zsz: number | null;   // 总市值（元）
  zs: number | null;    // 涨速（%）
  nh: number | null;    // 是否新高（0：否，1：是）
  lb: number | null;    // 量比
  hs: number | null;    // 换手率（%）
  tj: string;   // 涨停统计（x 天/y 板）
}

export interface LimitUpBreakPoolData {
  dm: string;    // 代码
  date: string;  // 日期参数
  mc: string;    // 名称
  p: number | null;     // 价格（元）
  ztp: number | null;   // 涨停价（元）
  zf: number | null;    // 涨跌幅（%）
  cje: number | null;   // 成交额（元）
  lt: number | null;    // 流通市值（元）
  zsz: number | null;   // 总市值（元）
  zs: number | null;    // 涨速（%）
  hs: number | null;    // 转手率（%）
  tj: string | null;    // 涨停统计（x 天/y 板）
  fbt: string;  // 首次封板时间（HH:mm:ss）
  zbc: number | null;   // 炸板次数
}

export interface LimitUpPoolData {
  dm: string;    // 代码
  date: string;  // 日期参数
  mc: string;    // 名称
  p: number | null;     // 价格（元）
  zf: number | null;    // 涨幅（%）
  cje: number | null;   // 成交额（元）
  lt: number | null;    // 流通市值（元）
  zsz: number | null;   // 总市值（元）
  hs: number | null;    // 换手率（%）
  lbc: number | null;   // 连板数
  fbt: string;  // 首次封板时间（HH:mm:ss）
  lbt: string;  // 最后封板时间（HH:mm:ss）
  zj: number | null;    // 封板资金（元）
  zbc: number | null;   // 炸板次数
  tj: string | null;    // 涨停统计（x 天/y 板）
  hy: string | null;    // 所属行业
}

export interface SubNewPoolData {
  dm: string;    // 代码
  date: string;  // 日期参数
  mc: string;    // 名称
  p: number | null;     // 价格（元）
  ztp: number | null;   // 涨停价（元，无涨停价为 null）
  zf: number | null;    // 涨跌幅（%）
  cje: number | null;   // 成交额（元）
  lt: number | null;    // 流通市值（元）
  zsz: number | null;   // 总市值（元）
  nh: number | null;    // 是否新高（0：否，1：是）
  hs: number | null;    // 转手率（%）
  tj: string | null;    // 涨停统计（x 天/y 板）
  kb: number | null;    // 开板几日
  od: string;   // 开板日期（yyyyMMdd）
  ipod: string; // 上市日期（yyyyMMdd）
}

@Injectable()
export class StockPoolClassificationClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取跌停股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 跌停股池数据列表
   *
   * API: /hslt/dtgc/{date}/{licence}
   */
  async fetchLimitDownPool(date: string): Promise<LimitDownPoolData[]> {
    if (!date) {
      throw new Error('日期参数不能为空');
    }

    const url = this.buildUrl(`/hslt/dtgc/${date}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: LimitDownPoolData[] = [];
    for (const item of data) {
      const dmValue = item['dm'] || '';
      const lbtValue = item['lbt'] || '';

      // 主键字段不能为空
      if (!dmValue || !lbtValue) {
        this.logger.warn(`跳过无效数据：主键字段为空 (dm=${dmValue}, lbt=${lbtValue})`);
        continue;
      }

      result.push({
        dm: dmValue,
        date,
        mc: item['mc'] || '',
        p: this.toNumber(item['p']),
        zf: this.toNumber(item['zf']),
        cje: this.toNumber(item['Cje'] ?? item['cje']),
        lt: this.toNumber(item['lt']),
        zsz: this.toNumber(item['zsz']),
        pe: this.toNumber(item['pe']),
        hs: this.toNumber(item['hs']),
        lbc: this.toNumber(item['lbc']),
        lbt: lbtValue,
        zj: this.toNumber(item['zj']),
        fba: this.toNumber(item['fba']),
        zbc: this.toNumber(item['zbc']),
      });
    }
    return result;
  }

  /**
   * 获取强势股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 强势股池数据列表
   *
   * API: /hslt/qsgc/{date}/{licence}
   */
  async fetchStrongPool(date: string): Promise<StrongPoolData[]> {
    if (!date) {
      throw new Error('日期参数不能为空');
    }

    const url = this.buildUrl(`/hslt/qsgc/${date}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: StrongPoolData[] = [];
    for (const item of data) {
      const dmValue = item['dm'] || '';
      const tjValue = item['tj'] || '';

      // 主键字段不能为空
      if (!dmValue || !tjValue) {
        this.logger.warn(`跳过无效数据：主键字段为空 (dm=${dmValue}, tj=${tjValue})`);
        continue;
      }

      result.push({
        dm: dmValue,
        date,
        mc: item['Mc'] ?? item['mc'] ?? '',
        p: this.toNumber(item['p']),
        ztp: this.toNumber(item['Ztp'] ?? item['ztp']),
        zf: this.toNumber(item['zf']),
        cje: this.toNumber(item['cje'] ?? item['Cje']),
        lt: this.toNumber(item['lt']),
        zsz: this.toNumber(item['zsz']),
        zs: this.toNumber(item['zs']),
        nh: this.toNumber(item['nh']),
        lb: this.toNumber(item['lb']),
        hs: this.toNumber(item['hs']),
        tj: tjValue,
      });
    }
    return result;
  }

  /**
   * 获取炸板股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 炸板股池数据列表
   *
   * API: /hslt/zbgc/{date}/{licence}
   */
  async fetchLimitUpBreakPool(date: string): Promise<LimitUpBreakPoolData[]> {
    if (!date) {
      throw new Error('日期参数不能为空');
    }

    const url = this.buildUrl(`/hslt/zbgc/${date}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: LimitUpBreakPoolData[] = [];
    for (const item of data) {
      const dmValue = item['dm'] || '';
      const fbtValue = item['fbt'] || '';

      // 主键字段不能为空
      if (!dmValue || !fbtValue) {
        this.logger.warn(`跳过无效数据：主键字段为空 (dm=${dmValue}, fbt=${fbtValue})`);
        continue;
      }

      result.push({
        dm: dmValue,
        date,
        mc: item['mc'] || '',
        p: this.toNumber(item['p']),
        ztp: this.toNumber(item['ztp'] ?? item['Ztp']),
        zf: this.toNumber(item['zf']),
        cje: this.toNumber(item['cje'] ?? item['Cje']),
        lt: this.toNumber(item['lt']),
        zsz: this.toNumber(item['zsz']),
        zs: this.toNumber(item['zs']),
        hs: this.toNumber(item['hs']),
        tj: item['tj'] || null,
        fbt: fbtValue,
        zbc: this.toNumber(item['zbc']),
      });
    }
    return result;
  }

  /**
   * 获取涨停股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 涨停股池数据列表
   *
   * API: /hslt/ztgc/{date}/{licence}
   */
  async fetchLimitUpPool(date: string): Promise<LimitUpPoolData[]> {
    if (!date) {
      throw new Error('日期参数不能为空');
    }

    const url = this.buildUrl(`/hslt/ztgc/${date}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: LimitUpPoolData[] = [];
    for (const item of data) {
      const dmValue = item['dm'] || '';
      const fbtValue = item['fbt'] || '';
      const lbtValue = item['lbt'] || '';

      // 主键字段不能为空
      if (!dmValue || !fbtValue || !lbtValue) {
        this.logger.warn(`跳过无效数据：主键字段为空 (dm=${dmValue}, fbt=${fbtValue}, lbt=${lbtValue})`);
        continue;
      }

      result.push({
        dm: dmValue,
        date,
        mc: item['Mc'] ?? item['mc'] ?? '',
        p: this.toNumber(item['p']),
        zf: this.toNumber(item['zf']),
        cje: this.toNumber(item['cje'] ?? item['Cje']),
        lt: this.toNumber(item['lt']),
        zsz: this.toNumber(item['zsz']),
        hs: this.toNumber(item['hs']),
        lbc: this.toNumber(item['Lbc'] ?? item['lbc']),
        fbt: fbtValue,
        lbt: lbtValue,
        zj: this.toNumber(item['zj']),
        zbc: this.toNumber(item['zbc']),
        tj: item['tj'] || null,
        hy: item['hy'] || null,
      });
    }
    return result;
  }

  /**
   * 获取次新股池数据
   * @param date 日期，格式 yyyy-MM-dd
   * @returns 次新股池数据列表
   *
   * API: /hslt/cxgc/{date}/{licence}
   */
  async fetchSubNewPool(date: string): Promise<SubNewPoolData[]> {
    if (!date) {
      throw new Error('日期参数不能为空');
    }

    const url = this.buildUrl(`/hslt/cxgc/${date}`);
    const data = await this.getRequest<Record<string, any>>(url);

    const result: SubNewPoolData[] = [];
    for (const item of data) {
      const dmValue = item['dm'] || '';
      const odValue = item['od'] || '';
      const ipodValue = item['ipod'] || '';

      // 主键字段不能为空
      if (!dmValue || !odValue || !ipodValue) {
        this.logger.warn(`跳过无效数据：主键字段为空 (dm=${dmValue}, od=${odValue}, ipod=${ipodValue})`);
        continue;
      }

      result.push({
        dm: dmValue,
        date,
        mc: item['mc'] || '',
        p: this.toNumber(item['p']),
        ztp: this.toNumber(item['ztp'] ?? item['Ztp']),
        zf: this.toNumber(item['zf']),
        cje: this.toNumber(item['cje'] ?? item['Cje']),
        lt: this.toNumber(item['lt']),
        zsz: this.toNumber(item['zsz']),
        nh: this.toNumber(item['nh']),
        hs: this.toNumber(item['hs']),
        tj: item['tj'] || null,
        kb: this.toNumber(item['kb']),
        od: odValue,
        ipod: ipodValue,
      });
    }
    return result;
  }
}
