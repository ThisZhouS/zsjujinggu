/**
 * Article Repository - 文章数据访问层
 * 负责单表 CRUD 操作
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  Article,
  ArticleCategory,
  ArticleTopicType,
  AutomationProvider,
  Prisma,
} from '@prisma/client';

@Injectable()
export class ArticleRepository {
  constructor(private prisma: PrismaService) {}

  private buildWhere(options: {
    category?: ArticleCategory;
    topicType?: ArticleTopicType;
    keyword?: string;
    createdByUserId?: bigint;
    relatedInvestorId?: bigint;
    relatedStockCode?: string;
    relatedExecutiveName?: string;
  }): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {};

    if (options.category) {
      where.category = options.category;
    }

    if (options.topicType) {
      where.topicType = options.topicType;
    }

    if (options.keyword) {
      where.OR = [
        {
          title: {
            contains: options.keyword,
          },
        },
        {
          summary: {
            contains: options.keyword,
          },
        },
      ];
    }

    if (options.createdByUserId !== undefined) {
      where.createdByUserId = options.createdByUserId;
    }

    if (options.relatedInvestorId !== undefined) {
      where.relatedInvestorId = options.relatedInvestorId;
    }

    if (options.relatedStockCode) {
      where.relatedStockCode = options.relatedStockCode;
    }

    if (options.relatedExecutiveName) {
      where.relatedExecutiveName = {
        contains: options.relatedExecutiveName,
      };
    }

    return where;
  }

  /**
   * 根据 ID 查找文章
   */
  async findById(id: number): Promise<Article | null> {
    return this.prisma.article.findUnique({
      where: { id },
    });
  }

  /**
   * 分页查询文章列表
   * 支持分类过滤、关键词搜索、置顶排序
   */
  async findMany(options: {
    page: number;
    pageSize: number;
    category?: ArticleCategory;
    topicType?: ArticleTopicType;
    keyword?: string;
    relatedInvestorId?: bigint;
    relatedStockCode?: string;
    relatedExecutiveName?: string;
  }): Promise<Article[]> {
    const {
      page,
      pageSize,
      category,
      topicType,
      keyword,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    } = options;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere({
      category,
      topicType,
      keyword,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    });

    return this.prisma.article.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { isPinned: 'desc' },
        { publishDate: 'desc' },
      ],
    });
  }

  /**
   * 查询指定用户发布的文章
   */
  async findManyByCreator(
    userId: number,
    options: {
      page: number;
      pageSize: number;
      category?: ArticleCategory;
      topicType?: ArticleTopicType;
      keyword?: string;
      relatedInvestorId?: bigint;
      relatedStockCode?: string;
      relatedExecutiveName?: string;
    },
  ): Promise<Article[]> {
    const {
      page,
      pageSize,
      category,
      topicType,
      keyword,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    } = options;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere({
      category,
      topicType,
      keyword,
      createdByUserId: BigInt(userId),
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    });

    return this.prisma.article.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { isPinned: 'desc' },
        { publishDate: 'desc' },
      ],
    });
  }

  /**
   * 统计文章数量
   */
  async count(options?: {
    category?: ArticleCategory;
    topicType?: ArticleTopicType;
    keyword?: string;
    relatedInvestorId?: bigint;
    relatedStockCode?: string;
    relatedExecutiveName?: string;
  }): Promise<number> {
    const where = this.buildWhere({
      category: options?.category,
      topicType: options?.topicType,
      keyword: options?.keyword,
      relatedInvestorId: options?.relatedInvestorId,
      relatedStockCode: options?.relatedStockCode,
      relatedExecutiveName: options?.relatedExecutiveName,
    });

    return this.prisma.article.count({ where });
  }

  /**
   * 统计指定用户发布的文章数量
   */
  async countByCreator(
    userId: number,
    options?: {
      category?: ArticleCategory;
      topicType?: ArticleTopicType;
      keyword?: string;
      relatedInvestorId?: bigint;
      relatedStockCode?: string;
      relatedExecutiveName?: string;
    },
  ): Promise<number> {
    const where = this.buildWhere({
      category: options?.category,
      topicType: options?.topicType,
      keyword: options?.keyword,
      createdByUserId: BigInt(userId),
      relatedInvestorId: options?.relatedInvestorId,
      relatedStockCode: options?.relatedStockCode,
      relatedExecutiveName: options?.relatedExecutiveName,
    });

    return this.prisma.article.count({ where });
  }

  /**
   * 创建文章
   */
  async create(data: {
    title: string;
    content: string;
    summary?: string;
    coverImage?: string;
    author?: string;
    createdByUserId?: bigint;
    category?: ArticleCategory;
    topicType?: ArticleTopicType;
    relatedInvestorId?: bigint;
    relatedStockCode?: string;
    relatedExecutiveName?: string;
    automationProvider?: AutomationProvider;
    automationExternalId?: string;
    sourceUrl?: string;
    sourceMetadata?: string;
    isPinned?: boolean;
    tags?: string[];
    publishDate?: Date;
  }): Promise<Article> {
    return this.prisma.article.create({
      data,
    });
  }

  /**
   * 更新文章
   */
  async update(id: number, data: Partial<Article>): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除文章
   */
  async delete(id: number): Promise<void> {
    await this.prisma.article.delete({
      where: { id },
    });
  }

  /**
   * 增加阅读次数
   */
  async incrementViewCount(id: number): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async findByAutomationKey(
    provider: AutomationProvider,
    externalId: string,
  ): Promise<Article | null> {
    return this.prisma.article.findFirst({
      where: {
        automationProvider: provider,
        automationExternalId: externalId,
      },
    });
  }
}
