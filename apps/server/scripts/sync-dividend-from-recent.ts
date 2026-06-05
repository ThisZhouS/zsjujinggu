/**
 * 从 recent_dividend 表解析并同步数据到 dividends 表
 *
 * recent_dividend 表包含原始分红数据（fhx: "每 10 股派 X 元"）
 * dividends 表需要解析后的数据（cashDividend, dividendYield）
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * 从分红方案字符串解析每股分红金额
 * 例如："每 10 股派 5 元" -> 0.5（每股 0.5 元）
 */
function parseCashDividend(fhx: string | null): number | null {
  if (!fhx) return null;

  // 匹配 "每 10 股派 X 元" 或 "每 10 股派 X.XX 元"
  // 使用更宽松的正则表达式，允许前后有空格或其他字符
  const match = fhx.match(/每\s*10\s*股派\s*([0-9.]+)\s*元/);
  if (match && match[1]) {
    const per10Shares = parseFloat(match[1]);
    return per10Shares / 10; // 转换为每股分红
  }

  // 尝试另一种格式："10 派 X 元"
  const match2 = fhx.match(/10\s*派\s*([0-9.]+)\s*元/);
  if (match2 && match2[1]) {
    const per10Shares = parseFloat(match2[1]);
    return per10Shares / 10;
  }

  return null;
}

/**
 * 从方案字符串解析送股数量
 * 例如："每 10 股送 2 股" -> 0.2（每股送 0.2 股）
 */
function parseBonusShare(hf: string | null): number | null {
  if (!hf) return null;

  const match = hf.match(/每 10 股送 ([0-9.]+) 股/);
  if (match && match[1]) {
    const per10Shares = parseFloat(match[1]);
    return per10Shares / 10;
  }

  return null;
}

/**
 * 从方案字符串解析转增数量
 * 例如："每 10 股转 3 股" -> 0.3（每股转 0.3 股）
 */
function parseTransferShare(zf: string | null): number | null {
  if (!zf) return null;

  const match = zf.match(/每 10 股转 ([0-9.]+) 股/);
  if (match && match[1]) {
    const per10Shares = parseFloat(match[1]);
    return per10Shares / 10;
  }

  return null;
}

/**
 * 从除权日获取股票收盘价
 */
async function getPriceOnDate(stockCode: string, date: string): Promise<number | null> {
  try {
    const trading = await prisma.hsStockHistoryTrading.findFirst({
      where: {
        dm: stockCode,
        t: date,
      },
    });

    if (trading && trading.c) {
      return Number(trading.c);
    }

    // 如果当天没有交易数据，查找最近的前一天
    const recentTrading = await prisma.hsStockHistoryTrading.findFirst({
      where: {
        dm: stockCode,
        t: { lt: date },
      },
      orderBy: { t: 'desc' },
    });

    if (recentTrading && recentTrading.c) {
      return Number(recentTrading.c);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 计算股息率
 * 股息率 = 每股分红 / 股价 * 100%
 */
function calculateDividendYield(cashDividend: number, price: number): number {
  if (price <= 0) return 0;
  return (cashDividend / price) * 100;
}

async function main() {
  console.log('=== 从 recent_dividend 同步数据到 dividends 表 ===\n');

  const startTime = Date.now();

  try {
    // 1. 获取所有 recent_dividend 记录
    console.log('1. 读取 recent_dividend 数据...');
    const recentDividends = await prisma.recentDividend.findMany();
    console.log(`   共 ${recentDividends.length} 条记录\n`);

    // 2. 按股票代码分组
    console.log('2. 按股票代码分组...');
    const stockMap = new Map<string, any[]>();
    for (const div of recentDividends) {
      if (!stockMap.has(div.dm)) {
        stockMap.set(div.dm, []);
      }
      stockMap.get(div.dm)!.push(div);
    }
    console.log(`   共 ${stockMap.size} 只股票\n`);

    // 3. 解析并同步到 dividends 表
    console.log('3. 解析并同步数据...');
    let syncedCount = 0;
    let skippedCount = 0;

    for (const [stockCode, dividends] of stockMap.entries()) {
      // 获取股票名称
      const stock = await prisma.stock.findUnique({
        where: { code: stockCode },
        select: { name: true },
      });

      if (!stock) {
        console.log(`   跳过 ${stockCode}: 股票信息不存在`);
        continue;
      }

      for (const div of dividends) {
        const cashDividend = parseCashDividend(div.fhx);

        if (!cashDividend) {
          console.log(`   跳过 ${stockCode} (${div.jzrq}): 无法解析分红方案 "${div.fhx}"`);
          skippedCount++;
          continue;
        }

        // 提取年份（从 jzrq）
        const year = div.jzrq ? parseInt(div.jzrq.split('-')[0], 10) : new Date().getFullYear();

        // 解析除权日
        const dividendDate = div.fhjzr ? new Date(div.fhjzr) : null;

        // 获取除权日股价
        let priceOnExDate: number | null = null;
        let dividendYield: number | null = null;

        if (dividendDate) {
          priceOnExDate = await getPriceOnDate(stockCode, div.fhjzr!);
          if (priceOnExDate && cashDividend) {
            dividendYield = calculateDividendYield(cashDividend, priceOnExDate);
          }
        }

        // 计算总分红金额（需要知道总股本，暂时设为 null）
        const totalDividend = null;

        // 解析送股和转增
        const bonusShare = parseBonusShare(div.hf);
        const transferShare = parseTransferShare(div.zf);

        // Upsert 到 dividends 表
        try {
          await prisma.dividend.upsert({
            where: {
              stockCode_dividendYear_dataSlot: {
                stockCode,
                dividendYear: year,
                dataSlot: 'PRIMARY',
              },
            },
            update: {
              stockName: stock.name,
              dividendDate,
              cashDividend: new Decimal(cashDividend),
              bonusShare: bonusShare ? new Decimal(bonusShare) : null,
              transferShare: transferShare ? new Decimal(transferShare) : null,
              totalDividend,
              dividendYield: dividendYield ? new Decimal(dividendYield) : null,
            },
            create: {
              stockCode,
              stockName: stock.name,
              dividendYear: year,
              dataSlot: 'PRIMARY',
              dividendDate,
              cashDividend: new Decimal(cashDividend),
              bonusShare: bonusShare ? new Decimal(bonusShare) : null,
              transferShare: transferShare ? new Decimal(transferShare) : null,
              totalDividend,
              dividendYield: dividendYield ? new Decimal(dividendYield) : null,
            },
          });
          syncedCount++;
        } catch (e: any) {
          console.error(`   ${stockCode} (${year}) 插入失败：${e.message}`);
        }
      }
    }

    console.log(`\n   ✓ 完成！同步 ${syncedCount} 条记录，跳过 ${skippedCount} 条记录`);

    // 4. 统计结果
    const finalCount = await prisma.dividend.count();
    console.log(`\n=== 最终结果 ===`);
    console.log(`dividends 表：${finalCount} 条记录`);
    console.log(`总耗时：${((Date.now() - startTime) / 1000).toFixed(2)}秒`);

  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
