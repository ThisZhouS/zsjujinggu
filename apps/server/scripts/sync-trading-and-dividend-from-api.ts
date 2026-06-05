/**
 * 旧版交易和分红 API 同步脚本已禁用。
 *
 * 该脚本绕过 A/B 业务数据源，不再作为可执行数据入口保留。
 * 请使用正式业务同步链路。
 */

export {};

async function main() {
  throw new Error(
    'sync-trading-and-dividend-from-api.ts 已禁用：请使用 POST /api/v1/admin/sync/business-data 或凌晨 4 点定时同步。',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
