/**
 * IndividualShareholder Service - 个人股东业务逻辑层
 */

import { Injectable } from '@nestjs/common';
import { IndividualShareholderRepository } from './individual-shareholder.repository';
import type { InvestorCategory } from '@/common/utils/investor-name-filter';

export interface IndividualShareholderResult {
  list: any[];
  total: number;
}

@Injectable()
export class IndividualShareholderService {
  constructor(private individualShareholderRepository: IndividualShareholderRepository) {}

  /**
   * 获取个人股东持仓排行
   */
  async getRanking(options: {
    page: number;
    pageSize: number;
    category: InvestorCategory;
    keyword?: string;
  }): Promise<IndividualShareholderResult> {
    const [list, total] = await Promise.all([
      this.individualShareholderRepository.getRanking(options),
      this.individualShareholderRepository.count(options.category, options.keyword),
    ]);

    return {
      list,
      total,
    };
  }

  /**
   * 获取股票个人股东列表
   */
  async getStockShareholders(
    stockCode: string,
    category: InvestorCategory = 'personal',
  ) {
    return this.individualShareholderRepository.findByStockCode(stockCode, category);
  }
}
