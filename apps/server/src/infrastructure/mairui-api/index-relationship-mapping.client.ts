/**
 * IndexRelationshipMappingClient - 指数关系映射 API 客户端
 *
 * 提供指数关系映射相关的 API 接口：
 * - 指数成分股树 (zg_tree)
 * - 根据股票代码查相关指数 (related_codes_by_stock)
 * - 根据指数代码查成分股 (related_stocks_by_code)
 * - 股票所属指数 (belonging_indices)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MairuiApiClient } from './mairui-api.client';

export interface ZgTreeData {
  dm: string;
  t: string;
  name?: string;
  parentDm?: string;
  level?: number;
  children?: string;
}

export interface RelatedCodesByStockData {
  dm: string;
  t: string;
  indexDm?: string;
  indexName?: string;
  weight?: number;
}

export interface RelatedStocksByCodeData {
  dm: string;
  t: string;
  stockDm?: string;
  stockName?: string;
  weight?: number;
}

export interface BelongingIndicesData {
  dm: string;
  t: string;
  indexDm?: string;
  indexName?: string;
  board?: string;
}

@Injectable()
export class IndexRelationshipMappingClient extends MairuiApiClient {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  /**
   * 获取指数成分股树数据
   * @param indexCode 指数代码（如 000001）
   * @returns 指数成分股树数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/index/zg/指数代码/您的 licence
   */
  async fetchZgTree(indexCode: string): Promise<ZgTreeData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    const url = this.buildUrl(`/hssj/index/zg/${indexCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      name: this.getField<string>(item, 'name', 'Name'),
      parentDm: this.getField<string>(item, 'parent_dm', 'Parent_dm'),
      level: this.toNumber(this.getField(item, 'level', 'Level')),
      children: this.getField<string>(item, 'children', 'Children'),
    }));
  }

  /**
   * 根据股票代码查询相关指数
   * @param stockCode 股票代码（如 000001）
   * @returns 相关指数数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/stock/related/index/股票代码/您的 licence
   */
  async fetchRelatedCodesByStock(stockCode: string): Promise<RelatedCodesByStockData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/stock/related/index/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      indexDm: this.getField<string>(item, 'index_dm', 'Index_dm'),
      indexName: this.getField<string>(item, 'index_name', 'Index_name'),
      weight: this.toNumber(this.getField(item, 'weight', 'Weight')),
    }));
  }

  /**
   * 根据指数代码查询成分股
   * @param indexCode 指数代码（如 000001）
   * @returns 成分股数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/index/related/stock/指数代码/您的 licence
   */
  async fetchRelatedStocksByCode(indexCode: string): Promise<RelatedStocksByCodeData[]> {
    if (!indexCode) {
      throw new Error('指数代码不能为空');
    }

    const url = this.buildUrl(`/hssj/index/related/stock/${indexCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || indexCode,
      t: this.getField<string>(item, 't', 'T') || '',
      stockDm: this.getField<string>(item, 'stock_dm', 'Stock_dm'),
      stockName: this.getField<string>(item, 'stock_name', 'Stock_name'),
      weight: this.toNumber(this.getField(item, 'weight', 'Weight')),
    }));
  }

  /**
   * 获取股票所属指数
   * @param stockCode 股票代码（如 000001）
   * @returns 股票所属指数数据列表
   *
   * API 接口：http://api.mairuiapi.com/hssj/stock/belong/index/股票代码/您的 licence
   */
  async fetchBelongingIndices(stockCode: string): Promise<BelongingIndicesData[]> {
    if (!stockCode) {
      throw new Error('股票代码不能为空');
    }

    const url = this.buildUrl(`/hssj/stock/belong/index/${stockCode}`);
    const data = await this.getRequest<Record<string, any>>(url);

    return data.map((item) => ({
      dm: this.getField<string>(item, 'dm', 'Dm') || stockCode,
      t: this.getField<string>(item, 't', 'T') || '',
      indexDm: this.getField<string>(item, 'index_dm', 'Index_dm'),
      indexName: this.getField<string>(item, 'index_name', 'Index_name'),
      board: this.getField<string>(item, 'board', 'Board'),
    }));
  }
}
