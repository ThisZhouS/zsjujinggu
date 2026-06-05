/**
 * 查找数据库中所有包含股票代码字段的表
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findTables() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        column_name IN ('dm', 'code', 'stock_code', 'stockcode')
        OR column_name LIKE '%code%'
        OR column_name LIKE '%dm%'
        OR column_name LIKE '%stock%'
      )
    ORDER BY table_name
  `) as any[];
  
  console.log('\n=== 包含股票代码相关字段的表 ===\n');
  console.table(result);
  console.log(`\n总计：${result.length} 条记录`);
  
  // 按表名分组
  const tableMap = new Map<string, string[]>();
  for (const row of result) {
    if (!tableMap.has(row.table_name)) {
      tableMap.set(row.table_name, []);
    }
    tableMap.get(row.table_name)!.push(`${row.column_name} (${row.data_type})`);
  }
  
  console.log('\n=== 按表分组 ===\n');
  for (const [tableName, columns] of Array.from(tableMap.entries()).sort()) {
    console.log(`${tableName}: ${columns.join(', ')}`);
  }
  console.log(`\n总计：${tableMap.size} 张表`);
}

findTables().catch(console.error).finally(() => prisma.$disconnect());
