/**
 * Investor Service - 牛散业务逻辑层
 * 负责业务逻辑、计算、跨 Repository 聚合
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InvestorRepository } from './investor.repository';
import {
  HoldingRepository,
  TrackedHoldingSnapshot,
} from '@/domain/holding/holding.repository';
import { NaturalPersonHolderService } from '@/domain/natural-person-holder/natural-person-holder.service';
import { Investor, Holding } from '@prisma/client';
import { sanitizeCount } from '@/common/utils/data-sanitizer';
import {
  InvestorCategory,
  isLikelyPersonalInvestorName,
} from '@/common/utils/investor-name-filter';

export interface InvestorWithStats extends Omit<Investor, 'id' | 'totalMarketValue' | 'stockCount'> {
  id: number;
  category: InvestorCategory;
  totalMarketValue: number;
  stockCount: number;
}

export interface InvestorDetail {
  id: number;
  name: string;
  category: InvestorCategory;
  avatar: string | null;
  bio: string | null;
  totalMarketValue: number;
  stockCount: number;
  updatedAt: Date;
  pieData?: Array<{ name: string; value: number }>;
  holdings?: HoldingRow[];
  top10Holdings?: HoldingRow[];
  otherHoldings?: HoldingRow;
}

interface HoldingRow {
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdChange: number;
  returnRate: number | null;
  currentPrice: number | null;
  marketValue: number;
  proportion: number;
  reportDate: string;
}

export interface SameSurnameGroupInvestor {
  investorId: number;
  name: string;
  avatar: string | null;
  stockCount: number;
  totalMarketValue: number;
  latestReportDate: string;
}

export interface SameSurnameSharedStock {
  stockCode: string;
  stockName: string;
  investorCount: number;
  investorNames: string[];
  totalMarketValue: number;
}

export interface SameSurnameGroup {
  surname: string;
  memberCount: number;
  totalMarketValue: number;
  uniqueStockCount: number;
  sharedStockCount: number;
  latestReportDate: string;
  investors: SameSurnameGroupInvestor[];
  sharedStocks: SameSurnameSharedStock[];
}

export interface HoldingsHistoryRecord {
  stockCode: string;
  stockName: string;
  reportDate: string;
  holdAmount: number;
  holdChange: number;
  holdRatio: number;
  closePrice: number | null;
  avgCost: number | null;
  totalInvestedCost: number;
  marketValue: number | null;
  unrealizedGain: number | null;
  currentPrice: number | null;
  currentGainRate: number | null;
  profitIfSellAll: number | null;
  isCleared?: boolean;
}

export interface TopFlowTrackingRecord {
  stockCode: string;
  stockName: string;
  firstEntryReportDate: string;
  reportDate: string;
  isInTopFlowHolders: boolean;
  holderRank: string | null;
  announcementDate: string | null;
  holdAmount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  marketValue: number;
  changeReason: string | null;
  shareholderType: string | null;
}

interface SameSurnameInvestorAggregate {
  investorId: number;
  name: string;
  avatar: string | null;
  stockCount: number;
  totalMarketValue: number;
  latestReportDate: string;
  holdings: TrackedHoldingSnapshot[];
}

@Injectable()
export class InvestorService {
  private static readonly SAME_SURNAME_MIN_MARKET_VALUE = 500000000;
  private static readonly COMPOUND_SURNAMES = new Set([
    '欧阳', '太史', '端木', '上官', '司马', '东方', '独孤', '南宫', '万俟', '闻人',
    '夏侯', '诸葛', '尉迟', '公羊', '赫连', '澹台', '皇甫', '宗政', '濮阳', '公冶',
    '太叔', '申屠', '公孙', '慕容', '仲孙', '钟离', '长孙', '宇文', '司徒', '鲜于',
    '司空', '闾丘', '子车', '亓官', '司寇', '巫马', '公西', '颛孙', '壤驷', '公良',
    '漆雕', '乐正', '宰父', '谷梁', '拓跋', '夹谷', '轩辕', '令狐', '段干', '百里',
    '呼延', '东郭', '南门', '羊舌', '微生', '公户', '公玉', '公仪', '梁丘', '公仲',
    '公上', '公门', '公山', '公坚', '左丘', '公伯', '西门', '公祖', '第五', '公乘',
    '贯丘', '公皙', '南荣', '东里', '东宫', '仲长', '子书', '子桑', '即墨', '达奚',
    '褚师',
  ]);

  constructor(
    private investorRepository: InvestorRepository,
    private holdingRepository: HoldingRepository,
    private naturalPersonHolderService: NaturalPersonHolderService,
  ) {}

  private isLikelyPersonalName(name: string): boolean {
    return isLikelyPersonalInvestorName(name);
  }

  private extractSurname(name: string): string {
    const normalized = name.trim();
    const compoundSurname = normalized.slice(0, 2);
    if (InvestorService.COMPOUND_SURNAMES.has(compoundSurname)) {
      return compoundSurname;
    }

    return normalized.slice(0, 1);
  }

  /**
   * 获取牛散列表
   */
  async getList(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    category?: InvestorCategory;
    includeUntracked?: boolean;
  }): Promise<{ list: InvestorWithStats[]; total: number }> {
    const [list, total] = await Promise.all([
      this.investorRepository.findMany(options),
      this.investorRepository.count(
        options.keyword,
        options.includeUntracked,
        options.category,
      ),
    ]);

    return {
      list: list.map((investor) => ({
        ...investor,
        id: Number(investor.id),
        category: investor.category as InvestorCategory,
        totalMarketValue: Number(investor.totalMarketValue ?? 0),
        stockCount: sanitizeCount(investor.stockCount),
      })),
      total,
    };
  }

  async getSameSurnameGroups(options: {
    page: number;
    pageSize: number;
    keyword?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<{ list: SameSurnameGroup[]; total: number }> {
    const { page, pageSize, keyword } = options;
    const sortBy = options.sortBy ?? 'surname';
    const sortDirection = options.order ?? (sortBy === 'surname' ? 'asc' : 'desc');
    const investors = await this.investorRepository.findTrackedInvestorsForSurnameDiscovery();
    const groupedBySurname = new Map<string, SameSurnameInvestorAggregate[]>();
    for (const investor of investors) {
      if (!this.isLikelyPersonalName(investor.name)) {
        continue;
      }
      if (investor.totalMarketValue < InvestorService.SAME_SURNAME_MIN_MARKET_VALUE) {
        continue;
      }

      const surname = this.extractSurname(investor.name);
      if (!groupedBySurname.has(surname)) {
        groupedBySurname.set(surname, []);
      }
      groupedBySurname.get(surname)!.push({
        investorId: investor.id,
        name: investor.name,
        avatar: investor.avatar,
        stockCount: investor.stockCount,
        totalMarketValue: investor.totalMarketValue,
        latestReportDate: '',
        holdings: [],
      });
    }

    const normalizedKeyword = keyword?.trim().toLowerCase();
    const groupedSummaries = Array.from(groupedBySurname.entries())
      .filter(([, investors]) => investors.length >= 2)
      .map(([surname, sameSurnameInvestors]) => {
        const keywordMatched =
          !normalizedKeyword ||
          surname.toLowerCase().includes(normalizedKeyword) ||
          sameSurnameInvestors.some((investor) =>
            investor.name.toLowerCase().includes(normalizedKeyword),
          );

        return keywordMatched
          ? {
          surname,
            investors: sameSurnameInvestors.sort(
              (a, b) => b.totalMarketValue - a.totalMarketValue,
            ),
            memberCount: sameSurnameInvestors.length,
            totalMarketValue: sameSurnameInvestors.reduce(
              (sum, investor) => sum + investor.totalMarketValue,
              0,
            ),
          }
          : null;
      })
      .filter(
        (
          group,
        ): group is {
          surname: string;
          investors: SameSurnameInvestorAggregate[];
          memberCount: number;
          totalMarketValue: number;
        } => Boolean(group),
      )
      .sort((a, b) => {
        const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
        if (sortBy === 'totalMarketValue') {
          const marketValueDiff = a.totalMarketValue - b.totalMarketValue;
          if (marketValueDiff !== 0) {
            return marketValueDiff * directionMultiplier;
          }
        } else if (sortBy === 'memberCount') {
          const memberCountDiff = a.memberCount - b.memberCount;
          if (memberCountDiff !== 0) {
            return memberCountDiff * directionMultiplier;
          }
        } else {
          const surnameCompare = a.surname.localeCompare(b.surname, 'zh-CN');
          if (surnameCompare !== 0) {
            return surnameCompare * directionMultiplier;
          }
        }

        if (b.memberCount !== a.memberCount) {
          return b.memberCount - a.memberCount;
        }

        if (b.totalMarketValue !== a.totalMarketValue) {
          return b.totalMarketValue - a.totalMarketValue;
        }

        return a.surname.localeCompare(b.surname, 'zh-CN');
      });

    const skip = (page - 1) * pageSize;
    const pagedSummaries = groupedSummaries.slice(skip, skip + pageSize);
    const targetInvestorIds = pagedSummaries.flatMap((group) =>
      group.investors.map((investor) => investor.investorId),
    );
    const holdings = await this.holdingRepository.findLatestTrackedHoldingsByInvestorIds(
      targetInvestorIds,
    );

    const holdingsByInvestorId = new Map<number, TrackedHoldingSnapshot[]>();
    for (const holding of holdings) {
      const existing = holdingsByInvestorId.get(holding.investorId) ?? [];
      existing.push(holding);
      holdingsByInvestorId.set(holding.investorId, existing);
    }

    const list = pagedSummaries.map<SameSurnameGroup>((group) => {
      const sharedStockMap = new Map<
        string,
        {
          stockCode: string;
          stockName: string;
          totalMarketValue: number;
          investorNames: string[];
        }
      >();
      let latestReportDate = '';

      const investorsWithHoldings = group.investors.map((investor) => {
        const latestInvestorHoldings = holdingsByInvestorId.get(investor.investorId) ?? [];
        let investorLatestReportDate = '';

        for (const holding of latestInvestorHoldings) {
          if (holding.reportDate > investorLatestReportDate) {
            investorLatestReportDate = holding.reportDate;
          }

          const existingStock = sharedStockMap.get(holding.stockCode);
          if (!existingStock) {
            sharedStockMap.set(holding.stockCode, {
              stockCode: holding.stockCode,
              stockName: holding.stockName,
              totalMarketValue: holding.marketValue,
              investorNames: [investor.name],
            });
            continue;
          }

          existingStock.totalMarketValue += holding.marketValue;
          existingStock.investorNames.push(investor.name);
        }

        if (investorLatestReportDate > latestReportDate) {
          latestReportDate = investorLatestReportDate;
        }

        return {
          investorId: investor.investorId,
          name: investor.name,
          avatar: investor.avatar,
          stockCount: investor.stockCount,
          totalMarketValue: investor.totalMarketValue,
          latestReportDate: investorLatestReportDate,
        };
      });

      const sharedStocks = Array.from(sharedStockMap.values())
        .filter((stock) => stock.investorNames.length >= 2)
        .map<SameSurnameSharedStock>((stock) => ({
          stockCode: stock.stockCode,
          stockName: stock.stockName,
          investorCount: stock.investorNames.length,
          investorNames: stock.investorNames,
          totalMarketValue: stock.totalMarketValue,
        }))
        .sort((a, b) => {
          if (b.investorCount !== a.investorCount) {
            return b.investorCount - a.investorCount;
          }
          return b.totalMarketValue - a.totalMarketValue;
        });

      return {
        surname: group.surname,
        memberCount: group.memberCount,
        totalMarketValue: group.totalMarketValue,
        uniqueStockCount: sharedStockMap.size,
        sharedStockCount: sharedStocks.length,
        latestReportDate,
        investors: investorsWithHoldings,
        sharedStocks: sharedStocks.slice(0, 8),
      };
    });

    return {
      list,
      total: groupedSummaries.length,
    };
  }

  /**
   * 获取牛散详情
   * 数据权限已降级为登录用户可访问；默认返回完整持仓明细。
   */
  async getDetail(id: number, includeHoldings: boolean = true): Promise<InvestorDetail> {
    const investor = await this.investorRepository.findById(id);
    if (!investor) {
      throw new NotFoundException(`股东不存在`);
    }

    const baseDetail: InvestorDetail = {
      id: Number(investor.id),
      name: investor.name,
      category: investor.category as InvestorCategory,
      avatar: investor.avatar,
      bio: investor.bio,
      totalMarketValue: Number(investor.totalMarketValue ?? 0),
      stockCount: sanitizeCount(investor.stockCount),
      updatedAt: investor.updatedAt,
    };

    if (!includeHoldings) {
      return baseDetail;
    }

    const holdings = await this.holdingRepository.findByInvestorId(id);

    // 获取股票现价数据
    const stockCodes = holdings.map(h => h.stockCode);
    const stocks = await this.investorRepository.findStocksByCodes(stockCodes);
    const stockPriceMap = new Map(stocks.map(s => [s.code, Number(s.currentPrice ?? 0)]));

    const totalValue = holdings.reduce((sum, h) => {
      const marketValue = stockPriceMap.get(h.stockCode) * Number(h.holdCount ?? 0);
      return sum + marketValue;
    }, 0);

    const holdingRows: HoldingRow[] = holdings.map((h) => {
      const currentPrice = stockPriceMap.get(h.stockCode) ?? 0;
      const marketValue = currentPrice * Number(h.holdCount ?? 0);
      const proportion = totalValue > 0 ? (marketValue / totalValue) * 100 : 0;

      return {
        stockCode: h.stockCode,
        stockName: h.stockName ?? '',
        holdCount: sanitizeCount(h.holdCount),
        holdChange: 0,
        returnRate: null,
        currentPrice,
        marketValue,
        proportion,
        reportDate: h.reportDate.toISOString().slice(0, 10),
      };
    });

    // Top 10 + 其他
    const top10 = holdingRows.slice(0, 10);
    const otherRows = holdingRows.slice(10);

    const otherHoldings =
      otherRows.length > 0
        ? {
            stockCode: 'OTHER',
            stockName: '其他',
            holdCount: otherRows.reduce((sum, r) => sum + r.holdCount, 0),
            holdChange: 0,
            returnRate: null,
            currentPrice: null,
            marketValue: otherRows.reduce((sum, r) => sum + r.marketValue, 0),
            proportion: otherRows.reduce((sum, r) => sum + r.proportion, 0),
            reportDate: top10[0]?.reportDate ?? '',
          }
        : undefined;

    // 生成饼图数据（Top 10 + 其他）
    const pieData = [
      ...top10.map(h => ({ name: h.stockName, value: h.marketValue })),
      ...(otherHoldings ? [{ name: '其他', value: otherHoldings.marketValue }] : []),
    ].filter(d => d.value > 0);

    return {
      ...baseDetail,
      pieData,
      holdings: holdingRows,
      top10Holdings: top10,
      otherHoldings,
    };
  }

  /**
   * 获取牛散的持股历史记录（含成本、收益计算）
   * 基于牛散名称从 company_top_flow_holders 表查询原始持仓数据，
   * 使用加权平均成本算法计算每只股票的成本投入和盈利
   */
  async getHoldingsHistory(id: number): Promise<HoldingsHistoryRecord[]> {
    const investor = await this.investorRepository.findById(id);
    if (!investor) {
      throw new NotFoundException(`股东不存在`);
    }

    const result = await this.naturalPersonHolderService.getHoldingsHistory(investor.name);

    return result.holdings.map(h => ({
      stockCode: h.stockCode,
      stockName: h.stockName,
      reportDate: h.reportDate,
      holdAmount: h.holdAmount,
      holdChange: h.holdChange,
      holdRatio: h.holdRatio,
      closePrice: h.closePricePeriod,
      avgCost: h.avgCostPerShare,
      totalInvestedCost: h.totalInvestedCost,
      marketValue: h.marketValue,
      unrealizedGain: h.unrealizedGain,
      currentPrice: h.currentPrice,
      currentGainRate: h.currentGainRate,
      profitIfSellAll: h.profitIfSellAll,
      isCleared: h.isCleared,
    }));
  }

  async getTopFlowTracking(id: number, stockCode?: string): Promise<TopFlowTrackingRecord[]> {
    const investor = await this.investorRepository.findById(id);
    if (!investor) {
      throw new NotFoundException(`股东不存在`);
    }

    const result = await this.naturalPersonHolderService.getTopFlowTracking(
      investor.name,
      stockCode,
    );

    return result.tracking;
  }

  /**
   * 创建牛散
   */
  async create(data: {
    name: string;
    avatar?: string;
    bio?: string;
    isTracked?: boolean;
  }): Promise<Investor> {
    // 检查名称是否重复
    const existing = await this.investorRepository.findByName(data.name);
    if (existing) {
      throw new ConflictException(`牛散"${data.name}"已存在`);
    }

    return this.investorRepository.create(data);
  }

  /**
   * 更新牛散
   */
  async update(id: number, data: Partial<Investor>): Promise<Investor> {
    // 检查是否存在
    const existing = await this.investorRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`股东不存在`);
    }

    // 如果更新名称，检查新名称是否与其他牛散重复
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.investorRepository.findByName(data.name);
      if (duplicate && Number(duplicate.id) !== id) {
        throw new ConflictException(`牛散"${data.name}"已存在`);
      }
    }

    return this.investorRepository.update(id, data);
  }

  /**
   * 删除牛散
   */
  async delete(id: number): Promise<void> {
    const existing = await this.investorRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`牛散不存在`);
    }

    await this.investorRepository.delete(id);
  }

  /**
   * 同步牛散数据（用于定时任务）
   * 计算所有牛散的总市值和持仓数量
   */
  async syncAllInvestorsData(): Promise<void> {
    const investors = await this.investorRepository.findAllActive();

    const updates = await Promise.all(
      investors.map(async (investor) => {
        const holdings = await this.holdingRepository.findByInvestorId(Number(investor.id));

        // Holding 表没有 currentPrice 字段，需要另外获取
        const totalMarketValue = 0; // 暂时设为 0
        const stockCount = sanitizeCount(holdings.length);

        return {
          id: Number(investor.id),
          totalMarketValue,
          stockCount,
        };
      }),
    );

    await this.investorRepository.updateMarketValue(updates);
  }
}
