/**
 * Article Service - 文章业务逻辑层
 * 负责业务逻辑、文章管理
 */

import { createHash } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Article,
  ArticleCategory as PrismaArticleCategory,
  ArticleTopicType as PrismaArticleTopicType,
  AutomationProvider as PrismaAutomationProvider,
} from '@prisma/client';
import { maskPhone } from '@/common/utils/data-sanitizer';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ArticleRepository } from './article.repository';
import {
  ArticleCategory,
  ArticleTopicType,
  AutomationNewsDto,
  AutomationProviderType,
} from './dto/article.dto';

export interface ArticleListResult {
  list: PublicArticle[];
  total: number;
}

export interface PublicArticle
  extends Omit<
    Article,
    'id' | 'category' | 'createdByUserId' | 'topicType' | 'relatedInvestorId' | 'automationProvider'
  > {
  id: number;
  category: ArticleCategory | null;
  topicType: ArticleTopicType;
  relatedInvestorId: number | null;
  automationProvider: AutomationProviderType | null;
}

export interface ArticleActor {
  id: number;
  role: string;
  canUploadArticles?: boolean;
}

export interface AutomationNewsBatchResult {
  list: PublicArticle[];
  total: number;
  created: number;
  updated: number;
}

type AutomationWriteAction = 'created' | 'updated';

type AutomationPayloadRecord = Record<string, unknown>;

@Injectable()
export class ArticleService {
  constructor(
    private articleRepository: ArticleRepository,
    private prisma: PrismaService,
  ) {}

  private isAdmin(actor: ArticleActor): boolean {
    return String(actor.role).toUpperCase() === 'ADMIN';
  }

  private async resolveFreshActor(actor: ArticleActor): Promise<ArticleActor> {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(actor.id) },
      select: {
        id: true,
        role: true,
        canUploadArticles: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('用户不存在或已被禁用');
    }

    return {
      ...actor,
      id: Number(user.id),
      role: user.role,
      canUploadArticles: user.canUploadArticles,
    };
  }

  private canEditArticle(article: Article, actor: ArticleActor): boolean {
    if (this.isAdmin(actor)) {
      return true;
    }

    if (!actor.canUploadArticles || !article.createdByUserId) {
      return false;
    }

    return Number(article.createdByUserId) === actor.id;
  }

  private canDeleteArticle(article: Article, actor: ArticleActor): boolean {
    if (this.isAdmin(actor)) {
      return true;
    }

    if (!article.createdByUserId) {
      return false;
    }

    return Number(article.createdByUserId) === actor.id;
  }

  private toPrismaCategory(category?: ArticleCategory): PrismaArticleCategory | undefined {
    switch (category) {
      case ArticleCategory.BUFFETT:
        return 'BUFFETT';
      case ArticleCategory.ARKK:
        return 'WOOD';
      case ArticleCategory.GENERAL:
        return 'GENERAL';
      default:
        return undefined;
    }
  }

  private toPublicCategory(category?: PrismaArticleCategory | null): ArticleCategory | null {
    switch (category) {
      case 'BUFFETT':
        return ArticleCategory.BUFFETT;
      case 'WOOD':
        return ArticleCategory.ARKK;
      case 'GENERAL':
        return ArticleCategory.GENERAL;
      default:
        return null;
    }
  }

  private toPrismaTopicType(topicType?: ArticleTopicType): PrismaArticleTopicType {
    switch (topicType) {
      case ArticleTopicType.INVESTOR:
        return 'INVESTOR';
      case ArticleTopicType.EXECUTIVE:
        return 'EXECUTIVE';
      case ArticleTopicType.GENERAL:
      default:
        return 'GENERAL';
    }
  }

  private toPublicTopicType(topicType?: PrismaArticleTopicType | null): ArticleTopicType {
    switch (topicType) {
      case 'INVESTOR':
        return ArticleTopicType.INVESTOR;
      case 'EXECUTIVE':
        return ArticleTopicType.EXECUTIVE;
      case 'GENERAL':
      default:
        return ArticleTopicType.GENERAL;
    }
  }

  private toPrismaAutomationProvider(
    provider?: AutomationProviderType,
  ): PrismaAutomationProvider | undefined {
    switch (provider) {
      case AutomationProviderType.OPENCLAW:
        return 'OPENCLAW';
      case AutomationProviderType.HARNESS:
        return 'HARNESS';
      default:
        return undefined;
    }
  }

  private toPublicAutomationProvider(
    provider?: PrismaAutomationProvider | null,
  ): AutomationProviderType | null {
    switch (provider) {
      case 'OPENCLAW':
        return AutomationProviderType.OPENCLAW;
      case 'HARNESS':
        return AutomationProviderType.HARNESS;
      default:
        return null;
    }
  }

  private normalizeStockCode(stockCode?: string): string | undefined {
    const normalized = stockCode?.trim().toUpperCase();
    return normalized || undefined;
  }

  private isRecord(value: unknown): value is AutomationPayloadRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private pickFirstDefined(
    record: AutomationPayloadRecord,
    paths: string[][],
  ): unknown {
    for (const path of paths) {
      let current: unknown = record;
      let found = true;

      for (const segment of path) {
        if (!this.isRecord(current) || !(segment in current)) {
          found = false;
          break;
        }

        current = current[segment];
      }

      if (found && current !== undefined && current !== null) {
        return current;
      }
    }

    return undefined;
  }

  private pickString(
    record: AutomationPayloadRecord,
    paths: string[][],
  ): string | undefined {
    const value = this.pickFirstDefined(record, paths);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || undefined;
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
      return String(value);
    }

    return undefined;
  }

  private pickNumber(
    record: AutomationPayloadRecord,
    paths: string[][],
  ): number | undefined {
    const value = this.pickFirstDefined(record, paths);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private pickStringArray(
    record: AutomationPayloadRecord,
    paths: string[][],
  ): string[] | undefined {
    const value = this.pickFirstDefined(record, paths);
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
        .filter(Boolean);

      return normalized.length > 0 ? normalized : undefined;
    }

    if (typeof value === 'string') {
      const normalized = value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

      return normalized.length > 0 ? normalized : undefined;
    }

    return undefined;
  }

  private stringifyMetadata(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || undefined;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }

  private normalizeAutomationCategory(value?: string): ArticleCategory | undefined {
    const normalized = value?.trim().toLowerCase();
    switch (normalized) {
      case 'buffett':
        return ArticleCategory.BUFFETT;
      case 'arkk':
      case 'wood':
        return ArticleCategory.ARKK;
      case 'general':
        return ArticleCategory.GENERAL;
      default:
        return undefined;
    }
  }

  private normalizeAutomationTopicType(
    rawTopicType: string | undefined,
    record: AutomationPayloadRecord,
  ): ArticleTopicType {
    const normalized = rawTopicType?.trim().toLowerCase();
    switch (normalized) {
      case 'investor':
      case 'shareholder':
      case 'personal':
        return ArticleTopicType.INVESTOR;
      case 'executive':
      case 'manager':
      case 'officer':
        return ArticleTopicType.EXECUTIVE;
      case 'general':
      case 'article':
      case 'news':
        return ArticleTopicType.GENERAL;
      default:
        break;
    }

    const relatedInvestorId = this.pickNumber(record, [
      ['relatedInvestorId'],
      ['related_investor_id'],
      ['investorId'],
      ['investor_id'],
      ['target', 'relatedInvestorId'],
      ['target', 'related_investor_id'],
      ['target', 'investorId'],
      ['target', 'investor_id'],
    ]);
    if (relatedInvestorId) {
      return ArticleTopicType.INVESTOR;
    }

    const relatedExecutiveName = this.pickString(record, [
      ['relatedExecutiveName'],
      ['related_executive_name'],
      ['executiveName'],
      ['executive_name'],
      ['target', 'relatedExecutiveName'],
      ['target', 'related_executive_name'],
      ['target', 'executiveName'],
      ['target', 'executive_name'],
    ]);
    if (relatedExecutiveName) {
      return ArticleTopicType.EXECUTIVE;
    }

    return ArticleTopicType.GENERAL;
  }

  private normalizeAutomationPublishDate(value: unknown): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const timestamp = value > 1_000_000_000_000 ? value : value * 1_000;
      return new Date(timestamp).toISOString();
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      if (/^\d{10,13}$/.test(trimmed)) {
        const numeric = Number(trimmed);
        const timestamp = trimmed.length === 13 ? numeric : numeric * 1_000;
        return new Date(timestamp).toISOString();
      }

      return trimmed;
    }

    return undefined;
  }

  private buildAutomationExternalId(
    provider: AutomationProviderType,
    data: {
      title: string;
      summary?: string;
      sourceUrl?: string;
      publishDate?: string;
      topicType: ArticleTopicType;
      relatedInvestorId?: number;
      relatedStockCode?: string;
      relatedExecutiveName?: string;
    },
  ): string {
    return createHash('sha1')
      .update(
        JSON.stringify({
          provider,
          title: data.title,
          summary: data.summary,
          sourceUrl: data.sourceUrl,
          publishDate: data.publishDate,
          topicType: data.topicType,
          relatedInvestorId: data.relatedInvestorId,
          relatedStockCode: data.relatedStockCode,
          relatedExecutiveName: data.relatedExecutiveName,
        }),
      )
      .digest('hex');
  }

  private extractAutomationItems(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!this.isRecord(payload)) {
      throw new BadRequestException('自动化新闻请求体必须是对象或数组');
    }

    const collectionKeys = ['items', 'list', 'articles', 'records', 'news', 'data', 'result'];
    for (const key of collectionKeys) {
      const directValue = payload[key];
      if (Array.isArray(directValue)) {
        return directValue;
      }
    }

    for (const key of collectionKeys) {
      const nestedValue = payload[key];
      if (!this.isRecord(nestedValue)) {
        continue;
      }

      for (const nestedKey of collectionKeys) {
        const collection = nestedValue[nestedKey];
        if (Array.isArray(collection)) {
          return collection;
        }
      }
    }

    const singleItemKeys = ['item', 'article', 'news', 'record', 'data', 'result'];
    for (const key of singleItemKeys) {
      const candidate = payload[key];
      if (this.isRecord(candidate)) {
        return [candidate];
      }
    }

    return [payload];
  }

  private normalizeAutomationNewsItem(
    provider: AutomationProviderType,
    payload: unknown,
  ): AutomationNewsDto {
    if (!this.isRecord(payload)) {
      throw new BadRequestException('自动化新闻条目必须是对象');
    }

    const title = this.pickString(payload, [
      ['title'],
      ['headline'],
      ['subject'],
    ]);
    const summary = this.pickString(payload, [
      ['summary'],
      ['excerpt'],
      ['description'],
      ['desc'],
      ['abstract'],
    ]);
    const content = this.pickString(payload, [
      ['content'],
      ['body'],
      ['markdown'],
      ['text'],
      ['articleContent'],
      ['article_content'],
      ['article'],
    ]) ?? summary ?? title;

    if (!title) {
      throw new BadRequestException('自动化新闻缺少标题字段');
    }

    if (!content) {
      throw new BadRequestException(`自动化新闻「${title}」缺少正文或摘要内容`);
    }

    const topicType = this.normalizeAutomationTopicType(
      this.pickString(payload, [
        ['topicType'],
        ['topic_type'],
        ['topic'],
        ['newsType'],
        ['news_type'],
        ['type'],
      ]),
      payload,
    );
    const relatedInvestorId = this.pickNumber(payload, [
      ['relatedInvestorId'],
      ['related_investor_id'],
      ['investorId'],
      ['investor_id'],
      ['target', 'relatedInvestorId'],
      ['target', 'related_investor_id'],
      ['target', 'investorId'],
      ['target', 'investor_id'],
    ]);
    const relatedStockCode = this.pickString(payload, [
      ['relatedStockCode'],
      ['related_stock_code'],
      ['stockCode'],
      ['stock_code'],
      ['symbol'],
      ['target', 'relatedStockCode'],
      ['target', 'related_stock_code'],
      ['target', 'stockCode'],
      ['target', 'stock_code'],
      ['target', 'symbol'],
    ]);
    const relatedExecutiveName = this.pickString(payload, [
      ['relatedExecutiveName'],
      ['related_executive_name'],
      ['executiveName'],
      ['executive_name'],
      ['target', 'relatedExecutiveName'],
      ['target', 'related_executive_name'],
      ['target', 'executiveName'],
      ['target', 'executive_name'],
    ]);
    const publishDate = this.normalizeAutomationPublishDate(
      this.pickFirstDefined(payload, [
        ['publishDate'],
        ['publish_date'],
        ['publishedAt'],
        ['published_at'],
        ['date'],
        ['datetime'],
        ['timestamp'],
      ]),
    );
    const sourceUrl = this.pickString(payload, [
      ['sourceUrl'],
      ['source_url'],
      ['url'],
      ['link'],
      ['originUrl'],
      ['origin_url'],
    ]);
    const sourceMetadata = this.stringifyMetadata(
      this.pickFirstDefined(payload, [
        ['sourceMetadata'],
        ['source_metadata'],
        ['metadata'],
        ['meta'],
      ]),
    );
    const externalId =
      this.pickString(payload, [
        ['externalId'],
        ['external_id'],
        ['newsId'],
        ['news_id'],
        ['id'],
        ['uuid'],
      ]) ??
      this.buildAutomationExternalId(provider, {
        title,
        summary,
        sourceUrl,
        publishDate,
        topicType,
        relatedInvestorId,
        relatedStockCode,
        relatedExecutiveName,
      });

    return {
      externalId,
      title,
      content,
      summary,
      coverImage: this.pickString(payload, [
        ['coverImage'],
        ['cover_image'],
        ['cover'],
        ['image'],
        ['imageUrl'],
        ['image_url'],
        ['thumbnail'],
      ]),
      author: this.pickString(payload, [
        ['author'],
        ['byline'],
        ['creator'],
        ['publisher'],
      ]),
      category:
        this.normalizeAutomationCategory(
          this.pickString(payload, [
            ['category'],
            ['articleCategory'],
            ['article_category'],
          ]),
        ) ?? ArticleCategory.GENERAL,
      topicType,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
      sourceUrl,
      sourceMetadata,
      publishDate,
      tags: this.pickStringArray(payload, [
        ['tags'],
        ['labels'],
      ]),
    };
  }

  private normalizeAutomationPayload(
    provider: AutomationProviderType,
    payload: unknown,
  ): AutomationNewsDto[] {
    const items = this.extractAutomationItems(payload);
    if (items.length === 0) {
      throw new BadRequestException('自动化新闻请求体未包含可写入的新闻条目');
    }

    return items.map((item) => this.normalizeAutomationNewsItem(provider, item));
  }

  private prepareArticleTargetFields(data: {
    topicType?: ArticleTopicType;
    relatedInvestorId?: number;
    relatedStockCode?: string;
    relatedExecutiveName?: string;
    sourceUrl?: string;
    sourceMetadata?: string;
  }): {
    topicType: PrismaArticleTopicType;
    relatedInvestorId?: bigint | null;
    relatedStockCode?: string | null;
    relatedExecutiveName?: string | null;
    sourceUrl?: string | null;
    sourceMetadata?: string | null;
  } {
    const topicType = data.topicType ?? ArticleTopicType.GENERAL;
    const relatedInvestorId = data.relatedInvestorId
      ? BigInt(data.relatedInvestorId)
      : null;
    const relatedStockCode = this.normalizeStockCode(data.relatedStockCode) ?? null;
    const relatedExecutiveName = data.relatedExecutiveName?.trim() || null;
    const sourceUrl = data.sourceUrl?.trim() || null;
    const sourceMetadata = data.sourceMetadata?.trim() || null;

    if (topicType === ArticleTopicType.INVESTOR && !relatedInvestorId) {
      throw new BadRequestException('牛散相关新闻必须提供 relatedInvestorId');
    }

    if (
      topicType === ArticleTopicType.EXECUTIVE &&
      !relatedStockCode &&
      !relatedExecutiveName
    ) {
      throw new BadRequestException('高管相关新闻至少需要提供 relatedStockCode 或 relatedExecutiveName');
    }

    if (topicType === ArticleTopicType.GENERAL) {
      return {
        topicType: this.toPrismaTopicType(topicType),
        relatedInvestorId: null,
        relatedStockCode,
        relatedExecutiveName: null,
        sourceUrl,
        sourceMetadata,
      };
    }

    return {
      topicType: this.toPrismaTopicType(topicType),
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
      sourceUrl,
      sourceMetadata,
    };
  }

  private async resolveDefaultAuthor(
    providedAuthor: string | undefined,
    actorId: number,
  ): Promise<string | undefined> {
    const author = providedAuthor?.trim();
    if (author) {
      return author;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: {
        phone: true,
        username: true,
        nickname: true,
      },
    });

    if (!user) {
      return undefined;
    }

    return user.nickname?.trim() || user.username?.trim() || maskPhone(user.phone);
  }

  private serializeArticle(article: Article): PublicArticle {
    const { id, category, createdByUserId: _createdByUserId, ...rest } = article;

    return {
      ...rest,
      id: Number(id),
      category: this.toPublicCategory(category),
      topicType: this.toPublicTopicType(article.topicType),
      relatedInvestorId: article.relatedInvestorId ? Number(article.relatedInvestorId) : null,
      automationProvider: this.toPublicAutomationProvider(article.automationProvider),
      tags: article.tags ?? [],
    };
  }

  /**
   * 获取文章列表
   */
  async getList(options: {
    page: number;
    pageSize: number;
    category?: ArticleCategory;
    topicType?: ArticleTopicType;
    keyword?: string;
    relatedInvestorId?: number;
    relatedStockCode?: string;
    relatedExecutiveName?: string;
  }): Promise<ArticleListResult> {
    const prismaCategory = this.toPrismaCategory(options.category);
    const [list, total] = await Promise.all([
      this.articleRepository.findMany({
        ...options,
        category: prismaCategory,
        topicType: options.topicType ? this.toPrismaTopicType(options.topicType) : undefined,
        relatedInvestorId: options.relatedInvestorId
          ? BigInt(options.relatedInvestorId)
          : undefined,
        relatedStockCode: this.normalizeStockCode(options.relatedStockCode),
        relatedExecutiveName: options.relatedExecutiveName?.trim() || undefined,
      }),
      this.articleRepository.count({
        category: prismaCategory,
        topicType: options.topicType ? this.toPrismaTopicType(options.topicType) : undefined,
        keyword: options.keyword,
        relatedInvestorId: options.relatedInvestorId
          ? BigInt(options.relatedInvestorId)
          : undefined,
        relatedStockCode: this.normalizeStockCode(options.relatedStockCode),
        relatedExecutiveName: options.relatedExecutiveName?.trim() || undefined,
      }),
    ]);

    return {
      list: list.map((article) => this.serializeArticle(article)),
      total,
    };
  }

  /**
   * 获取文章详情
   */
  async getDetail(id: number): Promise<PublicArticle> {
    const article = await this.articleRepository.findById(id);
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    await this.articleRepository.incrementViewCount(id);

    return this.serializeArticle(article);
  }

  /**
   * 获取当前用户发布的文章
   */
  async getMine(
    userId: number,
    options: {
      page: number;
      pageSize: number;
      category?: ArticleCategory;
      topicType?: ArticleTopicType;
      keyword?: string;
      relatedInvestorId?: number;
      relatedStockCode?: string;
      relatedExecutiveName?: string;
    },
  ): Promise<ArticleListResult> {
    const prismaCategory = this.toPrismaCategory(options.category);
    const [list, total] = await Promise.all([
      this.articleRepository.findManyByCreator(userId, {
        ...options,
        category: prismaCategory,
        topicType: options.topicType ? this.toPrismaTopicType(options.topicType) : undefined,
        relatedInvestorId: options.relatedInvestorId
          ? BigInt(options.relatedInvestorId)
          : undefined,
        relatedStockCode: this.normalizeStockCode(options.relatedStockCode),
        relatedExecutiveName: options.relatedExecutiveName?.trim() || undefined,
      }),
      this.articleRepository.countByCreator(userId, {
        category: prismaCategory,
        topicType: options.topicType ? this.toPrismaTopicType(options.topicType) : undefined,
        keyword: options.keyword,
        relatedInvestorId: options.relatedInvestorId
          ? BigInt(options.relatedInvestorId)
          : undefined,
        relatedStockCode: this.normalizeStockCode(options.relatedStockCode),
        relatedExecutiveName: options.relatedExecutiveName?.trim() || undefined,
      }),
    ]);

    return {
      list: list.map((article) => this.serializeArticle(article)),
      total,
    };
  }

  /**
   * 创建文章
   */
  async create(
    data: {
      title: string;
      content: string;
      summary?: string;
      coverImage?: string;
      author?: string;
      category?: ArticleCategory;
      topicType?: ArticleTopicType;
      relatedInvestorId?: number;
      relatedStockCode?: string;
      relatedExecutiveName?: string;
      sourceUrl?: string;
      sourceMetadata?: string;
      isPinned?: boolean;
      tags?: string[];
      publishDate?: string;
    },
    actor: ArticleActor,
  ): Promise<PublicArticle> {
    const freshActor = await this.resolveFreshActor(actor);
    const author = await this.resolveDefaultAuthor(data.author, freshActor.id);
    const targetFields = this.prepareArticleTargetFields(data);
    const {
      topicType: _topicType,
      relatedInvestorId: _relatedInvestorId,
      relatedStockCode: _relatedStockCode,
      relatedExecutiveName: _relatedExecutiveName,
      sourceUrl: _sourceUrl,
      sourceMetadata: _sourceMetadata,
      ...restData
    } = data;

    const article = await this.articleRepository.create({
      ...restData,
      author,
      createdByUserId: BigInt(freshActor.id),
      category: this.toPrismaCategory(data.category),
      ...targetFields,
      isPinned: this.isAdmin(freshActor) ? data.isPinned : false,
      publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
    });
    return this.serializeArticle(article);
  }

  /**
   * 更新文章
   */
  async update(
    id: number,
    data: {
      title?: string;
      content?: string;
      summary?: string;
      coverImage?: string;
      author?: string;
      category?: ArticleCategory;
      topicType?: ArticleTopicType;
      relatedInvestorId?: number;
      relatedStockCode?: string;
      relatedExecutiveName?: string;
      sourceUrl?: string;
      sourceMetadata?: string;
      isPinned?: boolean;
      publishDate?: string;
      tags?: string[];
    },
    actor: ArticleActor,
  ): Promise<PublicArticle> {
    const existing = await this.articleRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('文章不存在');
    }

    const freshActor = await this.resolveFreshActor(actor);
    if (!this.canEditArticle(existing, freshActor)) {
      throw new ForbiddenException('无权编辑该文章');
    }

    const targetFields = this.prepareArticleTargetFields({
      topicType: data.topicType ?? this.toPublicTopicType(existing.topicType),
      relatedInvestorId:
        data.relatedInvestorId ??
        (existing.relatedInvestorId ? Number(existing.relatedInvestorId) : undefined),
      relatedStockCode: data.relatedStockCode ?? existing.relatedStockCode ?? undefined,
      relatedExecutiveName:
        data.relatedExecutiveName ?? existing.relatedExecutiveName ?? undefined,
      sourceUrl: data.sourceUrl ?? existing.sourceUrl ?? undefined,
      sourceMetadata: data.sourceMetadata ?? existing.sourceMetadata ?? undefined,
    });
    const {
      topicType: _topicType,
      relatedInvestorId: _relatedInvestorId,
      relatedStockCode: _relatedStockCode,
      relatedExecutiveName: _relatedExecutiveName,
      sourceUrl: _sourceUrl,
      sourceMetadata: _sourceMetadata,
      ...restData
    } = data;

    const article = await this.articleRepository.update(id, {
      ...restData,
      ...targetFields,
      isPinned: this.isAdmin(freshActor) ? data.isPinned : undefined,
      category: data.category ? this.toPrismaCategory(data.category) : undefined,
      publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
    });
    return this.serializeArticle(article);
  }

  /**
   * 删除文章
   */
  async delete(id: number, actor: ArticleActor): Promise<void> {
    const existing = await this.articleRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('文章不存在');
    }

    const freshActor = await this.resolveFreshActor(actor);
    if (!this.canDeleteArticle(existing, freshActor)) {
      throw new ForbiddenException('无权删除该文章');
    }

    await this.articleRepository.delete(id);
  }

  private async upsertAutomationNewsEntry(
    provider: AutomationProviderType,
    data: AutomationNewsDto,
  ): Promise<{ article: PublicArticle; action: AutomationWriteAction }> {
    const prismaProvider = this.toPrismaAutomationProvider(provider);
    if (!prismaProvider) {
      throw new BadRequestException('不支持的自动化新闻来源');
    }

    const targetFields = this.prepareArticleTargetFields(data);
    const existing = await this.articleRepository.findByAutomationKey(
      prismaProvider,
      data.externalId,
    );
    const normalizedAuthor = data.author?.trim() || `${provider} automation`;

    if (existing) {
      const article = await this.articleRepository.update(Number(existing.id), {
        title: data.title,
        content: data.content,
        summary: data.summary,
        coverImage: data.coverImage,
        author: normalizedAuthor,
        category: this.toPrismaCategory(data.category ?? ArticleCategory.GENERAL),
        ...targetFields,
        sourceUrl: targetFields.sourceUrl,
        sourceMetadata: targetFields.sourceMetadata,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
        tags: data.tags,
      });

      return {
        article: this.serializeArticle(article),
        action: 'updated',
      };
    }

    const article = await this.articleRepository.create({
      title: data.title,
      content: data.content,
      summary: data.summary,
      coverImage: data.coverImage,
      author: normalizedAuthor,
      category: this.toPrismaCategory(data.category ?? ArticleCategory.GENERAL),
      ...targetFields,
      automationProvider: prismaProvider,
      automationExternalId: data.externalId,
      sourceUrl: targetFields.sourceUrl,
      sourceMetadata: targetFields.sourceMetadata,
      publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
      tags: data.tags,
      isPinned: false,
    });

    return {
      article: this.serializeArticle(article),
      action: 'created',
    };
  }

  async upsertAutomationNews(
    provider: AutomationProviderType,
    data: AutomationNewsDto,
  ): Promise<PublicArticle> {
    const result = await this.upsertAutomationNewsEntry(provider, data);
    return result.article;
  }

  async upsertAutomationNewsBatch(
    provider: AutomationProviderType,
    payload: unknown,
  ): Promise<AutomationNewsBatchResult> {
    const items = this.normalizeAutomationPayload(provider, payload);
    const list: PublicArticle[] = [];
    let created = 0;
    let updated = 0;

    for (const item of items) {
      const result = await this.upsertAutomationNewsEntry(provider, item);
      list.push(result.article);
      if (result.action === 'created') {
        created += 1;
      } else {
        updated += 1;
      }
    }

    return {
      list,
      total: list.length,
      created,
      updated,
    };
  }
}
