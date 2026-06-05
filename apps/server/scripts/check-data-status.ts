/**
 * 检查数据库表数据状态
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('\n=== stock_list 数据样例 ===');
  const data = await prisma.$queryRawUnsafe('SELECT * FROM stock_list LIMIT 5') as any[];
  console.table(data);
  
  console.log('\n=== stocks 数据样例 ===');
  const stocks = await prisma.$queryRawUnsafe('SELECT * FROM stocks LIMIT 5') as any[];
  console.table(stocks);
  
  console.log('\n=== 数据统计 ===');
  
  const stockListCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM stock_list') as any[];
  console.log('stock_list 记录数:', stockListCount[0].count);
  
  const stocksCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM stocks') as any[];
  console.log('stocks 记录数:', stocksCount[0].count);
  
  const tradingCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM hs_stock_history_trading') as any[];
  console.log('hs_stock_history_trading 记录数:', tradingCount[0].count);
  
  const divCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM recent_dividend') as any[];
  console.log('recent_dividend 记录数:', divCount[0].count);
  
  const holdersCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM company_top_flow_holders') as any[];
  console.log('company_top_flow_holders 记录数:', holdersCount[0].count);
}

check().catch(console.error).finally(() => prisma.$disconnect());
