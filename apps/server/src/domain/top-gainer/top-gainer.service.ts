/**
 * TopGainer Service - 涨幅榜业务逻辑层
 * 负责涨幅榜查询、排序、过滤、涨停/跌停统计
 */

import { Injectable } from '@nestjs/common';
import { TopGainerRepository } from './top-gainer.repository';
import { GainerPeriod } from './dto/top-gainer.dto';

export interface TopGainerResult {
  list: any[];
  total: number;
}

@Injectable()
export class TopGainerService {
  constructor(private topGainerRepository: TopGainerRepository) {}

  /**
   * 获取涨幅榜列表
   */
  async getList(options: {
    page: number;
    pageSize: number;
    period?: GainerPeriod;
    keyword?: string;
  }): Promise<TopGainerResult> {
    const { period, keyword } = options;

    let gainers: any[];

    if (period) {
      gainers = await this.topGainerRepository.getHistoricalGainers(period);
    } else {
      gainers = await this.topGainerRepository.getTodayGainers();
    }

    if (keyword) {
      gainers = gainers.filter((g) =>
        g.name.includes(keyword) || g.code.includes(keyword),
      );
    }

    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize;
    const paginatedList = gainers.slice(start, end);

    return {
      list: paginatedList,
      total: gainers.length,
    };
  }

  /**
   * 获取涨停板数据
   */
  async getLimitUp(): Promise<any[]> {
    return this.topGainerRepository.getLimitUpStocks();
  }

  /**
   * 获取涨停次数统计
   */
  async getLimitUpCountStats(period?: string): Promise<any[]> {
    return this.topGainerRepository.getLimitUpCountStats(period || '');
  }

  /**
   * 获取跌停次数统计
   */
  async getLimitDownCountStats(period?: string): Promise<any[]> {
    return this.topGainerRepository.getLimitDownCountStats(period || '');
  }
}
