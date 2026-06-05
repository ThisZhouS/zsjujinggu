/**
 * FavoriteService - 用户收藏业务逻辑层
 * 负责收藏牛散管理
 */

import { Injectable } from '@nestjs/common';
import { FavoriteRepository } from './favorite.repository';

@Injectable()
export class FavoriteService {
  constructor(private favoriteRepository: FavoriteRepository) {}

  /**
   * 获取用户的收藏列表
   */
  async getFavorites(userId: number) {
    return this.favoriteRepository.findByUserId(userId);
  }

  /**
   * 收藏牛散
   */
  async addToFavorites(userId: number, investorId: number) {
    return this.favoriteRepository.create(userId, investorId);
  }

  /**
   * 取消收藏
   */
  async removeFromFavorites(userId: number, investorId: number): Promise<void> {
    return this.favoriteRepository.delete(userId, investorId);
  }

  /**
   * 检查是否已收藏
   */
  async isFavorite(userId: number, investorId: number): Promise<boolean> {
    return this.favoriteRepository.isFavorite(userId, investorId);
  }
}
