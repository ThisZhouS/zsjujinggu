/**
 * 检查持仓相关表的数据结构和内容
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  console.log('\n=== 检查持仓相关表 ===\n');
  
  // 1. company_top_flow_holders
  console.log('1. company_top_flow_holders 表结构:');
  const structure = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'company_top_flow_holders'
    ORDER BY ordinal_position
  `) as any[];
  console.table(structure);
  
  console.log('\n2. company_top_flow_holders 数据样例:');
  const data = await prisma.$queryRawUnsafe(`
    SELECT * FROM company_top_flow_holders LIMIT 3
  `) as any[];
  console.table(data);
  
  console.log('\n3. company_top_flow_holders 统计:');
  const count = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM company_top_flow_holders
  `) as any[];
  console.log(`   总记录数：${count[0].count}`);
  
  const naturalCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM company_top_flow_holders WHERE gdlx = '自然人'
  `) as any[];
  console.log(`   自然人记录数：${naturalCount[0].count}`);
  
  // 4. company_top_holders
  console.log('\n4. company_top_holders 表结构:');
  const topHoldersStructure = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'company_top_holders'
    ORDER BY ordinal_position
  `) as any[];
  console.table(topHoldersStructure);
  
  console.log('\n5. company_top_holders 统计:');
  const topHoldersCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM company_top_holders
  `) as any[];
  console.log(`   总记录数：${topHoldersCount[0].count}`);
  
  // 6. 检查 stock_list 表
  console.log('\n6. stock_list 表结构:');
  const stockListStructure = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'stock_list'
    ORDER BY ordinal_position
  `) as any[];
  console.table(stockListStructure.slice(0, 15));
  
  console.log('\n7. stock_list 数据样例:');
  const stockListData = await prisma.$queryRawUnsafe(`
    SELECT dm, jc, ssrq FROM stock_list LIMIT 5
  `) as any[];
  console.table(stockListData);
  
  console.log('\n8. stock_list 统计:');
  const stockListCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM stock_list
  `) as any[];
  console.log(`   总记录数：${stockListCount[0].count}`);
}

checkTables().catch(console.error).finally(() => prisma.$disconnect());
