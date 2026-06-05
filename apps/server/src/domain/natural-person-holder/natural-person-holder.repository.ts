/**
 * Natural Person Holder Repository - 自然人股东持仓数据访问层
 * 负责从 company_top_flow_holders、hs_stock_history_trading、recent_dividend 表查询原始数据
 */

import { Injectable } from '@nestjs/common';
import { BusinessDataSlot } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import {
  buildTrackedInvestorWhere,
  buildTrackedPersonalInvestorWhere,
  InvestorCategory,
  isLikelyPersonalInvestorName,
} from '@/common/utils/investor-name-filter';

export interface RawHolderData {
  dm: string;
  ggrq: string | null;
  jzrq: string | null;
  gdmc: string | null;
  gdlx: string | null;
  cgsl: number | null;
  bdyy: string | null;
  cgbl: number | null;
  gfxz: string | null;
  cgpm: string | null;
}

export interface TradingData {
  dm: string;
  t: string;
  model: string;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
  a: number | null;
  pc: number | null;
  sf: number | null;
}

export interface DividendData {
  dm: string;
  jzrq: string;
  plrq: string;
  fhx: string | null;
  fhjyr: string | null;
  fhjzr: string | null;
  hf: string | null;
  hfjyr: string | null;
  hfjzr: string | null;
  zf: string | null;
  zfjyr: string | null;
  zfjzr: string | null;
}

export interface HoldingSnapshotData {
  stockCode: string;
  stockName: string;
  reportDate: string;
  holdCount: number;
  holdRatio: number | null;
}

export interface ShareholderSummary {
  shareholderName: string;
  stockCount: number;
  latestReportDate: string;
  totalMarketValue: number;
}

export interface LatestShareholderHoldingByStock {
  shareholderName: string;
  stockCode: string;
  stockName: string;
  reportDate: string;
  holdCount: number;
  holdRatio: number | null;
  currentPrice: number | null;
  marketValue: number;
}

export interface TrackedInvestorSnapshot {
  investorId: number;
  name: string;
  totalMarketValue: number;
  stockCount: number;
}

@Injectable()
export class NaturalPersonHolderRepository {
  constructor(private prisma: PrismaService) {}

  private async getActiveDataSlot(): Promise<BusinessDataSlot> {
    const state = await this.prisma.businessDataSourceState.findUnique({
      where: { id: 1 },
      select: { activeSlot: true },
    });

    return state?.activeSlot ?? 'PRIMARY';
  }

  private normalizeDate(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^\d{8}$/.test(trimmed)) {
      return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
    }

    if (trimmed.includes(' ')) {
      return trimmed.split(' ')[0];
    }

    if (trimmed.includes('T')) {
      return trimmed.split('T')[0];
    }

    return trimmed;
  }

  /**
   * 查询自然人股东持仓数据（按股东名称和股票代码分组）
   */
  async findNaturalPersonHolders(options?: {
    shareholderName?: string;
    stockCode?: string;
    category?: InvestorCategory;
  }): Promise<RawHolderData[]> {
    const { shareholderName, stockCode, category } = options || {};

    const where: any = {};

    if (category === 'personal') {
      where.gdlx = '自然人';
    } else if (category === 'institution') {
      where.NOT = {
        gdlx: '自然人',
      };
    }

    if (shareholderName) {
      where.gdmc = shareholderName;
    }

    if (stockCode) {
      where.stockCode = { in: this.getCodeCandidates(stockCode) };
    }

    const data = await this.prisma.companyTopFlowHolders.findMany({
      where,
      orderBy: [
        { gdmc: 'asc' },
        { stockCode: 'asc' },
        { jzrq: 'asc' },
      ],
    });

    return data.map((row) => ({
      dm: row.stockCode,
      ggrq: this.normalizeDate(row.ggrq),
      jzrq: this.normalizeDate(row.jzrq),
      gdmc: row.gdmc,
      gdlx: row.gdlx,
      cgsl: row.cgsl ? Number(row.cgsl) : null,
      bdyy: row.bdyy,
      cgbl: row.cgbl ? Number(row.cgbl) : null,
      gfxz: row.gfxz,
      cgpm: row.cgpm,
    }));
  }

  /**
   * Normalize stock code by removing exchange suffix (.SZ, .SH, etc.)
   * to match the format in hs_stock_history_trading.dm
   */
  private normalizeCode(code: string): string {
    return code.trim().toUpperCase().split('.')[0];
  }

  /**
   * Add exchange suffix if missing, to match trading data that stores full codes.
   */
  private addSuffix(code: string): string {
    if (code.includes('.')) return code;
    if (
      code.startsWith('43') ||
      code.startsWith('83') ||
      code.startsWith('87') ||
      code.startsWith('92')
    ) {
      return `${code}.BJ`;
    }
    if (code.startsWith('6') || code.startsWith('9') || code.startsWith('688')) return `${code}.SH`;
    return `${code}.SZ`;
  }

  private getCodeCandidates(code: string): string[] {
    const normalizedCode = this.normalizeCode(code);
    return Array.from(new Set([code, normalizedCode, this.addSuffix(normalizedCode)]));
  }

  /**
   * 查询历史交易数据（用于价格匹配）
   * 兼容带后缀和不带后缀的 dm 格式
   */
  async findTradingData(options: {
    stockCode: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TradingData[]> {
    const { stockCode, startDate, endDate } = options;
    const normalizedCode = this.normalizeCode(stockCode);
    const fullCode = this.addSuffix(normalizedCode);

    const where: any = {
      dm: { in: [normalizedCode, fullCode] },
      model: 'n',
    };

    if (startDate) {
      where.t = { gte: startDate };
    }

    if (endDate) {
      where.t = { ...where.t, lte: endDate };
    }

    const data = await this.prisma.hsStockHistoryTrading.findMany({
      where,
      orderBy: { t: 'asc' },
    });

    // 去重：同一日期可能有两份数据（带后缀和不带后缀）
    const seen = new Map<string, typeof data[0]>();
    for (const row of data) {
      const date = row.t;
      if (!seen.has(date) || (row.c && !seen.get(date)!.c)) {
        seen.set(date, row);
      }
    }
    const deduped = Array.from(seen.values()).sort((a, b) => {
      const dateA = typeof a.t === 'string' ? a.t : String(a.t);
      const dateB = typeof b.t === 'string' ? b.t : String(b.t);
      return dateA.localeCompare(dateB);
    });

    return deduped.map((row) => ({
      dm: row.dm,
      t: row.t.includes(' ') ? row.t.split(' ')[0] : row.t,
      model: row.model,
      o: row.o ? Number(row.o) : null,
      h: row.h ? Number(row.h) : null,
      l: row.l ? Number(row.l) : null,
      c: row.c ? Number(row.c) : null,
      v: row.v ? Number(row.v) : null,
      a: row.a ? Number(row.a) : null,
      pc: row.pc ? Number(row.pc) : null,
      sf: row.sf,
    }));
  }

  /**
   * 查询分红数据（已去重）
   */
  async findDividends(options?: {
    stockCode?: string;
  }): Promise<DividendData[]> {
    const { stockCode } = options || {};

    const where: any = {};
    if (stockCode) {
      where.dm = { in: this.getCodeCandidates(stockCode) };
    }

    const data = await this.prisma.recentDividend.findMany({
      where,
      orderBy: { jzrq: 'desc' },
    });

    // 去重：按 dm+jzrq+fhx 去重
    const seen = new Set<string>();
    const uniqueData: typeof data = [];
    for (const row of data) {
      const key = `${row.dm}|${row.jzrq}|${row.fhx}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueData.push(row);
      }
    }

    return uniqueData.map((row) => ({
      dm: row.dm,
      jzrq: this.normalizeDate(row.jzrq) ?? row.jzrq,
      plrq: this.normalizeDate(row.plrq) ?? row.plrq,
      fhx: row.fhx,
      fhjyr: this.normalizeDate(row.fhjyr),
      fhjzr: this.normalizeDate(row.fhjzr),
      hf: row.hf,
      hfjyr: this.normalizeDate(row.hfjyr),
      hfjzr: this.normalizeDate(row.hfjzr),
      zf: row.zf,
      zfjyr: this.normalizeDate(row.zfjyr),
      zfjzr: this.normalizeDate(row.zfjzr),
    }));
  }

  /**
   * 查询业务持仓快照（用作原始十大流通股东为空时的回退来源）
   */
  async findHoldingSnapshotsByShareholderName(
    shareholderName: string,
  ): Promise<HoldingSnapshotData[]> {
    const activeSlot = await this.getActiveDataSlot();
    const rows = await this.prisma.holding.findMany({
      where: {
        dataSlot: activeSlot,
        investor: {
          name: shareholderName,
          ...buildTrackedInvestorWhere(),
        },
      },
      select: {
        stockCode: true,
        stockName: true,
        holdCount: true,
        holdRatio: true,
        reportDate: true,
      },
      orderBy: [{ stockCode: 'asc' }, { reportDate: 'asc' }],
    });

    return rows.map((row) => ({
      stockCode: row.stockCode,
      stockName: row.stockName,
      reportDate: row.reportDate.toISOString().slice(0, 10),
      holdCount: Number(row.holdCount),
      holdRatio: row.holdRatio ? Number(row.holdRatio) : null,
    }));
  }

  async findLatestShareholderHoldingsByStockCodes(
    stockCodes: string[],
  ): Promise<LatestShareholderHoldingByStock[]> {
    if (stockCodes.length === 0) {
      return [];
    }

    const normalizedStockCodes = Array.from(
      new Set(
        stockCodes
          .map((stockCode) => this.normalizeCode(stockCode))
          .filter(Boolean),
      ),
    );
    const codeCandidates = Array.from(
      new Set(
        normalizedStockCodes.flatMap((stockCode) => [
          stockCode,
          this.addSuffix(stockCode),
        ]),
      ),
    );

    const rows = await this.prisma.companyTopFlowHolders.findMany({
      where: {
        gdlx: '自然人',
        gdmc: { not: null },
        stockCode: { in: codeCandidates },
        jzrq: { not: null },
        cgsl: { not: null, gt: 0 },
      },
      select: {
        stockCode: true,
        gdmc: true,
        cgsl: true,
        cgbl: true,
        jzrq: true,
        createdAt: true,
      },
      orderBy: [
        { gdmc: 'asc' },
        { stockCode: 'asc' },
        { jzrq: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const latestByKey = new Map<string, (typeof rows)[number] & { normalizedStockCode: string }>();
    for (const row of rows) {
      const shareholderName = row.gdmc?.trim();
      if (!shareholderName || !isLikelyPersonalInvestorName(shareholderName)) {
        continue;
      }

      const normalizedStockCode = this.normalizeCode(row.stockCode);
      const key = `${shareholderName}::${normalizedStockCode}`;
      if (!latestByKey.has(key)) {
        latestByKey.set(key, {
          ...row,
          normalizedStockCode,
        });
      }
    }

    const [stocks, latestPrices] = await Promise.all([
      this.prisma.stock.findMany({
        where: {
          code: { in: normalizedStockCodes },
        },
        select: {
          code: true,
          name: true,
          currentPrice: true,
        },
      }),
      this.prisma.hsStockHistoryTrading.findMany({
        where: {
          dm: { in: codeCandidates },
          model: 'n',
          c: { not: null },
        },
        orderBy: [{ dm: 'asc' }, { t: 'desc' }],
        select: {
          dm: true,
          c: true,
        },
      }),
    ]);

    const stockMap = new Map(
      stocks.map((stock) => [
        this.normalizeCode(stock.code),
        {
          stockName: stock.name,
          currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
        },
      ]),
    );

    const latestPriceMap = new Map<string, number>();
    for (const row of latestPrices) {
      const normalizedStockCode = this.normalizeCode(row.dm);
      if (!latestPriceMap.has(normalizedStockCode) && row.c !== null) {
        latestPriceMap.set(normalizedStockCode, Number(row.c));
      }
    }

    return Array.from(latestByKey.values()).map((row) => {
      const stock = stockMap.get(row.normalizedStockCode);
      const currentPrice = stock?.currentPrice ?? latestPriceMap.get(row.normalizedStockCode) ?? null;
      const holdCount = row.cgsl ? Number(row.cgsl) : 0;

      return {
        shareholderName: row.gdmc!.trim(),
        stockCode: row.normalizedStockCode,
        stockName: stock?.stockName ?? row.normalizedStockCode,
        reportDate: this.normalizeDate(row.jzrq) ?? row.jzrq!,
        holdCount,
        holdRatio: row.cgbl ? Number(row.cgbl) : null,
        currentPrice,
        marketValue: currentPrice != null ? holdCount * currentPrice : 0,
      };
    });
  }

  async findTrackedInvestorSnapshotsByNames(
    names: string[],
    category: InvestorCategory = 'personal',
  ): Promise<Map<string, TrackedInvestorSnapshot>> {
    if (names.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.investor.findMany({
      where: {
        ...buildTrackedInvestorWhere(category),
        name: { in: names },
      },
      select: {
        id: true,
        name: true,
        totalMarketValue: true,
        stockCount: true,
      },
    });

    return new Map(
      rows.map((row) => [
        row.name,
        {
          investorId: Number(row.id),
          name: row.name,
          totalMarketValue: row.totalMarketValue ? Number(row.totalMarketValue) : 0,
          stockCount: Number(row.stockCount ?? 0),
        },
      ]),
    );
  }

  /**
   * 获取所有报告日期（用于补全时间序列）
   */
  async getAllReportDates(): Promise<string[]> {
    const result = await this.prisma.companyTopFlowHolders.groupBy({
      by: ['jzrq'],
      where: {
        jzrq: { not: null },
      },
      orderBy: {
        jzrq: 'asc',
      },
    });

    return Array.from(
      new Set(
        result
          .map((row) => this.normalizeDate(row.jzrq))
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }

  /**
   * 获取股票信息
   */
  async getStockInfo(stockCode: string): Promise<{ name: string; industry: string | null } | null> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        code: {
          in: this.getCodeCandidates(stockCode),
        },
      },
      select: { name: true, industry: true },
    });

    return stocks[0] ?? null;
  }

  /**
   * 获取最新股价
   */
  async getLatestPrice(stockCode: string): Promise<number | null> {
    const normalizedCode = this.normalizeCode(stockCode);
    const fullCode = this.addSuffix(normalizedCode);
    const latest = await this.prisma.hsStockHistoryTrading.findFirst({
      where: {
        dm: { in: [normalizedCode, fullCode] },
        model: 'n',
        c: { not: null },
      },
      orderBy: { t: 'desc' },
      select: { c: true },
    });

    return latest?.c !== null && latest?.c !== undefined ? Number(latest.c) : null;
  }

  /**
   * 获取所有自然人股东的持仓市值汇总
   * 按 gdmc 分组，用最新收盘价计算总市值
   */
  async getShareholderMarketValueSummary(): Promise<Map<string, { stockCount: number; latestReportDate: string; totalMarketValue: number; stockLatestPrice: Map<string, number> }>> {
    // 1. 获取所有自然人股东的最新持仓记录（按 jzrq 最新的）
    const holders = await this.prisma.companyTopFlowHolders.findMany({
      where: {
        gdlx: '自然人',
        gdmc: { not: null },
        stockCode: { not: null },
        jzrq: { not: null },
      },
      select: {
        gdmc: true,
        stockCode: true,
        jzrq: true,
        cgsl: true,
      },
    });

    // 2. 按股东名称分组，取每个股东的最新报告期持仓
    const groupedByName = new Map<string, Map<string, { jzrq: string; cgsl: number }>>();
    for (const h of holders) {
      const name = h.gdmc!;
      const code = h.stockCode!;
      if (!groupedByName.has(name)) {
        groupedByName.set(name, new Map());
      }
      const stockMap = groupedByName.get(name)!;
      const existing = stockMap.get(code);
      if (!existing || h.jzrq > existing.jzrq) {
        stockMap.set(code, { jzrq: h.jzrq!, cgsl: h.cgsl ? Number(h.cgsl) : 0 });
      }
    }

    // 3. 收集所有股票代码
    const allStockCodes = new Set<string>();
    for (const stockMap of groupedByName.values()) {
      for (const code of stockMap.keys()) {
        allStockCodes.add(code);
      }
    }

    // 4. 批量获取每只股票的最新收盘价
    const priceMap = new Map<string, number>();
    for (const code of allStockCodes) {
      const normalized = this.normalizeCode(code);
      const full = this.addSuffix(normalized);
      const latest = await this.prisma.hsStockHistoryTrading.findFirst({
        where: { dm: { in: [normalized, full] } },
        orderBy: { t: 'desc' },
        select: { c: true },
      });
      if (latest?.c) {
        priceMap.set(code, Number(latest.c));
      }
    }

    // 5. 计算每个股东的总市值
    const summary = new Map<string, { stockCount: number; latestReportDate: string; totalMarketValue: number; stockLatestPrice: Map<string, number> }>();
    for (const [name, stockMap] of groupedByName.entries()) {
      let totalMarketValue = 0;
      let latestReportDate = '';
      const stockLatestPrice = new Map<string, number>();

      for (const [code, data] of stockMap.entries()) {
        const price = priceMap.get(code) ?? 0;
        totalMarketValue += data.cgsl * price;
        stockLatestPrice.set(code, price);
        if (data.jzrq > latestReportDate) {
          latestReportDate = data.jzrq;
        }
      }

      summary.set(name, {
        stockCount: stockMap.size,
        latestReportDate,
        totalMarketValue,
        stockLatestPrice,
      });
    }

    return summary;
  }
}
