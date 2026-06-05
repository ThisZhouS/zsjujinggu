/**
 * Ad Service - 广告业务逻辑层
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { AdRepository } from './ad.repository';
import { AdMediaType, AdPosition } from '@prisma/client';

@Injectable()
export class AdService {
  constructor(private adRepository: AdRepository) {}

  /**
   * 获取广告列表（按广告位）
   */
  async getAdsByPosition(position: AdPosition) {
    return this.adRepository.findByPosition(position);
  }

  /**
   * 获取所有活跃广告
   */
  async getAllActiveAds() {
    return this.adRepository.findAllActive();
  }

  /**
   * 获取所有广告（管理员）
   */
  async getAllAds(options: { position?: AdPosition; isActive?: boolean } = {}) {
    return this.adRepository.findAll(options);
  }

  /**
   * 记录广告点击
   */
  async recordClick(adId: number, userId?: number, ip?: string, userAgent?: string): Promise<void> {
    const ad = await this.adRepository.findById(adId);
    if (!ad) {
      throw new NotFoundException('广告不存在');
    }

    await this.adRepository.logClick(adId, userId, ip, userAgent);
  }

  /**
   * 创建广告（管理员）
   */
  async createAd(data: {
    position: AdPosition;
    mediaType?: AdMediaType;
    title: string;
    content: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    linkUrl: string;
    priority?: number;
    isActive?: boolean;
  }) {
    return this.adRepository.create(data);
  }

  /**
   * 更新广告（管理员）
   */
  async updateAd(
    id: number,
    data: Partial<{
      position: AdPosition;
      mediaType: AdMediaType;
      title: string;
      content: string;
      imageUrl: string | null;
      videoUrl: string | null;
      linkUrl: string;
      priority: number;
      isActive: boolean;
    }>,
  ) {
    const existing = await this.adRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('广告不存在');
    }

    return this.adRepository.update(id, data);
  }

  /**
   * 删除广告（管理员）
   */
  async deleteAd(id: number) {
    const existing = await this.adRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('广告不存在');
    }

    await this.adRepository.delete(id);
  }
}
