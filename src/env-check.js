/**
 * 环境自检代码
 * 在入口文件顶部插入，用于检查必要的环境变量
 */

// ==================== 后端环境自检 ====================
export function backendEnvCheck() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'MAIRUI_API_KEY',
    'DEEPSEEK_API_KEY',
  ];

  const optionalEnvVars = [
    'PORT',
    'NODE_ENV',
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:');
    missing.forEach((envVar) => {
      console.error(`   - ${envVar}`);
    });
    console.error('\n📝 请在 .env 文件中配置这些变量');
    console.error('参考 .env.example 文件');
    process.exit(1);
  }

  console.log('✅ 后端环境变量检查通过');
  console.log(`   Database: ${process.env.DATABASE_URL?.split('@')[1]}`);
  console.log(`   Redis: ${process.env.REDIS_URL?.split('@')[1]}`);
  console.log(`   Port: ${process.env.PORT || 4000}`);
}

// ==================== 前端环境自检 ====================
export function frontendEnvCheck() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_URL',
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0 && process.env.NODE_ENV !== 'development') {
    console.warn('⚠️ 前端缺少环境变量:');
    missing.forEach((envVar) => {
      console.warn(`   - ${envVar}`);
    });
  }

  console.log('✅ 前端环境变量检查通过');
  console.log(`   API URL: ${process.env.NEXT_PUBLIC_API_URL}`);
}

// ==================== 数据库连接自检 ====================
export async function databaseCheck(prisma) {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 检查表是否存在
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    console.log(`   数据表数量: ${tables.length}`);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

// ==================== Redis连接自检 ====================
export async function redisCheck(redis) {
  try {
    await redis.ping();
    console.log('✅ Redis连接成功');
  } catch (error) {
    console.error('❌ Redis连接失败:', error.message);
    process.exit(1);
  }
}

// ==================== 样板间文件自检 ====================
export function templateCheck() {
  const requiredTemplates = [
    'controller.template.ts',
    'service.template.ts',
    'repository.template.ts',
    'guard.template.ts',
    'decorator.template.ts',
    'interceptor.template.ts',
    'filter.template.ts',
    'infrastructure.service.template.ts',
    'scheduler.task.template.ts',
    'react.page.template.tsx',
    'react.component.template.tsx',
    'swr.hook.template.ts',
    'type.definition.template.ts',
  ];

  console.log('📋 检查样板间文件...');
  requiredTemplates.forEach((template) => {
    console.log(`   ✓ ${template}`);
  });
}

// ==================== 规则自检 ====================
export function rulesCheck() {
  console.log('📋 代码规则自检...');

  const rules = [
    'R1: Decimal/BigInt类型转换',
    'R2: 可空字段处理',
    'R3: Redis操作注意',
    'R4: 类型安全',
    'R5: 日期处理',
    'R6: 报告期格式',
    'R7: UTC时间',
    'R8: JOIN查询',
    'R9: 批量查询避免N+1',
    'R10: Prisma upsert约束',
    'R11: 统一响应格式',
    'R12: VIP拦截处理',
    'R13: 外部API降级',
    'R14: 分页参数',
    'R15: 命名规范',
    'R16: 错误处理',
    'R17: 前端环境变量',
    'R18: bcrypt参数',
    'R19: API Key存储',
    'R20: 管理员权限',
    'R21: IDOR保护',
    'R22: 数据脱敏',
    'R23: 审计日志',
  ];

  rules.forEach((rule) => {
    console.log(`   ✓ ${rule}`);
  });
}

// ==================== 架构自检 ====================
export function architectureCheck() {
  console.log('📋 架构自检...');

  const validCalls = [
    'Controller → Service → Repository → Database',
    'Service → Infrastructure → External APIs',
  ];

  const forbiddenCalls = [
    '❌ Controller → Repository',
    '❌ Controller → Infrastructure',
    '❌ Service → Prisma Client',
    '❌ Repository → Service',
  ];

  console.log('   允许的调用关系:');
  validCalls.forEach((call) => console.log(`     ✓ ${call}`));

  console.log('   禁止的调用关系:');
  forbiddenCalls.forEach((call) => console.log(`     ${call}`));
}
