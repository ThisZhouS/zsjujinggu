/**
 * Stock Service - 股票业务逻辑层
 * 负责业务逻辑、计算、跨 Repository 聚合
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StockRepository } from './stock.repository';
import {
  BusinessDataSlot,
  HsIndexRealTimeData,
  Stock,
  Market as PrismaMarket,
} from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  HsIndexRealTimeData as LiveHsIndexRealTimeData,
  StockRealTimeDataClient,
} from '@/infrastructure/mairui-api/stock-realtime-data.client';
import {
  buildTrackedPersonalInvestorWhere,
  isLikelyPersonalInvestorName,
} from '@/common/utils/investor-name-filter';
import { DividendRepository } from '@/domain/dividend/dividend.repository';

export interface StockWithStats {
  id: number;
  code: string;
  name: string;
  industry: string | null;
  market: PrismaMarket;
  listingDate: Date | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  priceUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  changePercent?: number;
  volume?: number;
  turnover?: number;
  mainRevenue?: number | null;
  revenueReportDate?: string | null;
  companyDescription?: string | null;
  companySite?: string | null;
  principal?: string | null;
  address?: string | null;
  latestDividendYear?: number | null;
  latestDividendDate?: Date | null;
  latestCashDividend?: number | null;
  latestTotalDividend?: number | null;
  latestDividendYield?: number | null;
  dividendPrice?: number | null;
}

export interface StockQuote {
  code: string;
  name: string;
  currentPrice: number | null;
  totalMarketCap: number | null;
  priceUpdatedAt: Date | null;
}

export interface StockKlinePoint {
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  changePercent: number | null;
  turnover: number | null;
}

export interface StockTrackedHolderItem {
  investorId: number;
  investorName: string;
  investorAvatar: string | null;
  holdCount: number;
  holdRatio: number | null;
  marketValue: number;
  reportDate: string;
}

export interface StockPerformanceItem {
  label: string;
  days: number;
  startDate: string | null;
  endDate: string | null;
  startPrice: number | null;
  endPrice: number | null;
  changePercent: number | null;
}

export interface StockLimitHistoryItem {
  date: string;
  type: 'UP' | 'DOWN';
  stockCode: string;
  stockName: string;
  price: number | null;
  changePercent: number | null;
  turnover: number | null;
  sealAmount: number | null;
  statusText: string | null;
}

export interface StockRealtimePayload {
  available: boolean;
  message: string;
  data: {
    code: string;
    name: string;
    currentPrice: number | null;
    totalMarketCap: number | null;
    updatedAt: Date | null;
  };
}

export interface MarketOverview {
  shIndex: MarketIndex;
  szIndex: MarketIndex;
  bjIndex: MarketIndex;
}

interface MarketIndex {
  name: string;
  code: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  turnover: number | null;
  updatedAt: Date | null;
  source: 'database' | 'live' | 'unavailable';
}

interface NormalizedMarketSnapshot {
  code: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  turnover: number | null;
  updatedAt: Date | null;
}

interface TopicArticleListResult {
  list: Array<{
    id: number;
    title: string;
    summary: string | null;
    coverImage: string | null;
    author: string | null;
    category: 'buffett' | 'arkk';
    publishDate: Date;
    isPinned: boolean;
    viewCount: number;
    tags: string[];
  }>;
  total: number;
}

export interface TopIncreaseItem {
  stockCode: string;
  stockName: string;
  currentPrice: number | null;
  shareholderNames: string[];
  shareholderCount: number;
  totalIncreaseShares: number;
  reportDate: string;
}

export interface TopIncreaseResult {
  list: TopIncreaseItem[];
  total: number;
  reportDate: string | null;
}

interface TopFlowHolderSnapshot {
  id: number;
  stockCode: string;
  shareholderName: string;
  announcementDate: string | null;
  reportDate: string;
  currentShares: number;
  currentHoldRatio: number | null;
  changeReason: string | null;
  holderRank: string | null;
  createdAt: Date;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private stockRepository: StockRepository,
    private prisma: PrismaService,
    private stockRealTimeDataClient: StockRealTimeDataClient,
    private dividendRepository: DividendRepository,
  ) {}

  private readonly marketIndexDefinitions = [
    { key: 'shIndex', code: '000001.SH', name: '上证指数' },
    { key: 'szIndex', code: '399001.SZ', name: '深证成指' },
    { key: 'bjIndex', code: '899050.BJ', name: '北证 50' },
  ] as const;

  private async getActiveDataSlot(): Promise<BusinessDataSlot> {
    const state = await this.prisma.businessDataSourceState.findUnique({
      where: { id: 1 },
      select: { activeSlot: true },
    });

    return state?.activeSlot ?? 'PRIMARY';
  }

  private buildTopFlowHolderKey(item: {
    stockCode: string;
    shareholderName: string;
  }): string {
    return `${item.shareholderName}::${item.stockCode}`;
  }

  private normalizeStockCode(code: string): string {
    return code.trim().toUpperCase().split('.')[0];
  }

  private getStockCodeCandidates(code: string): string[] {
    const originalCode = code.trim().toUpperCase();
    const normalizedCode = this.normalizeStockCode(code);

    return Array.from(
      new Set([
        originalCode,
        normalizedCode,
        `${normalizedCode}.SH`,
        `${normalizedCode}.SZ`,
        `${normalizedCode}.BJ`,
      ]),
    );
  }

  private normalizeReportDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    return value.replace(/-/g, '');
  }

  private async getRepresentativeTopFlowHolderReportDates(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ reportDate: string; rowCount: number }>>`
      SELECT
        jzrq AS "reportDate",
        COUNT(*)::int AS "rowCount"
      FROM company_top_flow_holders
      WHERE gdlx = '自然人' AND jzrq IS NOT NULL
      GROUP BY jzrq
      ORDER BY jzrq DESC
    `;

    if (rows.length === 0) {
      return [];
    }

    const maxCount = Math.max(...rows.map((row) => Number(row.rowCount) || 0));
    const threshold = Math.max(1, Math.floor(maxCount * 0.3));
    const representativeRows = rows.filter((row) => Number(row.rowCount) >= threshold);

    return (representativeRows.length > 0 ? representativeRows : rows).map((row) => row.reportDate);
  }

  private async getLatestTopFlowHolderReportDate(): Promise<string | null> {
    const representativeDates = await this.getRepresentativeTopFlowHolderReportDates();
    return representativeDates[0] ?? null;
  }

  /**
   * 获取股票列表
   */
  async getList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    market?: PrismaMarket;
    sortBy?: string;
  }): Promise<{ list: StockWithStats[]; total: number }> {
    const [list, total] = await Promise.all([
      this.stockRepository.findMany(options),
      this.stockRepository.count(options.keyword, options.market),
    ]);

    return {
      list: list.map((stock) => ({
        ...stock,
        id: Number(stock.id),
        currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
        totalMarketCap: stock.totalMarketCap ? Number(stock.totalMarketCap) : null,
      })) as StockWithStats[],
      total,
    };
  }

  /**
   * 获取股票详情
   */
  async getDetail(code: string): Promise<StockWithStats> {
    const normalizedCode = this.normalizeStockCode(code);
    const codeCandidates = this.getStockCodeCandidates(code);
    const stock = await this.stockRepository.findByCodeCandidates(codeCandidates);
    if (!stock) {
      throw new NotFoundException(`股票 ${code} 不存在`);
    }

    const [revenue, intro, dividendMetric] = await Promise.all([
      this.stockRepository.findLatestRevenueByCodes(codeCandidates).then((rows) => rows[0]),
      this.prisma.companyIntro.findFirst({
        where: {
          stockCode: {
            in: codeCandidates,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.dividendRepository.findLatestMetricByStockCode(stock.code),
    ]);

    return {
      ...stock,
      id: Number(stock.id),
      currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
      totalMarketCap: stock.totalMarketCap ? Number(stock.totalMarketCap) : null,
      mainRevenue: revenue?.mainRevenue ?? null,
      revenueReportDate: revenue?.reportDate ?? null,
      companyDescription: intro?.desc ?? null,
      companySite: intro?.site ?? null,
      principal: intro?.principal ?? null,
      address: intro?.addr ?? null,
      latestDividendYear: dividendMetric?.dividendYear ?? null,
      latestDividendDate: dividendMetric?.dividendDate ?? null,
      latestCashDividend: dividendMetric?.cashDividend ?? null,
      latestTotalDividend: dividendMetric?.totalDividend ?? null,
      latestDividendYield: dividendMetric?.dividendYield ?? null,
      dividendPrice: dividendMetric?.currentPrice ?? null,
    } as StockWithStats;
  }

  async getQuote(code: string): Promise<StockQuote> {
    const stock = await this.getDetail(code);
    return {
      code: stock.code,
      name: stock.name,
      currentPrice: stock.currentPrice ?? null,
      totalMarketCap: stock.totalMarketCap ?? null,
      priceUpdatedAt: stock.priceUpdatedAt ?? null,
    };
  }

  async getKline(code: string, limit: number = 120): Promise<StockKlinePoint[]> {
    const normalizedCode = this.normalizeStockCode(code);
    const codeCandidates = [
      normalizedCode,
      `${normalizedCode}.SH`,
      `${normalizedCode}.SZ`,
      `${normalizedCode}.BJ`,
    ];

    const rows = await this.prisma.klineDaily.findMany({
      where: {
        stockCode: {
          in: codeCandidates,
        },
      },
      orderBy: {
        tradeDate: 'desc',
      },
      take: Math.min(Math.max(limit, 30), 240),
    });

    const latestByDate = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = row.tradeDate.toISOString().slice(0, 10);
      if (!latestByDate.has(key)) {
        latestByDate.set(key, row);
      }
    }

    return Array.from(latestByDate.values())
      .reverse()
      .map((row) => ({
        tradeDate: row.tradeDate.toISOString().slice(0, 10),
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
        volume: Number(row.volume),
        amount: Number(row.amount),
        changePercent: row.changePct != null ? Number(row.changePct) : null,
        turnover: row.turnover != null ? Number(row.turnover) : null,
      }));
  }

  async getPerformanceHistory(code: string): Promise<StockPerformanceItem[]> {
    const kline = await this.getKline(code, 260);
    if (kline.length === 0) {
      return [];
    }

    const latest = kline[kline.length - 1];
    const points = [
      { label: '5日', days: 5 },
      { label: '10日', days: 10 },
      { label: '20日', days: 20 },
      { label: '60日', days: 60 },
      { label: '120日', days: 120 },
      { label: '250日', days: 250 },
    ];

    return points.map((point) => {
      const startIndex = Math.max(0, kline.length - point.days);
      const start = kline[startIndex] ?? null;
      const end = latest ?? null;
      const startPrice = start?.close ?? null;
      const endPrice = end?.close ?? null;

      return {
        label: point.label,
        days: point.days,
        startDate: start?.tradeDate ?? null,
        endDate: end?.tradeDate ?? null,
        startPrice,
        endPrice,
        changePercent:
          startPrice != null && startPrice > 0 && endPrice != null
            ? Number((((endPrice - startPrice) / startPrice) * 100).toFixed(2))
            : null,
      };
    });
  }

  async getLimitHistory(code: string, limit: number = 30): Promise<StockLimitHistoryItem[]> {
    const normalizedCode = this.normalizeStockCode(code);
    const codeCandidates = [
      normalizedCode,
      `${normalizedCode}.SH`,
      `${normalizedCode}.SZ`,
      `${normalizedCode}.BJ`,
    ];

    const [limitUps, limitDowns] = await Promise.all([
      this.prisma.limitUpPool.findMany({
        where: {
          dm: {
            in: codeCandidates,
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: limit,
      }),
      this.prisma.limitDownPool.findMany({
        where: {
          dm: {
            in: codeCandidates,
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: limit,
      }),
    ]);

    return [
      ...limitUps.map<StockLimitHistoryItem>((item) => ({
        date: item.date,
        type: 'UP',
        stockCode: this.normalizeStockCode(item.dm),
        stockName: item.mc ?? normalizedCode,
        price: item.p != null ? Number(item.p) : null,
        changePercent: item.zf != null ? Number(item.zf) : null,
        turnover: item.hs != null ? Number(item.hs) : null,
        sealAmount: item.zj != null ? Number(item.zj) : null,
        statusText: item.tj ?? null,
      })),
      ...limitDowns.map<StockLimitHistoryItem>((item) => ({
        date: item.date,
        type: 'DOWN',
        stockCode: this.normalizeStockCode(item.dm),
        stockName: item.mc ?? normalizedCode,
        price: item.p != null ? Number(item.p) : null,
        changePercent: item.zf != null ? Number(item.zf) : null,
        turnover: item.hs != null ? Number(item.hs) : null,
        sealAmount: item.zj != null ? Number(item.zj) : null,
        statusText: item.lbt ? `最后封板 ${item.lbt}` : null,
      })),
    ].sort((left, right) => {
      if (left.date === right.date) {
        return left.type === 'UP' ? -1 : 1;
      }
      return right.date.localeCompare(left.date);
    }).slice(0, limit);
  }

  async getRealtimePayload(code: string): Promise<StockRealtimePayload> {
    const quote = await this.getQuote(code);

    return {
      available: false,
      message: '已预留实时数据接口，当前默认回落为库存行情摘要，后续可直接接入实时源。',
      data: {
        code: quote.code,
        name: quote.name,
        currentPrice: quote.currentPrice,
        totalMarketCap: quote.totalMarketCap,
        updatedAt: quote.priceUpdatedAt,
      },
    };
  }

  async getTrackedHolders(code: string): Promise<StockTrackedHolderItem[]> {
    const activeSlot = await this.getActiveDataSlot();
    const normalizedCode = this.normalizeStockCode(code);
    const holdings = await this.prisma.holding.findMany({
      where: {
        stockCode: normalizedCode,
        dataSlot: activeSlot,
        investor: buildTrackedPersonalInvestorWhere(),
      },
      include: {
        investor: true,
      },
      orderBy: [
        { reportDate: 'desc' },
        { holdCount: 'desc' },
      ],
    });

    const latestByInvestor = new Map<string, (typeof holdings)[number]>();
    for (const holding of holdings) {
      const key = holding.investorId.toString();
      if (!latestByInvestor.has(key)) {
        latestByInvestor.set(key, holding);
      }
    }

    const stock = await this.stockRepository.findByCode(normalizedCode);
    const currentPrice = stock?.currentPrice ? Number(stock.currentPrice) : 0;

    return Array.from(latestByInvestor.values())
      .filter((holding) => isLikelyPersonalInvestorName(holding.investor.name))
      .map((holding) => {
        const holdCount = Number(holding.holdCount);
        return {
          investorId: Number(holding.investorId),
          investorName: holding.investor.name,
          investorAvatar: holding.investor.avatar,
          holdCount,
          holdRatio: holding.holdRatio != null ? Number(holding.holdRatio) : null,
          marketValue: currentPrice * holdCount,
          reportDate: holding.reportDate.toISOString().slice(0, 10),
        };
      })
      .sort((left, right) => {
        if (right.marketValue !== left.marketValue) {
          return right.marketValue - left.marketValue;
        }
        return right.holdCount - left.holdCount;
      });
  }

  /**
   * 获取市场概览
   * 返回三大市场指数
   * 优先使用已同步到库里的指数实时快照；若缺失则回退到实时 API。
   */
  async getMarketOverview(): Promise<MarketOverview> {
    const codes = this.marketIndexDefinitions.map((item) => item.code);
    const storedSnapshots = await this.stockRepository.findLatestIndexSnapshots(codes);
    const storedSnapshotMap = new Map(
      storedSnapshots.map((snapshot) => [
        snapshot.indexCode,
        this.normalizeStoredSnapshot(snapshot),
      ]),
    );

    const liveSnapshotEntries = await Promise.all(
      this.marketIndexDefinitions.map(async (definition) => {
        if (storedSnapshotMap.has(definition.code)) {
          return [definition.code, null] as const;
        }

        return [definition.code, await this.fetchLiveSnapshot(definition.code)] as const;
      }),
    );
    const liveSnapshotMap = new Map(liveSnapshotEntries);

    const overviewMap = new Map(
      this.marketIndexDefinitions.map((definition) => {
        const storedSnapshot = storedSnapshotMap.get(definition.code);
        if (storedSnapshot) {
          return [
            definition.key,
            this.buildMarketIndex(definition.code, definition.name, storedSnapshot, 'database'),
          ] as const;
        }

        const liveSnapshot = liveSnapshotMap.get(definition.code) ?? null;
        return [
          definition.key,
          this.buildMarketIndex(
            definition.code,
            definition.name,
            liveSnapshot,
            liveSnapshot ? 'live' : 'unavailable',
          ),
        ] as const;
      }),
    );

    return {
      shIndex: overviewMap.get('shIndex')!,
      szIndex: overviewMap.get('szIndex')!,
      bjIndex: overviewMap.get('bjIndex')!,
    };
  }

  private buildMarketIndex(
    code: string,
    name: string,
    snapshot: NormalizedMarketSnapshot | null,
    source: MarketIndex['source'],
  ): MarketIndex {
    return {
      name,
      code,
      value: snapshot?.value ?? null,
      change: snapshot?.change ?? null,
      changePercent: snapshot?.changePercent ?? null,
      high: snapshot?.high ?? null,
      low: snapshot?.low ?? null,
      volume: snapshot?.volume ?? null,
      turnover: snapshot?.turnover ?? null,
      updatedAt: snapshot?.updatedAt ?? null,
      source,
    };
  }

  private normalizeStoredSnapshot(snapshot: HsIndexRealTimeData): NormalizedMarketSnapshot {
    return {
      code: snapshot.indexCode,
      value: this.toNumber(snapshot.p),
      change: this.toNumber(snapshot.ud),
      changePercent: this.toNumber(snapshot.pc),
      high: this.toNumber(snapshot.h),
      low: this.toNumber(snapshot.l),
      volume: this.toNumber(snapshot.v),
      turnover: this.toNumber(snapshot.cje),
      updatedAt: snapshot.t,
    };
  }

  private normalizeLiveSnapshot(snapshot: LiveHsIndexRealTimeData): NormalizedMarketSnapshot {
    return {
      code: snapshot.dm,
      value: snapshot.p ?? null,
      change: snapshot.ud ?? null,
      changePercent: snapshot.pc ?? null,
      high: snapshot.h ?? null,
      low: snapshot.l ?? null,
      volume: snapshot.v ?? null,
      turnover: snapshot.cje ?? null,
      updatedAt: snapshot.t ?? null,
    };
  }

  private async fetchLiveSnapshot(indexCode: string): Promise<NormalizedMarketSnapshot | null> {
    try {
      const snapshots = await this.stockRealTimeDataClient.fetchHsIndexRealTimeData(indexCode);
      if (!snapshots.length) {
        return null;
      }

      const latest = [...snapshots].sort((a, b) => b.t.getTime() - a.t.getTime())[0];
      return this.normalizeLiveSnapshot(latest);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`获取指数实时行情失败，已回退为空值：${indexCode} - ${message}`);
      return null;
    }
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof value === 'object' && value && 'toNumber' in value) {
      const parsed = Number((value as { toNumber: () => number }).toNumber());
      return Number.isFinite(parsed) ? parsed : null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private async getTopicArticles(
    category: 'BUFFETT' | 'WOOD',
    options: {
      page: number;
      pageSize: number;
    },
  ): Promise<TopicArticleListResult> {
    const { page, pageSize } = options;
    const skip = (page - 1) * pageSize;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: { category },
        skip,
        take: pageSize,
        orderBy: [
          { isPinned: 'desc' },
          { publishDate: 'desc' },
        ],
      }),
      this.prisma.article.count({
        where: { category },
      }),
    ]);

    return {
      list: articles.map((article) => ({
        id: Number(article.id),
        title: article.title,
        summary: article.summary,
        coverImage: article.coverImage,
        author: article.author,
        category: category === 'BUFFETT' ? 'buffett' : 'arkk',
        publishDate: article.publishDate,
        isPinned: article.isPinned,
        viewCount: article.viewCount,
        tags: article.tags ?? [],
      })),
      total,
    };
  }

  async getBuffettHoldings(options: {
    page: number;
    pageSize: number;
  }): Promise<TopicArticleListResult> {
    return this.getTopicArticles('BUFFETT', options);
  }

  async getArkkHoldings(options: {
    page: number;
    pageSize: number;
  }): Promise<TopicArticleListResult> {
    return this.getTopicArticles('WOOD', options);
  }

  /**
   * 创建股票
   */
  async create(data: {
    code: string;
    name: string;
    industry?: string;
    market?: PrismaMarket;
    listingDate?: Date;
    currentPrice?: number;
    totalMarketCap?: number;
  }): Promise<Stock> {
    return this.stockRepository.create(data);
  }

  /**
   * 更新股票
   */
  async update(id: number, data: Partial<Stock>): Promise<Stock> {
    const existing = await this.stockRepository.findByCode(String(id));
    if (!existing) {
      throw new NotFoundException(`股票不存在`);
    }

    return this.stockRepository.update(id, data);
  }

  /**
   * 删除股票
   */
  async delete(id: number): Promise<void> {
    await this.stockRepository.delete(BigInt(id));
  }

  /**
   * 同步股票列表（用于定时任务）
   */
  async syncStockList(stocks: Array<{
    code: string;
    name: string;
    industry?: string;
    market?: string;
  }>): Promise<number> {
    await this.stockRepository.upsertMany(stocks as any);
    return stocks.length;
  }

  /**
   * 同步行情数据（用于定时任务）
   */
  async syncQuotes(quotes: Array<{
    code: string;
    currentPrice: number;
    totalMarketCap: number;
  }>): Promise<number> {
    await this.stockRepository.updateQuotes(
      quotes.map((q) => ({
        ...q,
        priceUpdatedAt: new Date(),
      })),
    );
    return quotes.length;
  }

  /**
   * 获取十大股东增持列表
   */
  async getTopIncrease(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    reportDate?: string;
  }): Promise<TopIncreaseResult> {
    const { page, pageSize, keyword, reportDate } = options;
    const skip = (page - 1) * pageSize;
    const targetReportDate =
      this.normalizeReportDate(reportDate) || await this.getLatestTopFlowHolderReportDate();

    if (!targetReportDate) {
      return {
        list: [],
        total: 0,
        reportDate: null,
      };
    }

    const currentRows = await this.prisma.companyTopFlowHolders.findMany({
      where: {
        gdlx: '自然人',
        jzrq: targetReportDate,
        gdmc: { not: null },
        cgsl: { not: null, gt: 0 },
      },
      select: {
        id: true,
        stockCode: true,
        ggrq: true,
        jzrq: true,
        gdmc: true,
        cgsl: true,
        bdyy: true,
        cgbl: true,
        cgpm: true,
        createdAt: true,
      },
      orderBy: [
        { gdmc: 'asc' },
        { stockCode: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const currentMap = new Map<string, TopFlowHolderSnapshot>();
    for (const row of currentRows) {
      const shareholderName = row.gdmc?.trim();
      const currentReportDate = row.jzrq?.trim();
      if (!shareholderName || !currentReportDate) {
        continue;
      }

      const item: TopFlowHolderSnapshot = {
        id: Number(row.id),
        stockCode: row.stockCode,
        shareholderName,
        announcementDate: row.ggrq,
        reportDate: currentReportDate,
        currentShares: row.cgsl ? Number(row.cgsl) : 0,
        currentHoldRatio: row.cgbl ? Number(row.cgbl) : null,
        changeReason: row.bdyy,
        holderRank: row.cgpm,
        createdAt: row.createdAt,
      };
      const key = this.buildTopFlowHolderKey(item);
      if (!currentMap.has(key)) {
        currentMap.set(key, item);
      }
    }

    const currentSnapshots = [...currentMap.values()];
    if (currentSnapshots.length === 0) {
      return {
        list: [],
        total: 0,
        reportDate: targetReportDate,
      };
    }

    const stockCodes = [...new Set(currentSnapshots.map((item) => item.stockCode))];
    const shareholderNames = [...new Set(currentSnapshots.map((item) => item.shareholderName))];
    const representativeDates = await this.getRepresentativeTopFlowHolderReportDates();
    const previousDates = representativeDates.filter((date) => date < targetReportDate).slice(0, 8);

    const [previousRows, stocks] = await Promise.all([
      this.prisma.companyTopFlowHolders.findMany({
        where: {
          gdlx: '自然人',
          jzrq: { in: previousDates },
          stockCode: { in: stockCodes },
          gdmc: { in: shareholderNames },
          cgsl: { not: null },
        },
        select: {
          stockCode: true,
          gdmc: true,
          cgsl: true,
          jzrq: true,
          createdAt: true,
        },
        orderBy: [
          { gdmc: 'asc' },
          { stockCode: 'asc' },
          { jzrq: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.stock.findMany({
        where: {
          code: { in: stockCodes },
        },
        select: {
          code: true,
          name: true,
          currentPrice: true,
        },
      }),
    ]);

    const previousMap = new Map<string, number>();
    for (const row of previousRows) {
      const shareholderName = row.gdmc?.trim();
      if (!shareholderName) {
        continue;
      }

      const key = this.buildTopFlowHolderKey({
        stockCode: row.stockCode,
        shareholderName,
      });
      if (!previousMap.has(key)) {
        previousMap.set(key, row.cgsl ? Number(row.cgsl) : 0);
      }
    }

    const stockMap = new Map(
      stocks.map((stock) => [
        stock.code,
        {
          name: stock.name,
          currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
        },
      ]),
    );

    const keywordText = keyword?.trim().toLowerCase();
    const increaseDetails = currentSnapshots
      .map((item) => {
        const key = this.buildTopFlowHolderKey(item);
        const previousShares = previousMap.get(key);
        if (previousShares == null || item.currentShares <= previousShares) {
          return null;
        }

        const stock = stockMap.get(item.stockCode);
        const currentPrice = stock?.currentPrice ?? null;
        const increaseShares = item.currentShares - previousShares;
        const increaseRate = previousShares > 0 ? (increaseShares / previousShares) * 100 : null;

        return {
          stockCode: item.stockCode,
          stockName: stock?.name ?? item.stockCode,
          currentPrice,
          shareholderName: item.shareholderName,
          increaseShares,
          reportDate: `${item.reportDate.slice(0, 4)}-${item.reportDate.slice(4, 6)}-${item.reportDate.slice(6, 8)}`,
        };
      })
      .filter(
        (
          item,
        ): item is {
          stockCode: string;
          stockName: string;
          currentPrice: number | null;
          shareholderName: string;
          increaseShares: number;
          reportDate: string;
        } => item !== null,
      );

    const groupedMap = new Map<
      string,
      TopIncreaseItem & { shareholderNameSet: Set<string> }
    >();

    for (const item of increaseDetails) {
      if (!groupedMap.has(item.stockCode)) {
        groupedMap.set(item.stockCode, {
          stockCode: item.stockCode,
          stockName: item.stockName,
          currentPrice: item.currentPrice,
          shareholderNames: [],
          shareholderCount: 0,
          totalIncreaseShares: 0,
          reportDate: item.reportDate,
          shareholderNameSet: new Set<string>(),
        });
      }

      const groupedItem = groupedMap.get(item.stockCode)!;
      groupedItem.totalIncreaseShares += item.increaseShares;
      groupedItem.shareholderNameSet.add(item.shareholderName);
    }

    const topIncreaseRows = Array.from(groupedMap.values())
      .map(({ shareholderNameSet, ...item }) => ({
        ...item,
        shareholderNames: Array.from(shareholderNameSet),
        shareholderCount: shareholderNameSet.size,
      }))
      .filter((item) => {
        if (!keywordText) {
          return true;
        }

        return [
          item.stockCode,
          item.stockName,
          item.shareholderNames.join(' '),
        ].some((field) => field.toLowerCase().includes(keywordText));
      })
      .sort((a, b) => {
        if (b.totalIncreaseShares !== a.totalIncreaseShares) {
          return b.totalIncreaseShares - a.totalIncreaseShares;
        }
        return b.shareholderCount - a.shareholderCount;
      });

    const top100Rows = topIncreaseRows.slice(0, 100);

    return {
      list: top100Rows.slice(skip, skip + pageSize),
      total: top100Rows.length,
      reportDate: `${targetReportDate.slice(0, 4)}-${targetReportDate.slice(4, 6)}-${targetReportDate.slice(6, 8)}`,
    };
  }
}
