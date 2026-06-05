# King 财经数据平台 — 一期 PRD

> **版本**: v3.1  
> **日期**: 2026-04-07  
> **核心原则**: 前后端分离 + 三层架构 + 独立基础设施层

**变更日志**：

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v3.1 | 2026-04-07 | 清理过程性描述；扩展安全规则（R21-R23）；补充验收标准和非功能性需求；22 轮自检修复 ~200 项问题 |
| v3.0 | 2026-04-03 | 分层架构重构；从实现引导改为规范驱动；新增 0.4 编码强规则（R1-R20） |
| v2.0 | 初始版本 | 完整业务逻辑和接口定义 |

**目录**：

| 章节 | 内容 |
|------|------|
| 0. 架构总览 | 系统架构图、编码强规则（R1-R23）、技术栈 |
| 1. 项目目录结构 | Monorepo 目录树 |
| 2. 环境变量 | 后端/前端 .env 配置 |
| 3. 数据库模型 | Prisma Schema（20 个 model） |
| 4. 基础设施层设计 | 外部 API、Redis 缓存、定时任务、全局异常过滤器、日志拦截器 |
| 5. 数据同步策略 | 股票/行情/股东/分红/K 线同步规则 |
| 6. 实现优先级 | 一期 6 批次开发计划 |
| 7. 页面实现规范 | 布局系统、HTTP 客户端、SWR Hook、数字格式化 |
| 8. 关键业务逻辑 | 牛散详情/增持减持/涨幅榜/搜索/文章/分红/高管/个人股东/数据清洗 |
| 9. 认证方案 | JWT 认证、登录接口、路由保护 |
| 10. Docker 部署配置 | docker-compose.yml、Dockerfile |
| 11. 启动命令 | 开发/生产环境启动命令 |
| 12. 与 v2.0 的变更对照 | 版本差异对比 |
| 13. 商业化需求 | 会员等级、VIP 付费墙、支付集成、广告系统、数据 API、实现优先级 |
| 14. 用户体验与功能增强 | 首页/牛散/涨幅榜/文章/个人中心/自选股/提醒/通知页面规范 |

**一期验收标准（Acceptance Criteria）**：

| AC 编号 | 验收条件 | 验证方式 |
|---------|----------|----------|
| AC-01 | 管理员可通过后台手动触发数据同步，同步完成后日志可查 | 手动触发 → 检查同步日志状态为 success |
| AC-02 | 牛散列表按总市值降序展示，分页正常（page_size=20） | 调用 API 验证排序和分页 |
| AC-03 | 牛散详情页展示持仓饼图，VIP 用户可见完整持仓明细 | 免费用户验证仅返回概览；VIP 用户验证返回完整数据 |
| AC-04 | 涨幅榜今日数据实时更新，免费用户最多查看前 20 名 | 免费用户验证返回 ≤20 条；VIP 用户验证返回全部 |
| AC-05 | 增持/减持/新进查询返回正确数据，分页正常 | 对比 mairuiapi 原始数据验证 |
| AC-06 | 共同持仓查询支持多选牛散（≥2），结果正确 | 选择 3 个牛散验证交集数据 |
| AC-07 | 文章列表置顶优先、分页正常，巴菲特/木头姐分类过滤正确 | 验证排序和分类筛选 |
| AC-08 | 全局搜索输入关键词返回匹配的牛散和股票 | 搜索已知牛散名称验证 |
| AC-09 | 收藏/取消收藏牛散正常，重复收藏返回 409 | 重复 POST 验证 409 响应 |
| AC-10 | 自选股添加/删除/排序正常 | CRUD 操作验证 |
| AC-11 | 价格提醒在目标价触发时发送通知 | 设置提醒 → 等待触发 → 检查通知 |
| AC-12 | 管理员可 CRUD 牛散/文章/广告 | 后台操作验证 |
| AC-13 | JWT 认证正常，Token 过期返回 401 | 过期 Token 验证 401 响应 |
| AC-14 | VIP 拦截返回 HTTP 200 + code:403 | 免费用户访问 VIP 接口验证 |
| AC-15 | 数据同步定时任务按 cron 表达式执行 | 检查同步日志时间戳 |
| AC-16 | Redis 缓存命中/未命中时 API 返回格式一致 | 对比缓存过期前后的响应结构 |
| AC-17 | 外部 API（mairuiapi/DeepSeek）失败时返回降级数据，不返回 500 | 模拟外部 API 失败验证 |

**非功能性需求**：

| 类别 | 指标 | 说明 |
|------|------|------|
| **API 响应时间** | P95 < 500ms，P99 < 2000ms | 不含外部 API 调用的接口 |
| **外部 API 降级** | mairuiapi 失败时 < 3s 降级 | 超时 3s 后返回缓存或空数组 |
| **并发支持** | ≥ 100 同时在线用户 | 一期目标，基于单实例部署 |
| **数据同步** | 全量同步 < 30 分钟 | 股票列表+行情+股东+分红 |
| **缓存可用性** | Redis 不可用时不影响核心功能 | 自动降级为数据库查询 |
| **分页限制** | page_size 最大 100 | 防止超大查询 |
| **JWT 有效期** | 7 天 | 过期后需重新登录 |
| **密码安全** | bcrypt saltRounds=10 | 不可逆加密 |
| **数据精度** | Decimal/BigInt 转 number 后精度可接受 | holdCount ≤ 100 亿时不丢失精度 |

---

## 0. 架构总览

### 0.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                            │
│                                                                  │
│  ┌──────────────┐     HTTP/JSON     ┌──────────────────────────┐ │
│  │   Next.js    │ ────────────────→ │     NestJS Backend       │ │
│  │   前端       │    :3000 → :4000  │     (API Server)         │ │
│  │              │                   │                          │ │
│  │  App Router  │                   │  ┌────────────────────┐  │ │
│  │  Ant Design  │                   │  │  Controller Layer  │  │ │
│  │  ECharts     │                   │  │  (路由/参数校验/    │  │ │
│  │  SWR         │                   │  │   响应格式化)       │  │ │
│  └──────────────┘                   │  └────────┬───────────┘  │ │
│                                     │           │              │ │
│                                     │  ┌────────▼───────────┐  │ │
│                                     │  │  Service Layer     │  │ │
│                                     │  │  (业务逻辑/计算/    │  │ │
│                                     │  │   跨表聚合)         │  │ │
│                                     │  └────────┬───────────┘  │ │
│                                     │           │              │ │
│                                     │  ┌────────▼───────────┐  │ │
│                                     │  │  Repository Layer  │  │ │
│                                     │  │  (Prisma ORM/      │  │ │
│                                     │  │   数据访问)         │  │ │
│                                     │  └────────┬───────────┘  │ │
│                                     │           │              │ │
│                                     │  ┌────────▼───────────┐  │ │
│                                     │  │  Infrastructure    │  │ │
│                                     │  │  (外部API/缓存/     │  │ │
│                                     │  │   日志/定时任务)    │  │ │
│                                     │  └────────┬───────────┘  │ │
│                                     └───────────┼──────────────┘ │
│                                                 │                │
│                                     ┌───────────▼──────────────┐ │
│                                     │     PostgreSQL 15+       │ │
│                                     │     (数据库)             │ │
│                                     └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 0.2 分层职责

| 层 | 职责 | 规则 |
|----|------|------|
| **Controller** | 路由定义、参数校验、调用 Service、格式化响应 | 禁止直接操作数据库，禁止包含业务逻辑 |
| **Service** | 业务逻辑、计算、跨 Repository 聚合 | 可调用多个 Repository，可调用 Infrastructure |
| **Repository** | 单表/简单关联的数据访问 | 只做 CRUD，禁止业务计算，返回原始数据 |
| **Infrastructure** | 外部 API 封装、缓存、日志、定时任务 | 不依赖 Service 层，被 Service 调用 |

### 0.3 依赖规则

```
Controller → Service → Repository → Database
                    → Infrastructure → 外部世界

禁止：
❌ Controller 直接调用 Repository
❌ Controller 直接调用 Infrastructure
❌ Repository 调用 Service
❌ Service 直接使用 Prisma Client（必须通过 Repository）
❌ 跨层调用（如 Controller → Infrastructure）
```

---

### 0.4 编码强规则（MUST 遵守）

> **本节是编码时的最高优先级规则。违反任何一条都可能导致运行时错误或数据不一致。**

#### 0.4.1 数据类型安全规则

| 规则 | 说明 |
|------|------|
| **R1: Prisma Decimal/BigInt 必须转换** | `Decimal` 字段（如 `amount`, `currentPrice`）必须用 `Number()` 转换后再做数学运算。`BigInt` 字段（如 `holdCount`）同理。**禁止直接对 Prisma 原始返回值做 `+`、`-`、`*`、`/`、`>`、`<` 运算**。**JSON 序列化**：Service 层返回数据前，所有 `Decimal` 和 `BigInt` 字段必须转为 `number`（`Number(value)`），否则 `JSON.stringify()` 会抛出 `TypeError`（BigInt）或返回字符串（Decimal）。`prisma.count()` 返回值也需 `Number()` 转换 |
| **R2: 可空字段必须守卫** | 所有标记 `?` 的 Prisma 字段（如 `currentPrice?`, `vipExpiresAt?`）在使用前必须做 `?? defaultValue` 或 `if (value != null)` 守卫。**禁止直接链式访问可空字段** |
| **R3: 数组索引不等于 Map** | `redis.mget()` 返回的是 `Array`，必须用 `Map` 或数组下标访问。**禁止用字符串 key 直接索引数组**（如 `array[stringKey]`） |
| **R4: .filter(Boolean) 不收窄类型** | TypeScript 的 `.filter(Boolean)` 不会收窄联合类型。需要类型守卫时必须用 `.filter((x): x is NonNullable<typeof x> => Boolean(x))` |

#### 0.4.2 日期时间规则

| 规则 | 说明 |
|------|------|
| **R5: getMonth() 是 0-indexed** | `new Date().getMonth()` 返回 0-11（0=一月，11=十二月）。**禁止加 1 后与 3/6/9 比较**。正确：`month === 2` 对应三月 |
| **R6: 季度报告期格式** | 持仓报告期统一使用 `YYYY-MM-DD` 字符串格式（如 `"2024-09-30"`），对应 Prisma `DateTime @db.Date`。**API 响应中所有 DateTime 字段统一序列化为 ISO 8601 格式**（如 `"2025-09-30T00:00:00.000Z"`），前端按需格式化展示 |
| **R7: 时区统一** | 所有日期比较和存储使用 UTC。前端展示时转换为用户本地时区 |

#### 0.4.3 数据库查询规则

| 规则 | 说明 |
|------|------|
| **R8: JOIN 字段不在查询结果中** | Prisma `findMany` 不 `include` 关联模型时，结果中**不包含**关联模型的字段。如 Holding 查询不 include Investor 时，结果中**没有** `investorName`。需要关联字段时必须显式 `include` 或手动 JOIN |
| **R9: 批量查询替代 N+1** | 遍历列表时需要关联数据，必须先批量查询再构建 `Map`。**禁止在循环内执行数据库查询** |
| **R10: upsert 使用唯一键** | Prisma `upsert` 的 `where` 必须是 `@@unique` 或 `@@id` 字段。复合唯一键用 `@@unique([a, b])` |

#### 0.4.4 API 设计规则

| 规则 | 说明 |
|------|------|
| **R11: 统一响应格式** | 所有 API 响应使用 `{ code: number, message: string, data: T }` 格式。`code` 为 HTTP 状态码或业务码 |
| **R12: VIP 拦截返回 200** | VipGuard 拦截时返回 HTTP 200 + `{ code: 403, message: '该功能需要VIP会员', data: { requiredPlan: 'vip', pricing: { monthly: 49, yearly: 399 } } }`。**禁止返回 HTTP 403**。详细实现见 13.2.2 节 |
| **R13: 外部 API 失败降级** | 调用 mairuiapi / DeepSeek 等外部 API 失败时，返回缓存数据或空数组，**禁止抛 500 错误**。使用 `ExternalApiError` + `AllExceptionsFilter`（即 `http-exception.filter.ts`）降级 |
| **R14: 分页参数统一** | 分页参数统一使用 `page`（从 1 开始）和 `page_size`（默认 20，最大 100） |

#### 0.4.5 前端规则

| 规则 | 说明 |
|------|------|
| **R15: camelCase 统一** | 前端所有字段名使用 camelCase。**禁止使用 snake_case**（如 `publish_date` → `publishDate`） |
| **R16: SWR 错误处理** | 所有 SWR Hook 必须配置 `onError` 回调，展示用户友好的错误提示 |
| **R17: 环境变量前缀** | 前端环境变量必须以 `NEXT_PUBLIC_` 开头，否则 Next.js 不会暴露给客户端 |

#### 0.4.6 安全规则

| 规则 | 说明 |
|------|------|
| **R18: bcrypt 需要 saltRounds** | `bcrypt.hash(password, 10)` 必须传入 saltRounds 参数（推荐 10）。**禁止省略** |
| **R19: API Key 只存哈希** | API Key 明文只在创建时返回一次，数据库只存 `bcrypt hash`。验证时对输入做 hash 后比对 |
| **R20: 管理接口双重守卫** | 所有 `/admin/*` 路由必须同时使用 `JwtAuthGuard` + `AdminGuard` |
| **R21: IDOR 防护** | 所有用户资源接口（收藏、自选股、价格提醒、API Key、订单）必须在 Service 层校验 `resource.userId === currentUser.id`，**禁止仅依赖路径参数直接查询** |
| **R22: 敏感数据脱敏** | API 响应中的手机号必须脱敏为 `138****1234` 格式；API Key 仅返回前 8 位 `ak_xxxx...`；用户密码、支付信息禁止出现在任何响应中 |
| **R23: 管理操作审计** | 所有 `/admin/*` 的写操作（创建/更新/删除）必须写入审计日志，包含 `adminId`、`action`、`targetType`、`targetId`、`ip`、`timestamp` |

---

### 0.5 技术栈（已锁定，不可更改）

| 层 | 技术 | 版本 | 说明 |
|----|------|------|------|
| **前端** | | | |
| 框架 | Next.js (App Router) | 14.x | 仅做前端渲染，不含 API Routes |
| UI | Ant Design | 5.x | Table/Form/Modal/Tag/Tabs |
| UI 增强 | @ant-design/pro-components | 2.x | 虚拟滚动表格（useVirtualAntdTable） |
| 图表 | ECharts (echarts-for-react) | 5.x | 饼图 + K线图 |
| 数据请求 | SWR | 2.x | 客户端数据获取 + 缓存 |
| 语言 | TypeScript | 5.x | 全栈强类型 |
| **后端** | | | |
| 框架 | NestJS | 10.x | Controller/Service/Module 分层 |
| ORM | Prisma | 5.x | 类型安全的数据库操作 |
| 认证 | @nestjs/jwt + passport | — | JWT Token 认证 |
| 定时任务 | @nestjs/schedule | — | 内置 cron 调度 |
| HTTP 客户端 | axios | 1.x | 调用外部 API |
| 校验 | class-validator + class-transformer | — | DTO 参数校验 |
| 密码哈希 | bcrypt | — | 用户密码 + API Key 哈希 |
| 日志 | nestjs-pino | — | 结构化日志 |
| **基础设施** | | | |
| 数据库 | PostgreSQL | 15+ | 关系型 |
| 缓存 | Redis | 7.x | 涨停板/涨幅榜缓存 |
| 包管理器 | pnpm | 8.x | Monorepo |
| 部署 | Docker Compose | — | 前端 + 后端 + DB + Redis |

---

## 1. 项目目录结构（Monorepo，AI 必须严格遵循）

```
king/
├── package.json                         # 根 package.json（workspace 配置）
├── pnpm-lock.yaml                       # 锁文件（部署必需）
├── docker-compose.yml
├── pnpm-workspace.yaml              # Monorepo 配置
│
├── packages/
│   ├── shared/                      # 共享类型 + 常量 + 工具
│   │   ├── package.json
│   │   └── src/
│   │       ├── types/               # 全局 TypeScript 类型定义
│   │       │   ├── investor.ts
│   │       │   ├── stock.ts
│   │       │   ├── holding.ts
│   │       │   ├── article.ts
│   │       │   ├── dividend.ts
│   │       │   └── api.ts           # 通用 API 响应类型
│   │       ├── constants/           # 业务常量
│   │       │   ├── quarter.ts       # 季度计算、财报披露规则
│   │       │   └── format.ts        # 数字/百分比格式化
│   │       └── index.ts             # 统一导出
│   │
│   └── prisma/                      # Prisma Schema（独立包，前后端共用）
│       ├── package.json
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           └── index.ts             # PrismaClient 导出
│
├── apps/
│   ├── web/                         # Next.js 前端（纯渲染，不含 API Routes）
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── next.config.js           # rewrites → 后端 API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx       # 全局布局
│   │   │   │   ├── page.tsx         # 首页
│   │   │   │   ├── globals.css
│   │   │   │   ├── investors/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── top-gainers/page.tsx
│   │   │   │   ├── articles/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── common-holdings/page.tsx
│   │   │   │   ├── investor-increase/page.tsx
│   │   │   │   ├── investor-decrease/page.tsx
│   │   │   │   ├── investor-new/page.tsx
│   │   │   │   ├── executive-increase/page.tsx
│   │   │   │   ├── top-increase/page.tsx
│   │   │   │   ├── individual-shareholders/page.tsx
│   │   │   │   ├── buffett-holdings/page.tsx
│   │   │   │   ├── arkk-holdings/page.tsx
│   │   │   │   ├── dividend-yield/page.tsx
│   │   │   │   ├── login/page.tsx   # 管理员登录
│   │   │   │   ├── watchlist/page.tsx
│   │   │   │   ├── notifications/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   ├── account/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── api-keys/page.tsx
│   │   │   │   │   ├── orders/page.tsx
│   │   │   │   │   └── favorites/page.tsx
│   │   │   │   └── admin/            # 管理后台
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── page.tsx
│   │   │   │       ├── investors/page.tsx
│   │   │   │       ├── articles/page.tsx
│   │   │   │       ├── ads/page.tsx
│   │   │   │       ├── orders/page.tsx
│   │   │   │       ├── users/page.tsx
│   │   │   │       └── api-keys/page.tsx
│   │   │   ├── lib/
│   │   │   │   ├── api.ts           # 后端 API 客户端（axios 实例）
│   │   │   │   └── auth.ts           # 前端 Token 管理
│   │   │   ├── hooks/
│   │   │   │   ├── useInvestors.ts  # SWR Hook
│   │   │   │   ├── useTopGainers.ts
│   │   │   │   ├── useArticles.ts
│   │   │   │   └── useStockPrice.ts
│   │   │   └── components/
│   │   │       ├── layout/           # AppHeader, AppSidebar, AppFooter, AppBreadcrumb, ThemeSwitcher
│   │   │       ├── charts/           # PieChart, KLineChart, SparklineChart
│   │   │       ├── stock/            # StockTable, StockSearch, WatchlistCard, PriceAlertModal, StockCard
│   │   │       ├── investor/         # InvestorCard, InvestorTable, HoldingTable
│   │   │       ├── common/
│   │   │       │   ├── AsyncContent.tsx
│   │   │       │   └── ShareModal.tsx
│   │   │       ├── market/
│   │   │       │   └── MarketOverview.tsx
│   │   │       ├── notification/
│   │   │       │   └── NotificationDropdown.tsx
│   │   │       ├── paywall/
│   │   │       │   └── VipPaywall.tsx
│   │   │       └── lib/
│   │   │           └── theme.ts              # 主题配置（暗色/亮色）
│   │   └── .env.local                # NEXT_PUBLIC_API_URL=http://localhost:4000
│   │
│   └── server/                      # NestJS 后端
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│       │   ├── main.ts               # NestJS 入口
│       │   ├── app.module.ts         # 根模块
│       │   │
│       │   ├── common/               # 公共模块（跨领域复用）
│       │   │   ├── decorators/
│       │   │   │   └── roles.decorator.ts    # @Roles('admin')
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts     # JWT 认证守卫
│       │   │   │   ├── vip.guard.ts
│       │   │   │   └── admin.guard.ts
│       │   │   ├── filters/
│       │   │   │   ├── http-exception.filter.ts  # 全局异常过滤器
│       │   │   │   └── external-api.error.ts     # ExternalApiError 自定义异常
│       │   │   └── interceptors/
│       │   │       ├── logging.interceptor.ts  # 请求日志拦截器
│       │   │       └── api-usage.interceptor.ts
│       │   │
│       │   ├── infrastructure/       # 基础设施层
│       │   │   ├── prisma/
│       │   │   │   ├── prisma.module.ts
│       │   │   │   └── prisma.service.ts      # PrismaClient 单例
│       │   │   ├── redis/
│       │   │   │   ├── redis.module.ts
│       │   │   │   └── redis.service.ts       # Redis 客户端
│       │   │   ├── external-api/
│       │   │   │   ├── external-api.module.ts
│       │   │   │   ├── mairui.service.ts      # mairuiapi 封装
│       │   │   │   ├── deepseek.service.ts    # DeepSeek API 封装
│       │   │   │   └── data-sanitizer.ts
│       │   │   └── scheduler/
│       │   │       ├── scheduler.module.ts
│       │   │       ├── base-sync.task.ts
│       │   │       ├── stock-sync.task.ts
│       │   │       ├── kline-sync.task.ts
│       │   │       └── sync.module.ts           # 同步任务模块注册（汇总导出所有 SyncTask）
│       │   │
│       │   ├── domain/               # 领域层（按业务模块组织）
│       │   │   │
│       │   │   ├── investor/          # 牛散模块
│       │   │   │   ├── investor.module.ts
│       │   │   │   ├── investor.controller.ts  # Controller
│       │   │   │   ├── investor.service.ts     # Service
│       │   │   │   ├── investor.repository.ts  # Repository
│       │   │   │   └── dto/
│       │   │   │       ├── create-investor.dto.ts
│       │   │   │       ├── update-investor.dto.ts
│       │   │   │       └── query-investor.dto.ts
│       │   │   │
│       │   │   ├── holding/            # 持仓分析模块
│       │   │   │   ├── holding.module.ts
│       │   │   │   ├── holding.controller.ts
│       │   │   │   ├── holding.service.ts       # 增持/减持/新进/共同持仓
│       │   │   │   ├── holding.repository.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── stock/              # 股票模块
│       │   │   │   ├── stock.module.ts
│       │   │   │   ├── stock.controller.ts
│       │   │   │   ├── stock.service.ts
│       │   │   │   ├── stock.repository.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── article/            # 文章模块
│       │   │   │   ├── article.module.ts
│       │   │   │   ├── article.controller.ts
│       │   │   │   ├── article.service.ts
│       │   │   │   ├── article.repository.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── dividend/           # 分红模块
│       │   │   │   ├── dividend.module.ts
│       │   │   │   ├── dividend.controller.ts
│       │   │   │   ├── dividend.service.ts
│       │   │   │   ├── dividend.repository.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── executive/          # 高管交易模块
│       │   │   │   ├── executive.module.ts
│       │   │   │   ├── executive.controller.ts
│       │   │   │   ├── executive.service.ts
│       │   │   │   ├── executive.repository.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   ├── top-gainer/         # 涨幅榜模块
│       │   │   │   ├── top-gainer.module.ts
│       │   │   │   ├── top-gainer.controller.ts
│       │   │   │   ├── top-gainer.service.ts
│       │   │   │   └── dto/
│       │   │   │
│       │   │   └── search/             # 搜索模块
│       │   │   │   ├── search.module.ts
│       │   │   │   ├── search.controller.ts
│       │   │   │   ├── search.service.ts
│       │   │   │   └── dto/
│       │   ├── auth/              # 认证模块
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   └── dto/
│       │   ├── admin/             # 管理后台模块
│       │   │   ├── admin.module.ts
│       │   │   ├── admin.controller.ts
│       │   │   └── admin.service.ts
│       │   ├── watchlist/         # 自选股模块
│       │   │   ├── watchlist.module.ts
│       │   │   ├── watchlist.controller.ts
│       │   │   ├── watchlist.service.ts
│       │   │   └── watchlist.repository.ts
│       │   ├── notification/      # 通知模块
│       │   │   ├── notification.module.ts
│       │   │   ├── notification.controller.ts
│       │   │   └── notification.service.ts
│       │   ├── price-alert/       # 价格提醒模块
│       │   │   ├── price-alert.module.ts
│       │   │   ├── price-alert.controller.ts
│       │   │   └── price-alert.service.ts
│       │   ├── api-key/           # API Key 管理模块
│       │   │   ├── api-key.module.ts
│       │   │   ├── api-key.controller.ts
│       │   │   └── api-key.service.ts
│       │   ├── payment/           # 支付模块
│       │   │   ├── payment.module.ts
│       │   │   ├── payment.controller.ts
│       │   │   └── payment.service.ts
│       │   ├── ad/                # 广告模块
│       │   │   ├── ad.module.ts
│       │   │   ├── ad.controller.ts
│       │   │   └── ad.service.ts
│       │   ├── favorite/              # 收藏模块
│       │   │   ├── favorite.module.ts
│       │   │   ├── favorite.controller.ts
│       │   │   └── favorite.service.ts
│       │   ├── order/                 # 订单模块
│       │   │   ├── order.module.ts
│       │   │   ├── order.controller.ts
│       │   │   └── order.service.ts
│       │   ├── account/               # 个人中心模块
│       │   │   ├── account.module.ts
│       │   │   └── account.controller.ts
│       │   ├── data-api/              # 数据 API（X-API-Key 认证）
│       │   │   ├── data-api.module.ts
│       │   │   └── data-api.controller.ts
│       │   ├── individual-shareholder/ # 个人股东模块
│       │   │   ├── individual-shareholder.module.ts
│       │   │   ├── individual-shareholder.controller.ts
│       │   │   └── individual-shareholder.service.ts
│       │   ├── export/                # 数据导出模块
│       │   │   ├── export.module.ts
│       │   │   └── export.controller.ts
│       │
│       │   └── config/
│       │   │   ├── jwt.strategy.ts     # Passport JWT 策略
│       │   │   ├── config.module.ts    # 环境变量配置
│       │   │   └── .env                        # 后端环境变量
│
└── .env.example                       # 环境变量模板（合并 2.1 + 2.2 所有变量）
```

---

## 2. 环境变量

### 2.1 后端（apps/server/.env）

```env
# 应用
PORT=4000
NODE_ENV=development

# 数据库
DATABASE_URL="postgresql://king:king123@localhost:5432/king"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET="your-random-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# mairuiapi
MAIRUI_API_LICENCE="your-licence-key"
MAIRUI_API_BASE="http://api.mairuiapi.com"
MAIRUI_API_REALTIME_BASE="http://a.mairuiapi.com"  // 实时全部接口独立域名（见 8.6.4）

# DeepSeek
DEEPSEEK_API_KEY="your-deepseek-key"
DEEPSEEK_API_BASE="https://api.deepseek.com/v1"

# 日志
LOG_LEVEL=debug

# 阿里云短信（用户注册验证码）
ALIYUN_SMS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_SMS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_SMS_SIGN_NAME=King财经
ALIYUN_SMS_TEMPLATE_CODE=SMS_123456

# 微信支付
WECHAT_PAY_APP_ID=your-app-id
WECHAT_PAY_MCH_ID=your-mch-id
WECHAT_PAY_API_KEY=your-api-key
WECHAT_PAY_NOTIFY_URL=https://api.kingdata.cn/api/v1/payment/callback/wechat

# 支付宝
ALIPAY_APP_ID=your-app-id
ALIPAY_PRIVATE_KEY=your-private-key
ALIPAY_PUBLIC_KEY=your-public-key
ALIPAY_NOTIFY_URL=https://api.kingdata.cn/api/v1/payment/callback/alipay
```

### 2.2 前端（apps/web/.env.local）

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME="King 财经数据平台"  // 用于页面 title、SEO meta 等
```

### 2.3 Next.js 代理配置（apps/web/next.config.js）

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
```

---

## 3. 数据库模型（Prisma Schema）

> **注意**: 本章为完整的、可直接运行的 Prisma Schema。所有模型定义已合并至此，其他章节不再单独列出。

```prisma
// packages/prisma/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 用户与认证 ====================

model User {
  id            String    @id @default(uuid())
  phone         String?   @unique
  email         String?   @unique
  passwordHash  String?
  nickname      String?
  role          String    @default("user")   // user | admin（VIP 状态由 vipExpiresAt 决定）
  vipExpiresAt  DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  favorites     UserFavorite[]
  watchlists    Watchlist[]
  priceAlerts   PriceAlert[]
  notifications Notification[]
  apiKeys       ApiKey[]
  orders        Order[]
  memberLogs    MemberLog[]

  @@map("users")
}

// ==================== 牛散与持仓 ====================

model Investor {
  id          String    @id @default(uuid())
  name        String
  description String?
  remark      String?   @db.Text
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  holdings    Holding[]
  favorites   UserFavorite[]

  @@map("investors")
}

model Holding {
  id          String   @id @default(uuid())
  investorId  String
  stockCode   String
  stockName   String
  holdCount   BigInt
  // 预留字段：当前版本不写入，查询时通过对比上期持仓实时计算（见 8.1.2）
  holdChange  BigInt?
  holdRatio   Decimal? @db.Decimal(8, 4)
  reportDate  DateTime @db.Date
  actualCost  Decimal? @db.Decimal(18, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  investor    Investor @relation(fields: [investorId], references: [id], onDelete: Cascade)

  @@unique([investorId, stockCode, reportDate])
  @@index([investorId, reportDate])
  @@index([stockCode])
  @@index([reportDate])              // 十大增持/减持查询仅按 reportDate 过滤（见 8.3.2、8.3.3）
  @@map("holdings")
}

// ==================== 股票与K线 ====================

model Stock {
  code            String       @id
  name            String
  market          String       @default("SZ")
  mainBusiness    String?      @db.Text
  currentPrice    Decimal?     @db.Decimal(10, 2)
  totalMarketCap  Decimal?     @db.Decimal(18, 2)
  isActive        Boolean      @default(true)
  priceUpdatedAt  DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  klineDaily      KlineDaily[]

  @@index([isActive])
  @@map("stocks")
}

model KlineDaily {
  id        String   @id @default(uuid())
  stockCode String
  date      DateTime @db.Date
  open      Float
  high      Float
  low       Float
  close     Float
  volume    Float
  amount    Float

  stock     Stock    @relation(fields: [stockCode], references: [code], onDelete: Cascade)

  @@unique([stockCode, date])
  @@map("kline_daily")
}

// ==================== 文章 ====================

model Article {
  id          String   @id @default(uuid())
  title       String
  summary     String?  @db.Text
  content     String?  @db.Text
  coverImage  String?
  category    String?  @default(null)  // null=普通文章, 'buffett', 'arkk'
  publishDate DateTime?
  isPinned    Boolean  @default(false)
  author      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category, publishDate])
  @@map("articles")
}

// ==================== 高管交易 ====================

model ExecutiveTrade {
  id            String   @id @default(uuid())
  stockCode     String
  stockName     String
  executiveName String
  tradeAmount   Decimal? @db.Decimal(18, 2)
  tradeType     String   @default("increase")
  tradeDate     DateTime @db.Date
  createdAt     DateTime @default(now())

  @@index([stockCode, tradeDate])
  @@map("executive_trades")
}

// ==================== 分红 ====================

model Dividend {
  id             String   @id @default(uuid())
  stockCode      String
  stockName      String
  dividendAmount Decimal  @db.Decimal(10, 4)
  exDate         DateTime @db.Date
  recordDate     DateTime @db.Date
  dividendYear   Int
  priceOnExDate  Decimal? @db.Decimal(10, 2)

  @@unique([stockCode, dividendYear, exDate])
  @@index([stockCode, dividendYear])
  @@index([dividendYear])             // 股息率排行榜按 dividendYear 全表查询（见 8.7）
  @@map("dividends")
}

// ==================== 用户收藏 ====================

model UserFavorite {
  id          String   @id @default(uuid())
  userId      String
  investorId  String
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  investor    Investor @relation(fields: [investorId], references: [id], onDelete: Cascade)

  @@unique([userId, investorId])
  @@map("user_favorites")
}

// ==================== 自选股 ====================

model Watchlist {
  id        String   @id @default(uuid())
  userId    String
  stockCode String
  stockName String
  group     String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, stockCode])
  @@map("watchlists")
}

// ==================== 价格提醒 ====================

model PriceAlert {
  id          String    @id @default(uuid())
  userId      String
  stockCode   String
  stockName   String
  targetPrice Decimal   @db.Decimal(10, 2)
  direction   String    @default("above")  // 'above' | 'below'
  isActive    Boolean   @default(true)
  triggeredAt DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([isActive, triggeredAt])
  @@index([userId])                   // 用户查询自己的提醒列表（GET /price-alerts）
  @@map("price_alerts")
}

// ==================== 通知 ====================

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // 'price_alert' | 'system' | 'vip_expire'
  title     String
  content   String   @db.Text
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt])
  @@map("notifications")
}

// ==================== 同步日志 ====================

model SyncLog {
  id          String   @id @default(uuid())
  taskName    String
  status      String   @default("pending")  // 'pending' | 'running' | 'success' | 'failed'
  message     String?  @db.Text
  startedAt   DateTime?
  finishedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([createdAt])
  @@map("sync_logs")
}

// ==================== API Key ====================

model ApiKey {
  id          String   @id @default(uuid())
  userId      String
  keyHash     String   @unique
  keyPrefix   String
  plan        String   @default("free")  // 'free' | 'basic' | 'pro' | 'enterprise'
  dailyLimit  Int      @default(100)
  expiresAt   DateTime  // 创建时设置为 now() + 30 分钟
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  usageLogs   ApiUsageLog[]

  @@index([userId])
  @@map("api_keys")
}

model ApiUsageLog {
  id           String   @id @default(uuid())
  apiKeyId     String
  endpoint     String
  method       String
  statusCode   Int
  responseTime Int
  createdAt    DateTime @default(now())

  apiKey       ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId, createdAt])
  @@map("api_usage_logs")
}

// ==================== 订单 ====================

model Order {
  id          String   @id @default(uuid())
  userId      String
  orderNo     String   @unique
  productType String   // 'vip_monthly' | 'vip_yearly' | 'api_basic' | 'api_pro' | 'api_enterprise'
  amount      Decimal  @db.Decimal(10, 2)
  status      String   @default("pending")  // 'pending' | 'paid' | 'expired' | 'refunded'
  payMethod   String?  // 'wechat' | 'alipay'
  payTradeNo  String?
  paidAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])  // 保留财务记录，不级联删除

  @@index([userId])
  @@map("orders")
}

model MemberLog {
  id           String   @id @default(uuid())
  userId       String
  action       String   // 'activate' | 'renew' | 'upgrade' | 'expire'
  plan         String
  durationDays Int
  expiresAt    DateTime
  orderId      String?
  createdAt    DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])  // 保留会员记录，不级联删除

  @@index([userId])
  @@map("member_logs")
}

// ==================== 广告 ====================

model Ad {
  id          String   @id @default(uuid())
  title       String
  imageUrl    String
  targetUrl   String
  position    String   // 'home-banner' | 'home-sidebar' | 'article-inline' | 'gainers-bottom' | 'investor-sidebar'
  weight      Int      @default(1)
  priority    Int      @default(0)
  impressions Int      @default(0)
  clicks      Int      @default(0)
  isActive    Boolean  @default(true)
  startAt     DateTime
  endAt       DateTime
  createdAt   DateTime @default(now())

  logs        AdLog[]

  @@index([position, isActive])
  @@map("ads")
}

model AdLog {
  id        String   @id @default(uuid())
  adId      String
  type      String   // 'impression' | 'click'
  userId    String?
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())

  ad        Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)

  @@index([adId, type, createdAt])
  @@map("ad_logs")
}
```

---

## 4. 基础设施层设计

### 4.1 外部 API 封装（Infrastructure → external-api）

所有外部 API 调用**必须且只能**通过 Infrastructure 层的 Service 进行，Domain 层通过依赖注入使用。

```typescript
// apps/server/src/infrastructure/external-api/mairui.service.ts

// ==================== 外部 API 返回类型 ====================

interface StockItem { Dm: string; mc: string; jys: string }
interface RealtimeQuote { dm: string; p: number; o: number; h: number; l: number; yc: number; cje: number; v: number; pc: number; pe: number; sz: number; lt: number }
interface RealtimeAllItem { dm: string; mc: string; p: number; pc: number; sz: number }
interface LimitUpItem { dm: string; Mc: string; p: number; zf: number; Lbc: number; fbt: number; zj: number; hy: string }
interface ShareholderItem { gdsm: string; cgsl: string; cgbl: string }
interface ShareholderData { jzrq: string; sdgd: ShareholderItem[] }
interface CompanyInfo { sshy: string; jyfw: string; qyjs: string }
interface DividendItem { Send: string; cdate: string; edate: string; sdate: string }
interface KlineItem { t: string; o: number; h: number; l: number; c: number; v: number; a: number }

@Injectable()
export class MairuiService {
  private readonly BASE = process.env.MAIRUI_API_BASE;
  private readonly LICENCE = process.env.MAIRUI_API_LICENCE;

  constructor(private readonly logger: Logger) {}

  // 股票列表（纯数字代码，无需后缀）
  async getStockList(): Promise<StockItem[]> { /* ... */ }

  // 实时行情（纯数字代码，无需后缀）
  async getRealtimeQuote(stockCode: string): Promise<RealtimeQuote> { /* ... */ }

  // 全市场实时行情（返回所有股票）
  async getRealtimeAllStocks(): Promise<RealtimeAllItem[]> { /* ... */ }

  // 批量实时行情（最多20个纯数字代码）
  async getRealtimeQuotesBatch(stockCodes: string[]): Promise<RealtimeQuote[]> { /* ... */ }

  // 涨停股池（日期格式 yyyy-MM-dd）
  async getTopLimitUp(date: string): Promise<LimitUpItem[]> { /* ... */ }

  // 十大股东（纯数字代码，无需后缀）
  async getTopShareholders(stockCode: string): Promise<ShareholderData> { /* ... */ }

  // 公司简介（纯数字代码，无需后缀）
  async getCompanyInfo(stockCode: string): Promise<CompanyInfo> { /* ... */ }

  // 分红记录（纯数字代码，无需后缀）
  async getDividendHistory(stockCode: string): Promise<DividendItem[]> { /* ... */ }

  // 历史K线（需要.SZ/.SH后缀）
  async getHistoryKline(symbol: string, period: string, adjust: string, opts?: { st?: string; et?: string }): Promise<KlineItem[]> { /* ... */ }
}
```

```typescript
// apps/server/src/infrastructure/external-api/deepseek.service.ts
// 完整实现见 8.13 节
@Injectable()
export class DeepseekService {
  constructor(private readonly logger: Logger) {}

  async getMainBusiness(stockName: string, stockCode: string): Promise<string> {
    // 调用 DeepSeek API，含重试、超时、错误处理
    // 完整实现规范见 8.13 节
    // 失败时返回空字符串，不抛异常
  }
}
```

### 4.2 Redis 缓存（Infrastructure → redis）

```typescript
// apps/server/src/infrastructure/redis/redis.service.ts
@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> { /* ... */ }
  async set(key: string, value: any, ttl?: number): Promise<void> { /* ... */ }
  async del(key: string): Promise<void> { /* ... */ }
  async mget(keys: string[]): Promise<(string | null)[]> { /* ... */ }
}
```

**缓存策略**:

| 数据 | Key 格式 | TTL | 说明 |
|------|----------|-----|------|
| 涨停板 | `limitup:{YYYYMMDD}` | 10 分钟 | 盘中每10分钟刷新。缓存结构：已转换为 `TopGainerItem[]` 格式（语义化字段名），非 mairuiapi 原始字段 |
| 历史涨幅 | `gainers:{period}:{YYYY-MM-DD}` | 24 小时 | 每日收盘后计算 |
| 股票实时价 | `stock:price:{code}` | 30 秒 | 盘中高频刷新。缓存结构：`{ currentPrice: number, totalMarketCap: number, priceUpdatedAt: string }`（仅缓存 API 所需字段，非完整 RealtimeQuote） |
| 十大股东 | `individual_shareholders:{YYYY-MM-DD}` | 24 小时 | 每日同步后缓存 |

> 注：今日涨幅（`gainers:today`）和搜索结果（`search:{keyword}`）一期暂不使用 Redis 缓存，直接实时查询。
> 缓存 key 日期格式规范：涨停板使用 `YYYYMMDD`（无连字符，与 mairuiapi 参数一致），其余统一使用 `YYYY-MM-DD`（ISO 日期格式）。

**Redis 降级策略**：

| 场景 | 处理方式 |
|------|----------|
| Redis 连接失败 | 跳过缓存，直接查询数据库。`RedisService.get()` 返回 `null` 时等同于缓存未命中 |
| Redis 连接超时 | 设置 2 秒超时，超时后降级为数据库查询 |
| Redis 服务不可用 | 应用启动时 Redis 连接失败不阻塞启动，仅打印警告日志。运行时操作（get/set）失败时静默降级 |

### 4.3 定时任务（Infrastructure → scheduler）

```markdown
<!-- 注：定时任务的完整实现见第 8.12 节（StockSyncTask）和第 8.17 节（KlineSyncTask）。 -->
<!-- 此处仅列出所有定时任务的调度清单： -->

| 任务 | Cron 表达式 | 实现类.方法 |
|------|------------|-------------|
| 股票列表同步 | `30 16 * * 1-5` | StockSyncTask.syncStockList() |
| 实时行情刷新 | `*/5 9-15 * * 1-5` | StockSyncTask.syncRealtimeQuotes() |
| 涨停板数据 | `*/10 9-15 * * 1-5` | StockSyncTask.syncLimitUp() |
| K线数据同步 | `30 17 * * 1-5` | KlineSyncTask.syncTodayKline() |
| 历史涨幅预计算 | `30 17 * * 1-5` | KlineSyncTask.recalcAllPeriodGainers()（在 syncTodayKline 内部调用） |
| 价格提醒检查 | `* 9-15 * * 1-5` | PriceAlertService.checkPriceAlerts() |
| 订单过期检查 | `*/5 * * * *` | OrderService.expirePendingOrders()（每5分钟检查超时未支付订单）
```

### 4.4 全局异常过滤器

> **文件**: `apps/server/src/common/filters/http-exception.filter.ts`

**异常处理规范**：

| 异常类型 | 处理方式 | HTTP 状态码 | 响应格式 |
|----------|----------|-------------|----------|
| `ExternalApiError` | 返回降级数据，不抛 500 | 200 | `{ code: 200, message: '数据获取失败，已返回缓存', data: fallbackData ?? [] }` |
| `HttpException`（业务异常） | 提取 status 和 message，重组为 R11 格式 | 异常自身 status | `{ code: status, message: exception.message, data: null }` |
| NestJS 内置异常（Guard/Pipe） | `UnauthorizedException`、`ForbiddenException`、`BadRequestException` 等由 Guard/Pipe 自动抛出，过滤器统一重组为 R11 格式 | 异常自身 statusCode | `{ code: statusCode, message: exception.message, data: null }` |
| 其他未知异常 | 兜底处理 | 500 | `{ code: 500, message: '服务器内部错误', data: null }` |

**关键约束**：
- 外部 API 错误必须返回 200 + 降级数据，避免前端全局错误弹窗
- `fallbackData` 缺省值为空数组 `[]`
- 所有异常响应（包括 NestJS 内置的 Guard/Pipe 异常）必须由 `http-exception.filter.ts` 统一组装为 R11 格式 `{ code, message, data }`

**统一错误码规范**：

`code` 字段优先使用 HTTP 状态码语义，业务场景需要更细粒度时使用 `1xxxx` 业务码：

| code | 含义 | 使用场景 |
|------|------|----------|
| 200 | 成功 | 所有正常响应 |
| 400 | 请求参数错误 | 参数校验失败、缺少必填字段 |
| 401 | 未认证 | JWT Token 缺失或无效 |
| 403 | 无权限 | 非管理员访问管理接口、VIP 功能未开通 |
| 404 | 资源不存在 | 牛散/股票/文章不存在 |
| 409 | 资源冲突 | 重复收藏、重复添加自选股 |
| 429 | 请求频率超限 | API Key 调用超限、短信验证码频率限制 |
| 500 | 服务器内部错误 | 未预期的异常（过滤器兜底） |

**ExternalApiError 处理路径**：Service 层调用外部 API 时，使用 try-catch 包裹，catch 中构造 `ExternalApiError(message, fallbackData)` 并**抛出**，由 `http-exception.filter.ts` 全局过滤器捕获后返回 200 + 降级数据。禁止在 Service 层直接返回降级数据（避免不同 Service 处理方式不一致）。

### 4.5 日志拦截器

> **文件**: `apps/server/src/common/interceptors/logging.interceptor.ts`

**日志拦截器规范**：

| 项目 | 规范 |
|------|------|
| 拦截内容 | HTTP method、URL、响应状态码、请求耗时（ms） |
| 输出格式 | `{METHOD} {URL} {statusCode} - {duration}ms` |
| 环境差异 | 开发环境：`console.log` 输出；生产环境：写入日志服务（不打印到控制台） |
| 实现方式 | NestJS `@Injectable()` + `NestInterceptor`，使用 RxJS `tap` 操作符 |

**关键约束**：
- 拦截器为全局注册，覆盖所有路由
- 耗时从请求进入开始计算，到响应返回结束

---

### 4.6 后端 API 路由汇总

> 所有后端 API 端点的完整清单。基础路径：`/api/v1`

#### 4.6.1 公开接口（无需认证）

| Method | 路径 | 说明 | Controller |
|--------|------|------|------------|
| GET | `/investors` | 牛散列表（基础：姓名+总市值，完整版见VIP接口） | InvestorController |
| GET | `/investors/:id` | 牛散详情（免费：概览信息；VIP：完整持仓明细+饼图，Service 层按 VIP 状态返回不同数据量） | InvestorController |
| GET | `/top-gainers` | 涨幅榜（免费：今日涨幅前 20 名基础信息；VIP：全部周期+连板/封板资金/行业扩展字段，见 13.2.1 会员等级表） | TopGainerController |
| GET | `/articles` | 文章列表 | ArticleController |
| GET | `/articles/:id` | 文章详情 | ArticleController |
| GET | `/search` | 全局搜索（免费：基础搜索；VIP：高级搜索，见 13.2.1 会员等级表） | SearchController |
| GET | `/ads` | 获取广告 | AdController |
| POST | `/ads/:id/click` | 记录广告点击 | AdController |
| GET | `/market/overview` | 市场概览（三大指数） | StockController |
| POST | `/auth/login` | 用户登录 | AuthController |
| POST | `/auth/register` | 用户注册 | AuthController |
| POST | `/auth/sms-code` | 发送短信验证码 | AuthController |

#### 4.6.2 用户接口（需 JWT）

| Method | 路径 | 说明 | Guard |
|--------|------|------|-------|
| GET | `/account/profile` | 获取个人信息 | JwtAuthGuard |
| PUT | `/account/profile` | 更新个人信息 | JwtAuthGuard |
| GET | `/account/favorites` | 我的收藏（牛散），支持分页（R14），按 `createdAt desc` 排序 | JwtAuthGuard |
| POST | `/account/favorites/:investorId` | 收藏牛散 | JwtAuthGuard |
| DELETE | `/account/favorites/:investorId` | 取消收藏 | JwtAuthGuard |
| GET | `/watchlist` | 自选股列表 | JwtAuthGuard |
| POST | `/watchlist` | 添加自选股 | JwtAuthGuard |
| DELETE | `/watchlist/:id` | 删除自选股 | JwtAuthGuard |
| GET | `/price-alerts` | 价格提醒列表 | JwtAuthGuard |
| POST | `/price-alerts` | 创建价格提醒 | JwtAuthGuard |
| DELETE | `/price-alerts/:id` | 删除价格提醒 | JwtAuthGuard |
| GET | `/notifications` | 通知列表 | JwtAuthGuard |
| PUT | `/notifications/read-all` | 全部已读 | JwtAuthGuard |
| GET | `/account/api-keys` | API Key 列表 | JwtAuthGuard |
| POST | `/account/api-keys` | 创建 API Key | JwtAuthGuard |
| DELETE | `/account/api-keys/:id` | 删除 API Key | JwtAuthGuard |
| GET | `/orders` | 订单列表 | JwtAuthGuard |
| POST | `/payment/create` | 创建支付订单 | JwtAuthGuard |
| GET | `/payment/status/:orderNo` | 查询支付状态 | JwtAuthGuard |

#### 4.6.3 VIP 接口（需 JWT + VIP）

> 注：以上接口仅对 VIP 用户开放。免费用户访问将收到 HTTP 200 + body.code:403 + 付费引导提示（见 13.2.2 VipGuard）。

| Method | 路径 | 说明 | Guard |
|--------|------|------|-------|
| GET | `/holdings/increase` | 牛散增持（VIP） | JwtAuthGuard + VipGuard |
| GET | `/holdings/decrease` | 牛散减持（VIP） | JwtAuthGuard + VipGuard |
| GET | `/holdings/new` | 牛散新进（VIP） | JwtAuthGuard + VipGuard |
| GET | `/holdings/common` | 共同持仓（VIP） | JwtAuthGuard + VipGuard |
| GET | `/top-increase` | 十大增持（VIP） | JwtAuthGuard + VipGuard |
| GET | `/dividend-yield` | 分红股息率（VIP） | JwtAuthGuard + VipGuard |
| GET | `/executive-increase` | 高管增持（VIP） | JwtAuthGuard + VipGuard |
| GET | `/individual-shareholders` | 个人股东（VIP） | JwtAuthGuard + VipGuard |
| POST | `/export/:type` | 数据导出 Excel（VIP） | JwtAuthGuard + VipGuard |

#### 4.6.4 管理员接口（需 JWT + Admin）

| Method | 路径 | 说明 | Guard |
|--------|------|------|-------|
| POST | `/admin/investors` | 创建牛散 | JwtAuthGuard + AdminGuard |
| PUT | `/admin/investors/:id` | 更新牛散 | JwtAuthGuard + AdminGuard |
| DELETE | `/admin/investors/:id` | 删除牛散 | JwtAuthGuard + AdminGuard |
| POST | `/admin/articles` | 创建文章 | JwtAuthGuard + AdminGuard |
| PUT | `/admin/articles/:id` | 更新文章 | JwtAuthGuard + AdminGuard |
| DELETE | `/admin/articles/:id` | 删除文章 | JwtAuthGuard + AdminGuard |
| POST | `/admin/sync/:task` | 手动触发同步 | JwtAuthGuard + AdminGuard |
| GET | `/admin/sync/logs` | 同步日志 | JwtAuthGuard + AdminGuard |
| GET | `/admin/users` | 用户列表 | JwtAuthGuard + AdminGuard |
| GET | `/admin/orders` | 订单列表 | JwtAuthGuard + AdminGuard |
| PUT | `/admin/orders/:id/refund` | 订单退款（一期预留） | JwtAuthGuard + AdminGuard |
| GET | `/admin/ads` | 广告列表 | JwtAuthGuard + AdminGuard |
| POST | `/admin/ads` | 创建广告 | JwtAuthGuard + AdminGuard |
| GET | `/admin/api-keys` | API Key 列表 | JwtAuthGuard + AdminGuard |
| PUT | `/admin/api-keys/:id` | 更新 API Key（禁用/调整套餐） | JwtAuthGuard + AdminGuard |
| PUT | `/admin/ads/:id` | 更新广告 | JwtAuthGuard + AdminGuard |
| DELETE | `/admin/ads/:id` | 删除广告 | JwtAuthGuard + AdminGuard |

#### 4.6.5 外部回调（签名验证）

| Method | 路径 | 说明 |
|--------|------|------|
| POST | `/payment/callback/wechat` | 微信支付异步通知 |
| POST | `/payment/callback/alipay` | 支付宝异步通知 |

#### 4.6.6 数据 API（API Key 认证）

| Method | 路径 | 说明 | 认证 |
|--------|------|------|------|
| GET | `/data/stocks` | 股票列表 | X-API-Key |
| GET | `/data/stocks/:code/quote` | 实时行情 | X-API-Key |
| GET | `/data/top-gainers` | 涨幅榜 | X-API-Key |
| GET | `/data/limit-up` | 涨停板 | X-API-Key（basic+） |
| GET | `/data/investors` | 牛散列表 | X-API-Key（pro+） |
| GET | `/data/investors/:id/holdings` | 牛散持仓 | X-API-Key（pro+） |
| GET | `/data/holdings/increase` | 增持列表 | X-API-Key（pro+） |
| GET | `/data/dividends` | 分红数据 | X-API-Key（pro+） |

---

## 5. 数据同步策略

同步逻辑由 **Service 层**实现，由 **Infrastructure → scheduler** 调度执行。

| 任务 | 频率 | 调度方式 | 实现位置 |
|------|------|----------|----------|
| 股票列表同步 | 每日 16:30 | @Cron | StockSyncTask.syncStockList() |
| 实时行情刷新 | 盘中每 5 分钟 | @Cron | StockSyncTask.syncRealtimeQuotes() |
| 涨停板数据 | 盘中每 10 分钟 | @Cron | StockSyncTask.syncLimitUp() |
| 历史涨幅预计算 | 每日 17:30（由 K线同步内部调用） | @Cron | KlineSyncTask.syncTodayKline() → recalcAllPeriodGainers() |
| 十大股东同步 | 每季度财报披露后 | 手动触发 API | StockSyncTask.syncShareholders() |
| 分红数据同步 | 每季度 | 手动触发 API | StockSyncTask.syncDividends() |
| 主营业务补充 | 按需 | 首次入库时 | StockSyncTask.syncStockList()（Step 4 内联实现） |
| K线数据同步 | 每日 17:30 | @Cron | KlineSyncTask.syncTodayKline() |
| 价格提醒检查 | 盘中每分钟 | @Cron | PriceAlertService.checkPriceAlerts() |

> 注：除上述定时任务外，以下任务通过管理员手动触发（POST /api/v1/admin/sync/:task）：
> - 十大股东同步 → StockSyncTask.syncShareholders()
> - 分红数据同步 → StockSyncTask.syncDividends()

**手动触发**: 管理员可通过 POST `/api/v1/admin/sync/{task}` 手动触发同步。

---

## 6. 实现优先级（AI 分批生成顺序）

### 6.1 第一批：项目骨架

| 序号 | 任务 | 产出文件 |
|------|------|----------|
| 1.1 | Monorepo 初始化（pnpm workspace） | pnpm-workspace.yaml, package.json |
| 1.2 | packages/shared 共享类型 | packages/shared/src/**/*.ts |
| 1.3 | packages/prisma Schema + 迁移 | packages/prisma/** |
| 1.4 | Docker Compose（PostgreSQL + Redis） | docker-compose.yml |
| 1.5 | NestJS 后端骨架（main.ts, app.module.ts） | apps/server/src/main.ts |
| 1.6 | Infrastructure 层（Prisma, Redis, External API） | apps/server/src/infrastructure/** |
| 1.7 | 全局异常过滤器 + 日志拦截器 | apps/server/src/common/** |

### 6.2 第二批：核心领域（牛散 + 股票）

| 序号 | 任务 | 产出文件 |
|------|------|----------|
| 2.1 | Investor 模块（Controller + Service + Repository） | apps/server/src/domain/investor/** |
| 2.2 | Stock 模块（Controller + Service + Repository） | apps/server/src/domain/stock/** |
| 2.3 | Holding 模块（增持/减持/新进/共同持仓） | apps/server/src/domain/holding/** |
| 2.4 | JWT 认证（Strategy + Guard + Decorator） | apps/server/src/config/**, apps/server/src/common/** |

### 6.3 第三批：前端骨架

| 序号 | 任务 | 产出文件 |
|------|------|----------|
| 3.1 | Next.js 初始化 + 代理配置 | apps/web/next.config.js |
| 3.2 | 全局布局（Header + Sidebar + Footer） | apps/web/src/components/layout/** |
| 3.3 | API 客户端 + SWR Hooks | apps/web/src/lib/**, apps/web/src/hooks/** |
| 3.4 | 首页 | apps/web/src/app/page.tsx |
| 3.5 | 牛散列表页 + 详情页 | apps/web/src/app/investors/** |

### 6.4 第四批：剩余后端模块

| 序号 | 任务 | 产出文件 |
|------|------|----------|
| 4.1 | Article 模块 | apps/server/src/domain/article/** |
| 4.2 | Dividend 模块 | apps/server/src/domain/dividend/** |
| 4.3 | Executive 模块 | apps/server/src/domain/executive/** |
| 4.4 | TopGainer 模块 | apps/server/src/domain/top-gainer/** |
| 4.5 | Search 模块 | apps/server/src/domain/search/** |
| 4.6 | 定时同步任务 | apps/server/src/infrastructure/scheduler/** |
| 4.7 | 个人股东模块 | apps/server/src/domain/individual-shareholder/** |
| 4.8 | 同步监控与告警 | apps/server/src/domain/admin/sync-logs 相关（见 8.19） |

### 6.5 第五批：剩余前端页面

| 序号 | 任务 | 产出文件 |
|------|------|----------|
| 5.1 | 涨幅榜 + 涨停板 | apps/web/src/app/top-gainers/** |
| 5.2 | 增持/减持/新进/共同持仓 | apps/web/src/app/investor-*/** |
| 5.3 | 文章 + 分红 + 高管 + 搜索 | apps/web/src/app/articles/**, dividend-yield/**, etc. |
| 5.4 | 管理后台（登录 + CRUD 界面） | apps/web/src/app/admin/**, apps/web/src/app/login/** |

### 6.6 第六批：体验增强（一期 UX，见 14.11）

| 序号 | 任务 | 产出文件 |
|------|------|----------|
| 6.1 | 暗色/亮色主题切换 | apps/web/src/components/lib/theme.ts, apps/web/src/components/layout/ThemeSwitcher.tsx |
| 6.2 | 涨跌颜色规范 + 全局样式 | packages/shared/src/constants/format.ts |
| 6.3 | 加载/空/错误三态组件 | apps/web/src/components/common/AsyncContent.tsx |
| 6.4 | 面包屑导航 | apps/web/src/components/layout/AppBreadcrumb.tsx |
| 6.5 | 表格增强（排序/筛选/固定列/吸顶） | 各页面 Table 组件 |
| 6.6 | 搜索增强（debounce + 建议列表） | apps/web/src/components/stock/StockSearch.tsx |
| 6.7 | 骨架屏 | 各页面 loading 状态 |

### 6.7 后续批次（商业化 + 高级体验）

> 完整的二期/三期优先级参见：
> - 商业化功能：第 13.9 节
> - 体验功能：第 14.11 节

---

## 7. 页面实现规范

### 7.1 全局布局

```
┌──────────────────────────────────────────────────────────┐
│  AppHeader: Logo | 导航菜单(首页/牛散/涨幅榜/...) | 搜索框 │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│ AppSidebar │              Page Content                   │
│ (可收起)    │                                             │
│            │                                             │
│  - 牛散     │                                             │
│  - 涨幅榜   │                                             │
│  - 共同持仓  │                                             │
│  - 增持     │                                             │
│  - 减持     │                                             │
│  - 新进     │                                             │
│  - ...      │                                             │
│            │                                             │
├────────────┴─────────────────────────────────────────────┤
│  AppFooter: © 2025 King 财经数据平台                      │
└──────────────────────────────────────────────────────────┘
```

**Ant Design 组件**: Layout.Header + Layout.Sider + Layout.Footer + Menu

### 7.2 前端 API 客户端

> **文件**: `apps/web/src/lib/api.ts`

**API 客户端规范**：

| 项目 | 规范 |
|------|------|
| baseURL | `/api`（通过 Next.js rewrites 代理到后端 `:4000`） |
| 超时时间 | 15000ms（15秒） |
| 请求拦截 | 自动从 `getToken()` 读取 Token，附加 `Authorization: Bearer {token}` 请求头 |
| 响应拦截（成功） | 直接返回 `res.data`（解包 axios 响应层） |
| 响应拦截（失败） | 401 状态码 → 自动跳转 `/login`；其他错误 → `Promise.reject(err)` 透传 |

**关键约束**：
- Token 为空时不附加 Authorization 头（公开接口场景）
- 401 跳转使用 `window.location.href`（全页面刷新，清除状态）

### 7.3 SWR Hook 模式

> **文件**: `apps/web/src/hooks/useInvestors.ts`（及其他数据 Hook）

**SWR Hook 规范**：

| 项目 | 规范 |
|------|------|
| 命名约定 | `use{Resource}`，如 `useInvestors`、`useTopGainers`、`useArticles`、`useStockPrice` |
| 参数规范 | 接收 `{ sort?: string; page?: number; pageSize?: number }` 等查询参数对象（前端用 camelCase，SWR Key 中转为 `page_size`） |
| SWR Key | `/resource?sort=${sort}&page=${page}&page_size=${pageSize}` 格式的 URL 字符串 |
| fetcher | 使用 `api.get(url)` 调用后端 API |
| 返回值规范 | 解构为语义化字段：`{ investors: data?.data?.items ?? [], pagination: data?.data?.pagination, error, isLoading }`（后端分页接口统一返回 `{ items: T[], pagination: {...} }` 结构） |
| SWR 配置 | `revalidateOnFocus: false`（避免切标签页重复请求） |

**关键约束**：
- 默认参数值在 Hook 内部处理（如 `sort ?? 'market_value'`、`page ?? 1`）
- 返回值中的列表数据必须有 `?? []` 兜底，避免 undefined

### 7.4 数字格式化（packages/shared）

> **文件**: `packages/shared/src/constants/format.ts`

**格式化函数规范**：

| 函数名 | 输入 | 输出 | 格式规则 |
|--------|------|------|----------|
| `formatMoney` | `number \| null` | `string` | null → `'—'`；>= 1亿 → `{value/1e8}亿`（保留2位小数）；>= 1万 → `{value/1e4}万`（保留2位小数）；其他 → `toLocaleString('zh-CN')`（最少2位小数） |
| `formatPercent` | `number \| null` | `string` | null → `'—'`；否则 → `{value}%`（保留2位小数） |

**关键约束**：
- 所有格式化函数必须处理 `null` 输入，返回占位符 `'—'`
- 金额单位自动降级：亿 → 万 → 元

---

## 8. 关键业务逻辑（完整版）

> 本章是 AI 实现时的核心参考。每个模块包含：完整处理流程、Prisma 查询、计算公式、边界条件、异常处理。

### 8.1 牛散详情页 — 持仓明细计算

#### 8.1.1 完整处理流程

**接口契约**

- **请求**: `GET /api/v1/investors/:id`
- **输入**: `id` (路径参数，牛散ID)
- **输出**: 牛散基本信息 + 持仓明细列表（`HoldingRow[]`，见 8.1.2）+ 总市值汇总
- **错误**: 牛散不存在 → 返回 404；无持仓记录 → 返回空列表（非 404）

**处理流程要点**

| 步骤 | 数据源 | 关键规则 |
|------|--------|----------|
| 1. 查询牛散基本信息 | `investor` 表 | `findUnique({ where: { id } })`，不存在则 404 |
| 2. 确定最新报告期 | `holding` 表 | 取 `reportDate` 降序第一条作为 `currentQuarter`；无记录则返回空列表 |
| 3. 查询最新报告期持仓 | `holding` 表 | `where: { investorId, reportDate: currentQuarter }` |
| 4. 查询上期持仓 | `holding` 表 | `previousQuarter` 由 `getComparisonQuarters().previous` 确定（见 8.3.1）；构建 `Map<stockCode, holdCount>` |
| 5. 批量获取实时股价 | `stock` 表 | 提取所有 `stockCode` 批量查询；股票不存在时 `currentPrice = null`，相关衍生字段均标记为 `null`，前端显示 "—" |
| 6. 逐行计算衍生字段 | 内存计算 | 见 8.1.2 |
| 7. 汇总牛散总市值 | 内存计算 | `totalMarketValue = Σ holdMarketValue`（跳过 null）；`stockCount = 持仓支数` |
| 8. 排序返回 | — | 按持股市值降序 |

**数据缺失容错规则**

- 股票在 `stocks` 表中不存在（数据未同步）时：`currentPrice`、`totalMarketCap`、`returnRate`、`holdMarketValue`、`sellProfit` 均为 `null`
- 前端对 `null` 值统一显示 "—"，不报错

#### 8.1.2 衍生字段计算规则

**接口定义**

```typescript
interface HoldingRow {
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdChange: number;
  returnRate: number | null;
  holdRatio: number | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  reportDate: string;
  avgCost: number | null;
  holdMarketValue: number | null;
  actualCost: number | null;
  sellProfit: number | null;
}

interface PieDataItem {
  name: string;
  value: number;
}
```

**函数签名**

```typescript
function calcHoldingRow(
  holding: Holding,                    // 当前报告期持仓
  prevHolding: Holding | undefined,    // 上期持仓（可能不存在）
  stock: Stock | null                  // 股票信息（可能不存在）
): HoldingRow
```

**衍生字段计算公式**

| 字段 | 计算公式 | 数据来源 | 边界条件 |
|------|----------|----------|----------|
| `currentPrice` | `stock?.currentPrice ?? null` | `stock` 表 | 股票不存在时为 `null` |
| `holdChange` | `本期 holdCount - 上期 holdCount` | `holding` 表 | 上期无记录时 `holdChange = holdCount`（视为全部新进） |
| `avgCost` | `actualCost / Number(holdCount)` | `holding.actualCost`, `holding.holdCount` | `actualCost` 为 `null` 或 `holdCount` 为 0 时返回 `null`（遵循 R1，BigInt 须转换） |
| `holdMarketValue` | `currentPrice * Number(holdCount)` | 计算值 | `currentPrice` 为 `null` 时返回 `null`（遵循 R1，BigInt 须转换） |
| `returnRate` | `(currentPrice - avgCost) / avgCost * 100` | 计算值 | `avgCost` 为 `null` 或 `avgCost <= 0` 或 `currentPrice` 为 `null` 时返回 `null` |
| `sellProfit` | `holdMarketValue - actualCost` | 计算值 | `holdMarketValue` 为 `null` 或 `actualCost` 为 `null` 时返回 `null` |
| `holdRatio` | `Number(holding.holdRatio)` | `holding.holdRatio` | 为 `null` 时返回 `null` |
| `totalMarketCap` | `Number(stock.totalMarketCap)` | `stock` 表 | 为 `null` 时返回 `null` |
| `actualCost` | `Number(holding.actualCost)` | `holding.actualCost` | 为 `null` 时返回 `null` |
| `reportDate` | `holding.reportDate` 转为 `YYYY-MM-DD` | `holding.reportDate` | — |

#### 8.1.3 饼图数据

**接口定义**（见 8.1.2 `PieDataItem`）

**函数签名**

```typescript
function buildPieData(rows: HoldingRow[]): PieDataItem[]
```

**饼图数据构建规则**

1. **过滤无效数据**：仅保留 `holdMarketValue !== null` 的记录
2. **取 Top 10**：按 `holdMarketValue` 降序排列，取前 10 条作为独立扇区，每条 `{ name: stockName, value: holdMarketValue }`
3. **合并"其他"**：第 11 条及之后的记录合并为一个扇区 `{ name: '其他', value: restTotal }`，其中 `restTotal` 为剩余所有记录的 `holdMarketValue` 之和；仅当 `restTotal > 0` 时才添加该扇区

---

### 8.2 牛散列表页 — 总市值计算与排序

#### 8.2.1 完整处理流程

**接口契约**

- **请求**: `GET /api/v1/investors?sort=market_value&page=1&page_size=20`
- **输入**: `sort` (排序字段), `page`, `page_size`
- **输出**: 牛散列表（含 `totalMarketValue`、`stockCount`）+ 分页信息

**处理流程要点**

| 步骤 | 数据源 | 关键规则 |
|------|--------|----------|
| 1. 查询所有活跃牛散 | `investor` 表 | `where: { isActive: true }` |
| 2. 计算当前持仓总市值 | `holding` + `stock` 表 | 查最新报告期所有 holdings，批量查 stocks 获取 `currentPrice`；`totalMarketValue = Σ(currentPrice * holdCount)` 跳过 null；`stockCount = 持仓支数` |
| 3. 牛散筛选门槛 | 计算值 | `totalMarketValue >= 70,000,000`（7000万元）；以上一交易日收盘价计算；低于门槛不出现在列表，但详情页仍可通过直链访问 |
| 4. 排序 | — | `sort=market_value`（默认）：按 `totalMarketValue` 降序；`sort=name`：按姓名拼音首字母 A-Z 升序（`String.localeCompare('zh-CN')`） |
| 5. 分页返回 | — | 标准分页 |

#### 8.2.2 性能优化

**函数签名**

```typescript
interface InvestorWithMarketValue {
  id: string;
  name: string;
  stockCount: number;        // 持仓支数（持有了几只不同的股票）
  totalHoldCount: number;    // 总持股数（所有持仓之和）
  totalMarketValue: number;  // 总市值（所有持仓市值之和）
}

async function getInvestorListWithMarketValue(): Promise<InvestorWithMarketValue[]>
```

**批量查询策略**

| 步骤 | 查询方式 | 说明 |
|------|----------|------|
| 1. 查所有活跃牛散 | `investor.findMany({ where: { isActive: true } })` | 单次查询 |
| 2. 查所有牛散最新报告期 | `holding.groupBy({ by: ['investorId'], _max: { reportDate: true } })` | 聚合查询，避免 N+1 |
| 3. 查所有持仓记录 | `holding.findMany({ where: { OR: latestDates } })` | 根据步骤2结果批量查询 |
| 4. 批量获取股价 | `stock.findMany({ where: { code: { in: stockCodes } } })` | 提取去重后的 `stockCode` 集合 |

**Map 构建方式**

- `stockMap`: `new Map(stocks.map(s => [s.code, s]))`，用于 O(1) 查找股票信息
- 禁止在循环中逐个查数据库，所有数据查询必须在计算前批量完成

**排序规则**

- 内存中排序，不依赖数据库排序
- 先按筛选门槛过滤，再按排序参数排序，最后分页

---

### 8.3 增持/减持/新进 — 完整查询逻辑

#### 8.3.1 季度对比规则（核心）

**季度报告期与自然季度的映射关系**

| 季度 | reportDate |
|------|------------|
| Q1 报告 | 03-31 |
| Q2 报告 | 06-30 |
| Q3 报告 | 09-30 |
| Q4 报告 | 12-31 |

**函数契约**

| 函数名 | 输入 | 输出 | 关键逻辑说明 |
|--------|------|------|-------------|
| `getLatestDisclosedQuarter()` | 无（使用当前日期） | `Date`（最新已披露季度末日期） | 根据当前月份判断：11月起可用Q3，9月起可用Q2，5月起可用Q1，否则用去年Q4 |
| `getComparisonQuarters()` | 无 | `{ latest: Date, previous: Date }` | `latest` = 最新已披露季度；`previous` = 上一季度（调用 `getPreviousQuarterDate`） |
| `getPreviousQuarterDate(date)` | `Date`（某季度末日期） | `Date`（上一季度末日期） | Q1(3月) -> 上年Q4(12-31)；Q2(6月) -> Q1(03-31)；Q3(9月) -> Q2(06-30)；Q4(12月) -> Q3(09-30) |

**财报披露时间规则（A股）**

| 季度 | 披露截止 | 可用起始 |
|------|----------|----------|
| Q1 (3.31) | 4.30 | 5月1日 |
| Q2 (6.30) | 8.31 | 9月1日 |
| Q3 (9.30) | 10.31 | 11月1日 |
| Q4 (12.31) | 次年 4.30 | 次年 5月1日 |

**注意：`getPreviousQuarterDate` 的 off-by-one 问题**

- `Date` 构造函数中月份为 0-indexed（0=Jan, 2=Mar, 5=Jun, 8=Sep, 11=Dec）
- 构造季度末日期时需注意：`new Date(year, 2, 31)` 对应 3月31日，但 `new Date(year, 5, 30)` 对应 6月30日（6月只有30天）
- 实现时需验证每个季度的日期是否合法，避免自动进位

#### 8.3.2 增持查询

**接口契约**

- **请求**: `GET /api/v1/holdings/increase`
- **输入**: `investorId?` (可选，筛选特定牛散)
- **输出**: 增持记录列表

**函数签名**

```typescript
interface IncreaseItem {
  investorId: string;
  investorName: string;
  stockCode: string;
  stockName: string;
  currentHoldCount: number;
  prevHoldCount: number;
  changeCount: number;
  changePercent: number | null;  // 新进查询时为 null（无上期数据）
  currentPrice: number | null;
}

async function getIncreaseList(investorId?: string): Promise<IncreaseItem[]>
```

**增持查询规则**

| 步骤 | 说明 |
|------|------|
| 1. 查询本期所有持仓 | `holding.findMany({ where: { reportDate: latest, ...(investorId ? { investorId } : {}) } })` |
| 2. 查询上期所有持仓 | 同上，`reportDate: previous`；构建 `Map<investorId-stockCode, Holding>` |
| 3. 筛选增持 | 本期持股数 > 上期持股数；上期不存在的不算增持（是新进） |
| 4. 计算增持仓位百分比 | `changePercent = (currCount - prevCount) / prevCount * 100`；上期为0理论上不会到这里 |
| 5. 批量补充股票信息 | 从 `stocks` 表获取 `mainBusiness`、`totalMarketCap`；从 mairuiapi 获取实时 `currentPrice`（若缓存过期） |
| 6. 排序 | 按增持市值降序：`增持市值 = changeCount * currentPrice` |

**输出字段映射**

| 字段 | 来源 |
|------|------|
| `investorId` | `holding.investorId` |
| `investorName` | JOIN `investor` 表获取 |
| `stockCode` | `holding.stockCode` |
| `stockName` | `holding.stockName` |
| `currentHoldCount` | 本期 `holdCount` |
| `prevHoldCount` | 上期 `holdCount` |
| `changeCount` | `currentHoldCount - prevHoldCount` |
| `changePercent` | 增持仓位百分比 |
| `currentPrice` | `stock` 表 / mairuiapi |

#### 8.3.3 减持查询 — 与增持的差异点

减持查询与增持查询（8.3.2）的整体流程相同（Step 1-2、Step 5 一致），仅在 Step 3 筛选条件和 Step 6 排序上有差异。

```typescript
interface DecreaseItem {
  investorId: string;
  investorName: string;
  stockCode: string;
  stockName: string;
  currentHoldCount: number;
  changeCount: number;        // 负数（减少量）
  changePercent: number | null;
  currentPrice: number | null;
  holdRatio: number | null;   // 当前持股比例
  isCleared: boolean;         // 清仓标记（currentHoldCount === 0）
}
```

**与增持的差异点**

| 差异项 | 增持 | 减持 |
|--------|------|------|
| Step 3 筛选条件 | 本期持股数 > 上期持股数 | 本期持股数 < 上期持股数 |
| 特殊标记 | 无 | `isCleared: true`：当 `curr.holdCount === 0` 时标记为清仓，前端使用黄色背景 + 加粗样式 |
| `changeCount` | 正数（增加量） | 负数（减少量） |
| `changePercent` | 增持仓位% | 减持仓位%（前端红色显示） |
| Step 6 排序 | 按增持市值降序 | 按减持市值降序（取绝对值）：`Math.abs(changeCount * currentPrice)` |

**减持输出字段**

| 字段 | 说明 |
|------|------|
| `investorId` | 牛散ID |
| `investorName` | 牛散姓名（JOIN `investor` 表） |
| `stockCode` | 股票代码 |
| `stockName` | 股票名称 |
| `currentHoldCount` | 当前持股数（与增持统一字段名） |
| `changeCount` | 变动数量（负数） |
| `holdRatio` | 持股比例 |
| `currentPrice` | 当前股价（Step 5 补充） |
| `isCleared` | 清仓标记（`holdCount === 0`） |
| `changePercent` | 减持仓位百分比 |

#### 8.3.4 新进查询

新进查询与增持查询（8.3.2）的 Step 1-2、Step 5 一致，仅在 Step 3 筛选条件不同。

**新进查询规则**

| 规则项 | 说明 |
|--------|------|
| 筛选条件 | 上期不存在该 `investorId-stockCode` 组合，**或**上期持股数为 0，且本期持股数 > 0 |
| 展示字段差异 | 无 `changePercent`（新进没有"增持百分比"概念）；当前持股数标为"新进数量" |
| 排序 | 按新进市值降序：`holdCount * currentPrice` |
| 股价补充 | `currentPrice` 需在 Step 5 从 `stock` 表批量获取后补充 |

#### 8.3.5 三者的前端展示差异

| 字段 | 增持 | 减持 | 新进 |
|------|------|------|------|
| 牛散姓名 | ✅ | ✅ | ✅ |
| 股票名称/代码 | ✅ | ✅ | ✅ |
| 当前持股数 | ✅ | ✅ | ✅（标为"新进数量"） |
| 变动数量 | ✅ 增持股数 | ✅ 减持股数（红色） | — |
| 变动百分比 | ✅ 增持仓位% | ✅ 减持仓位%（红色） | — |
| 清仓标记 | — | ✅ 黄色高亮 | — |
| 主营收入 | ✅ | ✅ | ✅ |
| 总市值 | ✅ | ✅ | ✅ |
| 平均增持/减持均价 | ✅ | ✅ | — |

**平均增持均价计算公式**

```
avgIncreasePrice = (本期 actualCost - 上期 actualCost) / 增持数量(changeCount)
```

**边界条件**

- `actualCost` 为 `null` 时 → 显示 "—"
- 增持数量为 0 → 不可能（已被筛选排除）
- 适用于增持和减持场景

---

### 8.4 共同持仓 — 完整查询逻辑

#### 8.4.1 交互流程

```
页面加载:
  1. 展示所有牛散列表（多选框），默认全选
  2. 用户勾选 2 个及以上牛散 → 点击"查询"按钮
  3. 发送请求: GET /api/v1/holdings/common?investor_ids=id1,id2,id3

查询逻辑:
  1. 解析 investor_ids 参数
  2. 若选中 < 2 个牛散 → 返回 400 错误 "请至少选择2个牛散"
  3. 查询这些牛散在最新报告期的所有持仓
  4. 按 stockCode 分组，统计每个股票被几个牛散持有
  5. 只保留被 >= 2 个牛散持有的股票
  6. 按持有牛散数量降序，同数量按总市值降序
```

#### 8.4.2 共同持仓查询规则

**函数签名**

```typescript
interface CommonHoldingItem {
  stockCode: string;
  stockName: string;
  investorCount: number;
  investorNames: string[];
  investorIds: string[];
  mainBusiness: string | null;
  totalMarketCap: number | null;
}

async function getCommonHoldings(investorIds: string[]): Promise<CommonHoldingItem[]>
```

**共同持仓查询规则**

| 规则项 | 说明 |
|--------|------|
| 输入 | `investorIds: string[]`（至少 2 个牛散 ID） |
| 数据源 | 使用 `getComparisonQuarters().latest` 作为报告期 |
| 查询方式 | `holding.findMany({ where: { investorId: { in: investorIds }, reportDate: latest }, include: { investor: { select: { id, name } } } })` |
| 交集计算 | 按 `stockCode` 分组，构建 `Map<stockCode, { stockCode, stockName, investors[] }>`；遍历所有持仓记录，将牛散信息追加到对应分组 |
| 筛选条件 | 仅保留被 >= 2 个牛散持有的股票（`investors.length >= 2`） |
| 股票信息补充 | 批量查 `stock` 表获取 `mainBusiness`、`totalMarketCap`，构建 `stockMap` |
| 排序 | 主排序：按持有牛散数量降序；次排序：按总市值降序 |
| 分页 | 标准分页 |

**输出字段**

| 字段 | 说明 |
|------|------|
| `stockCode` | 股票代码 |
| `stockName` | 股票名称 |
| `investorCount` | 持有该股的牛散数量 |
| `investorNames` | 牛散姓名列表 |
| `investorIds` | 牛散ID列表 |
| `mainBusiness` | 主营业务（`stock` 表，可能为 `null`） |
| `totalMarketCap` | 总市值（`stock` 表，可能为 `null`） |

#### 8.4.3 单股牛散详情（展开行）

```
用户点击共同持仓列表中的某只股票 → 展开该行
展示持有该股的所有牛散列表：
  - 牛散姓名（可点击，跳转 /investors/:id）
  - 持股数量
  - 持股比例
  - 持股市值

实现：使用 Ant Design Table 的 expandable 属性
展开数据从上面 stockGroups 的 investors 数组中获取
```

---

### 8.5 十大增持 — 完整逻辑

**接口契约**

- **请求**: `GET /api/v1/top-increase`
- **输入**: 无
- **输出**: 增持市值 Top 100 列表

**函数签名**

```typescript
interface TopIncreaseItem {
  investorName: string;
  stockCode: string;
  stockName: string;
  changeCount: number;
  currentPrice: number | null;
  increaseMarketValue: number;
}

async function getTopIncrease(): Promise<TopIncreaseItem[]>
```

**十大增持查询规则**

| 步骤 | 说明 |
|------|------|
| 1. 查本期所有持仓 | `holding.findMany({ where: { reportDate: latest } })` |
| 2. 查上期所有持仓 | `holding.findMany({ where: { reportDate: previous } })`；构建 `Map<investorId-stockCode, Holding>` |
| 3. 批量获取股价和牛散名 | 批量查 `stock` 表构建 `stockMap`；批量查 `investor` 表构建 `investorMap` |
| 4. 计算增持市值 | 筛选条件：上期存在 **且** 本期持股数 > 上期持股数；`changeCount = currCount - prevCount`；`increaseMarketValue = changeCount * currentPrice`（`currentPrice` 为 `null` 时记为 0） |
| 5. 排序并截取 | 按 `increaseMarketValue` 降序排序，取 Top 100 |

**输出字段**

| 字段 | 说明 |
|------|------|
| `investorName` | 牛散姓名（`investorMap` 获取，未知时为 "未知"） |
| `stockCode` | 股票代码 |
| `stockName` | 股票名称 |
| `changeCount` | 增持数量 |
| `currentPrice` | 当前股价（可能为 `null`） |
| `increaseMarketValue` | 增持市值 |

---

### 8.6 涨幅榜 — 完整逻辑

#### 8.6.1 各标签页数据来源

```typescript
// GET /api/v1/top-gainers?period=today|1w|2w|1m|3m|6m|12m&include_limit_up=false

interface TopGainerItem {
  stockCode: string;
  stockName: string;
  currentPrice: number | null;
  changePercent: number;   // 涨幅(%)
  mainBusiness?: string;   // 主营业务（可选列）
  // 涨停板扩展字段（仅 period=today 时返回）
  limitUpCount?: number;     // 连板数
  firstLimitTime?: string;   // 首次封板时间
  limitUpCapital?: number;   // 封板资金
  industry?: string;         // 所属行业
}

// 路由分发逻辑：period === 'today' → getTodayGainers，否则 → getHistoryGainers
```

#### 8.6.2 今日涨幅

**函数签名**

```typescript
async function getTodayGainers(_includeLimitUp: boolean): Promise<TopGainerItem[]>
```

**今日涨幅查询规则**

| 规则项 | 说明 |
|--------|------|
| 数据源 | 调用 mairuiapi 实时交易全部接口（仅限钻石版）：`GET ${MAIRUI_API_REALTIME_BASE}/hsrl/real/all/{LICENCE}`（独立域名，见 .env `MAIRUI_API_REALTIME_BASE`），返回所有股票实时数据，包含 `pc`（涨跌幅） |
| 股票名称关联 | 从 `stocks` 表关联获取股票名称 |
| ST 股过滤 | 排除股票名称包含 "ST" 的记录 |
| 排序 | 按涨幅（`changePercent`）降序 |
| 分页 | 标准分页 |
| 涨停板扩展 | `_includeLimitUp` 参数预留，当值为 `true` 时在结果末尾追加涨停板数据（见 8.6.3） |

**输出字段**

| 字段 | 来源 |
|------|------|
| `stockCode` | API 返回 `dm` |
| `stockName` | `stocks` 表关联 |
| `currentPrice` | API 返回 `p` |
| `changePercent` | API 返回 `pc`（已是百分比数值） |

#### 8.6.3 涨停板标签页

**函数签名**

```typescript
async function getLimitUpStocks(date: string): Promise<TopGainerItem[]>
```

**涨停板查询规则**

| 规则项 | 说明 |
|--------|------|
| 数据源 | 调用 mairuiapi 涨停股池：`GET /hslt/ztgc/{date}/{LICENCE}` |
| 日期参数 | 默认今天，可手动选择历史日期 |
| 非交易日处理 | 非交易日调用返回空数组，前端显示"今日非交易日" |

**输出字段映射**

| 字段 | API 字段 | 说明 |
|------|----------|------|
| `stockCode` | `dm` | 股票代码 |
| `stockName` | `Mc` | 股票名称 |
| `currentPrice` | `p` | 当前价格 |
| `changePercent` | `zf` | 涨跌幅 |
| `limitUpCount` | `Lbc` | 连板数 |
| `firstLimitTime` | `fbt` | 首次封板时间 |
| `limitUpCapital` | `zj` | 封板资金 |
| `industry` | `hy` | 所属行业 |

**注意**：涨停板数据只在交易日有效

#### 8.6.4 历史涨幅（1w/2w/1m/3m/6m/12m）

**函数签名**

```typescript
async function getHistoryGainers(period: string): Promise<TopGainerItem[]>
```

**周期与交易天数映射**

| 周期参数 | 交易天数（近似） |
|----------|------------------|
| `1w` | 5 |
| `2w` | 10 |
| `1m` | 22 |
| `3m` | 66 |
| `6m` | 132 |
| `12m` | 250 |

**方案选择**

- **方案A（推荐，数据准确）**：从数据库历史K线数据计算（需要 `kline_daily` 表，见 8.17 K线数据同步）
- **方案B（简单但有API调用限制）**：逐个股票调用 mairuiapi 历史接口

**方案A 实现要点**

| 步骤 | 说明 |
|------|------|
| 1. 获取所有股票的最新价格 | `stock.findMany({ where: { currentPrice: { not: null } } })` |
| 2. 查询 N 天前的收盘价 | 从 `kline_daily` 表查询：`SELECT close FROM kline_daily WHERE stock_code = ? AND period = 'd' ORDER BY date DESC LIMIT 1 OFFSET {days}` |
| 3. 计算涨幅 | `changePercent = (currentPrice - pastClose) / pastClose * 100` |
| 4. 过滤与排序 | 过滤 ST 股，按涨幅降序排序 |

**性能优化建议**

- 全市场约 5000 只股票，逐个查询太慢
- 优化方案：批量查询，或使用物化视图/缓存表
- **推荐**：每日收盘后预计算各周期涨幅，存入 `top_gainers_cache` 表（见 8.6.5）

#### 8.6.5 历史涨幅缓存方案（推荐）

```sql
-- 注：一期采用 Redis 缓存方案（见 4.2），此表作为二期持久化备选方案保留
-- 额外表：涨幅缓存（每日收盘后计算一次）
CREATE TABLE top_gainers_cache (
  stock_code VARCHAR(10),
  period VARCHAR(10),         -- '1w', '2w', '1m', '3m', '6m', '12m'
  past_close DECIMAL(10, 2),  -- N天前收盘价
  current_close DECIMAL(10, 2),
  change_percent DECIMAL(8, 4),
  calc_date DATE,             -- 计算日期
  PRIMARY KEY (stock_code, period, calc_date)
);

-- 查询时直接读缓存：
-- SELECT * FROM top_gainers_cache
-- WHERE period = ? AND calc_date = ?
-- ORDER BY change_percent DESC LIMIT 100;
```

---

### 8.7 分红股息率 — 完整逻辑

#### 8.7.1 数据来源

```typescript
// 分红数据来自 mairuiapi：GET /hscp/jnfh/{stockCode}/{LICENCE}
// 返回字段：sdate(公告日期), Send(每10股派息), cdate(除权除息日), ...
// 注意：Send 是"每10股派息"，需换算为"每股派息"

// 每股分红金额 = Send / 10
```

#### 8.7.2 股息率计算

```typescript
// 股息率计算公式（规范）

// 单年股息率 = 每股分红金额 / 除权除息日当天收盘价 × 100%
// 其中：每股分红金额 = Send（每10股派息） / 10

// 函数签名：
function calcAnnualYield(
  dividendPerShare: number,  // 每股分红金额 = Send / 10
  exDatePrice: number        // 除权除息日收盘价
): number

// 业务规则：
// 1. 除权除息日股价来源优先级：
//    优先从数据库 kline_daily 表查询（如果已同步）
//    若无 → 调用 mairuiapi 历史K线接口获取
// 2. 防除零：exDatePrice <= 0 时，股息率记为 0
// 3. 除权日股价缺失时，股息率记为 0，不参与排名
```

#### 8.7.3 排行榜查询逻辑

```typescript
// 排行榜查询规范

// 函数签名：
async function getTopDividendYield1Y(): Promise<Array<{
  stockCode: string;
  stockName: string;
  dividendAmount: number;  // 总每股分红
  yieldRate: number;       // 股息率（%）
}>>

async function getTopDividendYield3Y(): Promise<Array<{
  stockCode: string;
  stockName: string;
  avgYield: number;        // 3年平均股息率（%）
  yearlyYields: Array<{ year: number; yield: number }>;
}>>
```

**排行榜1：过去1年股息率最高前30**

| 步骤 | 操作 | 规则 |
|------|------|------|
| 1 | 获取分红记录 | 查询 `dividend` 表，`dividendYear = 当前年份` |
| 2 | 按股票分组累加 | 同一股票可能多次分红（中期+年度），`每股分红 = Number(dividendAmount) / 10`，累加求和 |
| 3 | 计算股息率 | `股息率 = 总每股分红 / Number(currentPrice) × 100`，`currentPrice` 为空则跳过 |
| 4 | 排序取前30 | 按股息率降序，取前30条 |

**排行榜2：过去3年平均股息率最高前30**

| 步骤 | 操作 | 规则 |
|------|------|------|
| 1 | 获取分红记录 | 查询 `dividend` 表，`dividendYear in [当年, 去年, 前年]` |
| 2 | 按股票+年份分组 | 构建 `Map<stockCode, Map<year, totalDividend>>` |
| 3 | 过滤连续分红 | 只保留 `yearMap.size >= 3`（连续3年都有分红）的股票 |
| 4 | 计算各年股息率 | 每年股息率 = `calcAnnualYield(该年总分红, 该年除权日收盘价)`，除权日收盘价从 `kline_daily` 表获取 |
| 5 | 计算平均 | `avgYield = 各年股息率之和 / 3` |
| 6 | 排序取前30 | 按平均股息率降序，取前30条 |

**关键约束**：
- `dividendAmount` 是 Prisma `Decimal` 类型，必须用 `Number()` 转换后再做数学运算
- `currentPrice` 可能为 null，使用前必须守卫

---

### 8.8 搜索功能 — 完整逻辑

```typescript
// GET /api/v1/search?keyword=xxx

interface SearchResult {
  type: 'stock' | 'investor';
  id: string;
  name: string;
  code: string | null;
}

// 函数签名：
async function search(keyword: string): Promise<SearchResult[]>
```

**搜索规则：**

| 步骤 | 操作 | 规则 |
|------|------|------|
| 1 | 输入校验 | `keyword.trim()`，长度 < 1 时返回空数组 |
| 2 | 输入类型判断 | 纯数字：`/^\d+$/`；中文：`/[\u4e00-\u9fff]/` |
| 3 | 纯数字匹配 | 优先精确匹配股票代码（`stock` 表 `where: { code: keyword }`）；若无精确匹配，则前缀匹配（`startsWith`，取前5条） |
| 4 | 中文匹配 | 先模糊匹配牛散姓名（`investor` 表 `where: { name: { contains }, isActive: true }`，取前5条）；再模糊匹配股票名称（`stock` 表 `where: { name: { contains } }`，取前5条） |
| 5 | 结果限制 | 总结果最多返回 10 条 |

**匹配优先级：**
- 纯数字输入：股票代码精确匹配 > 股票代码前缀匹配
- 中文输入：牛散姓名 > 股票名称
- 纯数字不搜索牛散姓名

#### 8.8.1 搜索结果展示

```
搜索结果弹窗（Ant Design Modal 或 Drawer）：

若点击 investor 类型结果：
  → 跳转 /investors/:id（牛散详情页）
  → 详情页顶部展示 K线图（ECharts）
  → 下方展示沪深京三市场持仓列表

若点击 stock 类型结果：
  → 展示股票详情弹窗
  → 包含：K线图 + 基本信息
  → 下方展示持有该股的所有牛散列表（从 holdings 表查询）
  → 每个牛散姓名可点击跳转
```

---

### 8.9 高管增持 — 完整逻辑

#### 8.9.1 数据来源

```typescript
// 高管交易数据需要管理员手动导入或通过外部数据源获取
// 一期方案：管理员通过后台手动录入

// ExecutiveTrade 表结构见 Prisma Schema（第3章）
// tradeType: "increase" | "decrease"
```

#### 8.9.2 查询逻辑

```typescript
// GET /api/v1/executive-increase?months=6

// 函数签名：
async function getExecutiveIncrease(months: number = 6): Promise<Array<{
  stockCode: string;
  stockName: string;
  totalAmount: number;    // 增持总金额
  tradeCount: number;     // 交易次数
  executives: string[];   // 涉及的高管姓名（去重）
  mainBusiness: string | null;
  totalMarketCap: number | null;
}>>
```

**高管增持查询规则：**

| 步骤 | 操作 | 规则 |
|------|------|------|
| 1 | 时间范围计算 | `startDate = 当前日期 - months 个月` |
| 2 | 查询增持记录 | `executiveTrade` 表，`tradeType = 'increase'`，`tradeDate >= startDate`，按 `tradeDate desc` 排序 |
| 3 | 按股票分组聚合 | 聚合字段：`totalAmount`（增持总金额，`Number(tradeAmount)` 累加）、`tradeCount`（交易次数）、`executives`（高管姓名去重列表） |
| 4 | 补充股票信息 | 从 `stock` 表获取 `mainBusiness`、`totalMarketCap`（`Number()` 转换） |
| 5 | 排序 | 按增持总金额 `totalAmount` 降序 |

**关键约束：**
- `tradeAmount` 是 Prisma `Decimal` 类型，必须用 `Number()` 转换
- `totalMarketCap` 可能为 null，使用前必须守卫

---

### 8.10 个人股东 — 完整逻辑

```typescript
// GET /api/v1/individual-shareholders

// 函数签名：
async function getIndividualShareholders(): Promise<Array<{
  stockCode: string;
  stockName: string;
  shareholderName: string;
  holdRatio: number;
  isTrackedInvestor: boolean;  // 是否为平台跟踪的牛散
  privateFundCount: number;    // 十大流通股中的私募数量
}>>
```

**个人股东识别规则：**

| 步骤 | 操作 | 规则 |
|------|------|------|
| 1 | 数据来源 | mairuiapi 十大股东接口 `GET /hscp/sdgd/{stockCode}/{LICENCE}`，返回 `sdgd` 数组 |
| 2 | 取第一大股东 | 每只股票取十大股东中的第1名（`sdgd[0]`） |
| 3 | 判断是否个人 | 股东说明 `gdsm` 中**不包含**以下任一关键词 → 视为个人股东 |
| 4 | 匹配牛散 | 检查该个人是否为平台跟踪的牛散（匹配 `investor.name`） |
| 5 | 统计私募数量 | 十大流通股中 `gdsm` 包含"私募"的数量 |
| 6 | 排序 | 按持仓比例 `holdRatio` 降序 |

**机构关键词列表（命中任一即视为非个人）：**

```
基金、社保、保险、券商、信托、银行、香港、汇金、证金、
公司、集团、有限、股份、资产、资本、投资、控股
```

**个人股东判断函数签名：**
```typescript
function isIndividual(gdsm: string): boolean
// 规则：gdsm 中不包含上述任一机构关键词 → 返回 true
```

**性能注意事项：**
- 全市场遍历非常慢，一期建议使用 Redis 缓存
- 缓存 key 格式：`individual_shareholders:{date}`
- 建议每日更新一次，非实时数据

---

### 8.11 首页 — 聚合逻辑

**首页数据聚合规则：**

| 项目 | 说明 |
|------|------|
| 加载策略 | 所有数据源使用 `Promise.all` 并行请求，禁止串行 |
| 布局 | 左侧 `Content` 区域 + 右侧 `Sider` 区域 |

**需要的 API 列表：**

| API | 用途 | 参数 |
|-----|------|------|
| `GET /api/v1/investors?sort=market_value&page=1&page_size=10` | 牛散市值排行榜 | 取前10 |
| `GET /api/v1/articles?page=1&page_size=10` | 最新文章列表 | 取前10，置顶优先 |
| `GET /api/v1/market/overview` | 市场概览数据（见 14.4.1） | 大盘指数实时数据 |
| `GET /api/v1/watchlist` | 自选股卡片（见 14.2.5） | 需登录，未登录不显示 |

**布局说明：**
- 左侧（Content）：
  - 功能模块入口卡片（`modules.map` 渲染 `Link` + `Card`）
  - 牛散市值排行榜（`Table` 组件，`pagination=false`，点击行跳转 `/investors/:id`）
- 右侧（Sider）：
  - 最新文章列表（`List` 组件，每项显示标题 + 发布日期，点击跳转 `/articles/:id`）

---

### 8.12 数据同步 — 完整架构（NestJS 适配版）

> 所有同步逻辑在 NestJS Service 层实现，由 Infrastructure → scheduler 调度。

```typescript
// 公共工具函数清单

// 函数签名：
const sleep = (ms: number): Promise<void>
// 用途：异步等待，用于 API 频率限制和批次间间隔
```

**ExternalApiError 自定义异常：**
- **用途**：外部 API 调用失败时的降级处理，配合 `AllExceptionsFilter` 统一捕获
- **构造参数**：`message: string`, `fallbackData?: any`（降级时返回的兜底数据）
- **行为**：继承 `Error`，`name` 固定为 `'ExternalApiError'`
- **降级规则**：调用 mairuiapi / DeepSeek 等外部 API 失败时，返回缓存数据或空数组，禁止抛 500 错误

#### 8.12.1 同步任务基类

```typescript
// apps/server/src/infrastructure/scheduler/base-sync.task.ts
@Injectable()
export abstract class BaseSyncTask
```

**同步任务基类规范：**

| 类名 | 方法 | 职责 | 关键行为 |
|------|------|------|----------|
| `BaseSyncTask` | `run(taskName: string)` | 模板方法：记录开始 → 执行 → 记录结束 | 在 `syncLog` 表创建记录，`status: 'running'`；成功后更新为 `'success'`；失败更新为 `'failed'`，`message` 截取前500字符；失败后重新抛出异常供 `@nestjs/schedule` 记录 |
| `BaseSyncTask` | `execute(): Promise<void>` | 抽象方法，子类实现具体同步逻辑 | 由 `run()` 调用 |
| `BaseSyncTask` | `callWithRetry<T>(fn, maxRetries?, delayMs?)` | 带重试的 API 调用 | 默认最多重试3次，初始延迟1000ms，指数退避（`delayMs * (i + 1)`）；最后一次失败抛出异常 |

**依赖注入：**
- `PrismaService` — 数据库操作
- `RedisService` — 缓存操作

#### 8.12.2 股票列表同步（全量 + 增量）

```typescript
// apps/server/src/infrastructure/scheduler/stock-sync.task.ts
@Injectable()
export class StockSyncTask extends BaseSyncTask
```

**股票列表同步规则：**

| 项目 | 规则 |
|------|------|
| 触发时机 | `@Cron('30 16 * * 1-5')` — 工作日 16:30 |
| 数据来源 | `mairui.getStockList()` — 外部 API 全量股票列表 |
| upsert 策略 | 以 `code` 为唯一键，逐条 `prisma.stock.upsert`；更新 `name` 和 `market`（`jys` 字段映射：`sh→SH`, `sz→SZ`, 其他→BJ`） |
| 退市标记 | 数据库中有但 API 未返回的股票，标记 `isActive: false`（软删除，不硬删） |
| DeepSeek 补充 | 对新入库且 `mainBusiness` 为 null 的股票，调用 `deepseek.getMainBusiness()` 补充主营业务描述，每次最多50只，调用间隔 1500ms |
| 错误处理 | 单只股票失败不阻塞整体流程，记录日志继续 |

**依赖注入：**
- `MairuiService` — 外部 API 调用
- `DeepseekService` — 主营业务补充

#### 8.12.3 实时行情同步（批量 + 增量）

```typescript
// 触发时机：@Cron('*/5 9-15 * * 1-5') — 工作日盘中每5分钟
// 方法签名：async syncRealtimeQuotes(): Promise<void>
```

**实时行情同步规则：**

| 项目 | 规则 |
|------|------|
| 触发时机 | `@Cron('*/5 9-15 * * 1-5')` — 工作日盘中每5分钟 |
| 数据来源 | `mairui.getRealtimeQuotesBatch(codes)` — 批量获取实时行情 |
| 批量大小 | 每批最多 20 个股票代码（mairuiapi 限制） |
| 并发控制 | 同时最多 3 个批次在请求（`Promise.allSettled`） |
| 批次间间隔 | 300ms（`sleep(300)`） |
| 更新字段 | `currentPrice`、`totalMarketCap`、`priceUpdatedAt` |
| Redis 缓存 | 每只股票行情写入 `stock:price:{code}`，TTL 30秒 |
| 错误处理 | 单批次失败不阻塞，记录日志；使用 `Promise.allSettled` 确保部分成功可继续 |

#### 8.12.4 十大股东同步（核心数据，最复杂）

```typescript
// 手动触发: POST /api/v1/admin/sync/shareholders
// 方法签名：async syncShareholders(): Promise<void>
```

**十大股东同步规则：**

| 步骤 | 操作 | 规则 |
|------|------|------|
| 1 | 获取牛散列表 | 查询 `investor` 表，`isActive: true`，构建 `name → id` 映射 |
| 2 | 获取活跃股票 | 查询 `stock` 表，`isActive: true` |
| 3 | 逐股票查询 | 调用 `mairui.getTopShareholders(stock.code)`，最多重试2次 |
| 4 | 解析报告期 | 调用 `parseReportDate(data.jzrq)` 解析截止日期 |
| 5 | 模糊匹配牛散 | 股东说明 `gdsm` 中包含牛散姓名 → 匹配成功 |
| 6 | 数据清洗 | `parseBigInt(cgsl)` 转换持股数，`parseDecimal(cgbl)` 转换持股比例 |
| 7 | 写入 holdings | 以 `investorId + stockCode + reportDate` 为唯一键 upsert |
| 8 | 进度日志 | 每处理100只股票输出一次进度 |
| 9 | API 限频 | 每只股票请求间隔 300ms |

**数据解析规则：**

| 函数 | 签名 | 规则 |
|------|------|------|
| `parseReportDate` | `(raw: string): Date \| null` | 兼容格式：`"2025-09-30"`, `"20250930"`, `"2025年09月30日"`；去除非数字字符后按 `YYYY-MM-DD` 解析 |
| `parseBigInt` | `(val: any): bigint \| null` | `null/undefined` → null；`NaN` 或负数 → null；有效值 → `BigInt(Math.floor(n))`。**注**：此函数为十大股东同步专用，与 8.18.1 `sanitizeCount` 功能重叠但无上限检查。实现时应统一为 `sanitizeCount`（去掉上限检查后复用） |
| `parseDecimal` | `(val: any): number \| null` | `null/undefined` → null；`parseFloat` 失败 → null；有效值返回数字。**注**：此函数为十大股东同步专用，与 8.18.1 `sanitizePrice`/`sanitizeRatio` 功能重叠但无范围检查。实现时应统一为对应 sanitize 函数 |

**去重策略：**
- holdings 表唯一约束：`@@unique([investorId, stockCode, reportDate])`
- 同一牛散在同一股票同一报告期只保留一条记录，后续 upsert 更新 `stockName`、`holdCount`、`holdRatio`

#### 8.12.5 分红数据同步

**分红数据同步规则：**

| 项目 | 规则 |
|------|------|
| 触发方式 | 手动触发：`POST /api/v1/admin/sync/dividends` |
| 数据来源 | `mairui.getDividendHistory(stock.code)` — 逐股票查询分红历史 |
| 数据清洗 | `Send` 字段可能为 `"--"` 或 `null`，`parseFloat` 后 `isNaN` 或 `<= 0` 则跳过 |
| 每股分红计算 | `perShare = parseFloat(Send) / 10`（Send 是每10股派息） |
| 日期解析 | `exDate = new Date(cdate)`，`recordDate = new Date(edate)`，`year = new Date(sdate).getFullYear()`；`exDate` 或 `year` 为空则跳过 |
| upsert 唯一键 | `stockCode + dividendYear + exDate` |
| API 限频 | 每只股票请求间隔 300ms |
| 错误处理 | 单只股票失败不阻塞，记录日志继续 |

---

**涨停板同步规则：**

| 项目 | 规则 |
|------|------|
| 触发时机 | `@Cron('*/10 9-15 * * 1-5')` — 工作日盘中每10分钟 |
| 数据来源 | `mairui.getTopLimitUp(today)` — 当日涨停板数据 |
| 存储方式 | 仅缓存到 Redis，**不入库** |
| Redis key | `limitup:{YYYYMMDD}`，TTL 600秒（10分钟） |
| 错误处理 | 失败记录日志，不阻塞 |

#### 8.12.6 同步管理 API

```typescript
// apps/server/src/domain/admin/admin.controller.ts
@Controller('api/v1/admin/sync')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSyncController
```

**同步管理 API 规范：**

| 路由 | 方法 | 参数 | 行为 |
|------|------|------|------|
| `POST /api/v1/admin/sync/:task` | `triggerSync` | `task`: `'stock-list' \| 'shareholders' \| 'dividends' \| 'realtime' \| 'limitup' \| 'kline-backfill'` | 根据任务名调用对应的 SyncTask，返回 `{ code: 200, message: '同步任务已启动', data: { taskId, status: 'started' } }` |
| `GET /api/v1/admin/sync/logs` | `getSyncLogs` | `page`（默认1）, `page_size`（默认20） | 查询 `sync_logs` 表，返回同步历史，按创建时间降序 |

**权限要求：**
- 所有接口需验证 JWT Token + 管理员权限（`@UseGuards(JwtAuthGuard, AdminGuard)`）
- 未登录返回 401

---

### 8.13 DeepSeek 主营业务补充 — 完整逻辑

```typescript
// apps/server/src/infrastructure/external-api/deepseek.service.ts
@Injectable()
export class DeepseekService
```

**DeepSeek 调用规范：**

| 项目 | 规则 |
|------|------|
| API 端点 | `${DEEPSEEK_API_BASE}/chat/completions` |
| 认证方式 | `Authorization: Bearer ${DEEPSEEK_API_KEY}` |
| 模型 | `deepseek-chat` |
| 请求格式 | POST JSON，`Content-Type: application/json` |

**请求参数：**

| 参数 | 值 |
|------|------|
| `temperature` | 0.3（低随机性，确保稳定输出） |
| `max_tokens` | 200 |
| `timeout` | 30000ms（30秒） |

**消息构造：**

| 角色 | 内容 |
|------|------|
| `system` | "你是一个财经数据助手。请根据股票名称和代码，简要描述该公司的主营业务。要求：不超过100个汉字，只输出描述文本，不要任何格式、标题或前缀。" |
| `user` | "请描述 {stockName}（{stockCode}）的主营业务。" |

**函数签名：**
```typescript
async getMainBusiness(stockName: string, stockCode: string): Promise<string>
```

**响应处理：**
- 提取路径：`response.data?.choices?.[0]?.message?.content`
- 返回值：`content?.trim() ?? ''`

**失败降级：**
- DeepSeek 调用失败**不影响主流程**，返回空字符串 `''`
- 记录错误日志：`DeepSeek 调用失败 ({stockName}): {error.message}`

---

### 8.14 文章模块 — 完整逻辑

#### 8.14.1 文章列表查询

```typescript
// GET /api/v1/articles?page=1&page_size=20&category=buffett|arkk

// 函数签名：
async function getArticles(
  page: number,
  pageSize: number,
  category?: string
): Promise<{
  data: Article[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}>
```

**文章列表查询规则：**

| 项目 | 规则 |
|------|------|
| 筛选条件 | `category` 可选，按 `category` 字段过滤（`'buffett'` / `'arkk'`） |
| 排序规则 | 第一优先级：`isPinned desc`（置顶优先）；第二优先级：`publishDate desc`（日期降序） |
| 分页 | `skip = (page - 1) * pageSize`，`take = pageSize` |
| 总数查询 | `prisma.article.count({ where })` 与列表查询并行执行（`Promise.all`） |
| 返回格式 | 遵循 R11：`{ code: 200, message: 'ok', data: { items: articles, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } } }` |

#### 8.14.2 文章 CRUD（管理员）

```typescript
// POST /api/v1/admin/articles — 创建
// - 必填字段：title, content
// - 可选字段：summary(自动从content截取前200字), coverImage, publishDate(默认now), author, category
// - content 存储富文本 HTML，前端使用 Ant Design RichTextEditor 或 react-quill

// PUT /api/v1/admin/articles/:id — 更新
// - 可部分更新（只传需要修改的字段）
// - updatedAt 自动更新

// DELETE /api/v1/admin/articles/:id — 删除
// - 硬删除（一期不需要软删除）
// - 删除后首页右侧文章列表自动移除（因为是实时查询）

// 权限校验：
// - 所有写操作需验证 JWT Token + 管理员权限（@UseGuards(JwtAuthGuard, AdminGuard)）
// - 未登录 → 返回 401
```

---

### 8.15 巴菲特/木头姐持仓 — 完整逻辑

```typescript
// 这两个页面是静态内容页，数据由管理员手动维护
// 一期方案：使用 Article 表存储，通过特定 category 区分

// 方案A（推荐）：复用 Article 表
// 创建文章时设置 category 字段：
//   category = 'buffett' → 巴菲特持仓页
//   category = 'arkk' → 木头姐持仓页

// 或者方案B：使用独立的静态页面
// 页面内容直接写在 page.tsx 中，管理员通过后台编辑

// 一期建议使用方案A，查询逻辑：
// 函数签名：
async function getBuffettHoldings(): Promise<Article[]>
// 规则：查询 article 表，where: { category: 'buffett' }，orderBy: { publishDate: 'desc' }
```

前端调用方式：
- 巴菲特持仓页 `/buffett-holdings` → GET /api/v1/articles?category=buffett
- 木头姐持仓页 `/arkk-holdings` → GET /api/v1/articles?category=arkk

ARKK 查询逻辑与 Buffett 完全对称，仅需将 category 参数改为 'arkk'。
两个页面可复用同一套文章列表组件，通过路由参数区分 category。

---

### 8.16 边界条件与异常处理汇总

| 场景 | 处理方式 |
|------|----------|
| 外部 API 调用失败 | 捕获异常，记录日志，返回缓存数据或空数组，不抛 500 |
| 外部 API 频率限制 | 每次调用后 sleep(300-1000ms)，批量调用分批处理 |
| stocks 表中无某股票 | currentPrice/totalMarketCap 返回 null，前端显示 "—" |
| 牛散无持仓记录 | 返回空列表（200），不返回 404 |
| actualCost 为 null | avgCost/sellProfit/returnRate 均为 null，前端显示 "—" |
| holdCount 为 0 | avgCost 不计算（防除零），returnRate 不计算 |
| 非交易日查询涨停板 | 返回空数组，前端提示"今日非交易日" |
| 搜索关键词为空 | 返回空数组 |
| 搜索无结果 | 返回空数组，前端提示"未找到相关结果" |
| 管理员未登录访问管理接口 | 返回 401 Unauthorized |
| DeepSeek 调用失败 | 返回空字符串，不影响主流程 |
| 分红数据 Send 为 null | 跳过该条记录 |
| 除权日股价缺失 | 股息率记为 0，不参与排名 |
| 超大分页参数 | page >= 1，page_size 限制 1-100，超出返回 400（遵循 R14） |
| 并发同步冲突 | 数据库唯一约束保证幂等，upsert 天然支持并发写入 |
| holdCount 为负数 | 数据清洗阶段已过滤（见 8.18.1 sanitizeCount），入库数据保证 >= 0 |
| 重复收藏/添加自选股 | 数据库唯一约束冲突，返回 409 Conflict |

---

### 8.17 历史K线数据获取（涨幅榜计算依赖）

#### 8.17.1 为什么需要历史K线

涨幅榜的 1w/2w/1m/3m/6m/12m 标签页需要计算历史涨幅，公式为：
```
涨幅 = (当前收盘价 - N天前收盘价) / N天前收盘价 × 100%
```
这要求数据库中存储每只股票的每日收盘价。

#### 8.17.2 K线数据表

```
// KlineDaily 模型已在第 3 章 Prisma Schema 中定义（见第 3 章）。
// 字段：id, stockCode, date, open, high, low, close, volume, amount
// 唯一约束：@@unique([stockCode, date])
```

#### 8.17.3 K线同步逻辑

```typescript
// apps/server/src/infrastructure/scheduler/kline-sync.task.ts
@Injectable()
export class KlineSyncTask extends BaseSyncTask
```

**K线同步规则（3 个方法）：**

| 方法 | 触发时机 | 职责 | 关键行为 |
|------|----------|------|----------|
| `syncTodayKline()` | `@Cron('30 17 * * 1-5')` — 每日 17:30（收盘后） | 同步当日K线数据 | 遍历所有活跃股票，构建 `symbol = code.market`，调用 `mairui.getHistoryKline(symbol, 'd', 'n', { st: today, et: today })`（不复权），以 `stockCode + date` 为唯一键 upsert；同步完成后自动调用 `recalcAllPeriodGainers()` |
| `backfillHistoryKline()` | 首次部署时手动触发 | 全量回填历史K线（过去1年） | 与 `syncTodayKline` 相同的 upsert 逻辑，但日期范围为 `[today - 1年, today]`；用于首次部署时初始化数据 |
| `recalcAllPeriodGainers()` | 由 `syncTodayKline` 内部调用 | 预计算各周期涨幅，写入 Redis | 计算周期：1w(5日)、2w(10日)、1m(22日)、3m(66日)、6m(132日)、12m(250日)；回溯日期 = `自然日 × 7/5`（交易日近似）；涨幅公式：`(当前价 - N天前收盘价) / N天前收盘价 × 100%`；结果按涨幅降序，取前500写入 Redis，key = `gainers:{period}:{YYYY-MM-DD}`，TTL 24小时 |

**依赖注入：**
- `MairuiService` — 外部 K线 API 调用

**错误处理：**
- 单只股票 K线同步失败不阻塞整体流程，记录日志继续
- API 调用间隔 300ms

---

### 8.18 数据清洗与校验规则

#### 8.18.1 外部数据通用清洗规则

```typescript
// apps/server/src/infrastructure/external-api/data-sanitizer.ts
@Injectable()
export class DataSanitizer
```

**数据清洗规则表格：**

| 清洗项 | 函数签名 | 规则 | 示例 |
|--------|----------|------|------|
| 股票代码 | `sanitizeStockCode(raw: string): string \| null` | `trim().toUpperCase()`；必须匹配 `/^\d{6}$/`（6位数字）；null/空返回 null | `" 000001 "` → `"000001"`；`"abc"` → `null` |
| 价格 | `sanitizePrice(raw: any): number \| null` | `parseFloat`；NaN 返回 null；范围 `0.01 ~ 100000`（A 股价格范围，含复权历史高价） | `"12.35"` → `12.35`；`"0"` → `null`；`"999999"` → `null` |
| 百分比（涨跌幅） | `sanitizePercent(raw: any): number \| null` | `parseFloat`；NaN 返回 null；范围 `-100 ~ +100`（覆盖北交所 30%、新股上市无涨跌幅限制等极端场景） | `"5.23"` → `5.23`；`"-30"` → `-30`；`"150"` → `null` |
| 比率（持股比例） | `sanitizeRatio(raw: any): number \| null` | `parseFloat`；NaN 返回 null；范围 `0 ~ 100`（用于十大股东 `cgbl` 等持股比例字段，与涨跌幅分开以避免范围冲突） | `"45.67"` → `45.67`；`"-1"` → `null`；`"101"` → `null` |
| 数量（持股数） | `sanitizeCount(raw: any): bigint \| null` | null/undefined → null；`Number()` 后 NaN 或负数 → null；上限 100 亿股（`10_000_000_000`）；返回 `BigInt` | `"12345678"` → `12345678n`；`"-1"` → `null` |
| 日期 | `sanitizeDate(raw: any): Date \| null` | null/空 → null；`new Date()` 后 NaN 返回 null；不能是未来日期；不能早于 1990 年 | `"2025-01-15"` → 有效；`"2099-01-01"` → `null` |
| 字符串（防 XSS） | `sanitizeString(raw: any, maxLength = 500): string \| null` | null/空 → null；`String(raw).trim().slice(0, maxLength)`；空字符串返回 null。**注意**：此函数仅做截断，不转义 HTML。富文本字段（如文章 content）需额外使用 DOMPurify 消毒；非富文本字段在 API 响应序列化时由框架自动转义 | `"  hello  "` → `"hello"`；超长截断 |

#### 8.18.2 各接口数据校验矩阵

**ST 股过滤全局策略**：

| 场景 | 策略 | 说明 |
|------|------|------|
| 涨幅榜（今日/历史） | **过滤** | 排除名称包含 "ST" 的股票，避免异常涨跌幅干扰排名 |
| 涨停板 | **过滤** | ST 股涨跌幅限制不同（5%），与正常涨停板混排会误导用户 |
| 增持/减持/新进排行 | **保留** | 牛散持有 ST 股是有效的投资信息，不应过滤 |
| 共同持仓 | **保留** | 按用户选择的牛散查询，不主动过滤 |
| 分红股息率排行 | **保留** | ST 股也可能分红，排行数据应完整 |
| 个人股东 | **保留** | 数据查询类功能，不主动过滤 |
| 实时行情同步 | **保留** | 同步全量数据，过滤在前端或查询时进行 |

| 数据源 | 字段 | 校验规则 |
|--------|------|----------|
| 股票列表 | Dm | 6位数字 |
| 股票列表 | mc | 非空，长度 1-50 |
| 实时行情 | p(价格) | 0.01 ~ 10000 |
| 实时行情 | pc(涨跌幅) | -50 ~ +50 |
| 实时行情 | v(成交量) | >= 0 |
| 十大股东 | cgsl(持股数) | >= 0, <= 100亿 |
| 十大股东 | cgbl(持股比例) | 0 ~ 100 |
| 十大股东 | jzrq(报告期) | 合法日期，非未来 |
| 分红 | Send(每10股派息) | > 0, <= 100 |
| K线 | o/h/l/c | > 0, <= 100000 |
| K线 | v(成交量) | >= 0 |

---

### 8.19 同步任务监控与告警

#### 8.19.1 同步日志查询

```typescript
// GET /api/v1/admin/sync/logs?page=1&page_size=20&status=failed
// 管理后台可查看所有同步任务的历史记录

interface SyncLogItem {
  id: string;
  taskName: string;       // 'stock-list' | 'shareholders' | 'dividends' | 'realtime' | 'limitup' | 'kline-backfill'
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string | null;  // 成功消息或错误信息
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null; // 毫秒（衍生字段：finishedAt - startedAt）
}
```

#### 8.19.2 告警规则

| 场景 | 告警方式 | 处理 |
|------|----------|------|
| 同步任务连续3次失败 | 写入 sync_logs + 日志 ERROR | 管理员手动检查 |
| 外部 API 返回空数据 | 日志 WARN | 跳过，不阻塞 |
| 同步耗时超过预期 2 倍 | 日志 WARN | 记录，不阻塞 |
| 数据量异常（如股票数量骤降 50%+） | 日志 ERROR + 标记 sync_log | 管理员确认 |
| DeepSeek API 额度耗尽 | 日志 ERROR | 停止补充，下次重试 |

#### 8.19.3 管理后台同步面板

```
管理后台 → 数据同步 页面

┌──────────────────────────────────────────────────────┐
│  同步任务面板                                         │
├──────────────────────────────────────────────────────┤
│  [手动触发同步]                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 股票列表  │ │ 十大股东  │ │ 分红数据  │ │ K线回填 │ │
│  │ [立即执行]│ │ [立即执行]│ │ [立即执行]│ │[立即执行]│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                      │
│  同步历史记录                                         │
│  ┌──────────────────────────────────────────────────┐│
│  │ 任务名    │ 状态   │ 耗时    │ 开始时间  │ 操作  ││
│  │ stock-list│ ✅成功 │ 12.3s   │ 16:30:01 │ 详情  ││
│  │ realtime  │ ✅成功 │ 45.6s   │ 09:35:00 │ 详情  ││
│  │ shareholders│ ❌失败│ 120.5s  │ 14:00:01 │ 重试  ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

---

## 9. 认证方案

### 9.1 后端 JWT 认证

> **文件**: `apps/server/src/config/jwt.strategy.ts`

**JWT 认证规范**：

| 项目 | 规范 |
|------|------|
| 策略类型 | Passport JWT Strategy（`@nestjs/passport`） |
| Token 提取方式 | `Authorization: Bearer {token}` 请求头 |
| 签名密钥 | 从 `ConfigService.get('JWT_SECRET')` 读取环境变量 |
| Token 有效期 | 从 `ConfigService.get('JWT_EXPIRES_IN')` 读取，默认 `7d` |

**Token 载荷结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `sub` | `string` | 用户 ID |
| `phone` | `string` | 手机号（User 模型主标识） |
| `role` | `string` | 角色（`user` / `admin`） |

**验证流程**：
1. 从请求头提取 Bearer Token
2. 使用 JWT Secret 验证签名和有效期
3. `validate()` 方法将 payload 转换为 `{ id, phone, role }` 挂载到 `request.user`

```typescript
// apps/server/src/config/config.module.ts 中的 JwtModule 注册：
// JwtModule.register({
//   secret: configService.get('JWT_SECRET'),
//   signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '7d') },
// })
```

```typescript
// apps/server/src/common/guards/jwt-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

```typescript
// apps/server/src/common/guards/admin.guard.ts
// Admin Guard 规范：
// - 判断逻辑：检查 request.user?.role === 'admin'
// - 前置条件：必须在 JwtAuthGuard 之后使用（确保 request.user 已存在）
// - 返回值：true 放行，false 拒绝（NestJS 自动返回 403）
// - 使用方式：@UseGuards(JwtAuthGuard, AdminGuard)
```

### 9.2 登录接口

```typescript
// apps/server/src/domain/auth/auth.controller.ts
class LoginDto {
  phone: string;    // 手机号（一期仅支持手机号登录）
  password: string;
}

@Controller('api/v1/auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // 校验手机号密码（一期仅实现管理员登录，用户注册/登录见 13.9 二期计划）
    // 返回 { code: 200, message: '登录成功', data: { accessToken, expiresIn } }
  }
}
```

### 9.3 路由保护

```typescript
// Controller 级别使用 Guard
@Controller('api/v1/admin/investors')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminInvestorController {
  // 所有接口需要 JWT Token + 管理员权限
}
```

### 9.4 前端 Token 管理

> **文件**: `apps/web/src/lib/auth.ts`

**Token 管理规范**：

| 项目 | 规范 |
|------|------|
| 存储 Key | `king_token` |
| 存储方式 | `localStorage` |
| SSR 兼容性 | `getToken()` 必须检查 `typeof window === 'undefined'`，服务端返回 `null` |
| `getToken()` | 读取 localStorage 中的 Token，SSR 环境返回 `null` |
| `setToken(token)` | 将 Token 写入 localStorage |
| `removeToken()` | 从 localStorage 删除 Token（退出登录时调用） |

**关键约束**：
- Token 不存入 Cookie（避免 CSRF 风险）
- 退出登录时必须调用 `removeToken()` + 跳转到登录页

---

## 10. Docker 部署配置

### 10.1 docker-compose.yml

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: king
      POSTGRES_PASSWORD: king123
      POSTGRES_DB: king
    ports:
      - "5432:5432"  # 生产环境建议移除此映射
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U king"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://king:king123@db:5432/king
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_USERNAME: ${ADMIN_USERNAME}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      MAIRUI_API_LICENCE: ${MAIRUI_API_LICENCE}
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
      MAIRUI_API_BASE: ${MAIRUI_API_BASE}
      DEEPSEEK_API_BASE: ${DEEPSEEK_API_BASE}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      REDIS_PORT: "6379"
      NODE_ENV: production
      PORT: "4000"
      LOG_LEVEL: info
      # 短信服务（从宿主机 .env 传入）
      ALIYUN_SMS_ACCESS_KEY_ID: ${ALIYUN_SMS_ACCESS_KEY_ID}
      ALIYUN_SMS_ACCESS_KEY_SECRET: ${ALIYUN_SMS_ACCESS_KEY_SECRET}
      ALIYUN_SMS_SIGN_NAME: ${ALIYUN_SMS_SIGN_NAME}
      ALIYUN_SMS_TEMPLATE_CODE: ${ALIYUN_SMS_TEMPLATE_CODE}
      # 微信支付（从宿主机 .env 传入）
      WECHAT_PAY_APP_ID: ${WECHAT_PAY_APP_ID}
      WECHAT_PAY_MCH_ID: ${WECHAT_PAY_MCH_ID}
      WECHAT_PAY_API_KEY: ${WECHAT_PAY_API_KEY}
      WECHAT_PAY_NOTIFY_URL: ${WECHAT_PAY_NOTIFY_URL}
      # 支付宝（从宿主机 .env 传入）
      ALIPAY_APP_ID: ${ALIPAY_APP_ID}
      ALIPAY_PRIVATE_KEY: ${ALIPAY_PRIVATE_KEY}
      ALIPAY_PUBLIC_KEY: ${ALIPAY_PUBLIC_KEY}
      ALIPAY_NOTIFY_URL: ${ALIPAY_NOTIFY_URL}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
      NEXT_PUBLIC_APP_NAME: "King 财经数据平台"
    depends_on:
      - server

volumes:
  pgdata:
```

### 10.2 apps/server/Dockerfile

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/prisma/package.json ./packages/prisma/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/server/ ./apps/server/
RUN pnpm --filter @king/prisma exec prisma generate
RUN pnpm --filter @king/server run build

EXPOSE 4000
CMD ["node", "apps/server/dist/main.js"]
```

### 10.3 apps/web/Dockerfile

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
RUN pnpm --filter @king/web run build

EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "--dir", "apps/web"]
```

---

## 11. 启动命令

```bash
# 1. 启动基础设施
docker compose up -d db redis

# 2. 安装依赖
pnpm install

# 3. 生成 Prisma Client + 建表
pnpm --filter @king/prisma exec prisma generate
pnpm --filter @king/prisma exec prisma db push

# 4. 启动后端（开发模式）
pnpm --filter @king/server dev

# 5. 启动前端（另一个终端）
pnpm --filter @king/web dev

# 6. 访问
# 前端: http://localhost:3000
# 后端 API: http://localhost:4000/api/v1
# 管理后台: http://localhost:3000/admin
# Docker 生产模式启动
# docker compose up -d
# 前端: http://localhost:3000
# 后端 API: http://localhost:4000/api/v1
```

---

## 12. 与 v2.0 的变更对照

| 变更项 | v2.0 | v3.0（本版） |
|--------|------|-------------|
| 架构模式 | Next.js 全栈（API Routes） | **前后端分离**（Next.js + NestJS） |
| 后端框架 | Next.js API Routes | **NestJS**（Controller/Service/Module） |
| 代码分层 | 无分层，逻辑全堆在 route.ts | **三层架构**（Controller → Service → Repository） |
| 基础设施 | 无独立层 | **Infrastructure 层**（Redis/外部API/定时任务/日志） |
| 项目结构 | 单体 | **pnpm Monorepo**（shared + prisma + web + server） |
| 类型共享 | 前后端各自定义 | **packages/shared** 统一类型 |
| 缓存 | 无 | **Redis**（涨停板/涨幅榜/实时行情） |
| 定时任务 | node-cron 脚本 | **@nestjs/schedule**（内置 cron） |
| 认证 | NextAuth.js | **@nestjs/jwt + Passport** |
| 参数校验 | 无 | **class-validator + DTO** |
| 异常处理 | 无 | **全局异常过滤器**（外部API降级） |
| 日志 | console.log | **nestjs-pino** 结构化日志 |
| 前端请求 | 直接 fetch | **axios + SWR**（拦截器 + 缓存） |
| 部署 | 单容器 | **Docker Compose**（4容器：web + server + db + redis） |

---

## 13. 商业化需求（盈利级功能）

> 本章定义让网站产生实际收入的商业化功能。一期实现免费+付费双轨模式。

### 13.1 商业模式总览

```
┌─────────────────────────────────────────────────────────┐
│                    收入来源                              │
├──────────────────┬──────────────────┬───────────────────┤
│   付费订阅       │   数据 API       │   广告系统         │
│   (核心收入)     │   (开发者收入)    │   (流量变现)       │
│                  │                  │                   │
│  免费用户:       │  开放数据:       │  展示位:           │
│  基础涨幅榜      │  股票列表         │  首页Banner       │
│  文章浏览        │  实时行情         │  文章页内嵌        │
│                  │                  │  侧边栏            │
│  VIP用户:        │  付费数据:       │                   │
│  牛散持仓详情    │  牛散持仓数据     │  收入模式:         │
│  增持/减持/新进  │  增持/减持/新进   │  CPM展示           │
│  共同持仓分析    │  共同持仓         │  点击分成           │
│  高管增持        │  高管交易         │                   │
│  分红股息率      │  分红数据         │                   │
│  实时推送        │  涨幅排行         │                   │
│                  │                  │                   │
│  定价:           │  定价:           │                   │
│  ¥49/月         │  ¥199/月         │                   │
│  ¥399/年         │  ¥1599/年        │                   │
└──────────────────┴──────────────────┴───────────────────┘
```

### 13.2 付费订阅系统

#### 13.2.1 会员等级定义

| 功能 | 免费用户 | VIP 会员 |
|------|----------|----------|
| 今日涨幅榜 | ✅ 前20名 | ✅ 全部 |
| 历史涨幅榜 | ❌ | ✅ 全部周期 |
| 涨停板数据 | ✅ 基础信息 | ✅ 连板/封板资金/行业 |
| 文章浏览 | ✅ 全部 | ✅ 全部 |
| 牛散列表 | ✅ 仅姓名+总市值 | ✅ 全部 |
| 牛散详情页 | ❌ 仅展示概览 | ✅ 完整持仓明细+饼图 |
| 增持/减持/新进 | ❌ | ✅ |
| 共同持仓分析 | ❌ | ✅ |
| 高管增持 | ❌ | ✅ |
| 十大增持排行 | ❌ | ✅ |
| 分红股息率 | ❌ | ✅ |
| 个人股东 | ❌ | ✅ |
| 搜索功能 | ✅ 基础搜索 | ✅ 高级搜索 |
| 数据导出 | ❌ | ✅ Excel导出 |
| 实时推送 | ❌ | ✅ WebSocket推送 |

#### 13.2.2 付费墙实现

> **文件**: `apps/server/src/common/guards/vip.guard.ts`

**VIP 拦截规范**：

| 项目 | 规范 |
|------|------|
| 判断逻辑 | 1. 管理员（`role === 'admin'`）→ 直接放行；2. 检查 `user.vipExpiresAt > new Date()` → VIP 有效则放行（精确到毫秒，到期当天 00:00:00.000 后失效）；3. 其他 → 拒绝 |
| 响应格式 | HTTP 200 + `{ code: 403, message: '该功能需要VIP会员', data: { requiredPlan: 'vip', pricing: { monthly: 49, yearly: 399 } } }` |
| 前端判断 | 前端根据响应体 `code === 403` 判断，展示付费墙组件 |
| 引用规则 | 遵循 **R12**（VIP 权限校验规则） |

**关键约束**：
- 返回 HTTP 200 而非 403，前端通过响应体 `code` 字段判断
- 响应中携带定价信息，供前端付费墙组件展示

```typescript
// Controller 使用
@Controller('api/v1/holdings/increase')
@UseGuards(JwtAuthGuard, VipGuard)
export class HoldingIncreaseController { /* ... */ }
```

#### 13.2.3 前端付费墙组件

> **文件**: `apps/web/src/components/paywall/VipPaywall.tsx`

**付费墙组件规范**：

| 项目 | 规范 |
|------|------|
| 触发条件 | API 返回 `{ code: 403 }` 时渲染此组件 |
| Props | 无外部 props（内部固定展示内容） |
| 展示内容 | 锁图标 + 标题"该功能需要 VIP 会员" + 功能描述 + 定价卡片（月度 ¥49/月、年度 ¥399/年，年度标注"省 ¥189"）+ "立即开通"按钮 |
| 行为 | 点击"立即开通" → 跳转支付页面 |
| 样式要求 | 居中布局，使用 Ant Design `Card` + `Button` 组件，年度卡片带 badge 标签 |

### 13.3 数据 API 服务（面向开发者）

#### 13.3.1 API 产品设计

为量化交易者、个人开发者提供标准化的数据 API。

**API 端点**: `https://api.kingdata.cn/v1`

**认证方式**: API Key（Header: `X-API-Key: your-key`）

**频率限制**: 根据套餐不同

| 套餐 | 月价格 | 频率限制 | 可用接口 |
|------|--------|----------|----------|
| 免费体验 | ¥0 | 100次/天 | 股票列表、实时行情 |
| 基础版 | ¥199/月 | 5000次/天 | + 涨停板、涨幅榜 |
| 专业版 | ¥599/月 | 50000次/天 | + 牛散持仓、增持/减持/新进 |
| 企业版 | ¥1599/月 | 无限制 | + 全部接口 + WebSocket推送 |

#### 13.3.2 API Key 管理系统

```typescript
// apps/server/src/domain/api-key/api-key.service.ts
import { randomBytes } from 'crypto';
import { hash } from 'bcrypt';

type ApiKeyPlan = 'free' | 'basic' | 'pro' | 'enterprise';

const PLAN_LIMITS: Record<ApiKeyPlan, number> = {
  free: 100,
  basic: 5000,
  pro: 50000,
  enterprise: Infinity,
};

interface ApiKeyContext {
  userId: string;
  plan: string;
  apiKeyId: string;
}
```

**API Key 管理规范**：

| 项目 | 规范 |
|------|------|
| 生成规则 | 前缀 `king_` + `randomBytes(32).toString('hex')`；使用 bcrypt（saltRounds=10）哈希后存储；仅创建时返回一次完整 Key |
| 存储字段 | `keyHash`（bcrypt 哈希）、`keyPrefix`（前12字符，用于展示）、`plan`、`dailyLimit`、`expiresAt`（默认30天） |
| 验证流程 | 1. 对请求 Key 做 bcrypt 哈希；2. 查库匹配 `keyHash`；3. 检查 `expiresAt` 是否过期；4. 检查当日用量是否超限 |
| 频率限制 | 按 `apiKeyId` + 当日（`createdAt >= todayStart`）统计 `apiUsageLog.count()`，超过 `dailyLimit` 返回 429 |
| 过期处理 | `expiresAt < new Date()` → 抛出 `UnauthorizedException('Invalid or expired API key')` |
| 返回上下文 | 验证通过后返回 `ApiKeyContext { userId, plan, apiKeyId }`，挂载到 `request.apiKeyContext` |

#### 13.3.3 API 用量统计

> **文件**: `apps/server/src/common/interceptors/api-usage.interceptor.ts`

**API 用量统计规范**：

| 项目 | 规范 |
|------|------|
| 实现方式 | NestJS `@Injectable()` + `NestInterceptor`，使用 RxJS `tap` 操作符 |
| 拦截逻辑 | 在响应返回后（`tap` 中）异步写入用量日志 |
| 记录内容 | `apiKeyId`（从 `request.apiKeyContext.apiKeyId` 获取）、`endpoint`（请求 URL）、`method`（HTTP 方法）、`statusCode`（200）、`responseTime`（`Date.now() - request.startTime`） |
| 超限处理 | 由 `ApiKeyService.validateApiKey()` 在请求前检查，超限返回 HTTP 429 |

**关键约束**：
- 用量记录写入不阻塞响应（异步操作）
- `request.startTime` 需在更早的中间件中设置

### 13.4 广告系统

#### 13.4.1 广告位定义

| 广告位 | 位置 | 尺寸 | 展示条件 |
|--------|------|------|----------|
| 首页顶部Banner | 首页 Header 下方 | 728×90 | 所有用户 |
| 首页侧边栏 | 右侧文章列表上方 | 300×250 | 所有用户 |
| 文章页内嵌 | 文章内容第2段后 | 728×90 | 免费用户 |
| 涨幅榜底部 | 表格下方 | 728×90 | 免费用户 |
| 牛散详情页侧栏 | 右侧持仓饼图下方 | 300×250 | 免费用户 |

**VIP用户无广告**。

#### 13.4.2 广告管理

```typescript
// 管理员在后台管理广告
// apps/server/src/domain/ad/ad.service.ts

// 广告数据模型（见 Prisma Schema）
// 管理员可：
// 1. 创建广告（图片/链接/展示位置/起止时间）
// 2. 设置广告优先级和权重
// 3. 查看广告展示次数和点击次数
// 4. 按时间段启用/停用广告

// 广告投放逻辑：
// 1. 前端请求广告位 → GET /api/v1/ads?position=home-banner
// 2. 后端根据：位置 + 用户是否VIP + 时间有效性 + 权重随机
// 3. 返回广告数据 + 记录展示日志
// 4. 用户点击广告 → POST /api/v1/ads/:id/click → 记录点击日志
```

### 13.5 支付集成

#### 13.5.1 支付方式

| 方式 | 说明 | 接入 |
|------|------|------|
| 微信支付 | 扫码支付（PC端） | 微信支付 Native API |
| 支付宝 | 扫码支付（PC端） | 支付宝当面付 API |

#### 13.5.2 支付流程

```
用户点击"开通VIP"
  → 选择套餐（月度/年度）
  → 选择支付方式（微信/支付宝）
  → 后端创建订单 → 调用支付API生成二维码
  → 前端展示二维码
  → 用户扫码支付
  → 支付平台异步通知 → 后端验签 → 开通VIP
  → 前端轮询支付状态 → 支付成功 → 刷新页面
```

#### 13.5.3 订单数据模型

```typescript
// 订单状态机
type OrderStatus = 'pending' | 'paid' | 'expired' | 'refunded';

// 支付完成后：
// 1. 更新订单状态为 paid
// 2. 更新用户的 vipExpiresAt
// 3. 创建会员变更记录（member_logs 表）
// 4. 发送站内通知

// 退款流程（一期预留，不实现）：
// - refunded 状态仅在管理员手动操作时触发
// - 退款 API: PUT /admin/orders/:id/refund（管理员接口）
// - 退款后：更新订单状态为 refunded，扣减用户 vipExpiresAt
```

### 13.6 用户注册与个人中心

#### 13.6.1 用户系统

```typescript
// 一期用户系统（轻量，不做复杂社交）
// 注册方式：手机号 + 验证码（阿里云短信服务）
// 或者：邮箱 + 密码

// 用户数据模型（见 Prisma Schema）
// - phone / email：登录凭证
// - passwordHash：bcrypt
// - role: 'user' | 'admin'（VIP 状态由 vipExpiresAt 决定，见 Prisma Schema）
// - vipExpiresAt：VIP到期时间
// - createdAt：注册时间
```

#### 13.6.2 个人中心页面

```
┌──────────────────────────────────────┐
│  个人中心                             │
├──────────────────────────────────────┤
│  头像  用户昵称                       │
│  会员状态: VIP (2026-12-31到期)       │
│  [续费VIP] [升级API套餐]              │
├──────────────────────────────────────┤
│  我的收藏                             │
│  - 牛散A  牛散B  牛散C  ...          │
├──────────────────────────────────────┤
│  API Key 管理                         │
│  Key: king_abc123...  [复制]          │
│  套餐: 专业版 | 今日用量: 1234/50000  │
│  [创建新Key] [升级套餐]               │
├──────────────────────────────────────┤
│  订单记录                             │
│  2026-03-01  VIP年度会员  ¥399  已支付│
│  2026-01-15  API专业版   ¥599  已支付│
├──────────────────────────────────────┤
│  退出登录                             │
└──────────────────────────────────────┘
```

### 13.7 商业化相关 Prisma 模型

```prisma
// 所有数据模型已统一在第 3 章 Prisma Schema 中定义，参见第 3 章。
```

### 13.8 商业化路由汇总

| 路由 | 页面 | 权限 |
|------|------|------|
| `/register` | 注册页 | 公开 |
| `/login` | 登录页 | 公开 |
| `/pricing` | 定价页 | 公开 |
| `/account` | 个人中心 | 登录 |
| `/account/api-keys` | API Key 管理 | 登录 |
| `/account/orders` | 订单记录 | 登录 |
| `/account/favorites` | 我的收藏 | 登录 |
| `/admin/ads` | 广告管理 | 管理员 |
| `/admin/orders` | 订单管理 | 管理员 |
| `/admin/users` | 用户管理 | 管理员 |
| `/admin/api-keys` | API Key 管理 | 管理员 |
| `/api/v1/auth/register` | 注册接口 | 公开 |
| `/api/v1/auth/login` | 登录接口 | 公开 |
| `/api/v1/auth/sms-code` | 短信验证码 | 公开 |
| `/api/v1/payment/create` | 创建支付订单 | 登录 |
| `/api/v1/payment/callback/wechat|alipay` | 支付回调 | 签名验证 |
| `/api/v1/payment/status/:orderNo` | 查询支付状态 | 登录 |
| `/api/v1/ads` | 获取广告 | 公开 |
| `/api/v1/ads/:id/click` | 记录广告点击 | 公开 |
| `/api/v1/account/api-keys` | API Key CRUD | 登录 |

### 13.9 商业化实现优先级

| 批次 | 功能 | 说明 |
|------|------|------|
| 二期-A | VIP 付费墙 + 会员等级 | 核心收入功能（JWT 认证一期已实现，见第 9 章） |
| 二期-A | 支付宝/微信支付集成 | 变现闭环 |
| 二期-B | 广告系统（展示+管理） | 流量变现 |
| 二期-B | 数据导出（Excel） | VIP 功能 |
| 三期 | 数据 API 服务 | 开发者收入 |
| 三期 | API Key 管理 + 用量统计 | |
| 三期 | WebSocket 实时推送 | VIP 高级功能 |

---

## 14. 用户体验与功能增强

> 本章定义让产品"好用、好看、想留下来"的体验层需求。

### 14.1 全局 UX 规范

#### 14.1.1 主题系统（暗色/亮色切换）

财经用户长时间盯盘，暗色主题是刚需。

> **文件**: `apps/web/src/components/lib/theme.ts`

**主题系统规范**：

| 项目 | 规范 |
|------|------|
| 实现方式 | Ant Design `ConfigProvider` + `theme` 配置 |
| 主题 Token | `colorPrimary`: `#1677ff`；`borderRadius`: `6`；`fontSize`: `14` |
| 亮色 Token | `colorBgBase`: `#ffffff`；`colorTextBase`: `#333333` |
| 暗色 Token | `colorBgBase`: `#141414`；`colorTextBase`: `#ffffff` |
| 切换方式 | Header 右上角太阳/月亮图标按钮 |
| 偏好存储 | `localStorage: 'king-theme'`，值为 `'dark'` / `'light'` / `'system'` |
| 默认行为 | 跟随系统偏好（`prefers-color-scheme`） |

**Header 右上角**：主题切换按钮（太阳/月亮图标），点击切换。

#### 14.1.2 涨跌颜色规范

财经数据必须统一涨跌颜色，这是用户最敏感的视觉信号。

| 场景 | 颜色 | 色值 |
|------|------|------|
| 涨幅/买入/盈利/增持 | 红色 | `#cf1322` |
| 跌幅/卖出/亏损/减持 | 绿色 | `#3f8600` |
| 平盘/中性 | 灰色 | `#999999` |
| 涨停 | 红色加粗 | `#cf1322` + `fontWeight: 700` |
| 跌停 | 绿色加粗 | `#3f8600` + `fontWeight: 700` |
| 清仓 | 黄色背景 | `#fffbe6` + `border: 1px solid #ffe58f` |

```typescript
// packages/shared/src/constants/format.ts
// 涨跌颜色规则表格：

// | 条件 | 颜色 | 前缀 |
// |------|------|------|
// | value == null 或 value === 0 | `#999999`（灰色） | `''`（空字符串） |
// | value > 0 | `#cf1322`（红色） | `'+'` |
// | value < 0 | `#3f8600`（绿色） | `''`（空字符串） |
```

#### 14.1.3 加载/空/错误三态

所有数据展示区域必须处理三种状态：

> **文件**: `apps/web/src/components/common/AsyncContent.tsx`

**三态组件规范**：

| 状态 | 展示要求 | Ant Design 组件 |
|------|----------|-----------------|
| 加载中（`loading=true`） | 骨架屏，默认 5 行段落 | `<Skeleton active paragraph={{ rows: 5 }} />` |
| 错误（`error` 存在） | 错误结果页，展示错误信息 | `<Result status="error" title="加载失败" subTitle={error.message} />` |
| 空数据（`data` 为 null/undefined） | 空状态提示，默认文案"暂无数据" | `<Empty description={emptyText} />` |
| 正常（`data` 存在） | 渲染 children render prop | `<>{children(data)}</>` |

**Props 规范**：

| Prop | 类型 | 说明 |
|------|------|------|
| `loading` | `boolean` | 是否加载中 |
| `error` | `Error \| undefined` | 错误对象 |
| `data` | `T \| undefined \| null` | 数据 |
| `emptyText` | `string`（默认 `'暂无数据'`） | 空状态文案 |
| `children` | `(data: NonNullable<T>) => ReactNode` | 数据渲染函数（render prop） |

#### 14.1.4 面包屑导航

所有二级及以下页面必须有面包屑：

```
首页 / 牛散 / 张三持仓详情
首页 / 涨幅榜 / 涨停板
首页 / 文章 / 文章标题
```

```tsx
// apps/web/src/components/layout/AppBreadcrumb.tsx
import { Breadcrumb } from 'antd';

const ROUTE_MAP: Record<string, string> = {
  '/': '首页',
  '/investors': '牛散',
  '/top-gainers': '涨幅榜',
  '/articles': '文章',
  '/common-holdings': '共同持仓',
  '/investor-increase': '牛散增持',
  '/investor-decrease': '牛散减持',
  '/investor-new': '牛散新进',
  '/executive-increase': '高管增持',
  '/top-increase': '十大增持',
  '/dividend-yield': '分红股息率',
  '/individual-shareholders': '个人股东',
  '/buffett-holdings': '巴菲特持仓',
  '/arkk-holdings': '木头姐持仓',
  '/watchlist': '自选股',
  '/notifications': '通知中心',
};

// 动态路由参数（如牛散姓名、文章标题）从数据中获取
```

---

### 14.2 新功能：自选股

#### 14.2.1 功能描述

用户可将感兴趣的股票加入自选，在首页快速查看自选股行情。

#### 14.2.2 数据模型

```prisma
// Watchlist 模型已在第 3 章 Prisma Schema 中定义（见第 3 章）。
```

#### 14.2.3 自选股页面

**路由**: `/watchlist`

```
┌──────────────────────────────────────────────────────────┐
│  自选股                                    [+ 添加股票]   │
├──────────────────────────────────────────────────────────┤
│  [全部] [重点关注] [短线观察] [自定义分组]                  │
├──────────────────────────────────────────────────────────┤
│  股票名称 │ 代码 │ 现价 │ 涨跌幅 │ 成交额 │ 市值 │ 操作  │
│  平安银行 │ 000001│ 12.50│ +2.04%│ 15.3亿│ 2430亿│ [删除]│
│  比亚迪   │ 002594│ 265.8│ -1.23%│ 45.2亿│ 7700亿│ [删除]│
│  ...                                                    │
├──────────────────────────────────────────────────────────┤
│  盘中每30秒自动刷新（SWR refreshInterval: 30000）         │
└──────────────────────────────────────────────────────────┘
```

#### 14.2.4 添加自选股

```tsx
// 点击 "+ 添加股票" → 弹出 Modal → 输入股票代码或名称 → 搜索 → 选择 → 加入
// 支持批量添加（逗号分隔多个代码）
// 支持选择分组
```

#### 14.2.5 首页自选股卡片

```
首页布局调整：
┌──────────────────────────────────────────────────────────┐
│  AppHeader                                                │
├────────────┬─────────────────────────────────────────────┤
│            │  [自选股行情卡片] ← 新增                      │
│            │  平安银行 12.50 +2.04%                       │
│ AppSidebar │  比亚迪   265.8 -1.23%                       │
│            │  ... [查看全部 →]                             │
│            ├─────────────────────────────────────────────┤
│            │  [功能模块入口卡片]                            │
│            ├─────────────────────────────────────────────┤
│            │  [牛散市值排行榜]                              │
│            ├─────────────────────────────────────────────┤
│            │  [最新文章]                                   │
├────────────┴─────────────────────────────────────────────┤
│  AppFooter                                                │
└──────────────────────────────────────────────────────────┘
```

---

### 14.3 新功能：价格提醒

#### 14.3.1 功能描述

用户对某只股票设置价格提醒，当股价达到目标价时通知用户。

#### 14.3.2 数据模型

```prisma
// PriceAlert 模型已在第 3 章 Prisma Schema 中定义（见第 3 章）。

// Notification 模型已在第 3 章 Prisma Schema 中定义（见第 3 章）。
```

#### 14.3.3 提醒设置交互

```
股票详情页 → [设置提醒] 按钮 → 弹出 Modal

┌──────────────────────────────────────┐
│  设置价格提醒 — 平安银行(000001)      │
├──────────────────────────────────────┤
│  提醒类型:  ○ 高于  ● 低于            │
│  目标价格:  [  12.00  ] 元            │
│                                      │
│  当前价: 11.50  距目标: +4.35%        │
│                                      │
│  [取消]            [确定]             │
└──────────────────────────────────────┘
```

#### 14.3.4 提醒触发逻辑

> **文件**: `apps/server/src/domain/price-alert/price-alert.service.ts`

**价格提醒触发规则**：

| 项目 | 规范 |
|------|------|
| 触发时机 | 定时任务 `@Cron('* 9-15 * * 1-5')`，盘中每分钟执行 |
| 查询条件 | `isActive: true` 且 `triggeredAt: null` 的所有活跃提醒 |
| 价格获取 | 从 Redis 缓存批量获取（`stock:price:{code}`），使用 `redis.mget()` + `Map` 映射 |
| 触发条件 | `direction === 'above'` 且 `currentPrice >= targetPrice`；或 `direction === 'below'` 且 `currentPrice <= targetPrice` |
| 触发后处理 | 1. 更新提醒：`triggeredAt = now`, `isActive = false`；2. 创建通知：`type: 'price_alert'`，标题含股票名称，内容含当前价和目标价 |
| 批量处理策略 | 先批量获取所有涉及股票的价格（去重），再逐条检查触发条件 |
| 通知内容格式 | `{stockName} 价格提醒：当前价 {currentPrice}，已{高于/低于}目标价 {targetPrice}` |

#### 14.3.5 通知中心

```
Header 右上角：🔔 通知图标 + 未读数 Badge

点击 → 下拉面板（Dropdown）：
┌──────────────────────────────────────┐
│  通知中心                    [全部已读] │
├──────────────────────────────────────┤
│  🔴 平安银行 价格提醒        2分钟前  │
│  当前价 12.50，已高于目标价 12.00    │
├──────────────────────────────────────┤
│  ⚪ 系统通知：VIP即将到期     3天前   │
├──────────────────────────────────────┤
│  [查看全部通知 →]                     │
└──────────────────────────────────────┘
```

---

### 14.4 数据可视化增强

#### 14.4.1 首页市场概览仪表盘

```
首页顶部（自选股卡片上方）：

┌──────────────────────────────────────────────────────────┐
│  📊 市场概览                              2026-04-03 盘中 │
├──────────────────────────────────────────────────────────┤
│  上证指数  3,245.68  +0.82%  ████████████░░  涨 2,647    │
│  深证成指  10,567.23 -0.35%  ██████████████░  跌 1,234   │
│  创业板指  2,089.45  +1.56%  ████████████░░  涨 1,890    │
│  涨停 45  跌停 12  上涨 2,847  下跌 1,923  平盘 234       │
└──────────────────────────────────────────────────────────┘

数据来源：mairuiapi 指数实时接口
刷新频率：盘中每30秒
```

#### 14.4.2 牛散详情页图表增强

```
牛散详情页 — 持仓概览区域：

┌──────────────────────────────────────────────────────────┐
│  持仓概览                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 总市值        │  │ 持股支数      │  │ 本期收益      │    │
│  │ ¥15.23亿     │  │ 12支         │  │ +2.34亿      │    │
│  │ ↑ 较上期+8%  │  │ ↑ 新进2支    │  │ ↑ 收益率+18% │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                          │
│  持仓行业分布（饼图）         持仓市值TOP5（柱状图）        │
│  ┌──────────────┐          ┌──────────────┐              │
│  │   🥧         │          │   📊         │              │
│  │  金融 35%    │          │  平安银行    │              │
│  │  科技 25%    │          │  ████████    │              │
│  │  医药 20%    │          │  比亚迪      │              │
│  │  消费 15%    │          │  ██████      │              │
│  │  其他 5%     │          │  ...         │              │
│  └──────────────┘          └──────────────┘              │
└──────────────────────────────────────────────────────────┘

行业分布数据来源：stocks 表的 mainBusiness 字段
按关键词匹配行业分类（金融/科技/医药/消费/能源/工业/其他）
```

#### 14.4.3 涨幅榜迷你走势图

```
涨幅榜表格中，每行股票名称旁展示 7 日迷你走势图（Sparkline）：

股票名称          代码    现价    涨跌幅    迷你走势
平安银行 📈       000001  12.50   +2.04%   [~~/\__]
比亚迪   📉       002594  265.8   -1.23%   [/\~~\__]

实现：ECharts Sparkline，数据从 Redis 缓存的 kline_daily 取最近7天
宽度：100px，高度：30px
颜色：整体涨为红色，跌为绿色
```

---

### 14.5 交互增强

#### 14.5.1 表格增强

所有数据表格统一增强：

| 功能 | 说明 | Ant Design 组件 |
|------|------|-----------------|
| 列筛选 | 按行业/交易所等筛选 | Table `filters` |
| 列排序 | 点击表头排序 | Table `sorter` |
| 列固定 | 固定前2列（名称+代码） | Table `fixed: 'left'` |
| 全文搜索 | 表格上方搜索框 | Input.Search |
| 列显隐 | 用户自定义显示哪些列 | Checkbox.Group |
| 密度切换 | 紧凑/标准/宽松 | Table `size` |
| 导出 Excel | VIP 功能 | 自定义按钮 |

**表格组件通用 Props 规范**：

| Prop | 值 | 说明 |
|------|-----|------|
| `rowKey` | `"id"` | 行唯一标识 |
| `pagination.pageSize` | `20` | 每页条数 |
| `pagination.showSizeChanger` | `true` | 允许切换每页条数 |
| `pagination.showTotal` | `(t) => '共 ${t} 条'` | 总条数展示 |
| `scroll.x` | `'max-content'` | 横向滚动（列过多时） |
| `scroll.y` | `600` | 纵向滚动（固定表头） |
| `size` | `tableSize`（动态） | 支持 `small` / `middle` / `large` 切换 |
| `sticky.offsetHeader` | `48` | 表头吸顶偏移（Header 高度） |
| `rowClassName` | 清仓行返回 `'row-cleared'` | 清仓行黄色背景高亮 |

#### 14.5.2 搜索增强

```
搜索框交互优化：

1. 输入即搜索（debounce 300ms），不需要点搜索按钮
2. 下拉建议列表（Dropdown）：
   ┌──────────────────────────────────────┐
   │  🔍 "000001"                         │
   ├──────────────────────────────────────┤
   │  📈 000001 平安银行    深圳           │
   │  👤 张三              牛散 · 市值15亿  │
   └──────────────────────────────────────┘
3. 键盘导航：↑↓ 选择，Enter 确认，Esc 关闭
4. 最近搜索记录（localStorage，最多10条）
5. 热门搜索（后台配置，展示前5个）
```

#### 14.5.3 页面间跳转优化

```
可点击跳转的元素统一规范：
- 股票名称 → 跳转股票详情（弹窗或新页面）
- 牛散姓名 → 跳转牛散详情页
- 股票代码 → 复制到剪贴板 + Toast 提示"已复制"
- 表格行 → 整行可点击，跳转详情（cursor: pointer + hover 高亮）

返回逻辑：
- 从列表页进入详情页 → 详情页顶部有 [← 返回列表] 按钮
- 浏览器后退 → 恢复列表页的滚动位置和筛选状态
  实现：使用 sessionStorage 保存列表状态
```

---

### 14.6 响应式设计

#### 14.6.1 断点规范

| 断点 | 宽度 | 设备 | 布局策略 |
|------|------|------|----------|
| xs | < 576px | 手机 | 侧边栏收起为底部Tab栏，表格改为卡片列表 |
| sm | 576-768px | 大手机/小平板 | 侧边栏收起，表格横向滚动 |
| md | 768-992px | 平板 | 侧边栏可收起 |
| lg | 992-1200px | 小笔记本 | 侧边栏展开 |
| xl | > 1200px | 桌面 | 完整布局 |

#### 14.6.2 移动端适配

```
手机端布局：
┌──────────────────────┐
│  [☰] King    [🔔][👤] │  ← 简化 Header
├──────────────────────┤
│                      │
│    页面内容           │
│    （全宽）           │
│                      │
├──────────────────────┤
│  首页 牛散 涨幅 我的  │  ← 底部 Tab 导航
└──────────────────────┘

表格 → 卡片列表（移动端）：
┌──────────────────────┐
│  平安银行  000001     │
│  现价: 12.50 +2.04%  │
│  市值: 2430亿  换手: 1.2% │
│  [查看详情 →]         │
└──────────────────────┘
```

---

### 14.7 性能体验优化

#### 14.7.1 骨架屏

所有页面首次加载时展示骨架屏，而非空白或 loading spinner。

**骨架屏规范**：

| 页面区域 | 骨架行数 | 说明 |
|----------|----------|------|
| 市场概览 | 2 行 | 首页顶部仪表盘区域 |
| 自选股 | 4 行 | 首页自选股卡片区域 |
| 牛散排行 | 6 行 | 首页牛散排行表格区域 |
| 文章列表 | 3 行 | 首页文章列表区域 |

**配置要求**：
- 使用 Ant Design `<Skeleton active />` 组件
- `paragraph.rows` 根据区域内容密度调整
- 骨架屏容器使用 `skeleton-home` 类名包裹

#### 14.7.2 数据预加载

**数据预加载规范**：

| 策略 | 说明 |
|------|------|
| 链接预加载 | 使用 Next.js `<Link prefetch={true}>`，鼠标悬停时预加载目标页面 |
| SWR 去重 | `dedupingInterval: 60000`（60秒内相同请求去重，避免重复请求） |
| 焦点不刷新 | `revalidateOnFocus: false`（切标签页不触发重新请求） |
| 预加载范围 | 列表页中的链接（如牛散姓名 → 详情页） |

**关键约束**：
- `prefetch` 仅在用户悬停/可见时触发，不预加载所有页面
- SWR 全局配置应统一设置上述参数

#### 14.7.3 表格虚拟滚动

```tsx
// 当数据量 > 100 条时，使用虚拟滚动
import { Table } from 'antd';
import { useVirtualAntdTable } from '@ant-design/pro-components';

// 或使用 rc-virtual-list 自定义实现
// 只渲染可视区域的行，DOM 节点数恒定
```

---

### 14.8 SEO 与分享

#### 14.8.1 Meta 标签

> **文件**: 各页面 `page.tsx` 中的 `generateMetadata` 导出

**SEO Meta 规范**：

| 项目 | 规范 |
|------|------|
| title 格式 | `{页面标题} - King 财经数据平台`（如 `{investor.name} 持仓详情 - King 财经数据平台`） |
| description 格式 | `查看{主体}的最新{数据类型}`（如 `查看{investor.name}的最新持仓明细、增持减持动态`） |
| OG title | `{主体}的{功能}`（如 `{investor.name}的持仓分析`） |
| OG description | 与 description 相同 |
| OG images | `['/og-image.png']`（统一 OG 图片） |
| 实现方式 | Next.js App Router 的 `generateMetadata()` 异步函数，在服务端生成 |

#### 14.8.2 分享功能

```
文章页和牛散详情页 → [分享] 按钮 → 弹出分享面板

┌──────────────────────────────────────┐
│  分享                                │
├──────────────────────────────────────┤
│  [微信] [微博] [QQ] [复制链接]        │
│                                      │
│  链接: https://king.com/investors/xxx │
│  [已复制]                            │
└──────────────────────────────────────┘
```

---

### 14.9 新增路由与组件汇总

| 路由 | 页面 | 说明 |
|------|------|------|
| `/watchlist` | 自选股 | 登录后可用 |
| `/notifications` | 通知中心 | 登录后可用 |

| 新增组件 | 路径 | 说明 |
|----------|------|------|
| AsyncContent | `components/common/` | 加载/空/错误三态 |
| AppBreadcrumb | `components/layout/` | 面包屑导航 |
| ThemeSwitcher | `components/layout/` | 暗色/亮色切换 |
| MarketOverview | `components/market/` | 市场概览仪表盘 |
| WatchlistCard | `components/stock/` | 自选股卡片 |
| PriceAlertModal | `components/stock/` | 价格提醒设置 |
| NotificationDropdown | `components/notification/` | 通知下拉面板 |
| SparklineChart | `components/charts/` | 迷你走势图 |
| ShareModal | `components/common/` | 分享面板 |
| StockCard | `components/stock/` | 移动端股票卡片 |

### 14.10 新增 Prisma 模型

```prisma
// 所有数据模型已统一在第 3 章 Prisma Schema 中定义，参见第 3 章。
```

### 14.11 体验功能实现优先级

| 批次 | 功能 | 说明 |
|------|------|------|
| 一期 | 暗色/亮色主题切换 | 基础体验 |
| 一期 | 涨跌颜色规范 | 基础体验 |
| 一期 | 加载/空/错误三态 | 基础体验 |
| 一期 | 面包屑导航 | 基础体验 |
| 一期 | 表格增强（排序/筛选/固定列） | 基础体验 |
| 一期 | 搜索增强（debounce/建议列表） | 基础体验 |
| 一期 | 骨架屏 | 基础体验 |
| 二期-A | 自选股 | 核心功能 |
| 二期-A | 价格提醒 + 通知中心 | 核心功能 |
| 二期-A | 市场概览仪表盘 | 数据可视化 |
| 二期-A | 牛散详情页图表增强 | 数据可视化 |
| 二期-B | 涨幅榜迷你走势图 | 数据可视化 |
| 二期-B | 响应式/移动端适配 | 体验扩展 |
| 二期-B | 分享功能 | 增长 |
| 三期 | SEO Meta 标签优化 | 增长 |
| 三期 | 表格虚拟滚动 | 性能 |
