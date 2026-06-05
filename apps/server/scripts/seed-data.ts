/**
 * 示例业务数据脚本已禁用。
 *
 * 该文件名仅为兼容旧命令保留。生产和测试主库禁止写入示例牛散、
 * 股票、文章、持仓数据；请使用真实业务同步或专门隔离的测试库。
 */

export {};

async function main() {
  throw new Error(
    'seed-data.ts 已禁用：禁止写入示例牛散、股票、文章和持仓数据。请使用真实业务数据源。',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
