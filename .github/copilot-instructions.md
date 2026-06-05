# King 财经数据平台 - 开发规则

## 架构约束

**严格遵守 3 层架构，禁止跨层调用**:
- ✅ Controller → Service → Repository → Database
- ✅ Service → Infrastructure → External APIs
- ❌ Controller → Repository
- ❌ Controller → Infrastructure
- ❌ Service → Prisma Client
- ❌ Repository → Service

## 编码强规则（MUST 遵守）

### 数据类型安全
- **R1**: Decimal/BigInt 必须转换为 number 后再运算
- **R2**: 可空字段（?）必须守卫（?? 或 if (value != null)）
- **R3**: redis.mget() 返回数组，用索引访问不能用字符串 key
- **R4**: 类型守卫使用 `.filter((x): x is NonNullable<typeof x> => Boolean(x))`

### 日期时间
- **R5**: Date.getMonth() 返回 0-11，直接比较不加 1
- **R6**: 报告期用 YYYY-MM-DD，API 响应用 ISO 8601
- **R7**: 日期存储/比较用 UTC，展示转本地时区

### 数据库查询
- **R8**: JOIN 字段必须显式 include
- **R9**: 批量查询 + Map，禁止循环内查询
- **R10**: upsert 的 where 必须是 @@unique 或 @@id 字段

### API 设计
- **R11**: 统一响应格式 { code, message, data }
- **R12**: VIP 拦截返回 HTTP 200 + { code: 403, message, data }
- **R13**: 外部 API 失败返回缓存或空数组，不抛 500
- **R14**: 分页参数 page (1-based) 和 page_size (默认20, 最大100)

### 前端
- **R15**: 所有字段名 camelCase，禁止 snake_case
- **R16**: SWR hooks 必须配置 onError 回调
- **R17**: 前端 env 变量必须以 NEXT_PUBLIC_ 开头

### 安全
- **R18**: bcrypt.hash(password, 10) 必须传 saltRounds
- **R19**: API Key 只存 hash，验证时 hash 后比对
- **R20**: 所有 /admin/* 路由需要 JwtAuthGuard + AdminGuard
- **R21**: IDOR 防护：Service 层验证 resource.userId === currentUser.id
- **R22**: 手机号脱敏为 138****1234，API Key 只返回前 8 位
- **R23**: /admin/* 写操作必须写审计日志

## 业务逻辑关键点

### 季度对比
- Q1=3月31, Q2=6月30, Q3=9月30, Q4=12月31
- 财报披露：Q1/4-30, Q2/8-31, Q3/10-31, Q4/次年4-30

### 持仓计算
- holdMarketValue = currentPrice * holdCount（需 Number() 转换）
- returnRate = (currentPrice - avgCost) / avgCost * 100
- 所有 null 值前端显示 "—"

### VIP 权限
- 免费用户：涨幅榜今日前20名，牛散详情概览
- VIP 用户：全部涨幅榜，完整持仓明细，所有分析功能

### 分页
- page 从 1 开始
- page_size 默认 20，最大 100

## 开发约定

### 文件命名
- 后端：snake-case（holding.service.ts, investor.controller.ts）
- 前端：PascalCase 组件，camelCase hooks（useInvestors.ts）
- 类型文件：xxx.types.ts

### 导入顺序
- 外部库
- 内部模块
- 类型定义
- 常量

### 注释规范
- 类/方法/复杂逻辑必须添加 JSDoc 注释
- TODO 标记为 `// TODO: ...`

## 使用样板间

所有新文件应从以下样板开始：
- 后端 Controller: TEMPLATES/controller.template.ts
- 后端 Service: TEMPLATES/service.template.ts
- 后端 Repository: TEMPLATES/repository.template.ts
- 前端 Page: TEMPLATES/react.page.template.tsx
- 前端 Component: TEMPLATES/react.component.template.tsx
- SWR Hook: TEMPLATES/swr.hook.template.ts

## 参考文档

- 完整规则：RULES.md
- 样板说明：TEMPLATES/README.md
- 常量定义：src/constants.js
- PRD：King项目一期PRD (4).md
