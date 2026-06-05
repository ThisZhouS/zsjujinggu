/**
 * IndexRealTimeDataClient - 指数实时行情 API 客户端
 *
 * 提供指数实时行情相关的 API 接口：
 * - 指数实时行情 (index_real_time_data)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface IndexRealTimeData {
  dm: string;
  t: string;
  p?: number;
  o?: number;
  h?: number;
  l?: number;
  pc?: number;
  v?: number;
  a?: number;
}

@Injectable()
export class IndexRealTimeDataClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取指数实时行情数据
   * @param indexCode 指数代码（如 000001）
   * @returns 指数实时行情数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/indexrealtime/指数代码/您的 licence
   */
  async fetchIndexRealTimeData(indexCode: string): Promise<IndexRealTimeData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    const url = this.buildUrl(`/hssj/indexrealtime/${indexCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      p: this.toNumber(this.getField(item, 'p', 'P')),
      o: this.toNumber(this.getField(item, 'o', 'O')),
      h: this.toNumber(this.getField(item, 'h', 'H')),
      l: this.toNumber(this.getField(item, 'l', 'L')),
      pc: this.toNumber(this.getField(item, 'pc', 'Pc')),
      v: this.toNumber(this.getField(item, 'v', 'V')),
      a: this.toNumber(this.getField(item, 'a', 'A')),
    }));
  }
}
