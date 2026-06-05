/**
 * WatchlistService - 自选股业务逻辑层
 * 负责自选股管理、行情聚合
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { WatchlistRepository } from './watchlist.repository';

@Injectable()
export class WatchlistService {
  constructor(private watchlistRepository: WatchlistRepository) {}

  /**
   * 获取用户的自选股列表
   */
  async getWatchlist(userId: number, page: number = 1, pageSize: number = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(pageSize, 100));
    const result = await this.watchlistRepository.findByUserId(userId, {
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });

    return result;
  }

  /**
   * 添加自选股
   */
  async addToWatchlist(userId: number, stockCode: string) {
    const stock = await this.watchlistRepository.findStockByCode(stockCode);
    if (!stock) {
      throw new NotFoundException('股票代码不存在');
    }

    return this.watchlistRepository.create(userId, stock.code, stock.name);
  }

  /**
   * 删除自选股
   */
  async removeFromWatchlist(userId: number, id: number): Promise<void> {
    return this.watchlistRepository.delete(id, userId);
  }

  /**
   * 更新自选股排序
   */
  async updateSortOrder(userId: number, stockCodes: string[]): Promise<void> {
    return this.watchlistRepository.updateSortOrder(userId, stockCodes);
  }
}
