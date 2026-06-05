/**
 * Mock 数据脚本已禁用。
 *
 * 该文件名仅为兼容旧命令保留。生产和测试主库禁止写入模拟股东、
 * 行情、分红数据；请使用真实 Mairui 同步链路。
 */

export {};

async function main() {
  throw new Error(
    'seed-mock-data.ts 已禁用：禁止写入模拟股东、行情和分红数据。请使用真实 Mairui 同步链路。',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
