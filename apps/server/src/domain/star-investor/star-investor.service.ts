import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { Prisma, StarHoldingChangeType, StarInvestorType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

type StarInvestorSlug = 'buffett' | 'catherine-wood';

interface TradingKeyStockInfo {
  icon?: string;
  code?: string;
  name?: string;
  route?: string;
  typeRoute?: string;
  instrumentCode?: string;
}

interface TradingKeyHolding {
  stockInfo?: TradingKeyStockInfo;
  industry?: string;
  holdingType?: string;
  tradePrice?: number | null;
  tradeQuantity?: number | null;
  holdingQuantity?: number | null;
  reportDate?: string | null;
  tradeValue?: number | null;
  changeRate?: number | null;
  proportion?: number | null;
  latestPrice?: number | null;
}

interface TradingKeyInvestorInfo {
  name?: string;
  logo?: string;
  organizationName?: string;
  description?: string;
  holdingDetail?: {
    reportDate?: string | null;
    holdingStockCount?: number | null;
    holdingValue?: number | null;
    tradeProportion?: number | null;
    topIncreaseInstrument?: {
      topChangeName?: string | null;
      topChangeCode?: string | null;
    };
    topDecreaseInstrument?: {
      topChangeName?: string | null;
      topChangeCode?: string | null;
    };
    period?: string | null;
  };
  topTenPercent?: number | null;
}

interface TradingKeyPayload {
  investorInfo: TradingKeyInvestorInfo;
  holdings: TradingKeyHolding[];
  total: number;
  periods: string[];
}

interface TradingKeyListResponse {
  success?: boolean;
  value?: {
    list?: TradingKeyHolding[];
    total?: number;
  };
}

type StarInvestorSyncContext = {
  investorType: StarInvestorType;
  investorName: string;
  period: string;
  sourceReportDate: Date | null;
  sourceUrl: string;
  scrapedAt: Date;
};

const INVESTORS: Record<StarInvestorSlug, {
  type: StarInvestorType;
  sourceUrl: string;
  route: string;
  fallbackName: string;
}> = {
  buffett: {
    type: StarInvestorType.BUFFETT,
    sourceUrl: 'https://www.tradingkey.com/zh-hans/tools/star-investors/warren-buffett/portfolio',
    route: 'warren-buffett',
    fallbackName: '沃伦·巴菲特',
  },
  'catherine-wood': {
    type: StarInvestorType.CATHERINE_WOOD,
    sourceUrl: 'https://www.tradingkey.com/zh-hans/tools/star-investors/catherine-wood/portfolio',
    route: 'catherine-wood',
    fallbackName: '凯茜·伍德（木头姐）',
  },
};

@Injectable()
export class StarInvestorService {
  private readonly logger = new Logger(StarInvestorService.name);

  constructor(private readonly prisma: PrismaService) {}

  resolveSlug(value: string): StarInvestorSlug {
    const normalized = value.trim().toLowerCase();
    if (['buffett', 'warren-buffett', 'warren_buffett'].includes(normalized)) {
      return 'buffett';
    }

    if (['catherine-wood', 'catherine_wood', 'wood', 'arkk', 'cathie-wood'].includes(normalized)) {
      return 'catherine-wood';
    }

    throw new NotFoundException(`不支持的明星投资人：${value}`);
  }

  async syncAll(): Promise<number> {
    let total = 0;
    for (const slug of Object.keys(INVESTORS) as StarInvestorSlug[]) {
      total += await this.syncInvestor(slug);
    }
    return total;
  }

  async syncInvestor(input: string): Promise<number> {
    const slug = this.resolveSlug(input);
    const definition = INVESTORS[slug];
    const payload = await this.fetchTradingKeyPagePayload(definition.sourceUrl);
    const investorInfo = payload.investorInfo;
    const detail = investorInfo.holdingDetail ?? {};
    const period = detail.period || payload.periods[0] || this.inferPeriod(detail.reportDate) || 'latest';
    const investorName = investorInfo.name || definition.fallbackName;
    const scrapedAt = new Date();
    const sourceReportDate = this.parseDate(detail.reportDate);
    const context: StarInvestorSyncContext = {
      investorType: definition.type,
      investorName,
      period,
      sourceReportDate,
      sourceUrl: definition.sourceUrl,
      scrapedAt,
    };

    const [latestSnapshot, currentHoldingCount] = await this.prisma.$transaction([
      this.prisma.starInvestorSnapshot.findFirst({
        where: { investorType: definition.type },
        orderBy: [{ scrapedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.starInvestorHolding.count({
        where: {
          investorType: definition.type,
          period,
        },
      }),
    ]);

    const needsFullSync = !latestSnapshot || latestSnapshot.period !== period || currentHoldingCount === 0;
    if (needsFullSync) {
      return this.syncInvestorFull(definition, payload, context);
    }

    const tradeCount = await this.syncInvestorTrades(definition, context);
    await this.upsertSnapshot(definition, payload, context, payload.total);
    return tradeCount;
  }

  async getHoldings(input: string, options: {
    page: number;
    pageSize: number;
    holdingType?: string;
    keyword?: string;
  }) {
    const slug = this.resolveSlug(input);
    const definition = INVESTORS[slug];
    const latestSnapshot = await this.prisma.starInvestorSnapshot.findFirst({
      where: { investorType: definition.type },
      orderBy: [{ scrapedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const period = latestSnapshot?.period;
    if (!period) {
      return {
        investor: null,
        list: [],
        total: 0,
      };
    }

    const where: Prisma.StarInvestorHoldingWhereInput = {
      investorType: definition.type,
      period,
      holdingQuantity: { gt: 0 },
    };

    if (options.holdingType && options.holdingType !== 'ALL') {
      where.holdingType = options.holdingType as StarHoldingChangeType;
    }

    if (options.keyword) {
      where.OR = [
        { stockCode: { contains: options.keyword, mode: 'insensitive' } },
        { stockName: { contains: options.keyword, mode: 'insensitive' } },
        { industry: { contains: options.keyword, mode: 'insensitive' } },
      ];
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.starInvestorHolding.findMany({
        where,
        orderBy: [
          { reportMarketValue: 'desc' },
          { holdingQuantity: 'desc' },
        ],
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.starInvestorHolding.count({ where }),
    ]);

    return {
      investor: latestSnapshot ? this.serializeSnapshot(latestSnapshot) : null,
      list: list.map((item) => this.serializeHolding(item)),
      total,
    };
  }

  async getSummary(input: string) {
    const slug = this.resolveSlug(input);
    const definition = INVESTORS[slug];
    const snapshot = await this.prisma.starInvestorSnapshot.findFirst({
      where: { investorType: definition.type },
      orderBy: [{ scrapedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return snapshot ? this.serializeSnapshot(snapshot) : null;
  }

  async getTrades(input: string, options: {
    page: number;
    pageSize: number;
    holdingType?: string;
    keyword?: string;
  }) {
    const slug = this.resolveSlug(input);
    const definition = INVESTORS[slug];
    const latestSnapshot = await this.prisma.starInvestorSnapshot.findFirst({
      where: { investorType: definition.type },
      orderBy: [{ scrapedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const period = latestSnapshot?.period;
    if (!period) {
      return {
        investor: null,
        list: [],
        total: 0,
      };
    }

    const where: Prisma.StarInvestorTradeWhereInput = {
      investorType: definition.type,
      period,
    };

    if (options.holdingType && options.holdingType !== 'ALL') {
      where.holdingType = options.holdingType as StarHoldingChangeType;
    }

    if (options.keyword) {
      where.OR = [
        { stockCode: { contains: options.keyword, mode: 'insensitive' } },
        { stockName: { contains: options.keyword, mode: 'insensitive' } },
        { industry: { contains: options.keyword, mode: 'insensitive' } },
      ];
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.starInvestorTrade.findMany({
        where,
        orderBy: [
          { reportDate: 'desc' },
          { reportMarketValue: 'desc' },
          { holdingQuantity: 'desc' },
        ],
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      this.prisma.starInvestorTrade.count({ where }),
    ]);

    return {
      investor: latestSnapshot ? this.serializeSnapshot(latestSnapshot) : null,
      list: list.map((item) => this.serializeTrade(item)),
      total,
    };
  }

  private async fetchTradingKeyPagePayload(sourceUrl: string): Promise<TradingKeyPayload> {
    const response = await axios.get<string>(sourceUrl, {
      timeout: 15000,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; KingDataBot/1.0; +https://localhost)',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    const loaderData = this.extractLoaderData(response.data);
    const values = Object.values(loaderData)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => value && typeof value === 'object') as any[];

    const investorNode = values.find((value) => value.investorInfo);
    const holdingNode = values.find((value) => value.holdingHistoryData);

    if (!investorNode?.investorInfo || !holdingNode?.holdingHistoryData) {
      throw new Error('TradingKey 页面缺少 investorInfo 或 holdingHistoryData');
    }

    const investorInfo = investorNode.investorInfo as TradingKeyInvestorInfo;
    const initialHoldings = holdingNode.holdingHistoryData.list ?? [];
    const periods = holdingNode.investorPeriods ?? [];
    const total = holdingNode.holdingHistoryData.total ?? initialHoldings.length;

    return {
      investorInfo: investorNode.investorInfo,
      holdings: initialHoldings,
      total,
      periods,
    };
  }

  private async syncInvestorFull(
    definition: typeof INVESTORS[StarInvestorSlug],
    payload: TradingKeyPayload,
    context: StarInvestorSyncContext,
  ): Promise<number> {
    const holdings = await this.fetchAllTradingKeyHoldings(
      definition.route,
      context.period,
      payload.total,
      payload.holdings,
    );
    const rows = holdings
      .map((holding) => this.normalizeHolding(holding, context))
      .filter((row): row is NonNullable<ReturnType<StarInvestorService['normalizeHolding']>> => Boolean(row));

    if (rows.length === 0) {
      throw new Error(
        `TradingKey ${context.investorName} 新报告期持仓为空，已阻断最新快照切换：period=${context.period}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.starInvestorHolding.deleteMany({
        where: {
          investorType: definition.type,
          period: context.period,
        },
      }),
      ...(rows.length > 0
        ? [
            this.prisma.starInvestorHolding.createMany({
              data: rows,
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    const tradeCount = await this.syncInvestorTrades(definition, context);
    await this.upsertSnapshot(definition, payload, context, Math.max(payload.total, rows.length));
    this.logger.log(
      `TradingKey ${context.investorName} 新报告期全量同步完成：period=${context.period}, holdings=${rows.length}, trades=${tradeCount}`,
    );
    return rows.length + tradeCount;
  }

  private async syncInvestorTrades(
    definition: typeof INVESTORS[StarInvestorSlug],
    context: StarInvestorSyncContext,
  ): Promise<number> {
    const trades = await this.fetchAllTradingKeyTrades(definition.route, context.period);
    const normalizedTradeRows = trades
      .map((trade) => this.normalizeTrade(trade, context))
      .filter((row): row is NonNullable<ReturnType<StarInvestorService['normalizeTrade']>> => Boolean(row));
    const normalizedHoldingRows = trades
      .map((trade) => this.normalizeHolding(trade, context))
      .filter((row): row is NonNullable<ReturnType<StarInvestorService['normalizeHolding']>> => Boolean(row));
    const tradeRows = Array.from(
      new Map(normalizedTradeRows.map((row) => [row.sourceKey, row])).values(),
    );
    const holdingRows = Array.from(
      new Map(normalizedHoldingRows.map((row) => [
        `${row.investorType}:${row.period}:${row.stockCode}:${row.instrumentCode ?? ''}`,
        row,
      ])).values(),
    );

    if (tradeRows.length === 0 && holdingRows.length === 0) {
      await this.assertTradingKeyEmptyTradesAcceptable(definition.type, context);
      this.logger.log(`TradingKey ${context.investorName} 日常买卖同步无更新：period=${context.period}`);
      return 0;
    }

    await this.prisma.$transaction([
      ...tradeRows.map((row) =>
        this.prisma.starInvestorTrade.upsert({
          where: { sourceKey: row.sourceKey },
          update: {
            investorName: row.investorName,
            sourceReportDate: row.sourceReportDate,
            stockName: row.stockName,
            instrumentCode: row.instrumentCode,
            iconUrl: row.iconUrl,
            route: row.route,
            typeRoute: row.typeRoute,
            industry: row.industry,
            holdingType: row.holdingType,
            tradePrice: row.tradePrice,
            tradeQuantity: row.tradeQuantity,
            holdingQuantity: row.holdingQuantity,
            reportDate: row.reportDate,
            reportMarketValue: row.reportMarketValue,
            changeRate: row.changeRate,
            proportion: row.proportion,
            latestPrice: row.latestPrice,
            sourceUrl: row.sourceUrl,
            scrapedAt: row.scrapedAt,
            lastSeenAt: context.scrapedAt,
          },
          create: row,
        }),
      ),
      ...holdingRows.map((row) =>
        this.prisma.starInvestorHolding.upsert({
          where: {
            investorType_period_stockCode_instrumentCode: {
              investorType: row.investorType,
              period: row.period,
              stockCode: row.stockCode,
              instrumentCode: row.instrumentCode,
            },
          },
          update: {
            investorName: row.investorName,
            sourceReportDate: row.sourceReportDate,
            stockName: row.stockName,
            iconUrl: row.iconUrl,
            route: row.route,
            typeRoute: row.typeRoute,
            industry: row.industry,
            holdingType: row.holdingType,
            tradePrice: row.tradePrice,
            tradeQuantity: row.tradeQuantity,
            previousHoldingQuantity: row.previousHoldingQuantity,
            holdingQuantity: row.holdingQuantity,
            reportDate: row.reportDate,
            reportMarketValue: row.reportMarketValue,
            changeRate: row.changeRate,
            proportion: row.proportion,
            latestPrice: row.latestPrice,
            latestMarketValue: row.latestMarketValue,
            sourceUrl: row.sourceUrl,
            scrapedAt: row.scrapedAt,
          },
          create: row,
        }),
      ),
    ]);

    this.logger.log(
      `TradingKey ${context.investorName} 日常买卖同步完成：period=${context.period}, trades=${tradeRows.length}, holdings=${holdingRows.length}, fetched=${trades.length}`,
    );
    return tradeRows.length;
  }

  private async upsertSnapshot(
    definition: typeof INVESTORS[StarInvestorSlug],
    payload: TradingKeyPayload,
    context: StarInvestorSyncContext,
    holdingStockCount: number,
  ): Promise<void> {
    const investorInfo = payload.investorInfo;
    const detail = investorInfo.holdingDetail ?? {};
    const data = {
      investorName: context.investorName,
      organizationName: investorInfo.organizationName ?? null,
      description: investorInfo.description ?? null,
      logoUrl: investorInfo.logo ?? null,
      reportDate: context.sourceReportDate,
      holdingStockCount: detail.holdingStockCount ?? holdingStockCount,
      holdingValue: this.toDecimal(detail.holdingValue),
      tradeProportion: this.toDecimal(detail.tradeProportion),
      topTenPercent: this.toDecimal(investorInfo.topTenPercent),
      topIncreaseCode: detail.topIncreaseInstrument?.topChangeCode ?? null,
      topIncreaseName: detail.topIncreaseInstrument?.topChangeName ?? null,
      topDecreaseCode: detail.topDecreaseInstrument?.topChangeCode ?? null,
      topDecreaseName: detail.topDecreaseInstrument?.topChangeName ?? null,
      sourceUrl: context.sourceUrl,
      scrapedAt: context.scrapedAt,
      rawPayload: JSON.stringify({
        investorInfo,
        total: payload.total,
        periods: payload.periods,
      }),
    };

    await this.prisma.starInvestorSnapshot.upsert({
      where: {
        investorType_period: {
          investorType: definition.type,
          period: context.period,
        },
      },
      update: data,
      create: {
        investorType: definition.type,
        period: context.period,
        ...data,
      },
    });
  }

  private async fetchAllTradingKeyHoldings(
    route: string,
    period: string,
    expectedTotal: number,
    fallbackHoldings: TradingKeyHolding[],
  ): Promise<TradingKeyHolding[]> {
    // TradingKey 对过大的 size 会静默截断，固定 100 分页最稳定。
    const pageSize = 100;
    const allRows: TradingKeyHolding[] = [];
    let page = 1;
    let total = expectedTotal;

    try {
      do {
        const response = await axios.get<TradingKeyListResponse>(
          'https://api.tradingkey.com/quotes-base/star-investors/investor/holding-history-list',
          {
            timeout: 20000,
            params: {
              route,
              page,
              size: pageSize,
              sortField: 'SORT_HOLDING_VALUE',
              sortOrder: 'DESC',
              period,
            },
            headers: {
              'user-agent': 'Mozilla/5.0 (compatible; KingDataBot/1.0; +https://localhost)',
              accept: 'application/json',
              origin: 'https://www.tradingkey.com',
              referer: `https://www.tradingkey.com/zh-hans/tools/star-investors/${route}/portfolio`,
            },
          },
        );

        if (!response.data?.success || !response.data.value) {
          throw new Error(`TradingKey API 返回异常：${JSON.stringify(response.data).slice(0, 300)}`);
        }

        const rows = response.data.value.list ?? [];
        total = response.data.value.total ?? total ?? rows.length;
        allRows.push(...rows);

        if (rows.length === 0 || allRows.length >= total) {
          break;
        }

        page += 1;
      } while (page <= 20);

      if (allRows.length > 0) {
        if (!this.isTradingKeyListCompleteEnough(total, allRows.length)) {
          throw new Error(
            `TradingKey ${route} 全量持仓分页不完整：fetched=${allRows.length}, expected=${total}`,
          );
        }
        if (total > 0 && allRows.length < total) {
          this.logger.warn(
            `TradingKey ${route} 全量持仓数量低于摘要 total，但达到完整度阈值后继续：fetched=${allRows.length}, expected=${total}`,
          );
        }
        return allRows;
      }

      if (this.isFallbackHoldingComplete(expectedTotal, fallbackHoldings)) {
        return fallbackHoldings;
      }

      throw new Error(
        `TradingKey ${route} 全量持仓为空且首屏数据不完整：fallback=${fallbackHoldings.length}, expected=${expectedTotal}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.isFallbackHoldingComplete(expectedTotal, fallbackHoldings)) {
        this.logger.warn(`TradingKey ${route} 全量持仓 API 获取失败，首屏数据已确认完整后回退：${message}`);
        return fallbackHoldings;
      }

      throw new Error(
        `TradingKey ${route} 全量持仓 API 获取失败且首屏数据不足，已阻断同步：${message}`,
      );
    }
  }

  private async fetchAllTradingKeyTrades(route: string, period: string): Promise<TradingKeyHolding[]> {
    const pageSize = 100;
    const allRows: TradingKeyHolding[] = [];
    let page = 1;
    let total = 0;

    try {
      do {
        const response = await axios.get<TradingKeyListResponse>(
          'https://api.tradingkey.com/quotes-base/star-investors/investor/latest-trade-stock-list',
          {
            timeout: 20000,
            params: {
              route,
              page,
              size: pageSize,
              period,
            },
            headers: {
              'user-agent': 'Mozilla/5.0 (compatible; KingDataBot/1.0; +https://localhost)',
              accept: 'application/json',
              origin: 'https://www.tradingkey.com',
              referer: `https://www.tradingkey.com/zh-hans/tools/star-investors/${route}/portfolio`,
            },
          },
        );

        if (!response.data?.success || !response.data.value) {
          throw new Error(`TradingKey 交易 API 返回异常：${JSON.stringify(response.data).slice(0, 300)}`);
        }

        const rows = response.data.value.list ?? [];
        total = response.data.value.total ?? total ?? rows.length;
        allRows.push(...rows);

        if (rows.length === 0 || allRows.length >= total) {
          break;
        }

        page += 1;
      } while (page <= 20);

      if (!this.isTradingKeyListCompleteEnough(total, allRows.length)) {
        throw new Error(
          `TradingKey ${route} 日常买卖分页不完整：fetched=${allRows.length}, expected=${total}`,
        );
      }
      if (total > 0 && allRows.length < total) {
        this.logger.warn(
          `TradingKey ${route} 日常买卖数量低于摘要 total，但达到完整度阈值后继续：fetched=${allRows.length}, expected=${total}`,
        );
      }

      return allRows;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`TradingKey ${route} 日常买卖 API 获取失败，已阻断同步：${message}`);
    }
  }

  private isFallbackHoldingComplete(
    expectedTotal: number,
    fallbackHoldings: TradingKeyHolding[],
  ): boolean {
    return fallbackHoldings.length > 0 && this.isTradingKeyListCompleteEnough(expectedTotal, fallbackHoldings.length);
  }

  private isTradingKeyListCompleteEnough(expectedTotal: number, fetchedCount: number): boolean {
    if (expectedTotal <= 0) {
      return fetchedCount > 0;
    }

    return fetchedCount / expectedTotal >= this.parseRatioEnv('TRADINGKEY_MIN_LIST_COMPLETENESS', 0.95);
  }

  private async assertTradingKeyEmptyTradesAcceptable(
    investorType: StarInvestorType,
    context: StarInvestorSyncContext,
  ): Promise<void> {
    const shouldBlockEmptyTrades = this.parseBooleanEnv(
      'TRADINGKEY_BLOCK_EMPTY_DAILY_TRADES',
      false,
    );
    if (!shouldBlockEmptyTrades) {
      return;
    }

    const existingTradeCount = await this.prisma.starInvestorTrade.count({
      where: {
        investorType,
        period: context.period,
      },
    });

    if (existingTradeCount > 0) {
      return;
    }

    throw new Error(
      `TradingKey ${context.investorName} 日常买卖返回空且本报告期无历史买卖记录，已阻断同步：period=${context.period}`,
    );
  }

  private parseRatioEnv(name: string, fallback: number): number {
    const rawValue = process.env[name];
    const parsed = rawValue ? Number(rawValue) : fallback;
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(1, Math.max(0, parsed));
  }

  private parseBooleanEnv(name: string, fallback: boolean): boolean {
    const rawValue = process.env[name];
    if (!rawValue) {
      return fallback;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }

    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
      return false;
    }

    return fallback;
  }

  private extractLoaderData(html: string): Record<string, unknown> {
    const marker = 'window.__QUDE_LOADER_DATA__=';
    const start = html.indexOf(marker);
    if (start < 0) {
      throw new Error('TradingKey 页面未找到 __QUDE_LOADER_DATA__');
    }

    const jsonStart = start + marker.length;
    const scriptEnd = html.indexOf('</script>', jsonStart);
    if (scriptEnd < 0) {
      throw new Error('TradingKey 页面 loader script 不完整');
    }

    const raw = html.slice(jsonStart, scriptEnd).replace(/;\s*$/, '');
    return JSON.parse(raw);
  }

  private normalizeHolding(
    holding: TradingKeyHolding,
    context: StarInvestorSyncContext,
  ): Prisma.StarInvestorHoldingCreateManyInput | null {
    const stockInfo = holding.stockInfo ?? {};
    const stockCode = stockInfo.code?.trim();
    if (!stockCode) {
      return null;
    }

    const instrumentCode = this.normalizeInstrumentCode(stockInfo.instrumentCode);
    const tradeQuantity = this.toBigInt(holding.tradeQuantity);
    const holdingQuantity = this.toBigInt(holding.holdingQuantity);
    const previousHoldingQuantity =
      holdingQuantity != null && tradeQuantity != null
        ? holdingQuantity - tradeQuantity
        : null;
    const latestPrice = this.resolveLatestPrice(holding);
    const latestMarketValue =
      latestPrice != null && holdingQuantity != null
        ? latestPrice * Number(holdingQuantity)
        : null;

    return {
      investorType: context.investorType,
      investorName: context.investorName,
      period: context.period,
      sourceReportDate: context.sourceReportDate,
      stockCode,
      stockName: stockInfo.name || stockCode,
      instrumentCode,
      iconUrl: stockInfo.icon ?? null,
      route: stockInfo.route ?? null,
      typeRoute: stockInfo.typeRoute ?? null,
      industry: holding.industry || null,
      holdingType: this.normalizeHoldingType(holding.holdingType, holding.tradeQuantity),
      tradePrice: this.toDecimal(holding.tradePrice),
      tradeQuantity,
      previousHoldingQuantity,
      holdingQuantity,
      reportDate: this.parseDate(holding.reportDate),
      reportMarketValue: this.toDecimal(holding.tradeValue),
      changeRate: this.toDecimal(holding.changeRate),
      proportion: this.toDecimal(holding.proportion),
      latestPrice: this.toDecimal(latestPrice),
      latestMarketValue: this.toDecimal(latestMarketValue),
      sourceUrl: context.sourceUrl,
      scrapedAt: context.scrapedAt,
    };
  }

  private normalizeTrade(
    trade: TradingKeyHolding,
    context: StarInvestorSyncContext,
  ): Prisma.StarInvestorTradeCreateInput | null {
    const stockInfo = trade.stockInfo ?? {};
    const stockCode = stockInfo.code?.trim();
    if (!stockCode) {
      return null;
    }

    const holdingType = this.normalizeHoldingType(trade.holdingType, trade.tradeQuantity);
    const tradeQuantity = this.toBigInt(trade.tradeQuantity);
    const holdingQuantity = this.toBigInt(trade.holdingQuantity);
    const reportDate = this.parseDate(trade.reportDate);
    const instrumentCode = this.normalizeInstrumentCode(stockInfo.instrumentCode);
    const latestPrice = this.resolveLatestPrice(trade);
    const sourceKey = [
      context.investorType,
      context.period,
      stockCode,
      instrumentCode,
      this.formatDate(reportDate) ?? '',
      holdingType,
      tradeQuantity?.toString() ?? '',
      holdingQuantity?.toString() ?? '',
    ].join(':');

    return {
      investorType: context.investorType,
      investorName: context.investorName,
      period: context.period,
      sourceKey,
      sourceReportDate: context.sourceReportDate,
      stockCode,
      stockName: stockInfo.name || stockCode,
      instrumentCode,
      iconUrl: stockInfo.icon ?? null,
      route: stockInfo.route ?? null,
      typeRoute: stockInfo.typeRoute ?? null,
      industry: trade.industry || null,
      holdingType,
      tradePrice: this.toDecimal(trade.tradePrice),
      tradeQuantity,
      holdingQuantity,
      reportDate,
      reportMarketValue: this.toDecimal(trade.tradeValue),
      changeRate: this.toDecimal(trade.changeRate),
      proportion: this.toDecimal(trade.proportion),
      latestPrice: this.toDecimal(latestPrice),
      sourceUrl: context.sourceUrl,
      scrapedAt: context.scrapedAt,
      lastSeenAt: context.scrapedAt,
    };
  }

  private normalizeHoldingType(value?: string | null, tradeQuantity?: number | null): StarHoldingChangeType {
    const normalized = value?.toUpperCase();
    if (normalized === 'INCREASE' || normalized === 'OPEN') return StarHoldingChangeType.INCREASE;
    if (normalized === 'DECREASE' || normalized === 'CLOSE') return StarHoldingChangeType.DECREASE;
    if (normalized === 'KEEP') return StarHoldingChangeType.KEEP;
    if (tradeQuantity != null && tradeQuantity > 0) return StarHoldingChangeType.INCREASE;
    if (tradeQuantity != null && tradeQuantity < 0) return StarHoldingChangeType.DECREASE;
    if (tradeQuantity === 0) return StarHoldingChangeType.KEEP;
    return StarHoldingChangeType.UNKNOWN;
  }

  private normalizeInstrumentCode(value?: string | null): string {
    return value?.trim() || '';
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private inferPeriod(reportDate?: string | null): string | null {
    if (!reportDate) {
      return null;
    }

    const date = this.parseDate(reportDate);
    if (!date) {
      return null;
    }

    const month = date.getUTCMonth() + 1;
    const quarter = Math.max(1, Math.ceil(month / 3));
    return `${date.getUTCFullYear()}Q${quarter}`;
  }

  private toDecimal(value?: number | string | null): Prisma.Decimal | null {
    if (value == null || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? new Prisma.Decimal(numberValue) : null;
  }

  private toBigInt(value?: number | string | null): bigint | null {
    if (value == null || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? BigInt(Math.trunc(numberValue)) : null;
  }

  private serializeSnapshot(snapshot: any) {
    return {
      id: Number(snapshot.id),
      investorType: snapshot.investorType,
      investorName: snapshot.investorName,
      organizationName: snapshot.organizationName,
      description: snapshot.description,
      logoUrl: snapshot.logoUrl,
      period: snapshot.period,
      reportDate: this.formatDate(snapshot.reportDate),
      holdingStockCount: snapshot.holdingStockCount,
      holdingValue: this.toNumber(snapshot.holdingValue),
      tradeProportion: this.toNumber(snapshot.tradeProportion),
      topTenPercent: this.toNumber(snapshot.topTenPercent),
      topIncreaseCode: snapshot.topIncreaseCode,
      topIncreaseName: snapshot.topIncreaseName,
      topDecreaseCode: snapshot.topDecreaseCode,
      topDecreaseName: snapshot.topDecreaseName,
      sourceUrl: snapshot.sourceUrl,
      scrapedAt: snapshot.scrapedAt,
    };
  }

  private serializeHolding(item: any) {
    return {
      id: Number(item.id),
      investorType: item.investorType,
      investorName: item.investorName,
      period: item.period,
      sourceReportDate: this.formatDate(item.sourceReportDate),
      stockCode: item.stockCode,
      stockName: item.stockName,
      instrumentCode: item.instrumentCode,
      iconUrl: item.iconUrl,
      industry: item.industry,
      holdingType: item.holdingType,
      tradePrice: this.toNumber(item.tradePrice),
      tradeQuantity: item.tradeQuantity != null ? Number(item.tradeQuantity) : null,
      previousHoldingQuantity: item.previousHoldingQuantity != null ? Number(item.previousHoldingQuantity) : null,
      holdingQuantity: item.holdingQuantity != null ? Number(item.holdingQuantity) : null,
      reportDate: this.formatDate(item.reportDate),
      reportMarketValue: this.toNumber(item.reportMarketValue),
      changeRate: this.toNumber(item.changeRate),
      proportion: this.toNumber(item.proportion),
      latestPrice: this.toNumber(item.latestPrice),
      latestMarketValue: this.toNumber(item.latestMarketValue),
      sourceUrl: item.sourceUrl,
      scrapedAt: item.scrapedAt,
    };
  }

  private serializeTrade(item: any) {
    return {
      id: Number(item.id),
      investorType: item.investorType,
      investorName: item.investorName,
      period: item.period,
      sourceReportDate: this.formatDate(item.sourceReportDate),
      stockCode: item.stockCode,
      stockName: item.stockName,
      instrumentCode: item.instrumentCode,
      iconUrl: item.iconUrl,
      industry: item.industry,
      holdingType: item.holdingType,
      tradePrice: this.toNumber(item.tradePrice),
      tradeQuantity: item.tradeQuantity != null ? Number(item.tradeQuantity) : null,
      holdingQuantity: item.holdingQuantity != null ? Number(item.holdingQuantity) : null,
      reportDate: this.formatDate(item.reportDate),
      reportMarketValue: this.toNumber(item.reportMarketValue),
      changeRate: this.toNumber(item.changeRate),
      proportion: this.toNumber(item.proportion),
      latestPrice: this.toNumber(item.latestPrice),
      sourceUrl: item.sourceUrl,
      scrapedAt: item.scrapedAt,
      lastSeenAt: item.lastSeenAt,
    };
  }

  private toNumber(value: unknown): number | null {
    if (value == null) {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private resolveLatestPrice(item: TradingKeyHolding): number | null {
    const explicitLatestPrice = this.toNumber(item.latestPrice);
    if (explicitLatestPrice != null && explicitLatestPrice > 0) {
      return explicitLatestPrice;
    }

    const tradePrice = this.toNumber(item.tradePrice);
    if (tradePrice != null && tradePrice > 0) {
      return tradePrice;
    }

    const reportMarketValue = this.toNumber(item.tradeValue);
    const holdingQuantity = this.toNumber(item.holdingQuantity);
    if (
      reportMarketValue != null &&
      reportMarketValue > 0 &&
      holdingQuantity != null &&
      holdingQuantity > 0
    ) {
      return Number((reportMarketValue / holdingQuantity).toFixed(4));
    }

    return null;
  }

  private formatDate(value?: Date | null): string | null {
    return value ? value.toISOString().slice(0, 10) : null;
  }
}
