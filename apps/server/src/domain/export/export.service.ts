/**
 * Export Service - 数据导出业务逻辑层
 * 支持导出牛散持仓、涨幅榜、股息率等数据为 CSV
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { BusinessDataSlot } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { DividendRepository } from '@/domain/dividend/dividend.repository';

export type ExportType = 'investor-holdings' | 'top-gainers' | 'dividend-yield' | 'executive-increase';

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private dividendRepository: DividendRepository,
  ) {}

  private async getActiveDataSlot(): Promise<BusinessDataSlot> {
    const state = await this.prisma.businessDataSourceState.findUnique({
      where: { id: 1 },
      select: { activeSlot: true },
    });

    return state?.activeSlot ?? 'PRIMARY';
  }

  /**
   * 导出数据为 CSV 格式
   */
  async exportData(type: ExportType, params?: any): Promise<{ filename: string; content: string }> {
    switch (type) {
      case 'investor-holdings':
        return this.exportInvestorHoldings(params?.investorId);
      case 'top-gainers':
        return this.exportTopGainers(params?.period);
      case 'dividend-yield':
        return this.exportDividendYield(params?.year);
      case 'executive-increase':
        return this.exportExecutiveIncrease();
      default:
        throw new BadRequestException('不支持的导出类型');
    }
  }

  /**
   * 导出牛散持仓
   */
  private async exportInvestorHoldings(investorId?: number): Promise<{ filename: string; content: string }> {
    const activeSlot = await this.getActiveDataSlot();
    const where = {
      ...(investorId ? { investorId: BigInt(investorId) } : {}),
      dataSlot: activeSlot,
    };
    const holdings = await this.prisma.holding.findMany({
      where,
      include: {
        investor: true,
      },
      orderBy: { holdCount: 'desc' },
      take: 1000,
    });

    const headers = '牛散姓名,股票代码,股票名称,持股数,持仓比例,报告日期\n';
    const rows = holdings.map((h) =>
      `${h.investor.name},${h.stockCode},${h.stockName},${h.holdCount},${h.holdRatio ?? ''},${h.reportDate.toISOString().split('T')[0]}`
    ).join('\n');

    return {
      filename: `investor-holdings-${new Date().toISOString().split('T')[0]}.csv`,
      content: '\uFEFF' + headers + rows, // BOM for Excel UTF-8
    };
  }

  /**
   * 导出涨幅榜
   */
  private async exportTopGainers(period?: string): Promise<{ filename: string; content: string }> {
    const stocks = await this.prisma.stock.findMany({
      where: {
        currentPrice: { not: null },
      },
      orderBy: { currentPrice: 'desc' },
      take: 100,
    });

    const headers = '股票代码,股票名称,当前价格,行业\n';
    const rows = stocks.map((s) =>
      `${s.code},${s.name},${s.currentPrice ?? ''},${s.industry ?? ''}`
    ).join('\n');

    return {
      filename: `top-gainers-${period ?? 'today'}-${new Date().toISOString().split('T')[0]}.csv`,
      content: '\uFEFF' + headers + rows,
    };
  }

  /**
   * 导出股息率排行
   */
  private async exportDividendYield(year?: number): Promise<{ filename: string; content: string }> {
    const result = await this.dividendRepository.getDividendYieldRanking({
      page: 1,
      pageSize: 100,
      year,
      mode: 'annual',
    });

    const headers = '股票代码,股票名称,统计区间,当前价格,每股股息,分红总额,股息率\n';
    const rows = result.list.map((d) =>
      `${d.stockCode},${d.stockName},${d.periodLabel},${d.currentPrice ?? ''},${d.dividendPerShare ?? ''},${d.totalDividend ?? ''},${d.dividendYield ?? ''}`
    ).join('\n');

    return {
      filename: `dividend-yield-${year ?? 'all'}-${new Date().toISOString().split('T')[0]}.csv`,
      content: '\uFEFF' + headers + rows,
    };
  }

  /**
   * 导出高管增持
   */
  private async exportExecutiveIncrease(): Promise<{ filename: string; content: string }> {
    const activeSlot = await this.getActiveDataSlot();
    const trades = await this.prisma.executiveTrade.findMany({
      where: {
        tradeType: 'INCREASE',
        dataSlot: activeSlot,
      },
      orderBy: { tradeAmount: 'desc' },
      take: 100,
    });

    const headers = '股票代码,股票名称,高管姓名,职务,增持数量,增持金额,交易日期\n';
    const rows = trades.map((t) =>
      `${t.stockCode},${t.stockName},${t.executiveName},${t.executivePosition},${t.tradeCount},${t.tradeAmount ?? ''},${t.tradeDate.toISOString().split('T')[0]}`
    ).join('\n');

    return {
      filename: `executive-increase-${new Date().toISOString().split('T')[0]}.csv`,
      content: '\uFEFF' + headers + rows,
    };
  }
}
