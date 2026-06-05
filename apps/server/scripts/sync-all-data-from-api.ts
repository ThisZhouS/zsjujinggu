/**
 * 从 Mairui API 全量同步数据
 * 1. 同步股票列表
 * 2. 同步历史交易数据
 * 3. 同步分红数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.MAIRUI_API_KEY;

async function syncStockList() {
  console.log('\n=== 同步股票列表 ===\n');
  
  if (!API_KEY || API_KEY === 'your-mairui-api-key') {
    console.log('未配置 MAIRUI_API_KEY');
    return 0;
  }
  
  try {
    const response = await fetch('https://mairuiapi.com/api/stock/list', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
    });
    
    if (!response.ok) {
      console.log(`API 请求失败：${response.status}`);
      return 0;
    }
    
    const result = await response.json();
    if (!result.data || result.data.length === 0) {
      console.log('API 返回数据为空');
      return 0;
    }
    
    let count = 0;
    for (const stock of result.data) {
      try {
        await prisma.stock.upsert({
          where: { code: stock.dm },
          update: {
            name: stock.mc || stock.jc,
            market: stock.jys || 'A',
          },
          create: {
            code: stock.dm,
            name: stock.mc || stock.jc,
            market: stock.jys || 'A',
          },
        });
        count++;
      } catch (e) {
        // 忽略
      }
    }
    
    console.log(`✓ 同步股票列表完成，新增/更新 ${count} 只股票`);
    return count;
  } catch (error) {
    console.error('同步股票列表失败:', error);
    return 0;
  }
}

async function syncTradingData() {
  console.log('\n=== 同步历史交易数据 ===\n');
  
  if (!API_KEY || API_KEY === 'your-mairui-api-key') {
    console.log('未配置 MAIRUI_API_KEY');
    return 0;
  }
  
  // 获取所有有持仓的股票
  const stocks = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT "stockCode" FROM holdings
  `) as any[];
  
  console.log(`需要同步 ${stocks.length} 只股票的交易数据`);
  
  let total = 0;
  let success = 0;
  
  for (const stock of stocks) {
    const stockCode = stock.stockcode || stock.stockCode;
    
    try {
      const url = `https://mairuiapi.com/api/stock/history-trading?dm=${stockCode}&start=2024-01-01&end=2024-12-31&model=n`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
      
      if (!response.ok) {
        console.log(`  ${stockCode}: 请求失败 ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      if (!result.data || result.data.length === 0) {
        console.log(`  ${stockCode}: 无数据`);
        continue;
      }
      
      // 插入数据
      for (const item of result.data) {
        try {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "hs_stock_history_trading" ("dm", "t", "model", "o", "h", "l", "c", "v", "a", "pc", "sf", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            ON CONFLICT ("dm", "t", "model") DO UPDATE SET
              "o" = EXCLUDED."o",
              "h" = EXCLUDED."h",
              "l" = EXCLUDED."l",
              "c" = EXCLUDED."c",
              "v" = EXCLUDED."v",
              "a" = EXCLUDED."a",
              "pc" = EXCLUDED."pc",
              "sf" = EXCLUDED."sf"
          `, 
            stockCode,
            item.t || item.date,
            'n',
            item.o ? Number(item.o) : null,
            item.h ? Number(item.h) : null,
            item.l ? Number(item.l) : null,
            item.c ? Number(item.c) : null,
            item.v ? BigInt(item.v) : null,
            item.a ? Number(item.a) : null,
            item.pc ? Number(item.pc) : null,
            item.sf || null
          );
          total++;
        } catch (e) {
          // 忽略
        }
      }
      
      success++;
      console.log(`  ${stockCode}: 同步 ${result.data.length} 条记录`);
      
      // 避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`  ${stockCode}: 同步失败`, error);
    }
  }
  
  console.log(`\n✓ 成功同步 ${success}/${stocks.length} 只股票，共 ${total} 条交易记录`);
  return total;
}

async function syncDividendData() {
  console.log('\n=== 同步分红数据 ===\n');
  
  if (!API_KEY || API_KEY === 'your-mairui-api-key') {
    console.log('未配置 MAIRUI_API_KEY');
    return 0;
  }
  
  // 获取所有有持仓的股票
  const stocks = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT "stockCode" FROM holdings
  `) as any[];
  
  console.log(`需要同步 ${stocks.length} 只股票的分红数据`);
  
  let total = 0;
  let success = 0;
  
  for (const stock of stocks) {
    const stockCode = stock.stockcode || stock.stockCode;
    
    try {
      const url = `https://mairuiapi.com/api/stock/dividend?dm=${stockCode}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
      
      if (!response.ok) {
        console.log(`  ${stockCode}: 请求失败 ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      if (!result.data || result.data.length === 0) {
        console.log(`  ${stockCode}: 无数据`);
        continue;
      }
      
      // 插入数据
      for (const item of result.data) {
        try {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "recent_dividend" ("dm", "jzrq", "plrq", "fhx", "fhjyr", "fhjzr", "hf", "hfjyr", "hfjzr", "zf", "zfjyr", "zfjzr", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            ON CONFLICT ("dm", "jzrq") DO UPDATE SET
              "plrq" = EXCLUDED."plrq",
              "fhx" = EXCLUDED."fhx",
              "fhjyr" = EXCLUDED."fhjyr",
              "fhjzr" = EXCLUDED."fhjzr",
              "hf" = EXCLUDED."hf",
              "hfjyr" = EXCLUDED."hfjyr",
              "hfjzr" = EXCLUDED."hfjzr",
              "zf" = EXCLUDED."zf",
              "zfjyr" = EXCLUDED."zfjyr",
              "zfjzr" = EXCLUDED."zfjzr"
          `,
            stockCode,
            item.jzrq || null,
            item.plrq || null,
            item.fhx || null,
            item.fhjyr || null,
            item.fhjzr || null,
            item.hf || null,
            item.hfjyr || null,
            item.hfjzr || null,
            item.zf || null,
            item.zfjyr || null,
            item.zfjzr || null
          );
          total++;
        } catch (e) {
          // 忽略
        }
      }
      
      success++;
      console.log(`  ${stockCode}: 同步 ${result.data.length} 条分红记录`);
      
      // 避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`  ${stockCode}: 同步失败`, error);
    }
  }
  
  console.log(`\n✓ 成功同步 ${success}/${stocks.length} 只股票，共 ${total} 条分红记录`);
  return total;
}

async function main() {
  console.log('=== 从 Mairui API 全量同步数据 ===');
  console.log(`API Key: ${API_KEY ? '已配置' : '未配置'}\n`);
  
  const startTime = Date.now();
  
  try {
    await syncStockList();
    await syncTradingData();
    await syncDividendData();
    
    console.log('\n=== 同步完成 ===');
    console.log(`总耗时：${((Date.now() - startTime) / 1000).toFixed(2)}秒`);
    
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
