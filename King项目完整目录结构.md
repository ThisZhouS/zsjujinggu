# King 财经数据平台 — 完整项目结构

> 本文档详细列出项目的所有文件及其作用，供开发人员参考。

---

## 一、项目根目录

```
king/
├── package.json                    # 根 package.json，定义 pnpm workspace 配置和公共脚本
├── pnpm-lock.yaml                  # 依赖锁文件，部署时必需
├── pnpm-workspace.yaml             # Monorepo 工作区配置，声明 packages/ 和 apps/
├── docker-compose.yml              # Docker Compose 编排文件（db + redis + server + web）
└── .env.example                    # 环境变量模板，包含所有服务的配置示例
```

---

## 二、共享包（packages/）

### 2.1 packages/shared/ — 共享类型与常量

```
packages/shared/
├── package.json                    # 包配置，定义 @king/shared 包名
└── src/
    ├── types/                      # 全局 TypeScript 类型定义
    │   ├── investor.ts             # Investor、InvestorWithMarketValue 等类型
    │   ├── stock.ts                # Stock、StockQuote、TopGainerItem 等类型
    │   ├── holding.ts              # HoldingRow、IncreaseItem、DecreaseItem 等类型
    │   ├── article.ts              # Article、ArticleListItem 等类型
    │   ├── dividend.ts             # Dividend、DividendYieldItem 等类型
    │   └── api.ts                  # ApiResponse<T>、Pagination 等通用响应类型
    │
    ├── constants/                  # 业务常量
    │   ├── quarter.ts              # 季度计算函数、财报披露规则常量
    │   └── format.ts               # 数字格式化、百分比格式化常量
    │
    └── index.ts                    # 统一导出入口
```

### 2.2 packages/prisma/ — 数据库 Schema

```
packages/prisma/
├── package.json                    # 包配置，定义 @king/prisma 包名
├── prisma/
│   └── schema.prisma               # Prisma Schema，定义 20 个数据模型
│                                   # User, Investor, Holding, Stock, KlineDaily,
│                                   # Article, ExecutiveTrade, Dividend, UserFavorite,
│                                   # Watchlist, PriceAlert, Notification, SyncLog,
│                                   # ApiKey, ApiUsageLog, Order, MemberLog, Ad, AdLog
│
└── src/
    └── index.ts                    # 导出 PrismaClient 单例
```

---

## 三、前端应用（apps/web/）

### 3.1 根配置

```
apps/web/
├── Dockerfile                      # Next.js 生产环境 Docker 构建文件
├── package.json                    # 前端依赖配置
├── next.config.js                  # Next.js 配置，包含 rewrites 代理到后端 API
├── .env.local                      # 前端环境变量（NEXT_PUBLIC_API_URL 等）
```

### 3.2 页面路由（src/app/）

```
apps/web/src/app/
├── layout.tsx                      # 全局布局（Header + Sidebar + Footer）
├── page.tsx                        # 首页（/）
├── globals.css                     # 全局样式（Tailwind + Ant Design 覆盖）
│
├── investors/                      # 牛散列表与详情
│   ├── page.tsx                    # 牛散列表页（/investors）
│   └── [id]/page.tsx               # 牛散详情页（/investors/:id）
│
├── top-gainers/page.tsx            # 涨幅榜页面（/top-gainers）
│
├── articles/                       # 文章模块
│   ├── page.tsx                    # 文章列表页（/articles）
│   └── [id]/page.tsx               # 文章详情页（/articles/:id）
│
├── common-holdings/page.tsx        # 共同持仓分析页（/common-holdings）
├── investor-increase/page.tsx      # 牛散增持页（/investor-increase）
├── investor-decrease/page.tsx      # 牛散减持页（/investor-decrease）
├── investor-new/page.tsx           # 牛散新进页（/investor-new）
├── executive-increase/page.tsx     # 高管增持页（/executive-increase）
├── top-increase/page.tsx           # 十大增持排行页（/top-increase）
├── individual-shareholders/page.tsx # 个人股东页（/individual-shareholders）
├── buffett-holdings/page.tsx       # 巴菲特持仓页（/buffett-holdings）
├── arkk-holdings/page.tsx          # 木头姐持仓页（/arkk-holdings）
├── dividend-yield/page.tsx         # 分红股息率页（/dividend-yield）
│
├── login/page.tsx                  # 管理员登录页（/login）
├── register/page.tsx               # 用户注册页（/register）
├── pricing/page.tsx                # 定价页（/pricing）
├── watchlist/page.tsx              # 自选股页（/watchlist）
├── notifications/page.tsx          # 通知中心页（/notifications）
│
├── account/                        # 个人中心
│   ├── page.tsx                    # 个人信息页（/account）
│   ├── api-keys/page.tsx           # API Key 管理页（/account/api-keys）
│   ├── orders/page.tsx             # 我的订单页（/account/orders）
│   └── favorites/page.tsx          # 我的收藏页（/account/favorites）
│
└── admin/                          # 管理后台（需 AdminGuard）
    ├── layout.tsx                  # 管理后台布局
    ├── page.tsx                    # 管理后台首页（/admin）
    ├── investors/page.tsx          # 牛散管理（/admin/investors）
    ├── articles/page.tsx           # 文章管理（/admin/articles）
    ├── ads/page.tsx                # 广告管理（/admin/ads）
    ├── orders/page.tsx             # 订单管理（/admin/orders）
    ├── users/page.tsx              # 用户管理（/admin/users）
    └── api-keys/page.tsx           # API Key 管理（/admin/api-keys）
```

### 3.3 工具库（src/lib/）

```
apps/web/src/lib/
├── api.ts                          # 后端 API 客户端
│                                   # - axios 实例配置
│                                   # - 请求拦截器：自动附加 Authorization header
│                                   # - 响应拦截器：401 跳转登录、解包 res.data
│
└── auth.ts                         # 前端 Token 管理
                                    # - getToken() / setToken() / removeToken()
                                    # - localStorage 读写封装
```

### 3.4 自定义 Hooks（src/hooks/）

```
apps/web/src/hooks/
├── useInvestors.ts                 # 牛散列表 SWR Hook
├── useTopGainers.ts                # 涨幅榜 SWR Hook
├── useArticles.ts                  # 文章列表 SWR Hook
└── useStockPrice.ts                # 股票实时价格 SWR Hook
```

### 3.5 组件库（src/components/）

```
apps/web/src/components/
├── layout/                         # 布局组件
│   ├── AppHeader.tsx               # 顶部导航栏
│   ├── AppSidebar.tsx              # 侧边栏菜单
│   ├── AppFooter.tsx               # 页脚
│   ├── AppBreadcrumb.tsx           # 面包屑导航
│   └── ThemeSwitcher.tsx           # 暗色/亮色主题切换
│
├── charts/                         # 图表组件
│   ├── PieChart.tsx                # 饼图（持仓分布）
│   ├── KLineChart.tsx              # K 线图
│   └── SparklineChart.tsx          # 迷你走势图
│
├── stock/                          # 股票相关组件
│   ├── StockTable.tsx              # 股票表格（支持虚拟滚动）
│   ├── StockSearch.tsx             # 股票搜索框
│   ├── WatchlistCard.tsx           # 自选股卡片
│   ├── PriceAlertModal.tsx         # 价格提醒弹窗
│   └── StockCard.tsx               # 股票信息卡片
│
├── investor/                       # 牛散相关组件
│   ├── InvestorCard.tsx            # 牛散信息卡片
│   ├── InvestorTable.tsx           # 牛散列表表格
│   └── HoldingTable.tsx            # 持仓明细表格
│
├── common/                         # 通用组件
│   ├── AsyncContent.tsx            # 异步内容包装器（loading/error/empty 状态）
│   └── ShareModal.tsx              # 分享弹窗
│
├── market/
│   └── MarketOverview.tsx          # 市场概览组件（大盘指数、涨跌统计）
│
├── notification/
│   └── NotificationDropdown.tsx    # 通知下拉菜单
│
├── paywall/
│   └── VipPaywall.tsx              # VIP 付费墙组件（检测 code:403 时展示）
│
└── lib/
    └── theme.ts                    # 主题配置（Ant Design 主题令牌）
```

---

## 四、后端应用（apps/server/）

### 4.1 根配置

```
apps/server/
├── Dockerfile                      # NestJS 生产环境 Docker 构建文件
├── package.json                    # 后端依赖配置
└── src/
```

### 4.2 入口文件

```
apps/server/src/
├── main.ts                         # NestJS 应用入口
│                                   # - 创建 NestFactory
│                                   # - 注册全局过滤器、拦截器
│                                   # - 启用 CORS
│                                   # - 监听端口
│
└── app.module.ts                   # 根模块
                                    # - 导入所有领域模块
                                    # - 配置 ConfigModule
```

### 4.3 公共模块（src/common/）

```
apps/server/src/common/
├── decorators/
│   └── roles.decorator.ts          # @Roles('admin') 装饰器
│                                   # 配合 AdminGuard 使用
│
├── guards/                         # 守卫
│   ├── jwt-auth.guard.ts           # JWT 认证守卫
│   │                               # 验证 Authorization header 中的 JWT
│   │                               # 将 payload 挂载到 request.user
│   ├── vip.guard.ts                # VIP 权限守卫
│   │                               # 检查 user.vipExpiresAt > new Date()
│   │                               # 非VIP返回 HTTP 200 + code:403
│   └── admin.guard.ts              # 管理员权限守卫
│                                   # 检查 user.role === 'admin'
│
├── filters/                        # 异常过滤器
│   ├── http-exception.filter.ts    # 全局异常过滤器
│   │                               # 统一响应格式为 { code, message, data }
│   │                               # 处理 NestJS 内置异常（401/403/404等）
│   └── external-api.error.ts       # ExternalApiError 自定义异常
│                                   # 外部 API 调用失败时抛出
│                                   # 全局过滤器捕获后返回降级数据
│
└── interceptors/                   # 拦截器
    ├── logging.interceptor.ts      # 请求日志拦截器
    │                               # 记录请求方法、路径、耗时
    └── api-usage.interceptor.ts    # API 使用量拦截器
                                    # 记录 API Key 调用次数
```

### 4.4 基础设施层（src/infrastructure/）

```
apps/server/src/infrastructure/
├── prisma/
│   ├── prisma.module.ts            # Prisma 模块
│   └── prisma.service.ts           # PrismaClient 单例服务
│                                   # 提供数据库连接和查询方法
│
├── redis/
│   ├── redis.module.ts             # Redis 模块
│   └── redis.service.ts            # Redis 客户端服务
│                                   # get/set/del/mget 等方法封装
│                                   # 连接失败时静默降级
│
├── external-api/
│   ├── external-api.module.ts      # 外部 API 模块
│   ├── mairui.service.ts           # mairuiapi 封装
│   │                               # 股票列表、实时行情、涨停板、股东等接口
│   ├── deepseek.service.ts         # DeepSeek API 封装
│   │                               # 股票简介生成（带降级策略）
│   └── data-sanitizer.ts           # 数据清洗函数
│                                   # sanitizePercent/sanitizePrice/sanitizeCount 等
│
└── scheduler/                      # 定时任务
    ├── scheduler.module.ts         # 调度器模块
    ├── base-sync.task.ts           # 同步任务基类
    │                               # 定义模板方法模式
    ├── stock-sync.task.ts          # 股票列表同步任务
    │                               # 每日 00:30 执行
    ├── kline-sync.task.ts          # K 线数据同步任务
    │                               # 盘中每 5 分钟执行
    └── sync.module.ts              # 同步任务模块汇总导出
```

### 4.5 领域层（src/domain/）

#### 4.5.1 牛散模块（investor/）

```
apps/server/src/domain/investor/
├── investor.module.ts              # 模块定义
├── investor.controller.ts          # 控制器
│                                   # GET /investors - 牛散列表
│                                   # GET /investors/:id - 牛散详情
├── investor.service.ts             # 业务逻辑
│                                   # 牛散详情：查询持仓、计算市值、生成饼图数据
├── investor.repository.ts          # 数据访问层
│                                   # findMany/findById/findByStockCode 等
└── dto/
    ├── create-investor.dto.ts      # 创建牛散 DTO
    ├── update-investor.dto.ts      # 更新牛散 DTO
    └── query-investor.dto.ts       # 查询参数 DTO
```

#### 4.5.2 持仓分析模块（holding/）

```
apps/server/src/domain/holding/
├── holding.module.ts
├── holding.controller.ts           # 控制器
│                                   # GET /holdings/increase - 增持列表（VIP）
│                                   # GET /holdings/decrease - 减持列表（VIP）
│                                   # GET /holdings/new - 新进列表（VIP）
│                                   # GET /holdings/common - 共同持仓（VIP）
├── holding.service.ts              # 业务逻辑
│                                   # 增持/减持计算：对比本期与上期持仓
│                                   # 共同持仓：多牛散交集分析
├── holding.repository.ts
└── dto/
```

#### 4.5.3 股票模块（stock/）

```
apps/server/src/domain/stock/
├── stock.module.ts
├── stock.controller.ts             # 控制器
│                                   # GET /stocks - 股票列表
│                                   # GET /stocks/:code - 股票详情
├── stock.service.ts
├── stock.repository.ts
└── dto/
```

#### 4.5.4 文章模块（article/）

```
apps/server/src/domain/article/
├── article.module.ts
├── article.controller.ts           # 控制器
│                                   # GET /articles - 文章列表（支持分类筛选）
│                                   # GET /articles/:id - 文章详情
├── article.service.ts
├── article.repository.ts
└── dto/
```

#### 4.5.5 分红模块（dividend/）

```
apps/server/src/domain/dividend/
├── dividend.module.ts
├── dividend.controller.ts          # 控制器
│                                   # GET /dividend-yield - 股息率排行榜（VIP）
├── dividend.service.ts             # 业务逻辑
│                                   # 计算股息率、排名
├── dividend.repository.ts
└── dto/
```

#### 4.5.6 高管交易模块（executive/）

```
apps/server/src/domain/executive/
├── executive.module.ts
├── executive.controller.ts         # 控制器
│                                   # GET /executive-increase - 高管增持排行（VIP）
├── executive.service.ts
├── executive.repository.ts
└── dto/
```

#### 4.5.7 涨幅榜模块（top-gainer/）

```
apps/server/src/domain/top-gainer/
├── top-gainer.module.ts
├── top-gainer.controller.ts        # 控制器
│                                   # GET /top-gainers - 涨幅榜（今日/历史）
│                                   # GET /limit-up - 涨停板
├── top-gainer.service.ts           # 业务逻辑
│                                   # 今日涨幅：实时查询 mairuiapi
│                                   # 历史涨幅：从 Redis 缓存读取预计算数据
└── dto/
```

#### 4.5.8 搜索模块（search/）

```
apps/server/src/domain/search/
├── search.module.ts
├── search.controller.ts            # 控制器
│                                   # GET /search - 全局搜索（牛散+股票）
├── search.service.ts
└── dto/
```

#### 4.5.9 认证模块（auth/）

```
apps/server/src/domain/auth/
├── auth.module.ts
├── auth.controller.ts              # 控制器
│                                   # POST /auth/login - 登录
│                                   # POST /auth/register - 注册（二期）
│                                   # POST /auth/sms-code - 发送验证码（二期）
├── auth.service.ts                 # 业务逻辑
│                                   # 密码校验、JWT 签发
└── dto/
    └── login.dto.ts                # 登录 DTO（phone + password）
```

#### 4.5.10 管理后台模块（admin/）

```
apps/server/src/domain/admin/
├── admin.module.ts
├── admin.controller.ts             # 控制器
│                                   # POST /admin/sync/:task - 触发同步任务
│                                   # GET /admin/sync/logs - 同步日志列表
│                                   # CRUD: /admin/investors, /admin/articles, /admin/ads
├── admin.service.ts
└── admin.service.ts
```

#### 4.5.11 自选股模块（watchlist/）

```
apps/server/src/domain/watchlist/
├── watchlist.module.ts
├── watchlist.controller.ts         # 控制器
│                                   # GET /watchlist - 自选股列表
│                                   # POST /watchlist - 添加自选股
│                                   # DELETE /watchlist/:id - 删除自选股
├── watchlist.service.ts
└── watchlist.repository.ts
```

#### 4.5.12 通知模块（notification/）

```
apps/server/src/domain/notification/
├── notification.module.ts
├── notification.controller.ts      # 控制器
│                                   # GET /notifications - 通知列表
│                                   # PUT /notifications/read-all - 全部已读
└── notification.service.ts
```

#### 4.5.13 价格提醒模块（price-alert/）

```
apps/server/src/domain/price-alert/
├── price-alert.module.ts
├── price-alert.controller.ts       # 控制器
│                                   # GET /price-alerts - 提醒列表
│                                   # POST /price-alerts - 创建提醒
│                                   # DELETE /price-alerts/:id - 删除提醒
└── price-alert.service.ts          # 业务逻辑
                                    # 定时检查价格、触发通知
```

#### 4.5.14 API Key 管理模块（api-key/）

```
apps/server/src/domain/api-key/
├── api-key.module.ts
├── api-key.controller.ts           # 控制器
│                                   # GET /account/api-keys - 我的 API Key
│                                   # POST /account/api-keys - 创建 API Key
│                                   # DELETE /account/api-keys/:id - 删除 API Key
└── api-key.service.ts              # 业务逻辑
                                    # API Key 生成（明文仅返回一次）
                                    # 哈希存储、使用量统计
```

#### 4.5.15 支付模块（payment/）

```
apps/server/src/domain/payment/
├── payment.module.ts
├── payment.controller.ts           # 控制器
│                                   # POST /payment/create - 创建支付订单
│                                   # GET /payment/status/:orderNo - 查询状态
│                                   # POST /payment/callback/wechat - 微信回调
│                                   # POST /payment/callback/alipay - 支付宝回调
└── payment.service.ts              # 业务逻辑
                                    # 订单创建、支付回调处理、VIP 开通
```

#### 4.5.16 广告模块（ad/）

```
apps/server/src/domain/ad/
├── ad.module.ts
├── ad.controller.ts                # 控制器
│                                   # GET /ads - 获取广告（按 position）
│                                   # POST /ads/:id/click - 记录点击
└── ad.service.ts
```

#### 4.5.17 收藏模块（favorite/）

```
apps/server/src/domain/favorite/
├── favorite.module.ts
├── favorite.controller.ts          # 控制器
│                                   # GET /account/favorites - 我的收藏
│                                   # POST /account/favorites/:investorId - 收藏牛散
│                                   # DELETE /account/favorites/:investorId - 取消收藏
└── favorite.service.ts
```

#### 4.5.18 订单模块（order/）

```
apps/server/src/domain/order/
├── order.module.ts
├── order.controller.ts             # 控制器
│                                   # GET /orders - 我的订单
├── order.service.ts                # 业务逻辑
                                    # 订单过期检查（定时任务）
```

#### 4.5.19 个人中心模块（account/）

```
apps/server/src/domain/account/
├── account.module.ts
└── account.controller.ts           # 控制器
                                    # GET /account/profile - 个人信息
                                    # PUT /account/profile - 更新信息
```

#### 4.5.20 数据 API 模块（data-api/）

```
apps/server/src/domain/data-api/
├── data-api.module.ts
└── data-api.controller.ts          # 控制器（X-API-Key 认证）
                                    # GET /data/stocks - 股票列表
                                    # GET /data/stocks/:code/quote - 股票行情
                                    # GET /data/investors - 牛散列表
                                    # GET /data/holdings/increase - 增持数据
                                    # GET /data/top-gainers - 涨幅榜
                                    # GET /data/limit-up - 涨停板
                                    # GET /data/dividend-yield - 股息率
                                    # GET /data/executive-increase - 高管增持
```

#### 4.5.21 个人股东模块（individual-shareholder/）

```
apps/server/src/domain/individual-shareholder/
├── individual-shareholder.module.ts
├── individual-shareholder.controller.ts  # 控制器
│                                         # GET /individual-shareholders - 个人股东列表（VIP）
└── individual-shareholder.service.ts
```

#### 4.5.22 数据导出模块（export/）

```
apps/server/src/domain/export/
├── export.module.ts
└── export.controller.ts            # 控制器
                                    # POST /export/:type - 导出 Excel
                                    # type: investors | holdings | top-gainers
```

### 4.6 配置模块（src/config/）

```
apps/server/src/config/
├── jwt.strategy.ts                 # Passport JWT 策略
│                                   # 从 Authorization header 提取 token
│                                   # 验证并返回 payload
├── config.module.ts                # 环境变量配置模块
│                                   # 使用 @nestjs/config 管理配置
└── .env                            # 后端环境变量文件
```

---

## 五、环境变量汇总

### 5.1 后端环境变量（apps/server/.env）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| PORT | 服务端口 | 4000 |
| NODE_ENV | 运行环境 | development / production |
| DATABASE_URL | PostgreSQL 连接串 | postgresql://king:king123@localhost:5432/king |
| REDIS_HOST | Redis 主机 | localhost |
| REDIS_PORT | Redis 端口 | 6379 |
| JWT_SECRET | JWT 密钥 | your-random-secret-key-min-32-chars |
| JWT_EXPIRES_IN | JWT 有效期 | 7d |
| ADMIN_USERNAME | 管理员用户名 | admin |
| ADMIN_PASSWORD | 管理员密码 | admin123 |
| MAIRUI_API_LICENCE | mairuiapi 授权码 | your-licence-key |
| MAIRUI_API_BASE | mairuiapi 基础 URL | http://api.mairuiapi.com |
| MAIRUI_API_REALTIME_BASE | mairuiapi 实时接口 URL | http://a.mairuiapi.com |
| DEEPSEEK_API_KEY | DeepSeek API Key | your-deepseek-key |
| DEEPSEEK_API_BASE | DeepSeek API URL | https://api.deepseek.com/v1 |
| LOG_LEVEL | 日志级别 | info |
| ALIYUN_SMS_* | 阿里云短信配置 | （二期） |
| WECHAT_PAY_* | 微信支付配置 | （二期） |
| ALIPAY_* | 支付宝配置 | （二期） |

### 5.2 前端环境变量（apps/web/.env.local）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| NEXT_PUBLIC_API_URL | 后端 API 地址 | http://localhost:4000 |
| NEXT_PUBLIC_APP_NAME | 应用名称 | King 财经数据平台 |

---

## 六、文件统计

| 类别 | 文件数量 |
|------|----------|
| 根配置文件 | 4 |
| packages/shared | 10 |
| packages/prisma | 3 |
| 前端页面 | 30+ |
| 前端组件 | 20+ |
| 前端工具/Hooks | 6 |
| 后端领域模块 | 22 × 4 ≈ 88 |
| 后端基础设施 | 15 |
| 后端公共模块 | 10 |
| **总计** | **约 180+ 文件** |

---

## 七、开发顺序建议

1. **第一批**：项目骨架 + Prisma Schema + 基础设施层
2. **第二批**：核心领域（investor + stock + holding）
3. **第三批**：前端骨架 + 布局组件
4. **第四批**：剩余后端模块
5. **第五批**：剩余前端页面
6. **第六批**：体验增强（虚拟滚动、骨架屏等）
