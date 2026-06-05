/**
 * 检查股东相关表的数据结构和内容
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  console.log('\n=== 检查股东相关表 ===\n');
  
  // 1. 检查 shareholder_top10 表
  console.log('1. shareholder_top10 表结构:');
  const top10Structure = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'shareholder_top10'
    ORDER BY ordinal_position
  `) as any[];
  console.table(top10Structure);
  
  console.log('\n2. shareholder_top10 数据样例:');
  const top10Data = await prisma.$queryRawUnsafe(`
    SELECT * FROM shareholder_top10 LIMIT 5
  `) as any[];
  console.table(top10Data);
  
  console.log('\n3. shareholder_top10 统计:');
  const top10Count = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM shareholder_top10
  `) as any[];
  console.log(`   总记录数：${top10Count[0].count}`);
  
  // 2. 检查 shareholder_top10_float 表
  console.log('\n4. shareholder_top10_float 表结构:');
  const top10FloatStructure = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'shareholder_top10_float'
    ORDER BY ordinal_position
  `) as any[];
  console.table(top10FloatStructure);
  
  console.log('\n5. shareholder_top10_float 数据样例:');
  const top10FloatData = await prisma.$queryRawUnsafe(`
    SELECT * FROM shareholder_top10_float LIMIT 5
  `) as any[];
  console.table(top10FloatData);
  
  console.log('\n6. shareholder_top10_float 统计:');
  const top10FloatCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM shareholder_top10_float
  `) as any[];
  console.log(`   总记录数：${top10FloatCount[0].count}`);
  
  // 3. 检查是否有自然人股东标识
  console.log('\n7. 检查股东类型字段:');
  const gdTypes = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT gdlx FROM shareholder_top10 WHERE gdlx IS NOT NULL LIMIT 10
  `) as any[];
  console.log('   shareholder_top10 中的股东类型:', gdTypes.map(t => t.gdlx).join(', '));
  
  const gdTypesFloat = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT gdlx FROM shareholder_top10_float WHERE gdlx IS NOT NULL LIMIT 10
  `) as any[];
  console.log('   shareholder_top10_float 中的股东类型:', gdTypesFloat.map(t => t.gdlx).join(', '));
  
  // 4. 统计自然人股东数量
  console.log('\n8. 自然人股东统计:');
  const naturalPersonCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM shareholder_top10_float WHERE gdlx = '自然人'
  `) as any[];
  console.log(`   shareholder_top10_float 中自然人股东记录数：${naturalPersonCount[0].count}`);
  
  const naturalPersonDistinct = await prisma.$queryRawUnsafe(`
    SELECT COUNT(DISTINCT gdmc) as count FROM shareholder_top10_float WHERE gdlx = '自然人'
  `) as any[];
  console.log(`   自然人股东人数 (去重): ${naturalPersonDistinct[0].count}`);
}

checkTables().catch(console.error).finally(() => prisma.$disconnect());
