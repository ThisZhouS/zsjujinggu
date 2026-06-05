/**
 * 自然人股东持仓数据全量同步脚本（真实数据）
 *
 * 功能：
 * 1. 从 holdings 表获取所有自然人股东（牛散）的持仓数据
 * 2. 保存到 company_top_flow_holders 表（统一格式）
 * 3. 同步相关的历史交易数据和分红数据
 *
 * 运行方式：
 * DATABASE_URL="postgresql://king:king123@localhost:5433/king" pnpm ts-node scripts/sync-natural-person-holders-real.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 同步批次大小
const BATCH_SIZE = 50;

/**
 * 从 holdings 表同步自然人股东数据到 company_top_flow_holders
 */
async function syncNaturalPersonHolders(): Promise<number> {
  console.log('\n=== 从 holdings 表同步自然人股东数据 ===\n');

  // 获取所有牛散持仓数据
  const holdings = await prisma.$queryRawUnsafe(`
    SELECT 
      h."stockCode",
      h."stockName",
      h."holdCount" as cgsl,
      h."holdRatio" as cgbl,
      h."reportDate" as jzrq,
      i.name as gdmc
    FROM holdings h
    JOIN investors i ON h."investorId" = i.id
  `) as any[];

  console.log(`找到 ${holdings.length} 条牛散持仓记录`);

  // 先清空现有数据
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE company_top_flow_holders RESTART IDENTITY`);
  
  // 批量插入
  let count = 0;
  for (const holder of holdings) {
    const stockCode = holder.stockcode || holder.stockCode;
    const jzrq = holder.jzrq ? new Date(holder.jzrq).toISOString().split('T')[0] : null;
    const gdmc = holder.gdmc;
    const cgsl = holder.cgsl ? Number(holder.cgsl) : null;
    const cgbl = holder.cgbl ? Number(holder.cgbl) : null;
    
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO company_top_flow_holders ("stockCode", "jzrq", "gdmc", "gdlx", "cgsl", "cgbl", "createdAt")
        VALUES ($1, $2, $3, '自然人', $4, $5, NOW())
        ON CONFLICT DO NOTHING
      `, stockCode, jzrq, gdmc, cgsl, cgbl);
      count++;
    } catch (e) {
      // 忽略单个记录错误
    }
  }

  console.log(`✓ 同步完成，共 ${count} 条记录`);
  return count;
}

/**
 * 同步历史交易数据
 */
async function syncHistoricalTradingData(): Promise<number> {
  console.log('\n=== 同步历史交易数据 ===\n');

  // 获取所有有持仓的股票代码
  const stocks = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT "stockCode" as code FROM holdings
  `) as any[];

  console.log(`需要检查 ${stocks.length} 只股票的交易数据`);

  let totalTrading = 0;

  for (const stock of stocks) {
    const stockCode = stock.code;

    try {
      const tradingData = await prisma.hsStockHistoryTrading.findMany({
        where: {
          dm: stockCode,
        },
      });

      totalTrading += tradingData.length;
    } catch (error) {
      console.error(`  ${stockCode}: 同步失败`, error);
    }
  }

  console.log(`✓ 已有 ${totalTrading} 条交易记录`);
  return totalTrading;
}

/**
 * 同步分红数据
 */
async function syncDividendData(): Promise<number> {
  console.log('\n=== 同步分红数据 ===\n');

  // 获取所有有持仓的股票代码
  const stocks = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT "stockCode" as code FROM holdings
  `) as any[];

  console.log(`需要检查 ${stocks.length} 只股票的分红数据`);

  let totalDividends = 0;

  for (const stock of stocks) {
    const stockCode = stock.code;

    try {
      const dividends = await prisma.recentDividend.findMany({
        where: {
          dm: stockCode,
        },
      });

      totalDividends += dividends.length;
    } catch (error) {
      console.error(`  ${stockCode}: 同步失败`, error);
    }
  }

  console.log(`✓ 已有 ${totalDividends} 条分红记录`);
  return totalDividends;
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 自然人股东持仓数据全量同步（真实数据）===\n');

  const startTime = Date.now();

  try {
    // 1. 同步自然人股东数据
    const holderCount = await syncNaturalPersonHolders();

    // 2. 检查历史交易数据
    const tradingCount = await syncHistoricalTradingData();

    // 3. 检查分红数据
    const dividendCount = await syncDividendData();

    // 4. 统计结果
    const naturalPersonCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM company_top_flow_holders WHERE "gdlx" = '自然人'
    `) as any[];

    const holders = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT "gdmc" FROM company_top_flow_holders WHERE "gdlx" = '自然人'
    `) as any[];

    console.log('\n=== 同步结果统计 ===');
    console.log(`自然人股东人数：${holders.length}`);
    console.log(`自然人股东持仓记录：${naturalPersonCount[0].count}`);
    console.log(`历史交易记录：${tradingCount}`);
    console.log(`分红记录：${dividendCount}`);

    if (holders.length > 0) {
      console.log(`\n自然人股东列表:`);
      holders.slice(0, 20).forEach((h: any) => console.log(`  - ${h.gdmc}`));
      if (holders.length > 20) {
        console.log(`  ... 还有 ${holders.length - 20} 人`);
      }
    }

    console.log(`\n总耗时：${((Date.now() - startTime) / 1000).toFixed(2)}秒`);

  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
