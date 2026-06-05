# King 财经数据平台 - 开发规则文档

> **版本**: v1.0
> **基于**: King项目一期PRD v3.1
> **生效日期**: 2026-04-17

本文档定义了项目开发过程中必须遵循的编码规范、架构约束、业务规则和验收标准。

---

## 目录

1. [架构规则](#1-架构规则)
2. [编码强规则](#2-编码强规则)
3. [API设计规范](#3-api设计规范)
4. [数据库操作规则](#4-数据库操作规则)
5. [前端开发规范](#5-前端开发规范)
6. [安全规则](#6-安全规则)
7. [业务逻辑规则](#7-业务逻辑规则)
8. [商业化规则](#8-商业化规则)
9. [性能与缓存规则](#9-性能与缓存规则)
10. [外部API集成规则](#10-外部api集成规则)
11. [验收标准](#11-验收标准)

---

## 1. 架构规则

### 1.1 分层架构（MUST遵循）

```
Controller → Service → Repository → Database
                     → Infrastructure → External APIs
```

**禁止的调用关系**:
- ❌ Controller 直接调用 Repository
- ❌ Controller 直接调用 Infrastructure
- ❌ Service 直接使用 Prisma Client（必须通过 Repository）
- ❌ Repository 调用 Service
- ❌ 跨层调用（如 Controller → Infrastructure）

**各层职责**:

| 层 | 职责 | 禁止操作 |
|-----|------|-----------|
| **Controller** | 路由定义、参数校验、调用 Service、格式化响应 | 数据库操作、业务逻辑 |
| **Service** | 业务逻辑、计算、跨 Repository 聚合 | 直接使用 Prisma Client |
| **Repository** | 单表/简单关联的数据访问 | 业务计算、调用 Service |
| **Infrastructure** | 外部 API 封装、缓存、日志、定时任务 | 依赖 Service 层 |

### 1.2 依赖注入规范

```typescript
// ✅ 正确：通过构造函数注入
constructor(
  private readonly xxxRepository: XxxRepository,
  private readonly yyyRepository: YyyRepository,
  private readonly mairuiService: MairuiService,
) {}

// ❌ 错误：手动创建实例
constructor() {
  this.xxxRepository = new XxxRepository();
}
```

### 1.3 模块组织规范

```
apps/server/src/domain/{module}/
├── {module}.module.ts      # 模块定义
├── {module}.controller.ts  # Controller层
├── {module}.service.ts     # Service层
├── {module}.repository.ts  # Repository层
└── dto/                   # 数据传输对象
```

---

## 2. 编码强规则

### 2.1 数据类型安全规则

#### R1: Prisma Decimal/BigInt 必须转换

```typescript
// ❌ 错误：直接对Prisma返回的Decimal进行运算
const total = stock.currentPrice + stock.amount; // Error!

// ✅ 正确：转换为number后再运算
const total = Number(stock.currentPrice) + Number(stock.amount);

// ✅ 正确：BigInt同理
const holdCount = Number(holding.holdCount);
```

**R1适用场景**:
- 所有包含 `Decimal` 类型的字段（`amount`, `currentPrice`, `totalMarketCap` 等）
- 所有包含 `BigInt` 类型的字段（`holdCount`, `changeCount` 等）
- `prisma.count()` 返回值

**违反后果**: 运行时 TypeError 或 JSON 序列化失败

#### R2: 可空字段必须守卫

```typescript
// ❌ 错误：直接访问可空字段
const price = stock.currentPrice.toFixed(2); // Error if null!

// ✅ 正确：使用 ?? 或条件检查
const price = stock.currentPrice?.toFixed(2) ?? '—';

// ✅ 正确：if检查
if (stock.currentPrice != null) {
  const price = stock.currentPrice.toFixed(2);
}
```

**R2适用字段**: 所有标记 `?` 的 Prisma 字段

#### R3: Redis 操作注意事项

```typescript
// ❌ 错误：数组不支持字符串索引
const results = await redis.mget(['key1', 'key2']);
const value = results['key1']; // Error!

// ✅ 正确：使用数组下标或Map
const [key1Value, key2Value] = await redis.mget(['key1', 'key2']);

// ✅ 正确：构建Map
const map = new Map(
  keys.map((key, index) => [key, results[index]])
);
```

#### R4: 类型守卫

```typescript
// ❌ 错误：filter(Boolean)不收窄类型
const filtered = items.filter(Boolean);
// filtered 仍然是 (number | null)[]

// ✅ 正确：使用类型守卫
const filtered = items.filter((x): x is NonNullable<typeof x> => Boolean(x));
// filtered 是 number[]
```

### 2.2 日期时间规则

#### R5: getMonth() 是 0-indexed

```typescript
// ❌ 错误：getMonth()返回0-11，比较时不应+1
const month = new Date().getMonth();
if (month + 1 === 3) { /* ❌ 错误逻辑 */ }

// ✅ 正确：直接与实际值比较
const month = new Date().getMonth();
if (month === 2) { /* ✅ 3月 */ }
```

**月份映射**:
- 0 = 一月
- 2 = 三月
- 5 = 六月
- 8 = 九月
- 11 = 十二月

#### R6: 报告期格式规范

```typescript
// ✅ 正确：报告期使用 YYYY-MM-DD 格式
const reportDate = '2024-03-31';
// 对应 Prisma DateTime @db.Date

// ✅ 正确：API响应使用 ISO 8601 格式
const isoDate = '2024-03-31T00:00:00.000Z';
```

**格式对照表**:

| 用途 | 格式 | 示例 |
|------|------|------|
| 数据库报告期 | `YYYY-MM-DD` | `2024-03-31` |
| API 响应 | ISO 8601 | `2024-03-31T00:00:00.000Z` |
| Redis 缓存 key | `YYYYMMDD` 或 `YYYY-MM-DD` | `20240331` 或 `2024-03-31` |

#### R7: 时区统一

```typescript
// ✅ 正确：存储使用 UTC
const now = new Date(); // 默认 UTC
await repository.create({ createdAt: now });

// ✅ 正确：比较使用 UTC
const items = await repository.findMany({
  where: {
    createdAt: { gte: new Date() }
  }
});

// ✅ 正确：前端展示转换为本地时区
const localDate = new Date(isoDate).toLocaleString('zh-CN');
```

### 2.3 数据库查询规则

#### R8: JOIN 字段必须显式 include

```typescript
// ❌ 错误：结果中没有 investor 字段
const holdings = await prisma.holding.findMany({
  where: { investorId: 'xxx' }
});
// holdings[0].investorName // undefined!

// ✅ 正确：显式 include
const holdings = await prisma.holding.findMany({
  where: { investorId: 'xxx' },
  include: { investor: true }
});
// holdings[0].investor.name // ✅ 存在
```

#### R9: 批量查询替代 N+1

```typescript
// ❌ 错误：循环中查询数据库
for (const investor of investors) {
  const holdings = await holdingRepository.findByInvestorId(investor.id);
  investor.holdings = holdings;
}

// ✅ 正确：批量查询 + Map
const investorIds = investors.map(i => i.id);
const holdings = await holdingRepository.findByInvestorIds(investorIds);
const holdingsMap = new Map(
  holdings.map(h => [h.investorId, h])
);
for (const investor of investors) {
  investor.holdings = holdingsMap.get(investor.id) || [];
}
```

#### R10: upsert 使用唯一键

```typescript
// ✅ 正确：where必须是@@unique或@@id字段
await prisma.stock.upsert({
  where: { code: '000001' }, // code 是 @@id 字段
  create: { code: '000001', name: '测试' },
  update: { name: '测试' }
});

// ✅ 正确：复合唯一键
await prisma.holding.upsert({
  where: { investorId_stockCode_reportDate: { /* 复合键 */ } },
  create: { /* ... */ },
  update: { /* ... */ }
});
```

---

## 3. API设计规范

### 3.1 统一响应格式（R11）

```typescript
// ✅ 正确：所有API响应使用统一格式
{
  code: 200,           // HTTP状态码或业务码
  message: 'success',  // 提示信息
  data: { ... }        // 数据载荷
}
```

**错误码规范**:

| code | 含义 | 使用场景 |
|------|------|----------|
| 200 | 成功 | 正常响应 |
| 400 | 请求参数错误 | 参数校验失败 |
| 401 | 未认证 | JWT Token 缺失或无效 |
| 403 | 无权限 | 非管理员访问、VIP功能未开通 |
| 404 | 资源不存在 | 资源未找到 |
| 409 | 资源冲突 | 重复收藏、重复添加自选股 |
| 500 | 服务器错误 | 内部错误 |

### 3.2 VIP 拦截规范（R12）

```typescript
// VipGuard 拦截时返回格式
{
  code: 403,
  message: '该功能需要VIP会员',
  data: {
    requiredPlan: 'vip',
    pricing: {
      monthly: 49,
      yearly: 399
    }
  }
}

// ❌ 错误：禁止返回 HTTP 403
// HTTP 状态码必须保持 200，业务码为 403
```

**VIP判断逻辑**:
1. 管理员（`role === 'admin'`）→ 直接放行
2. 检查 `user.vipExpiresAt > new Date()` → VIP 有效则放行
3. 其他 → 拒绝，返回上述格式

### 3.3 外部 API 失败降级（R13）

```typescript
// ✅ 正确：返回缓存数据或空数组
try {
  return await mairuiService.getData();
} catch (error) {
  const cached = await redis.get('cache:key');
  return {
    code: 200,
    message: '数据获取失败，已返回缓存',
    data: cached ? JSON.parse(cached) : []
  };
}

// ❌ 错误：禁止抛出 500 错误
throw new HttpException('External API failed', 500);
```

**R13实现方式**: 使用 `ExternalApiError` + `AllExceptionsFilter`

### 3.4 分页参数规范（R14）

```typescript
// ✅ 正确：统一使用 page 和 page_size
interface PaginationParams {
  page: number;        // 1-based
  page_size: number;   // 默认20，最大100
}

const page = Math.max(1, parseInt(params.page, 10));
const pageSize = Math.min(100, Math.max(1, parseInt(params.page_size, 10)));
```

### 3.5 接口权限规范

| 接口类型 | 所需权限 | Guard |
|----------|----------|-------|
| 公开接口 | 无 | 无 |
| 用户接口 | JWT | `JwtAuthGuard` |
| VIP 接口 | JWT + VIP | `JwtAuthGuard + VipGuard` |
| 管理员接口 | JWT + Admin | `JwtAuthGuard + AdminGuard` |

---

## 4. 数据库操作规则

### 4.1 Repository 层规范

```typescript
@Injectable()
export class XxxRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ 正确：仅做 CRUD，无业务逻辑
  async findById(id: string) {
    return this.prisma.xxx.findUnique({ where: { id } });
  }

  async create(data: XxxCreateInput) {
    return this.prisma.xxx.create({ data });
  }

  // ❌ 错误：包含业务计算
  async createWithCalculatedValue(data) {
    const calculated = data.a + data.b; // 不应在这里计算
    return this.prisma.xxx.create({ data: { ...data, calculated } });
  }
}
```

### 4.2 Service 层规范

```typescript
@Injectable()
export class XxxService {
  constructor(
    private readonly xxxRepository: XxxRepository,
    private readonly yyyRepository: YyyRepository,
    private readonly mairuiService: MairuiService, // 可以调用Infrastructure
  ) {}

  // ✅ 正确：可以调用多个 Repository
  async getAggregateData(id: string) {
    const [xxx, yyyList] = await Promise.all([
      this.xxxRepository.findById(id),
      this.yyyRepository.findByXxxId(id),
    ]);

    // 业务逻辑计算
    const total = yyyList.reduce((sum, y) => sum + Number(y.value), 0);

    return { ...xxx, total };
  }

  // ❌ 错误：直接使用 Prisma Client
  async getData(id: string) {
    return this.prisma.xxx.findUnique({ where: { id } }); // 禁止！
  }
}
```

### 4.3 事务操作规范

```typescript
// ✅ 正确：使用 prisma.$transaction
async createOrder(userId: string, items: OrderItem[]) {
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { userId, totalAmount: calculateTotal(items) }
    });

    await tx.orderItem.createMany({
      data: items.map(item => ({ ...item, orderId: order.id }))
    });

    return order;
  });
}
```

---

## 5. 前端开发规范

### 5.1 命名规范（R15）

```typescript
// ✅ 正确：所有字段名使用 camelCase
interface InvestorItem {
  id: string;
  name: string;
  totalMarketValue: number;  // 非 total_market_value
  stockCount: number;        // 非 stock_count
  createdAt: string;        // 非 created_at
}

// ❌ 错误：使用 snake_case
interface InvestorItem {
  total_market_value: number;  // 禁止！
}
```

### 5.2 SWR Hook 规范（R16）

```typescript
// ✅ 正确：必须配置 onError 回调
export function useInvestors(params: UseInvestorsParams) {
  const { data, error, isLoading, mutate } = useSWR(
    `/investors?${buildQuery(params)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch investors:', error);
        message.error('加载数据失败');
      },
    }
  );

  return { data, error, isLoading, mutate };
}

// ❌ 错误：缺少 onError
const { data } = useSWR('/investors', fetcher); // 禁止！
```

### 5.3 环境变量规范（R17）

```typescript
// ✅ 正确：前端环境变量必须以 NEXT_PUBLIC_ 开头
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ 错误：不以 NEXT_PUBLIC_ 开前缀
const apiKey = process.env.API_KEY; // 不会暴露给客户端！
```

### 5.4 API 客户端规范

```typescript
// apps/web/src/lib/api.ts
const apiClient = axios.create({
  baseURL: '/api', // 通过 Next.js rewrites 代理
  timeout: 15000,
});

// 请求拦截器：自动附加 Token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 自动跳转登录
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 5.5 数字格式化规范

```typescript
// packages/shared/src/constants/format.ts

export function formatMoney(value: number | null): string {
  if (value === null) return '—';

  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }

  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(2)}%`;
}
```

---

## 6. 安全规则

### 6.1 密码哈希（R18）

```typescript
// ✅ 正确：必须传入 saltRounds 参数
const hashedPassword = await bcrypt.hash(password, 10);

// ❌ 错：禁止省略 saltRounds
const hashedPassword = await bcrypt.hash(password); // 禁止！
```

### 6.2 API Key 存储（R19）

```typescript
// ✅ 正确：只存储 hash，验证时 hash 后比对
const keyHash = await bcrypt.hash(apiKey, 10);
await repository.create({ keyHash });

// 验证
const isValid = await bcrypt.compare(inputApiKey, storedKeyHash);

// ⚠️ 注意：明文只在创建时返回一次，之后不可恢复
```

### 6.3 管理员权限（R20）

```typescript
// ✅ 正确：所有 /admin/* 路由必须双重守卫
@Controller('admin')
export class AdminController {
  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getUsers() { /* ... */ }
}

// ❌ 错误：缺少任一守卫
@UseGuards(JwtAuthGuard) // 缺少 AdminGuard
async deleteUser() { /* ... */ }
```

### 6.4 IDOR 防护（R21）

```typescript
// ✅ 正确：Service 层验证资源归属
async deleteFavorite(userId: string, investorId: string) {
  const favorite = await this.favoriteRepository.findUnique({
    where: { userId_investorId: { userId, investorId } }
  });

  if (!favorite) {
    throw new NotFoundException('Favorite not found');
  }

  // R21: 验证 userId 匹配
  if (favorite.userId !== userId) {
    throw new ForbiddenException('Access denied');
  }

  return this.favoriteRepository.delete(favorite.id);
}

// ❌ 错误：仅依赖路径参数直接操作
async deleteFavorite(investorId: string) {
  return this.favoriteRepository.delete({ investorId }); // IDOR漏洞！
}
```

**适用资源**:
- 收藏（`UserFavorite`）
- 自选股（`Watchlist`）
- 价格提醒（`PriceAlert`）
- API Key（`ApiKey`）
- 订单（`Order`）

### 6.5 敏感数据脱敏（R22）

```typescript
// ✅ 正确：手机号脱敏
function maskPhone(phone: string): string {
  if (!phone) return '';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

// ✅ 正确：API Key 仅返回前8位
function maskApiKey(keyPrefix: string): string {
  return `${keyPrefix}...`;
}

// ❌ 错误：禁止返回明文密码或支付信息
return {
  password: user.password,      // 禁止！
  paymentInfo: order.paymentInfo // 禁止！
};
```

### 6.6 审计日志（R23）

```typescript
// ✅ 正确：所有 /admin/* 写操作必须记录审计日志
async deleteAdminInvestor(adminId: string, investorId: string) {
  const result = await this.investorRepository.delete(investorId);

  // R23: 记录审计日志
  await this.auditLogRepository.create({
    adminId,
    action: 'delete_investor',
    targetType: 'investor',
    targetId: investorId,
    ip: this.getRequestIp(),
    timestamp: new Date(),
  });

  return result;
}
```

---

## 7. 业务逻辑规则

### 7.1 季度对比规则

**季度报告期映射**:

| 季度 | reportDate |
|------|------------|
| Q1 | 03-31 |
| Q2 | 06-30 |
| Q3 | 09-30 |
| Q4 | 12-31 |

**财报披露时间规则（A股）**:

| 季度 | 披露截止 | 可用起始 |
|------|----------|----------|
| Q1 | 4.30 | 5月1日 |
| Q2 | 8.31 | 9月1日 |
| Q3 | 10.31 | 11月1日 |
| Q4 | 次年 4.30 | 次年 5月1日 |

**最新可用季度计算**:
```typescript
function getLatestDisclosedQuarter(): Date {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed

  if (month >= 10) { // 11月起（11月）
    return new Date(now.getFullYear(), 8, 30); // Q3 (9月30)
  } else if (month >= 8) { // 9月起（9月）
    return new Date(now.getFullYear(), 5, 30); // Q2 (6月30)
  } else if (month >= 4) { // 5月起（5月）
    return new Date(now.getFullYear(), 2, 31); // Q1 (3月31)
  } else {
    return new Date(now.getFullYear() - 1, 11, 31); // 去年Q4
  }
}
```

### 7.2 持仓计算规则

**衍生字段计算公式**:

| 字段 | 计算公式 |
|------|----------|
| `holdMarketValue` | `currentPrice * holdCount` |
| `returnRate` | `(currentPrice - avgCost) / avgCost * 100` |
| `sellProfit` | `holdMarketValue - actualCost` |
| `avgCost` | `actualCost / holdCount` |
| `changePercent` | `(currCount - prevCount) / prevCount * 100` |

**边界条件**:
- `currentPrice` 为 `null` 时 → `holdMarketValue`、`returnRate` 均为 `null`
- `avgCost` 为 `null` 或 `≤ 0` 时 → `returnRate` 为 `null`
- 上期不存在时 → `changePercent` 为 `null`（新进场景）

### 7.3 涨幅榜规则

**免费用户限制**:
- 今日涨幅：最多查看前 20 名
- 历史涨幅、涨停板：需 VIP

**涨停板查询规则**:
1. 从 Redis 缓存读取（`limitup:YYYYMMDD`）
2. 缓存未命中时调用 mairui API
3. 缓存 TTL 为 10 分钟

**涨幅计算公式**:
```
涨幅 = (当前价 - 昨收价) / 昨收价 * 100%
```

### 7.4 牛散列表筛选规则

**总市值筛选门槛**:
```
totalMarketValue >= 70,000,000 (7000万元)
```

低于门槛的牛散不出现在列表，但详情页可通过直链访问。

**排序规则**:
- `sort=market_value`（默认）：按 `totalMarketValue` 降序
- `sort=name`：按姓名拼音首字母 A-Z 升序（`String.localeCompare('zh-CN')`）

---

## 8. 商业化规则

### 8.1 会员等级定义

| 功能 | 免费用户 | VIP 会员 |
|------|----------|---------|
| 牛散列表 | 基础信息 | 完整信息 |
| 牛散详情 | 概览（持仓饼图） | 完整持仓明细 |
| 涨幅榜 | 今日前 20 名 | 全部周期 + 扩展字段 |
| 增持/减持/新进 | ❌ | ✅ |
| 共同持仓 | ❌ | ✅ |
| 十大增持 | ❌ | ✅ |
| 分红股息率 | ❌ | ✅ |
| 高管增持 | ❌ | ✅ |
| 个人股东 | ❌ | ✅ |
| 数据导出 | ❌ | ✅ |
| 广告显示 | ✅ | ❌ |

### 8.2 定价策略

```typescript
const PRICING = {
  vip: {
    monthly: 49,   // ¥49/月
    yearly: 399,   // ¥399/年（省 ¥189）
  },
  api: {
    basic: 99,     // ¥99/月（100次/天）
    pro: 299,      // ¥299/月（1000次/天）
    enterprise: 999, // ¥999/月（无限制）
  }
};
```

### 8.3 支付流程

```
用户点击"开通VIP"
  → 选择支付方式（微信/支付宝）
  → 后端创建订单 → 调用支付API生成二维码
  → 用户扫码支付
  → 支付平台异步通知 → 后端验签 → 开通VIP
  → 前端轮询支付状态 → 支付成功 → 刷新页面
```

### 8.4 API Key 管理

```typescript
// 创建
const apiKey = await repository.create({
  keyHash: await bcrypt.hash(generateKey(), 10),
  keyPrefix: 'ak_xxxx', // 仅返回前8位
  plan: 'free',
  dailyLimit: 100,
  expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟
});

// 验证
const isValid = await bcrypt.compare(inputApiKey, storedKeyHash);
```

---

## 9. 性能与缓存规则

### 9.1 Redis 缓存策略

| 数据 | Key 格式 | TTL | 刷新策略 |
|------|----------|-----|----------|
| 涨停板 | `limitup:YYYYMMDD` | 10分钟 | 盘中每10分钟 |
| 历史涨幅 | `gainers:{period}:{YYYY-MM-DD}` | 24小时 | 每日收盘后 |
| 股票实时价 | `stock:price:{code}` | 30秒 | 盘中高频刷新 |
| 十大股东 | `individual_shareholders:{YYYY-MM-DD}` | 24小时 | 每日同步后 |

### 9.2 Redis 降级策略

| 场景 | 处理方式 |
|------|----------|
| Redis 连接失败 | 跳过缓存，直接查询数据库 |
| Redis 连接超时 | 设置 2 秒超时，超时后降级 |
| Redis 服务不可用 | 应用启动时打印警告，不阻塞启动 |

### 9.3 批量查询规范

```typescript
// ✅ 正确：批量查询避免 N+1
const stockCodes = holdings.map(h => h.stockCode);
const stocks = await this.stockRepository.findByCodes(stockCodes);
const stockMap = new Map(stocks.map(s => [s.code, s]));

for (const holding of holdings) {
  const stock = stockMap.get(holding.stockCode);
  // 使用 stock
}

// ❌ 错误：循环中查询
for (const holding of holdings) {
  const stock = await this.stockRepository.findByCode(holding.stockCode);
}
```

---

## 10. 外部API集成规则

### 10.1 mairuiapi 规范

**股票代码格式**:
- 纯数字代码：`000001`
- K 线接口：需加后缀（`.SZ` 或 `.SH`）
- 其他接口：纯数字代码

**超时设置**:
- 最大超时：3 秒
- 超时后返回缓存或空数组

**数据清洗**:
```typescript
// ✅ 正确：清洗 API 返回数据
function sanitizeStockData(data: any): StockItem {
  return {
    code: data.Dm,          // 字段名转换为 camelCase
    name: data.mc,
    price: Number(data.p),  // 转换类型
  };
}
```

### 10.2 DeepSeek 规范

**重试策略**:
```typescript
async function generateDescription(prompt: string): Promise<string> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await axios.post(/* ... */);
      return response.data;
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        return ''; // 失败返回空字符串
      }
      await sleep(Math.pow(2, retryCount) * 1000); // 指数退避
    }
  }
}
```

---

## 11. 验收标准

### 11.1 功能验收

| AC 编号 | 验收条件 | 验证方式 |
|---------|----------|----------|
| AC-01 | 管理员手动触发同步，日志可查 | 手动触发 → 检查同步日志 |
| AC-02 | 牛散列表按总市值降序，分页正常 | API 验证排序和分页 |
| AC-03 | 持仓饼图正确，VIP 可见完整明细 | 免费/VIP 分别验证 |
| AC-04 | 涨幅榜今日实时更新，免费最多前20 | 免费验证 ≤20 条 |
| AC-05 | 增持/减持/新进返回正确数据 | 对比原始数据验证 |
| AC-06 | 共同持仓支持多选（≥2），结果正确 | 选3个牛散验证交集 |
| AC-07 | 文章列表置顶优先、分页正常 | 验证排序和筛选 |
| AC-08 | 全局搜索返回匹配牛散和股票 | 搜索已知牛散验证 |
| AC-09 | 收藏/取消收藏正常，重复返回 409 | 重复 POST 验证 409 |
| AC-10 | 自选股增删排序正常 | CRUD 操作验证 |
| AC-11 | 价格提醒触发时发送通知 | 设置提醒 → 检查通知 |
| AC-12 | 管理员可 CRUD 牛散/文章/广告 | 后台操作验证 |
| AC-13 | JWT 认证正常，Token 过期返回 401 | 过期 Token 验证 |
| AC-14 | VIP 拦截返回 HTTP 200 + code:403 | 免费用户验证 |
| AC-15 | 定时任务按 cron 表达式执行 | 检查同步日志时间戳 |
| AC-16 | Redis 缓存命中/未命中响应一致 | 对比缓存过期前后 |
| AC-17 | 外部 API 失败返回降级数据 | 模拟失败验证 |

### 11.2 非功能性需求

| 类别 | 指标 |要求 |
|------|------|------|
| **API 响应时间** | P95 < 500ms | 不含外部 API 调用 |
| **外部 API 降级** | mairuiapi 失败 < 3s | 返回缓存或空数组 |
| **并发支持** | ≥ 100 同时在线 | 一期目标 |
| **数据同步** | 全量同步 < 30 分钟 | 股票+行情+股东+分红 |
| **缓存可用性** | Redis 不可用不影响核心功能 | 自动降级为数据库查询 |
| **分页限制** | page_size 最大 100 | 防止超大查询 |
| **JWT 有效期** | 7 天 | 过期后需重新登录 |
| **密码安全** | bcrypt saltRounds=10 | 不可逆加密 |
| **数据精度** | Decimal/BigInt 转换后精度可接受 | holdCount ≤ 100 亿时不丢失精度 |

---

## 附录

### A. 样板间文件

- `controller.template.ts` - Controller 层样板
- `service.template.ts` - Service 层样板
- `repository.template.ts` - Repository 层样板
- `guard.template.ts` - Guard 样板
- `decorator.template.ts` - Decorator 样板
- `interceptor.template.ts` - Interceptor 样板
- `filter.template.ts` - Filter 样板
- `infrastructure.service.template.ts` - Infrastructure Service 样板
- `scheduler.task.template.ts` - 定时任务样板
- `react.page.template.tsx` - React 页面样板
- `react.component.template.tsx` - React 组件样板
- `swr.hook.template.ts` - SWR Hook 样板
- `type.definition.template.ts` - 类型定义样板

### B. 统一常量

所有项目常量定义在 `src/constants.js`，包括：
- API 响应常量（`RESPONSE_CODE`, `RESPONSE_MESSAGE`）
- 用户角色（`USER_ROLE`）
- 订单状态（`ORDER_STATUS`）
- 支付状态（`PAYMENT_STATUS`）
- 分页配置（`PAGINATION`）
- 缓存配置（`CACHE`）
- 安全配置（`SECURITY`）
- 规则标签（`RULE_TAG`）
- 路由路径（`ROUTE_PATH`）

### C. SQLite 数据库

- `function_registry.db` - 函数注册表（func_name, file_path, purpose, input_spec, output_spec）
- `variable_glossary.db` - 变量术语表（var_pattern, data_type, meaning）
- `error_log.db` - 错误日志（error_type, error_location, error_reason, solution, root_cause_model, root_cause_context, root_cause_interrupt）

### D. 环境自检

- ``src/env-check.js` - 环境自检模块，在应用启动时自动运行
- 后端入口 `apps/server/src/main.ts` - 插入环境自检代码
- 前端入口 `apps/web/src/app/layout.tsx` - 插入环境自检代码
