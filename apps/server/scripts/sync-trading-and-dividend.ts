/**
 * 历史交易和分红同步旧脚本已禁用。
 *
 * 原脚本在 MAIRUI_API_KEY 缺失时会写入模拟行情和分红数据，不能用于生产或测试主库。
 * 请使用真实 Mairui 同步链路：
 * - 管理端：POST /api/v1/admin/sync/business-data
 * - 定时任务：每天凌晨 4 点自动执行业务数据同步
 */

export {};

async function main() {
  throw new Error(
    'sync-trading-and-dividend.ts 已禁用：禁止写入模拟行情和分红数据。请使用真实 Mairui 同步链路。',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
