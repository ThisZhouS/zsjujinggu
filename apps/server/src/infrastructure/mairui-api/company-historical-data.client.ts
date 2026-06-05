/**
 * CompanyHistoricalDataClient - 公司历史数据 API 客户端
 *
 * 提供公司历史数据相关的 API 接口：
 * - 历届监事会成员 (supervisory_board_member)
 * - 历届高管成员 (executive_member)
 * - 历届董事会成员 (board_member)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface SupervisoryBoardMemberData {
  dm: string;
  name: string;
  title: string;
  sdate: string;
  edate: string;
}

export interface ExecutiveMemberData {
  dm: string;
  name: string;
  title: string;
  sdate: string;
  edate: string;
}

export interface BoardMemberData {
  dm: string;
  name: string;
  title: string;
  sdate: string;
  edate: string;
}

@Injectable()
export class CompanyHistoricalDataClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取历届监事会成员数据
   * @param stockCode 股票代码（如 000001）
   * @returns 监事会成员数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/monitors/股票代码/您的 licence
   */
  async fetchSupervisoryBoardMember(stockCode: string): Promise<SupervisoryBoardMemberData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/monitors/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      name: this.getField<string>(item, 'name', 'Name') || '',
      title: this.getField<string>(item, 'title', 'Title') || '',
      sdate: this.getField<string>(item, 'sdate', 'Sdate') || '',
      edate: this.getField<string>(item, 'edate', 'Edate') || '',
    }));
  }

  /**
   * 获取历届高管成员数据
   * @param stockCode 股票代码（如 000001）
   * @returns 高管成员数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/ljjj/股票代码/您的 licence
   */
  async fetchExecutiveMember(stockCode: string): Promise<ExecutiveMemberData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/ljjj/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      name: this.getField<string>(item, 'name', 'Name', 'mc', 'xm') || '',
      title: this.getField<string>(item, 'title', 'Title', 'zw', 'position') || '',
      sdate: this.getField<string>(item, 'sdate', 'Sdate', 'rxrq') || '',
      edate: this.getField<string>(item, 'edate', 'Edate', 'lkrq') || '',
    }));
  }

  /**
   * 获取历届董事会成员数据
   * @param stockCode 股票代码（如 000001）
   * @returns 董事会成员数据列表
   *
   * API 接口：http://api.mairuiapi.com/hscp/directors/股票代码/您的 licence
   */
  async fetchBoardMember(stockCode: string): Promise<BoardMemberData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hscp/directors/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      name: this.getField<string>(item, 'name', 'Name') || '',
      title: this.getField<string>(item, 'title', 'Title') || '',
      sdate: this.getField<string>(item, 'sdate', 'Sdate') || '',
      edate: this.getField<string>(item, 'edate', 'Edate') || '',
    }));
  }
}
