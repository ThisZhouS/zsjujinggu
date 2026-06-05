/**
 * 全量同步数据从 Mairui API
 *
 * 基于 datafetch Python 脚本中的 API 结构，使用正确的端点：
 * - 股票列表: /hslt/list/{key}
 * - 历史交易: /hsstock/history/{code}/{level}/{adjust}/{key}
 * - 分红数据: /hscp/jnfh/{code}/{key}
 * - 十大流通股东: /hsstock/financial/flowholder/{code}/{key}
 *
 * 运行方式：
 * npx ts-node -r tsconfig-paths/register scripts/sync-data-from-mairui.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// 加载 .env 文件
const envPath = resolve(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

const prisma = new PrismaClient();
const API_KEY = process.env.MAIRUI_API_KEY;
const BASE_URL = 'http://api.mairuiapi.com';

// 限速：每次请求间隔
const DELAY_MS = 100;

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url: string): Promise<any> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) {
      console.log(`    HTTP ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    return Array.isArray(data) ? data : [data];
  } catch (e: any) {
    console.log(`    请求失败: ${e.message?.slice(0, 100)}`);
    return null;
  }
}

/**
 * 1. 同步股票列表
 */
async function syncStockList(): Promise<number> {
  console.log('\n=== 1. 同步股票列表 ===');
  const data = await fetchJson(`${BASE_URL}/hslt/list/${API_KEY}`);
  if (!data?.length) { console.log('  无数据'); return 0; }

  let count = 0;
  for (const item of data) {
    // API 返回格式: { dm: "000001.SZ", mc: "平安银行", jys: "SZ" }
    const dm = item.dm || item.Dm;
    if (!dm) continue;
    const code = dm.includes('.') ? dm.split('.')[0] : dm; // 去除 .SH/.SZ 后缀
    const name = item.mc || item.Mc || '';
    const market = item.jys || item.Jys || 'A';
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO stock ("code", "name", "market", "createdAt")
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "market" = EXCLUDED."market"`,
        code, name, market,
      );
      count++;
    } catch { /* skip */ }
  }
  console.log(`  ✓ 同步 ${count} 只股票`);
  return count;
}

/**
 * 2. 同步十大流通股东数据
 */
async function syncFlowHolders(stockCodes: string[]): Promise<number> {
  console.log(`\n=== 2. 同步十大流通股东 (${stockCodes.length} 只股票) ===`);
  let total = 0;

  for (const code of stockCodes) {
    // 根据股票代码前缀判断交易所后缀
    const prefix = code.slice(0, 3);
    const suffix = (prefix === '600' || prefix === '601' || prefix === '603' || prefix === '605' || prefix === '688') ? 'SH' : 'SZ';
    const fullCode = `${code}.${suffix}`;

    const data = await fetchJson(
      `${BASE_URL}/hsstock/financial/flowholder/${fullCode}/${API_KEY}`,
    );
    if (!data?.length) { await sleep(DELAY_MS); continue; }

    for (const item of data) {
      try {
        // jzrq 和 plrq 格式为 YYYYMMDD，转为 YYYY-MM-DD
        let jzrq = null;
        if (item.jzrq) jzrq = `${item.jzrq.slice(0,4)}-${item.jzrq.slice(4,6)}-${item.jzrq.slice(6,8)}`;
        let ggrq = null;
        if (item.ggrq) ggrq = `${item.ggrq.slice(0,4)}-${item.ggrq.slice(4,6)}-${item.ggrq.slice(6,8)}`;

        await prisma.$executeRawUnsafe(
          `INSERT INTO company_top_flow_holders
            ("stockCode", "ggrq", "jzrq", "gdmc", "gdlx", "cgsl", "cgbl", "cgpm", "gfxz", "bdyy", "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
           ON CONFLICT DO NOTHING`,
          code,  // 存原始代码（无后缀）
          ggrq,
          jzrq,
          item.gdmc || '',
          item.Gdlx || item.gdlx || '',
          item.cgsl ? Number(item.cgsl) : null,
          item.cgbl ? Number(item.cgbl) : null,
          item.cgpm || null,
          item.gfxz || null,
          item.Bdyy || item.bdyy || null,
        );
        total++;
      } catch { /* skip */ }
    }
    if (total % 100 === 0) console.log(`  ... 已同步 ${total} 条记录`);
    await sleep(DELAY_MS);
  }
  console.log(`  ✓ 共 ${total} 条十大流通股东记录`);
  return total;
}

/**
 * 3. 同步历史交易数据（日K线）
 */
async function syncHistoryTrading(stockCodes: string[]): Promise<number> {
  console.log(`\n=== 3. 同步历史交易 (${stockCodes.length} 只股票) ===`);
  let total = 0;

  for (const code of stockCodes) {
    const data = await fetchJson(
      `${BASE_URL}/hsstock/history/${code}/d/n/${API_KEY}`,
    );
    if (!data?.length) { await sleep(DELAY_MS); continue; }

    for (const item of data) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO hs_stock_history_trading
            ("dm", "t", "model", "o", "h", "l", "c", "v", "a", "pc", "sf", "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
           ON CONFLICT ("dm", "t", "model") DO NOTHING`,
          code,
          item.t || '',
          'n',
          item.o ? Number(item.o) : null,
          item.h ? Number(item.h) : null,
          item.l ? Number(item.l) : null,
          item.c ? Number(item.c) : null,
          item.v ? BigInt(item.v ?? 0) : null,
          item.a ? Number(item.a) : null,
          item.pc ? Number(item.pc) : null,
          item.sf || null,
        );
        total++;
      } catch { /* skip */ }
    }
    if (total % 500 === 0) console.log(`  ... 已同步 ${total} 条记录`);
    await sleep(DELAY_MS);
  }
  console.log(`  ✓ 共 ${total} 条历史交易记录`);
  return total;
}

/**
 * 4. 同步分红数据
 * API: /hscp/jnfh/{code}/{key}
 * 返回字段: { sdate, give, change, send, line, cdate, edate, hdate }
 * - sdate: 预案/实施日期 (YYYY-MM-DD)
 * - give: 每股转增
 * - change: 每股送股
 * - send: 每股派息
 * - line: "预案" 或 "实施"
 * - cdate: 除权除息日
 * - edate: 股权登记日
 * - hdate: 红利发放日
 */
async function syncDividend(stockCodes: string[]): Promise<number> {
  console.log(`\n=== 4. 同步分红数据 (${stockCodes.length} 只股票) ===`);
  let total = 0;

  for (const code of stockCodes) {
    const data = await fetchJson(
      `${BASE_URL}/hscp/jnfh/${code}/${API_KEY}`,
    );
    if (!data?.length) { await sleep(DELAY_MS); continue; }

    for (const item of data) {
      try {
        // 只保存 "实施" 的记录
        if (item.line && item.line !== '实施') continue;

        // 构造 fhx 字段：每10股派X元
        let fhx = null;
        if (item.send && Number(item.send) > 0) {
          fhx = `每10股派${Number(item.send).toFixed(2)}元`;
        }

        const jzrqVal = item.edate || item.sdate || null;
        // 检查是否已存在
        const existing: any[] = await prisma.$queryRawUnsafe(
          `SELECT 1 FROM recent_dividend WHERE "dm" = $1 AND "jzrq" = $2 LIMIT 1`,
          code, jzrqVal,
        );
        if (existing.length > 0) continue;

        await prisma.$executeRawUnsafe(
          `INSERT INTO recent_dividend
            ("dm", "jzrq", "plrq", "fhx", "fhjyr", "fhjzr", "hf", "hfjyr", "hfjzr", "zf", "zfjyr", "zfjzr", "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
          code,
          jzrqVal,
          item.sdate || null,
          fhx,
          item.hdate || null,
          item.cdate || null,
          null,
          item.hdate || null,
          item.hdate || null,
          null,
          null,
          null,
        );
        total++;
      } catch { /* skip */ }
    }
    if (total % 50 === 0) console.log(`  ... 已同步 ${total} 条记录`);
    await sleep(DELAY_MS);
  }
  console.log(`  ✓ 共 ${total} 条分红记录`);
  return total;
}

async function main() {
  console.log('=== 从 Mairui API 全量同步数据 ===');
  console.log(`API Key: ${API_KEY ? '已配置 (' + API_KEY.slice(0, 8) + '...)' : '未配置'}`);

  if (!API_KEY) {
    console.error('请先配置 MAIRUI_API_KEY 环境变量');
    process.exit(1);
  }

  const start = Date.now();

  try {
    // 1. 股票列表
    await syncStockList();

    // 获取所有股票代码（从已有数据表，如 holdings 或 company_top_flow_holders）
    const stocks: any[] = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "stockCode" as code FROM holdings UNION SELECT DISTINCT "dm" as code FROM hs_stock_history_trading ORDER BY code`,
    );
    const stockCodes = stocks.map(s => s.code);
    console.log(`\n  数据库中共 ${stockCodes.length} 只股票`);

    // 限制同步数量（避免 API 调用过多）
    const limit = 50;
    const codesToSync = stockCodes.length > 0 ? stockCodes.slice(0, limit) : [];
    if (codesToSync.length === 0) {
      console.log('  没有可同步的股票代码，跳过');
      console.log('\n=== 同步完成 ===');
      console.log(`总耗时: ${((Date.now() - start) / 1000).toFixed(2)}s`);
      await prisma.$disconnect();
      return;
    }
    console.log(`  本次同步前 ${codesToSync.length} 只股票`);

    // 2. 十大流通股东
    await syncFlowHolders(codesToSync);

    // 3. 历史交易
    await syncHistoryTrading(codesToSync);

    // 4. 分红
    await syncDividend(codesToSync);

    console.log('\n=== 同步完成 ===');
    console.log(`总耗时: ${((Date.now() - start) / 1000).toFixed(2)}s`);
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
