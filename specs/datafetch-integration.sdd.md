# DataFetch 模块集成设计文档 (SDD)

## 1. 项目概述

### 1.1 背景
将现有 `datafetch/20260126-cursor` 项目中的数据获取能力集成到 King 财经数据平台，实现多源金融数据采集、存储和同步。

### 1.2 目标
- 保留原有数据获取方式（API 地址、参数、存储表、遍历逻辑）
- 重构为 NestJS + TypeScript 架构，与现有后端代码风格一致
- 支持定时任务和手动触发同步
- 遵循 King 项目 3 层架构规范（Controller → Service → Repository）

### 1.3 范围
集成以下 20 个数据模块：

| # | 模块名 | 说明 | 优先级 |
|---|--------|------|--------|
| 1 | CompanyBasicInfo | 公司基本信息（简介、股本、基础信息、解禁限售） | P0 |
| 2 | ShareholderBasicInfo | 股东信息（股东数、十大股东、十大流通股东） | P0 |
| 3 | StockRealTimeData | 股票实时数据（科创、沪深指数、基金、港股、京市） | P0 |
| 4 | HistoricalTradingData | 历史交易数据 | P1 |
| 5 | FinancialCoreIndicators | 财务核心指标 | P1 |
| 6 | FinancialStatements | 财务报表 | P1 |
| 7 | FinancialQuartersEvents | 财务季度事件 | P2 |
| 8 | CompanyHistoricalData | 公司历史数据 | P2 |
| 9 | IndexRealTimeData | 指数实时数据 | P1 |
| 10 | IndexTechnicalIndicators | 指数技术指标 | P2 |
| 11 | ShanghaiShenzhenTechnicalIndicators | 沪深技术指标 | P2 |
| 12 | IndexRelationshipMapping | 指数关系映射 | P3 |
| 13 | MajorMarketLists | 主要市场列表 | P1 |
| 14 | OtherMarketLists | 其他市场列表 | P2 |
| 15 | MarketDepthData | 市场深度数据 | P2 |
| 16 | RealTimeTradingInterfaces | 实时交易接口 | P1 |
| 17 | ShareholderDetailedData | 股东详细数据 | P2 |
| 18 | StockPoolClassification | 股票池分类（涨停/跌停） | P1 |
| 19 | TradingDetailsSpecialData | 交易明细特殊数据 | P2 |
| 20 | HistoricalTradingData | 历史交易数据 | P1 |

---

## 2. 架构设计

### 2.1 目标架构

```
apps/server/src/
├── domain/
│   ├── data-sync/           # 新增：数据同步模块
│   │   ├── controller/
│   │   │   └── data-sync.controller.ts
│   │   ├── service/
│   │   │   ├── data-sync.service.ts
│   │   │   ├── company-basic-info-sync.service.ts
│   │   │   ├── shareholder-sync.service.ts
│   │   │   └── ...
│   │   ├── repository/
│   │   │   └── (使用现有 Prisma models)
│   │   └── dto/
│   │       └── sync-params.dto.ts
│   └── ...
├── infrastructure/
│   ├── mairui-api/          # 新增：外部 API 客户端
│   │   ├── mairui-api.client.ts
│   │   ├── company-basic-info.client.ts
│   │   ├── shareholder.client.ts
│   │   └── ...
│   └── scheduler/           # 扩展现有定时任务
│       └── data-sync.task.ts
```

### 2.2 数据流

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Admin     │────>│  Controller  │────>│   Service   │────>│ Client   │
│   (手动)    │     │  (路由/验证) │     │ (业务逻辑)  │     │ (API 调用) │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
                                                 │
                                                 v
                                          ┌─────────────┐
                                          │ Repository  │────> PostgreSQL
                                          │  (Prisma)   │
                                          └─────────────┘
```

### 2.3 API 客户端设计模式

每个数据模块实现统一的接口模式：

```typescript
interface DataSyncClient {
  // 获取数据（不调用 API，仅转换格式）
  fetchXXX(stockCode: string, params?: SyncParams): Promise<RawData[]>;
  
  // 获取并存储（完整流程）
  fetchAndSaveXXX(stockCode: string, params?: SyncParams): Promise<number>;
  
  // 批量获取并存储（遍历股票列表）
  fetchAndSaveXXXForAll(params?: SyncParams): Promise<number>;
}
```

---

## 3. 数据模型映射

### 3.1 现有 Prisma 模型覆盖

| datafetch 表名 | King Prisma 模型 | 状态 |
|---------------|------------------|------|
| company_intro | - | 需新增 |
| company_capital | - | 需新增 |
| stock_basic_info | Stock | 部分覆盖 |
| lift_restriction | - | 需新增 |
| company_shareholder_count | - | 需新增 |
| company_top_holders | - | 需新增 |
| company_top_flow_holders | - | 需新增 |
| kc_stock_real_time | - | 需新增 |
| hs_index_real_time | - | 需新增 |
| hf_fund_real_time | - | 需新增 |
| hk_stock_real_time | - | 需新增 |
| bj_stock_real_time | - | 需新增 |
| historical_trading | KlineDaily | 部分覆盖 |
| executive_trades | ExecutiveTrade | 已存在 |
| dividends | Dividend | 已存在 |
| holdings | Holding | 已存在 |

### 3.2 需新增的 Prisma 模型

```prisma
// 公司简介
model CompanyIntro {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(10)
  name      String   @db.VarChar(100)
  ename     String?  @db.VarChar(200)
  market    String?  @db.VarChar(50)
  idea      String?  @db.Text
  ldate     String?  @db.VarChar(20)
  sprice    String?  @db.VarChar(20)
  principal String?  @db.VarChar(100)
  rdate     String?  @db.VarChar(20)
  rprice    String?  @db.VarChar(20)
  organ     String?  @db.VarChar(100)
  secre     String?  @db.VarChar(50)
  phone     String?  @db.VarChar(20)
  fax       String?  @db.VarChar(20)
  email     String?  @db.VarChar(100)
  site      String?  @db.VarChar(200)
  addr      String?  @db.Text
  desc      String?  @db.Text
  bscope    String?  @db.Text
  pe        String?  @db.VarChar(20)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([stockCode])
  @@map("company_intros")
}

// 公司股本
model CompanyCapital {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(10)
  zgb       Decimal? @db.Decimal(20, 2)  // 总股本
  ysltag    Decimal? @db.Decimal(20, 2)  // 已流通 A 股
  xsltgf    Decimal? @db.Decimal(20, 2)  // 未流通股份
  bdrq      String?  @db.VarChar(20)     // 变动日期
  plrq      String?  @db.VarChar(20)     // 披露日期
  createdAt DateTime @default(now())

  @@index([stockCode])
  @@map("company_capitals")
}

// 解禁限售
model LiftRestriction {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(10)
  rdate     String?  @db.VarChar(20)     // 解禁日期
  ramount   Decimal? @db.Decimal(20, 2)  // 解禁金额
  rprice    Decimal? @db.Decimal(10, 2)  // 解禁价格
  batch     String?  @db.VarChar(50)     // 批次
  pdate     String?  @db.VarChar(20)     // 公布日期
  createdAt DateTime @default(now())

  @@index([stockCode])
  @@map("lift_restrictions")
}

// 公司股东数
model CompanyShareholderCount {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(10)
  plrq      String?  @db.VarChar(20)     // 披露日期
  jzrq      String?  @db.VarChar(20)     // 截止日期
  gdzs      Int?     // 股东总数
  agdhs     Int?     // A 股股东户数
  bgdhs     Int?     // B 股股东户数
  hgdhs     Int?     // 港股股东户数
  yltgdhs   Int?     // 无限售条件股东户数
  wltgdhs   Int?     // 有限售条件股东户数
  createdAt DateTime @default(now())

  @@index([stockCode])
  @@map("company_shareholder_counts")
}

// 公司十大股东
model CompanyTopHolders {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(10)
  plrq      String?  @db.VarChar(20)     // 披露日期
  jzrq      String?  @db.VarChar(20)     // 截止日期
  gdmc      String?  @db.VarChar(200)    // 股东名称
  gdlx      String?  @db.VarChar(50)     // 股东类型
  cgsl      Decimal? @db.Decimal(20, 2)  // 持股数量
  bdyy      String?  @db.Text            // 变动原因
  cgbl      Decimal? @db.Decimal(5, 2)   // 持股比例
  gfxz      String?  @db.VarChar(50)     // 股份性质
  cgpm      String?  @db.VarChar(50)     // 持排名
  createdAt DateTime @default(now())

  @@index([stockCode])
  @@map("company_top_holders")
}

// 公司十大流通股东
model CompanyTopFlowHolders {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(10)
  ggrq      String?  @db.VarChar(20)     // 公告日期
  jzrq      String?  @db.VarChar(20)     // 截止日期
  gdmc      String?  @db.VarChar(200)    // 股东名称
  gdlx      String?  @db.VarChar(50)     // 股东类型
  cgsl      Decimal? @db.Decimal(20, 2)  // 持股数量
  bdyy      String?  @db.Text            // 变动原因
  cgbl      Decimal? @db.Decimal(5, 2)   // 持股比例
  gfxz      String?  @db.VarChar(50)     // 股份性质
  cgpm      String?  @db.VarChar(50)     // 持排名
  createdAt DateTime @default(now())

  @@index([stockCode])
  @@map("company_top_flow_holders")
}

// 科创股票实时数据
model KcStockRealTimeData {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(10)
  p         Decimal? @db.Decimal(10, 2)  // 现价
  o         Decimal? @db.Decimal(10, 2)  // 今开
  h         Decimal? @db.Decimal(10, 2)  // 最高
  l         Decimal? @db.Decimal(10, 2)  // 最低
  yc        Decimal? @db.Decimal(10, 2)  // 昨收
  cje       Decimal? @db.Decimal(20, 2)  // 成交额
  v         Decimal? @db.Decimal(20, 2)  // 成交量
  pv        Decimal? @db.Decimal(10, 2)  // 市盈率
  ud        Decimal? @db.Decimal(10, 2)  // 涨跌
  pc        Decimal? @db.Decimal(10, 2)  // 涨跌率
  zf        Decimal? @db.Decimal(10, 2)  // 振幅
  t         DateTime @db.Timestamp       // 更新时间
  pe        Decimal? @db.Decimal(10, 2)  // 市盈率
  tr        Decimal? @db.Decimal(10, 2)  // 换手率
  pbRatio   Decimal? @db.Decimal(10, 2)  // 市净率
  tv        Decimal? @db.Decimal(20, 2)  // 总市值
  createdAt DateTime @default(now())

  @@unique([stockCode, t])
  @@index([stockCode])
  @@map("kc_stock_real_time_data")
}

// 沪深指数实时数据
model HsIndexRealTimeData {
  id        BigInt   @id @default(autoincrement())
  indexCode String   @db.VarChar(20)
  p         Decimal? @db.Decimal(10, 2)
  o         Decimal? @db.Decimal(10, 2)
  h         Decimal? @db.Decimal(10, 2)
  l         Decimal? @db.Decimal(10, 2)
  yc        Decimal? @db.Decimal(10, 2)
  cje       Decimal? @db.Decimal(20, 2)
  v         Decimal? @db.Decimal(20, 2)
  pv        Decimal? @db.Decimal(10, 2)
  ud        Decimal? @db.Decimal(10, 2)
  pc        Decimal? @db.Decimal(10, 2)
  zf        Decimal? @db.Decimal(10, 2)
  t         DateTime @db.Timestamp
  createdAt DateTime @default(now())

  @@unique([indexCode, t])
  @@index([indexCode])
  @@map("hs_index_real_time_data")
}

// 沪深基金实时数据
model HfFundRealTimeData {
  id        BigInt   @id @default(autoincrement())
  fundCode String    @db.VarChar(20)
  p         Decimal? @db.Decimal(10, 2)
  o         Decimal? @db.Decimal(10, 2)
  h         Decimal? @db.Decimal(10, 2)
  l         Decimal? @db.Decimal(10, 2)
  yc        Decimal? @db.Decimal(10, 2)
  cje       Decimal? @db.Decimal(20, 2)
  v         Decimal? @db.Decimal(20, 2)
  pv        Decimal? @db.Decimal(10, 2)
  ud        Decimal? @db.Decimal(10, 2)
  pc        Decimal? @db.Decimal(10, 2)
  zf        Decimal? @db.Decimal(10, 2)
  t         DateTime @db.Timestamp
  pe        Decimal? @db.Decimal(10, 2)
  tr        Decimal? @db.Decimal(10, 2)
  pbRatio   Decimal? @db.Decimal(10, 2)
  tv        Decimal? @db.Decimal(20, 2)
  createdAt DateTime @default(now())

  @@unique([fundCode, t])
  @@index([fundCode])
  @@map("hf_fund_real_time_data")
}

// 港股实时数据
model HkStockRealTimeData {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(20)
  p         Decimal? @db.Decimal(10, 2)
  o         Decimal? @db.Decimal(10, 2)
  h         Decimal? @db.Decimal(10, 2)
  l         Decimal? @db.Decimal(10, 2)
  yc        Decimal? @db.Decimal(10, 2)
  cje       Decimal? @db.Decimal(20, 2)
  v         Decimal? @db.Decimal(20, 2)
  pv        Decimal? @db.Decimal(10, 2)
  ud        Decimal? @db.Decimal(10, 2)
  pc        Decimal? @db.Decimal(10, 2)
  zf        Decimal? @db.Decimal(10, 2)
  t         DateTime @db.Timestamp
  pe        Decimal? @db.Decimal(10, 2)
  tr        Decimal? @db.Decimal(10, 2)
  pbRatio   Decimal? @db.Decimal(10, 2)
  tv        Decimal? @db.Decimal(20, 2)
  updatedAt DateTime?
  createdAt DateTime @default(now())

  @@unique([stockCode, t])
  @@index([stockCode])
  @@map("hk_stock_real_time_data")
}

// 京市股票实时数据
model BjStockRealTimeData {
  id        BigInt   @id @default(autoincrement())
  stockCode String   @db.VarChar(20)
  p         Decimal? @db.Decimal(10, 2)
  o         Decimal? @db.Decimal(10, 2)
  h         Decimal? @db.Decimal(10, 2)
  l         Decimal? @db.Decimal(10, 2)
  yc        Decimal? @db.Decimal(10, 2)
  cje       Decimal? @db.Decimal(20, 2)
  v         Decimal? @db.Decimal(20, 2)
  pv        Decimal? @db.Decimal(10, 2)
  ud        Decimal? @db.Decimal(10, 2)
  pc        Decimal? @db.Decimal(10, 2)
  zf        Decimal? @db.Decimal(10, 2)
  t         DateTime @db.Timestamp
  pe        Decimal? @db.Decimal(10, 2)
  tr        Decimal? @db.Decimal(10, 2)
  pbRatio   Decimal? @db.Decimal(10, 2)
  tv        Decimal? @db.Decimal(20, 2)
  createdAt DateTime @default(now())

  @@unique([stockCode, t])
  @@index([stockCode])
  @@map("bj_stock_real_time_data")
}
```

---

## 4. 任务清单 (Tasks)

### Phase 1: 基础设施 (P0)

| ID | 任务 | 描述 | 状态 |
|----|------|------|------|
| T1.1 | 扩展 Prisma Schema | 添加 10 个新数据模型 | ✅ 完成 |
| T1.2 | 创建 Mairui API Client 基类 | 统一 HTTP 请求、错误处理、日志 | ✅ 完成 |
| T1.3 | 创建数据同步基类 | 定义通用接口和抽象方法 | ✅ 完成 |
| T1.4 | 创建定时任务基础设施 | DataSyncTask 调度器 | ✅ 完成 |

### Phase 2: 核心模块实现 (P0)

| ID | 任务 | 描述 | 状态 |
|----|------|------|------|
| T2.1 | CompanyBasicInfo Client | 公司简介、股本、基础信息、解禁限售 | ✅ 完成 |
| T2.2 | ShareholderInfo Client | 股东数、十大股东、十大流通股东 | ✅ 完成 |
| T2.3 | StockRealTimeData Client | 科创、沪深指数、基金、港股、京市 | ✅ 完成 |
| T2.4 | DataSync Controller | 手动触发同步的 API 端点 | ✅ 完成 |
| T2.5 | DataSync Service | 业务逻辑编排 | ✅ 完成 |

### Phase 2: 模块集成 (P0) - 待实现

剩余工作：将 DataSyncModule 集成到主应用，并完善所有 11 个同步方法的实际数据保存逻辑。

### Phase 3: 扩展模块 (P1) - 待实现

| ID | 任务 | 描述 | 状态 |
|----|------|------|------|
| T3.1 | HistoricalTradingData Client | 历史交易数据 | ⏳ |
| T3.2 | FinancialCoreIndicators Client | 财务核心指标 | ⏳ |
| T3.3 | FinancialStatements Client | 财务报表 | ⏳ |
| T3.4 | IndexRealTimeData Client | 指数实时数据 | ⏳ |
| T3.5 | MajorMarketLists Client | 主要市场列表 | ⏳ |
| T3.6 | RealTimeTradingInterfaces Client | 实时交易接口 | ⏳ |
| T3.7 | StockPoolClassification Client | 涨停/跌停池 | ⏳ |

### Phase 3: 扩展模块 (P1)

| ID | 任务 | 描述 | 状态 |
|----|------|------|------|
| T3.1 | HistoricalTradingData Client | 历史交易数据 | ⏳ |
| T3.2 | FinancialCoreIndicators Client | 财务核心指标 | ⏳ |
| T3.3 | FinancialStatements Client | 财务报表 | ⏳ |
| T3.4 | IndexRealTimeData Client | 指数实时数据 | ⏳ |
| T3.5 | MajorMarketLists Client | 主要市场列表 | ⏳ |
| T3.6 | RealTimeTradingInterfaces Client | 实时交易接口 | ⏳ |
| T3.7 | StockPoolClassification Client | 涨停/跌停池 | ⏳ |

### Phase 4: 辅助模块 (P2)

| ID | 任务 | 描述 | 状态 |
|----|------|------|------|
| T4.1 | FinancialQuartersEvents Client | 财务季度事件 | ⏳ |
| T4.2 | CompanyHistoricalData Client | 公司历史数据 | ⏳ |
| T4.3 | IndexTechnicalIndicators Client | 指数技术指标 | ⏳ |
| T4.4 | ShanghaiShenzhenTechnicalIndicators Client | 沪深技术指标 | ⏳ |
| T4.5 | OtherMarketLists Client | 其他市场列表 | ⏳ |
| T4.6 | MarketDepthData Client | 市场深度数据 | ⏳ |
| T4.7 | ShareholderDetailedData Client | 股东详细数据 | ⏳ |
| T4.8 | TradingDetailsSpecialData Client | 交易明细特殊数据 | ⏳ |

### Phase 5: 高级功能 (P3)

| ID | 任务 | 描述 | 状态 |
|----|------|------|------|
| T5.1 | IndexRelationshipMapping Client | 指数关系映射 | ⏳ |
| T5.2 | 定时任务配置 | 配置各模块同步频率 | ⏳ |
| T5.3 | 同步日志记录 | 完善 SyncLog 记录 | ⏳ |
| T5.4 | Admin 管理界面 | 前端同步管理页面 | ⏳ |

---

## 5. 实现检查清单 (Checklist)

### 5.1 代码规范检查

- [ ] 所有函数有类型注解
- [ ] 单函数 ≤ 50 行
- [ ] 每个 Client 类实现 `fetch` / `save` / `fetchAndSave` 方法
- [ ] 敏感配置从环境变量读取
- [ ] 错误处理使用统一异常类
- [ ] 日志输出使用 NestJS Logger

### 5.2 数据完整性检查

- [ ] API 地址与原始 datafetch 一致
- [ ] 传入参数与原始 datafetch 一致
- [ ] 字段映射完整（包括大小写处理）
- [ ] 主键约束正确
- [ ] 索引优化合理

### 5.3 测试检查

- [ ] 单元测试覆盖主要方法
- [ ] 集成测试验证 API 调用
- [ ] 边界条件测试（空数据、异常响应）
- [ ] 并发测试（批量同步场景）

### 5.4 部署检查

- [ ] 数据库迁移脚本
- [ ] 定时任务配置
- [ ] 环境变量配置文档
- [ ] 监控和告警配置

---

## 6. API 接口设计

### 6.1 手动触发同步

```typescript
// POST /api/v1/data-sync/sync
// 手动触发指定模块的数据同步

interface SyncRequest {
  module: 'company_basic_info' | 'shareholder_info' | 'stock_realtime' | ...;
  stockCode?: string;  // 可选，指定股票代码
  startDate?: string;  // 可选，格式 YYYYMMDD
  endDate?: string;    // 可选，格式 YYYYMMDD
}

interface SyncResponse {
  success: boolean;
  recordCount: number;
  duration: number;  // 执行时长 (ms)
  message?: string;
}
```

### 6.2 同步状态查询

```typescript
// GET /api/v1/data-sync/status/:taskId
// 查询异步同步任务状态

interface SyncStatusResponse {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;  // 0-100
  recordCount?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}
```

### 6.3 同步历史查询

```typescript
// GET /api/v1/data-sync/history
// 查询同步历史记录

interface SyncHistoryRequest {
  page: number;
  pageSize: number;
  module?: string;
  status?: 'success' | 'failed';
}

interface SyncHistoryResponse {
  list: SyncLog[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 7. 定时任务配置

| 模块 | Cron 表达式 | 说明 |
|------|-----------|------|
| 股票列表同步 | `30 9 * * 1-5` | 交易日 9:30 同步股票列表 |
| 实时行情 | `*/5 9-15 * * 1-5` | 交易时段每 5 分钟更新 |
| 公司基本信息 | `0 18 * * *` | 每日 18:00 全量更新 |
| 股东信息 | `0 19 * * *` | 每日 19:00 全量更新 |
| 财务指标 | `0 20 * * 1` | 每周一 20:00 更新 |
| 历史交易 | `30 17 * * 1-5` | 交易日 17:30 更新 |

---

## 8. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| API 限流 | 数据同步中断 | 实现请求速率限制和重试机制 |
| 数据量过大 | 内存溢出 | 分批处理，使用流式插入 |
| 网络异常 | 同步失败 | 实现断点续传和失败重试 |
| 数据库锁 | 写入阻塞 | 优化事务粒度，使用批量插入 |
| 数据不一致 | 脏数据 | 实现数据校验和回滚机制 |

---

## 9. 参考资料

- 原始 datafetch 项目：`/usr/src/20260417/datafetch/20260126-cursor`
- King 项目 Prisma Schema：`/usr/src/20260417/packages/prisma/prisma/schema.prisma`
- NestJS 最佳实践：https://docs.nestjs.com
- Prisma 文档：https://www.prisma.io/docs
