/**
 * 从 stock_list 表同步所有股票到 stock 表
 * stock_list 已有 5200 只股票，stock 表只有少量种子数据
 *
 * 运行方式：
 *   cd apps/server && pnpm ts-node scripts/sync-stock-from-list.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 从 stock_list 同步股票到 stock 表 ===\n');

  const startTime = Date.now();

  try {
    // 获取 stock_list 中所有股票
    const stockList = await prisma.$queryRawUnsafe(`
      SELECT dm, mc FROM stock_list
    `) as Array<{ dm: string; mc: string | null }>;

    console.log(`stock_list 共有 ${stockList.length} 只股票`);

    // 获取 stock 表中已存在的股票
    const existing = await prisma.stock.findMany({
      select: { code: true },
    });
    const existingCodes = new Set(existing.map(s => s.code));

    console.log(`stock 表已有 ${existingCodes.size} 只股票\n`);

    let created = 0;
    let skipped = 0;
    const batchSize = 500;

    // 批量插入
    for (let i = 0; i < stockList.length; i += batchSize) {
      const batch = stockList.slice(i, i + batchSize);
      const toInsert = batch.filter(s => !existingCodes.has(s.dm));

      if (toInsert.length === 0) {
        skipped += batch.length;
        continue;
      }

      const data = toInsert.map(s => ({
        code: s.dm,
        name: s.mc || s.dm,
        market: 'A' as const,
      }));

      try {
        await prisma.stock.createMany({
          data,
          skipDuplicates: true,
        });
        created += data.length;
        skipped += batch.length - data.length;
      } catch (e) {
        // 忽略冲突
        skipped += batch.length;
      }

      if ((i / batchSize + 1) % 5 === 0 || i + batchSize >= stockList.length) {
        console.log(`  进度：${Math.min(i + batchSize, stockList.length)}/${stockList.length}，创建: ${created}，跳过: ${skipped}`);
      }
    }

    const totalStocks = await prisma.stock.count();
    console.log(`\n=== 同步完成 ===`);
    console.log(`  创建: ${created}`);
    console.log(`  跳过: ${skipped}`);
    console.log(`  stock 表总数: ${totalStocks}`);
    console.log(`  总耗时: ${((Date.now() - startTime) / 1000).toFixed(2)}秒`);

  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
