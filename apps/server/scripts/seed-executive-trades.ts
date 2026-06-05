/**
 * 高管交易种子脚本已禁用。
 *
 * 原脚本会写入非真实高管交易数据，不能用于生产或测试主库。
 * 请使用真实 Mairui 高管交易同步链路。
 */

export {};

async function main() {
  throw new Error(
    'seed-executive-trades.ts 已禁用：禁止写入模拟高管交易数据。请使用真实 Mairui 同步链路。',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
