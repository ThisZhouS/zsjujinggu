import { Injectable } from '@nestjs/common';
import { BusinessDataSlot, Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

interface PaywallViewer {
  id?: number;
  role?: string;
  vipExpiresAt?: number | string | null;
}

export interface PaywallFeature {
  featureKey: string;
  title: string;
  description: string;
  requiredPlan: 'USER';
  status: 'ACTIVE' | 'RESERVED';
  dataScope: string;
  previewLimit: number;
  fullLimit: number;
  apiPath: string;
}

export interface PaywallFeatureView extends PaywallFeature {
  canAccess: boolean;
  reason: string | null;
}

export interface PaywallPreviewItem {
  rank: number;
  label: string;
  metric: string;
  masked: boolean;
  investorId?: number;
  name?: string;
  category?: 'personal' | 'institution';
  totalMarketValue?: number;
  stockCount?: number;
  latestReportDate?: string | null;
  topHoldings?: Array<{
    stockCode: string;
    stockName: string;
    marketValue: number;
    holdCount: number;
    reportDate: string;
  }>;
  stockCode?: string;
  stockName?: string;
  holdCount?: number;
  currentPrice?: number | null;
  holdingMarketValue?: number;
}

interface FeatureRankingRow {
  investorId: bigint | number | string;
  name: string;
  category: string;
  totalMarketValue: Prisma.Decimal | number | string | null;
  stockCount: number | string | null;
  latestReportDate: Date | string | null;
}

interface FeatureHoldingRow {
  investorId: bigint | number | string;
  stockCode: string;
  stockName: string;
  holdCount: bigint | number | string;
  reportDate: Date | string;
  marketValue: Prisma.Decimal | number | string;
  rowNo: number | string;
}

@Injectable()
export class PaywallService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly features: PaywallFeature[] = [
    {
      featureKey: 'top-personal-investors-50',
      title: '前 50 牛散数据墙',
      description: '按最新业务持仓市值生成前 50 牛散排名，展示持仓数、最新报告期和核心持仓。',
      requiredPlan: 'USER',
      status: 'ACTIVE',
      dataScope: 'personal-investor-ranking',
      previewLimit: 10,
      fullLimit: 50,
      apiPath: '/api/v1/paywall/features/top-personal-investors-50',
    },
    {
      featureKey: 'top-personal-investors-100',
      title: '前 100 牛散数据墙',
      description: '按最新业务持仓市值生成前 100 牛散排名，适配 Tetegu 数据墙浏览方式。',
      requiredPlan: 'USER',
      status: 'ACTIVE',
      dataScope: 'personal-investor-ranking',
      previewLimit: 10,
      fullLimit: 100,
      apiPath: '/api/v1/paywall/features/top-personal-investors-100',
    },
    {
      featureKey: 'top-institution-holders-100',
      title: '前 100 机构持仓数据墙',
      description: '按最新业务持仓市值生成前 100 机构持仓主体排名，并展示核心持仓。',
      requiredPlan: 'USER',
      status: 'ACTIVE',
      dataScope: 'institution-holder-ranking',
      previewLimit: 10,
      fullLimit: 100,
      apiPath: '/api/v1/paywall/features/top-institution-holders-100',
    },
    {
      featureKey: 'single-stock-personal-investors-100',
      title: '牛散单支持股 Top100',
      description: '筛选仅持有单只股票的牛散主体，按持仓市值从高到低排序。',
      requiredPlan: 'USER',
      status: 'ACTIVE',
      dataScope: 'single-stock-personal-ranking',
      previewLimit: 10,
      fullLimit: 100,
      apiPath: '/api/v1/paywall/features/single-stock-personal-investors-100',
    },
    {
      featureKey: 'single-stock-institution-holders-100',
      title: '机构单支持股 Top100',
      description: '筛选仅持有单只股票的机构主体，按持仓市值从高到低排序。',
      requiredPlan: 'USER',
      status: 'ACTIVE',
      dataScope: 'single-stock-institution-ranking',
      previewLimit: 10,
      fullLimit: 100,
      apiPath: '/api/v1/paywall/features/single-stock-institution-holders-100',
    },
  ];

  private async getFreshViewer(user?: PaywallViewer | null): Promise<PaywallViewer | null> {
    if (!user?.id) {
      return null;
    }

    const freshUser = await this.prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      select: {
        id: true,
        role: true,
        vipExpiresAt: true,
      },
    });

    return freshUser
      ? {
          id: Number(freshUser.id),
          role: freshUser.role,
          vipExpiresAt: freshUser.vipExpiresAt ? Number(freshUser.vipExpiresAt) : null,
        }
      : null;
  }

  private hasLoginAccessFromFreshViewer(freshUser?: PaywallViewer | null): boolean {
    return Boolean(freshUser?.id);
  }

  private toFeatureView(feature: PaywallFeature, freshUser?: PaywallViewer | null): PaywallFeatureView {
    const canAccess = this.hasLoginAccessFromFreshViewer(freshUser);
    return {
      ...feature,
      canAccess,
      reason: canAccess ? null : 'LOGIN_REQUIRED',
    };
  }

  async getFeatures(user?: PaywallViewer | null): Promise<PaywallFeatureView[]> {
    const freshUser = await this.getFreshViewer(user);
    return this.features.map((feature) => this.toFeatureView(feature, freshUser));
  }

  async getFeature(featureKey: string, user?: PaywallViewer | null): Promise<PaywallFeatureView | null> {
    const feature = this.features.find((item) => item.featureKey === featureKey);
    const freshUser = await this.getFreshViewer(user);
    return feature ? this.toFeatureView(feature, freshUser) : null;
  }

  private async getActiveDataSlot(): Promise<BusinessDataSlot> {
    const state = await this.prisma.businessDataSourceState.findUnique({
      where: { id: 1 },
      select: { activeSlot: true },
    });

    return state?.activeSlot ?? 'PRIMARY';
  }

  private resolveCategory(featureKey: string): 'personal' | 'institution' | null {
    if (featureKey.startsWith('top-personal-investors') || featureKey.startsWith('single-stock-personal')) {
      return 'personal';
    }

    if (featureKey === 'top-institution-holders-100' || featureKey.startsWith('single-stock-institution')) {
      return 'institution';
    }

    return null;
  }

  private isSingleStockFeature(featureKey: string): boolean {
    return featureKey.startsWith('single-stock-');
  }

  private formatDateValue(value: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  }

  private normalizeStockCode(stockCode: string): string {
    return stockCode.trim().toUpperCase().split('.')[0];
  }

  private normalizeInstitutionAlias(name: string): string {
    return name
      .toUpperCase()
      .replace(/[（）]/g, (char) => (char === '（' ? '(' : ')'))
      .replace(/\s+/g, '')
      .replace(/[·•・]/g, '')
      .trim();
  }

  private formatMarketValue(value: number): string {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(2)}亿`;
    }

    if (value >= 10000) {
      return `${(value / 10000).toFixed(2)}万`;
    }

    return value.toFixed(2);
  }

  private mergeInstitutionAliasRows(
    category: 'personal' | 'institution',
    rows: FeatureRankingRow[],
    limit: number,
  ): FeatureRankingRow[] {
    if (category !== 'institution') {
      return rows.slice(0, limit);
    }

    const merged = new Map<string, FeatureRankingRow>();
    for (const row of rows) {
      const key = this.normalizeInstitutionAlias(row.name);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, row);
        continue;
      }

      const rowValue = Number(row.totalMarketValue) || 0;
      const existingValue = Number(existing.totalMarketValue) || 0;
      const rowDate = this.formatDateValue(row.latestReportDate) ?? '';
      const existingDate = this.formatDateValue(existing.latestReportDate) ?? '';
      if (rowValue > existingValue || (rowValue === existingValue && rowDate > existingDate)) {
        merged.set(key, row);
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => {
        const valueDiff = (Number(b.totalMarketValue) || 0) - (Number(a.totalMarketValue) || 0);
        if (valueDiff !== 0) return valueDiff;
        return (Number(b.stockCount) || 0) - (Number(a.stockCount) || 0);
      })
      .slice(0, limit);
  }

  private maskPreviewItems(feature: PaywallFeatureView, list: PaywallPreviewItem[]): PaywallPreviewItem[] {
    if (feature.canAccess) {
      return list;
    }

    return list.map((item, index) => {
      if (index < 3) {
        return item;
      }

      const entityName = item.category === 'institution' ? '机构' : '牛散';
      return {
        rank: item.rank,
        label: `${entityName} #${item.rank}（登录可见）`,
        metric: '登录可见',
        masked: true,
        category: item.category,
        latestReportDate: item.latestReportDate,
        topHoldings: [],
      };
    });
  }

  private async getRankingRows(feature: PaywallFeatureView): Promise<PaywallPreviewItem[]> {
    const category = this.resolveCategory(feature.featureKey);
    if (!category) {
      return [];
    }

    const activeSlot = await this.getActiveDataSlot();
    const limit = feature.canAccess ? feature.fullLimit : feature.previewLimit;
    const singleStockOnly = this.isSingleStockFeature(feature.featureKey);
    const queryLimit = category === 'institution' ? limit * 3 : limit;
    const rawRankingRows = await this.prisma.$queryRaw<FeatureRankingRow[]>(Prisma.sql`
      SELECT
        i.id AS "investorId",
        i.name AS "name",
        i.category AS "category",
        COALESCE(i."totalMarketValue", 0) AS "totalMarketValue",
        COALESCE(i."stockCount", 0) AS "stockCount",
        MAX(h."reportDate") AS "latestReportDate"
      FROM investors i
      LEFT JOIN holdings h
        ON h."investorId" = i.id
       AND h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
      WHERE i."isTracked" = true
        AND i.category = ${category}
        AND (${singleStockOnly} = false OR COALESCE(i."stockCount", 0) = 1)
        AND COALESCE(i."totalMarketValue", 0) > 0
      GROUP BY i.id
      ORDER BY COALESCE(i."totalMarketValue", 0) DESC, COALESCE(i."stockCount", 0) DESC, i.name ASC
      LIMIT ${queryLimit}
    `);
    const rankingRows = this.mergeInstitutionAliasRows(category, rawRankingRows, limit);

    if (rankingRows.length === 0) {
      return [];
    }

    const investorIds = rankingRows.map((row) => BigInt(row.investorId));
    const holdingRows = await this.prisma.$queryRaw<FeatureHoldingRow[]>(Prisma.sql`
      WITH latest_holdings AS (
        SELECT
          h."investorId" AS "investorId",
          h."stockCode" AS "stockCode",
          h."stockName" AS "stockName",
          h."holdCount" AS "holdCount",
          h."reportDate" AS "reportDate",
          (COALESCE(s."currentPrice", 0)::numeric * h."holdCount"::numeric) AS "marketValue",
          ROW_NUMBER() OVER (
            PARTITION BY h."investorId", SPLIT_PART(UPPER(h."stockCode"), '.', 1)
            ORDER BY h."reportDate" DESC, h.id DESC
          ) AS "latestNo"
        FROM holdings h
        LEFT JOIN stocks s
          ON SPLIT_PART(UPPER(s.code), '.', 1) = SPLIT_PART(UPPER(h."stockCode"), '.', 1)
        WHERE h."dataSlot" = ${activeSlot}::"BusinessDataSlot"
          AND h."investorId" IN (${Prisma.join(investorIds)})
      ),
      ranked_holdings AS (
        SELECT
          "investorId",
          "stockCode",
          "stockName",
          "holdCount",
          "reportDate",
          "marketValue",
          ROW_NUMBER() OVER (
            PARTITION BY "investorId"
            ORDER BY "marketValue" DESC,
              "holdCount" DESC,
              "reportDate" DESC
          ) AS "rowNo"
        FROM latest_holdings
        WHERE "latestNo" = 1
      )
      SELECT *
      FROM ranked_holdings
      WHERE "rowNo" <= 3
      ORDER BY "investorId" ASC, "rowNo" ASC
    `);

    const holdingsByInvestor = new Map<string, PaywallPreviewItem['topHoldings']>();
    for (const row of holdingRows) {
      const key = row.investorId.toString();
      if (!holdingsByInvestor.has(key)) {
        holdingsByInvestor.set(key, []);
      }

      holdingsByInvestor.get(key)!.push({
        stockCode: this.normalizeStockCode(row.stockCode),
        stockName: row.stockName,
        marketValue: Number(row.marketValue) || 0,
        holdCount: Number(row.holdCount) || 0,
        reportDate: this.formatDateValue(row.reportDate) ?? '',
      });
    }

    return rankingRows.map((row, index) => {
      const rank = index + 1;
      const totalMarketValue = Number(row.totalMarketValue) || 0;
      const topHoldings = holdingsByInvestor.get(row.investorId.toString()) ?? [];
      const primaryHolding = singleStockOnly ? topHoldings[0] : null;

      return {
        rank,
        label: row.name,
        metric: this.formatMarketValue(totalMarketValue),
        masked: false,
        investorId: Number(row.investorId),
        name: row.name,
        category: category,
        totalMarketValue,
        stockCount: Number(row.stockCount) || 0,
        latestReportDate: this.formatDateValue(row.latestReportDate),
        topHoldings,
        stockCode: primaryHolding?.stockCode,
        stockName: primaryHolding?.stockName,
        holdCount: primaryHolding?.holdCount,
        currentPrice: null,
        holdingMarketValue: primaryHolding?.marketValue,
      };
    });
  }

  async getPreview(featureKey: string, user?: PaywallViewer | null): Promise<{
    feature: PaywallFeatureView | null;
    list: PaywallPreviewItem[];
  }> {
    const feature = await this.getFeature(featureKey, user);
    if (!feature) {
      return {
        feature: null,
        list: [],
      };
    }

    const list = this.maskPreviewItems(feature, await this.getRankingRows(feature));

    return {
      feature,
      list,
    };
  }
}
