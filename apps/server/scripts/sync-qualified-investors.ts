/**
 * 基于 company_top_flow_holders 表同步符合新定义的牛散到 investors 表
 *
 * 牛散新定义（三个条件同时满足）：
 * 1. 在至少一只股票上，出现过 3 个及以上不同的报告期（jzrq）
 * 2. 个人持股总市值 > NATURAL_PERSON_MIN_MARKET_VALUE（环境变量，默认 7000 万）
 * 3. 持有 3 支及以上不同股票
 *
 * 市值计算：关联 hs_stock_history_trading 表获取最新收盘价，市值 = SUM(cgsl * 最新收盘价)
 *
 * 运行方式：
 *   cd apps/server && pnpm ts-node scripts/sync-qualified-investors.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MIN_MARKET_VALUE = Number(process.env.NATURAL_PERSON_MIN_MARKET_VALUE) || 70_000_000;
const MIN_QUARTERS_IN_ONE_STOCK = 3;
const MIN_STOCK_COUNT = 3;

interface StockPrice {
  code: string;
  closePrice: number;
}

interface PersonStockInfo {
  stockCode: string;
  quarterCount: number;
  latestJzrq: string;
  latestCgsl: number | null;
  latestCgbl: number | null;
}

interface PersonSummary {
  name: string;
  stockCount: number;
  maxQuartersInOneStock: number;
  stocks: PersonStockInfo[];
  totalMarketValue: number;
}

async function main() {
  console.log('=== 同步符合新定义的牛散数据 ===\n');
  console.log(`判定条件：`);
  console.log(`  - 单只股票至少 ${MIN_QUARTERS_IN_ONE_STOCK} 个不同报告期`);
  console.log(`  - 持有至少 ${MIN_STOCK_COUNT} 支不同股票`);
  console.log(`  - 总市值 >= ${MIN_MARKET_VALUE.toLocaleString()} 元\n`);

  const startTime = Date.now();

  try {
    // ==========================================
    // Step 1: 查询所有自然人股东记录
    // ==========================================
    console.log('Step 1: 查询 company_top_flow_holders 中的自然人股东...');

    const records = await prisma.companyTopFlowHolders.findMany({
      where: {
        gdlx: '自然人',
        gdmc: { not: null },
        jzrq: { not: null },
        cgsl: { not: null },
      },
      select: {
        stockCode: true,
        jzrq: true,
        gdmc: true,
        cgsl: true,
        cgbl: true,
      },
    });

    console.log(`   共找到 ${records.length} 条自然人股东记录\n`);

    if (records.length === 0) {
      console.log('没有自然人股东记录，退出');
      return;
    }

    // ==========================================
    // Step 2: 按人名聚合，计算每人持仓统计
    // ==========================================
    console.log('Step 2: 按人名聚合统计...');

    // 按人名 -> 股票代码 -> 记录列表
    const personStockMap = new Map<string, Map<string, any[]>>();

    for (const record of records) {
      const name = record.gdmc as string;
      const stockCode = record.stockCode;
      const jzrq = record.jzrq as string;

      if (!personStockMap.has(name)) {
        personStockMap.set(name, new Map());
      }
      const stockMap = personStockMap.get(name)!;

      if (!stockMap.has(stockCode)) {
        stockMap.set(stockCode, []);
      }
      stockMap.get(stockCode)!.push(record);
    }

    // 计算每人统计
    const summaries: PersonSummary[] = [];

    for (const [name, stockMap] of personStockMap.entries()) {
      const stocks: PersonStockInfo[] = [];
      let maxQuartersInOneStock = 0;

      for (const [stockCode, stockRecords] of stockMap.entries()) {
        // 按 jzrq 去重统计报告期数
        const uniqueQuarters = new Set(stockRecords.map(r => r.jzrq));
        const quarterCount = uniqueQuarters.size;

        if (quarterCount > maxQuartersInOneStock) {
          maxQuartersInOneStock = quarterCount;
        }

        // 取最新报告期的持仓数据
        const sorted = stockRecords.sort((a, b) => (b.jzrq as string).localeCompare(a.jzrq as string));
        const latest = sorted[0];

        stocks.push({
          stockCode,
          quarterCount,
          latestJzrq: latest.jzrq as string,
          latestCgsl: latest.cgsl ? Number(latest.cgsl) : null,
          latestCgbl: latest.cgbl ? Number(latest.cgbl) : null,
        });
      }

      summaries.push({
        name,
        stockCount: stocks.length,
        maxQuartersInOneStock,
        stocks,
        totalMarketValue: 0, // 稍后计算
      });
    }

    console.log(`   共 ${summaries.length} 位自然人股东\n`);

    // ==========================================
    // Step 3: 获取所有相关股票的最新收盘价
    // ==========================================
    console.log('Step 3: 获取股票最新收盘价...');

    const allStockCodes = new Set<string>();
    for (const person of summaries) {
      for (const stock of person.stocks) {
        allStockCodes.add(stock.stockCode);
      }
    }

    console.log(`   共 ${allStockCodes.size} 只不同股票\n`);

    // 批量查询 hs_stock_history_trading 的最新收盘价
    const stockPriceMap = new Map<string, number>();

    // 使用子查询获取每只股票的最新收盘价
    const stockCodeList = Array.from(allStockCodes);

    // 先获取每只股票的最新交易日期范围
    const latestDatesResult = await prisma.$queryRawUnsafe(`
      SELECT dm, MAX(t) as latest_t
      FROM hs_stock_history_trading
      WHERE dm = ANY($1)
      GROUP BY dm
    `, stockCodeList) as Array<{ dm: string; latest_t: string }>;

    if (latestDatesResult.length === 0) {
      console.log('   ⚠️  hs_stock_history_trading 表无数据，尝试使用 stock 表的 currentPrice\n');

      // 降级：使用 stock 表的 currentPrice
      const stocks = await prisma.stock.findMany({
        where: { code: { in: stockCodeList } },
        select: { code: true, currentPrice: true },
      });
      for (const s of stocks) {
        if (s.currentPrice) {
          stockPriceMap.set(s.code, Number(s.currentPrice));
        }
      }
    } else {
      // 批量获取最新收盘价：使用子查询 + 元组比较
      const priceResult = await prisma.$queryRawUnsafe(`
        SELECT dm, c FROM hs_stock_history_trading
        WHERE (dm, t) IN (
          SELECT dm, MAX(t) FROM hs_stock_history_trading
          WHERE dm = ANY($1)
          GROUP BY dm
        )
      `, stockCodeList) as Array<{ dm: string; c: any }>;

      for (const p of priceResult) {
        if (p.c !== null && p.c !== undefined) {
          stockPriceMap.set(p.dm, Number(p.c));
        }
      }
    }

    console.log(`   获取到 ${stockPriceMap.size} 只股票的收盘价\n`);

    // ==========================================
    // Step 4: 计算每人总市值
    // ==========================================
    console.log('Step 4: 计算每人总市值...');

    for (const person of summaries) {
      let totalValue = 0;
      for (const stock of person.stocks) {
        if (stock.latestCgsl !== null) {
          const price = stockPriceMap.get(stock.stockCode) ?? 0;
          totalValue += stock.latestCgsl * price;
        }
      }
      person.totalMarketValue = totalValue;
    }

    // ==========================================
    // Step 5: 应用过滤条件
    // ==========================================
    console.log('Step 5: 应用牛散判定条件...\n');

    const qualified: PersonSummary[] = [];
    const rejected: { person: PersonSummary; reasons: string[] }[] = [];

    for (const person of summaries) {
      const reasons: string[] = [];

      if (person.maxQuartersInOneStock < MIN_QUARTERS_IN_ONE_STOCK) {
        reasons.push(`单只股票最多仅 ${person.maxQuartersInOneStock} 个报告期（需 >= ${MIN_QUARTERS_IN_ONE_STOCK}）`);
      }
      if (person.stockCount < MIN_STOCK_COUNT) {
        reasons.push(`仅持有 ${person.stockCount} 支股票（需 >= ${MIN_STOCK_COUNT}）`);
      }
      if (person.totalMarketValue < MIN_MARKET_VALUE) {
        const mvStr = person.totalMarketValue.toLocaleString();
        reasons.push(`总市值 ${mvStr} 元（需 >= ${MIN_MARKET_VALUE.toLocaleString()}）`);
      }

      if (reasons.length === 0) {
        qualified.push(person);
      } else {
        rejected.push({ person, reasons });
      }
    }

    console.log(`  ... 共 ${summaries.length} 人，仅显示前 30\n`);

    console.log(`📊 判定结果：`);
    console.log(`   ✅ 符合牛散定义：${qualified.length} 人`);
    console.log(`   ❌ 不符合：${rejected.length} 人\n`);

    // 显示合格的牛散
    if (qualified.length > 0) {
      console.log('=== 符合牛散定义的自然人 ===');
      const sorted = [...qualified].sort((a, b) => b.totalMarketValue - a.totalMarketValue);
      for (const p of sorted) {
        console.log(`  ${p.name}: 持股 ${p.stockCount} 支，单股最多 ${p.maxQuartersInOneStock} 个季度，总市值 ${p.totalMarketValue.toLocaleString()} 元`);
      }
      console.log('');
    }

    // 显示部分不合格的（前10名市值最高的）
    if (rejected.length > 0 && rejected.length <= 20) {
      console.log('=== 不符合的自然人（部分）===');
      const topByMv = [...rejected].sort((a, b) => b.person.totalMarketValue - a.person.totalMarketValue).slice(0, 10);
      for (const r of topByMv) {
        console.log(`  ${r.person.name}: 持股 ${r.person.stockCount} 支，单股最多 ${r.person.maxQuartersInOneStock} 个季度，总市值 ${r.person.totalMarketValue.toLocaleString()} 元`);
        for (const reason of r.reasons) {
          console.log(`    ⚠️ ${reason}`);
        }
      }
      console.log('');
    }

    // ==========================================
    // Step 6: 同步到 investors 表
    // ==========================================
    console.log('Step 6: 同步到 investors 表...');

    let created = 0;
    let updated = 0;

    // 先获取现有的所有 investors 名称映射
    const existingInvestors = await prisma.investor.findMany({
      select: { id: true, name: true },
    });
    const existingNameMap = new Map<string, bigint>();
    for (const inv of existingInvestors) {
      existingNameMap.set(inv.name, inv.id);
    }

    for (const person of qualified) {
      const existingId = existingNameMap.get(person.name);

      if (existingId !== undefined) {
        // 更新
        await prisma.investor.update({
          where: { id: existingId },
          data: {
            totalMarketValue: person.totalMarketValue,
            stockCount: person.stockCount,
          },
        });
        updated++;
      } else {
        // 创建
        await prisma.investor.create({
          data: {
            name: person.name,
            totalMarketValue: person.totalMarketValue,
            stockCount: person.stockCount,
            isTracked: true,
          },
        });
        created++;
      }
    }

    console.log(`   创建: ${created} 人，更新: ${updated} 人\n`);

    // ==========================================
    // Step 7: 同步持仓到 holdings 表
    // ==========================================
    console.log('Step 7: 同步持仓到 holdings 表...');

    // 获取所有股票信息（stockCode -> stockName 映射）
    const stockInfoResult = await prisma.stock.findMany({
      where: { code: { in: Array.from(allStockCodes) } },
      select: { code: true, name: true },
    });
    const stockNameMap = new Map<string, string>();
    for (const s of stockInfoResult) {
      stockNameMap.set(s.code, s.name);
    }

    let holdingsUpserted = 0;

    for (const person of qualified) {
      const investor = await prisma.investor.findFirst({
        where: { name: person.name },
      });
      if (!investor) continue;

      for (const stock of person.stocks) {
        if (stock.latestCgsl === null) continue;

        const stockName = stockNameMap.get(stock.stockCode) ?? stock.stockCode;
        const reportDate = new Date(stock.latestJzrq);

        try {
          await prisma.$executeRawUnsafe(`
            INSERT INTO holdings ("investorId", "stockCode", "stockName", "holdCount", "holdRatio", "reportDate", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT ("investorId", "stockCode", "reportDate")
            DO UPDATE SET "holdCount" = EXCLUDED."holdCount", "holdRatio" = EXCLUDED."holdRatio", "updatedAt" = NOW()
          `,
            investor.id,
            stock.stockCode,
            stockName,
            BigInt(stock.latestCgsl),
            stock.latestCgbl,
            reportDate,
          );
          holdingsUpserted++;
        } catch (e) {
          // 忽略冲突等错误
        }
      }
    }

    console.log(`   同步持仓记录: ${holdingsUpserted} 条\n`);

    // ==========================================
    // Step 8: 清理不再符合定义的 investors
    // ==========================================
    console.log('Step 8: 清理不再符合定义的 investors...');

    const qualifiedNames = new Set(qualified.map(p => p.name));
    const allInvestors = await prisma.investor.findMany({
      select: { id: true, name: true },
    });

    let deleted = 0;
    for (const inv of allInvestors) {
      if (!qualifiedNames.has(inv.name)) {
        // 删除不再符合定义的牛散（及其持仓）
        await prisma.holding.deleteMany({
          where: { investorId: inv.id },
        });
        await prisma.investor.delete({
          where: { id: inv.id },
        });
        deleted++;
      }
    }

    console.log(`   清理: ${deleted} 人\n`);

    // ==========================================
    // 汇总
    // ==========================================
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('=== 同步完成 ===');
    console.log(`  符合定义: ${qualified.length} 人`);
    console.log(`  不符合: ${rejected.length} 人`);
    console.log(`  创建: ${created}，更新: ${updated}，清理: ${deleted}`);
    console.log(`  持仓记录: ${holdingsUpserted} 条`);
    console.log(`  总耗时: ${elapsed}秒`);

  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
