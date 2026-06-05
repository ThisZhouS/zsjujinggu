# Source Map

按功能定位关键源码入口。

## 启动与基础设施

- 应用启动：`apps/server/src/main.ts`
- 前端代理：`apps/web/next.config.js`
- API 客户端：`apps/web/src/lib/api.ts`
- Prisma Schema：`packages/prisma/prisma/schema.prisma`

## 首页与基础展示

- 首页：`apps/web/src/app/page.tsx`
- 牛散 hook：`apps/web/src/hooks/useInvestors.ts`
- 文章 hook：`apps/web/src/hooks/useArticles.ts`
- 市场概览 hook：`apps/web/src/hooks/useMarketOverview.ts`

## 牛散与机构模块

### 页面

- 牛散列表：`apps/web/src/app/investors/page.tsx`
- 牛散详情：`apps/web/src/app/investors/[id]/page.tsx`
- 机构列表：`apps/web/src/app/institutions/page.tsx`
- 机构详情：`apps/web/src/app/institutions/[id]/page.tsx`
- 同姓牛散：`apps/web/src/app/same-surname-investors/page.tsx`
- 共享页面组件：
  - `apps/web/src/components/investor/ShareholderDirectoryPage.tsx`
  - `apps/web/src/components/investor/ShareholderDetailPage.tsx`
  - `apps/web/src/components/investor/TopFlowTrackingTable.tsx`
  - `apps/web/src/components/articles/RelatedNewsPanel.tsx`

### 前端数据入口

- `apps/web/src/hooks/useInvestors.ts`
- `apps/web/src/hooks/useNaturalPersonHolders.ts`
- `apps/web/src/hooks/useArticles.ts`

### 后端入口

- Controller：`apps/server/src/domain/investor/investor.controller.ts`
- Service：`apps/server/src/domain/investor/investor.service.ts`
- Repository：`apps/server/src/domain/investor/investor.repository.ts`
- 连续追踪明细：
  - `apps/server/src/domain/natural-person-holder/natural-person-holder.service.ts`
  - `apps/server/src/domain/holding/holding.repository.ts`
- 分类规则：`apps/server/src/common/utils/investor-name-filter.ts`
- 业务同步：`apps/server/src/domain/data-sync/service/business-data-sync.service.ts`

## 牛散持仓变动

### 页面

- 增持：`apps/web/src/app/investor-increase/page.tsx`
- 减持：`apps/web/src/app/investor-decrease/page.tsx`
- 新进：`apps/web/src/app/investor-new/page.tsx`
- 共同持仓：`apps/web/src/app/common-holdings/page.tsx`

### 前端数据入口

- `apps/web/src/hooks/useHoldings.ts`
- `apps/server/src/domain/holding/dto/query-holding.dto.ts`

### 后端入口

- Controller：`apps/server/src/domain/holding/holding.controller.ts`
- Service：`apps/server/src/domain/holding/holding.service.ts`
- Repository：`apps/server/src/domain/holding/holding.repository.ts`

## 涨幅榜与涨停统计

### 页面

- 涨幅榜：`apps/web/src/app/top-gainers/page.tsx`
- 涨停榜：`apps/web/src/app/limit-up/page.tsx`
- 跌停榜：`apps/web/src/app/limit-down/page.tsx`
- 涨跌停统计：`apps/web/src/app/limit-stats/page.tsx`

### 前端数据入口

- `apps/web/src/hooks/useTopGainers.ts`

### 后端入口

- Controller：`apps/server/src/domain/top-gainer/top-gainer.controller.ts`
- Service：`apps/server/src/domain/top-gainer/top-gainer.service.ts`
- Repository：`apps/server/src/domain/top-gainer/top-gainer.repository.ts`

## 十大增持

### 页面

- `apps/web/src/app/top-increase/page.tsx`

### 前端数据入口

- `apps/web/src/hooks/useTopIncrease.ts`

### 后端入口

- Controller：`apps/server/src/domain/stock/stock.controller.ts`
- Service：`apps/server/src/domain/stock/stock.service.ts`
- Repository：`apps/server/src/domain/stock/stock.repository.ts`

## 高管增持

### 页面

- `apps/web/src/app/executive-increase/page.tsx`
- `apps/web/src/components/articles/RelatedNewsPanel.tsx`

### 前端数据入口

- `apps/web/src/hooks/useExecutive.ts`
- `apps/web/src/hooks/useArticles.ts`

### 后端入口

- Controller：`apps/server/src/domain/executive/executive.controller.ts`
- Service：`apps/server/src/domain/executive/executive.service.ts`
- Repository：`apps/server/src/domain/executive/executive.repository.ts`
- 新闻接口：
  - `GET /api/v1/articles/executive/news`
  - `POST /api/v1/articles/automation/openclaw/news`
  - `POST /api/v1/articles/automation/harness/news`
- 口径：
  - 最近 `1-12` 月滚动区间
  - 数据来自 `executive_trades`
  - 主营收入来自 `income_statements`

## 分红与股息率

### 页面

- `apps/web/src/app/dividend-yield/page.tsx`

### 前端数据入口

- `apps/web/src/hooks/useDividend.ts`

### 后端入口

- Controller：`apps/server/src/domain/dividend/dividend.controller.ts`
- Service：`apps/server/src/domain/dividend/dividend.service.ts`
- Repository：`apps/server/src/domain/dividend/dividend.repository.ts`
- 口径：
  - `mode=annual`
  - `mode=avg3y`
  - 展示 `totalDividend`
  - `POST /api/v1/dividends/backfill-metrics` 支持 `dataSlot=ALL` 补齐双槽位股息率与分红总额
- 管理端入口：
  - `apps/web/src/components/admin/SyncManagementPanel.tsx`
  - `/admin/sync` 手动触发“股息率数据补齐”

## 自然人大股东与个人股东

### 页面

- `apps/web/src/app/individual-shareholders/page.tsx`

### 前端数据入口

- `apps/web/src/hooks/useNaturalPersonHolders.ts`
- `apps/web/src/hooks/useIndividualShareholder.ts`

### 后端入口

- 个人股东：
  - Controller：`apps/server/src/domain/individual-shareholder/individual-shareholder.controller.ts`
  - Repository：`apps/server/src/domain/individual-shareholder/individual-shareholder.repository.ts`
- 自然人大股东：
  - Controller：`apps/server/src/domain/natural-person-holder/natural-person-holder.controller.ts`
  - Service：`apps/server/src/domain/natural-person-holder/natural-person-holder.service.ts`
  - Repository：`apps/server/src/domain/natural-person-holder/natural-person-holder.repository.ts`
- 机构/个人强势股反查底层持仓：
  - `apps/server/src/domain/holding/holding.repository.ts`

## 文章系统

### 页面

- 列表：`apps/web/src/app/articles/page.tsx`
- 详情：`apps/web/src/app/articles/[id]/page.tsx`
- 后台：`apps/web/src/app/admin/articles/page.tsx`
- 用户投稿：`apps/web/src/app/account/articles/page.tsx`

### 前端数据入口

- `apps/web/src/hooks/useArticles.ts`
- `apps/web/src/hooks/useAccount.ts`
- 入口展示：
  - `apps/web/src/components/layout/AppSidebar.tsx`
  - `apps/web/src/components/layout/AppHeader.tsx`

### 后端入口

- Controller：`apps/server/src/domain/article/article.controller.ts`
- Service：`apps/server/src/domain/article/article.service.ts`
- Repository：`apps/server/src/domain/article/article.repository.ts`
- Guard：`apps/server/src/common/guards/article-upload.guard.ts`
- 相关新闻与自动化扩展：
  - `packages/shared/src/types/article.ts`
  - `apps/server/src/domain/article/dto/article.dto.ts`
  - `GET /api/v1/articles/investor/:investorId/news`
  - `GET /api/v1/articles/executive/news`
  - `POST /api/v1/articles/automation/openclaw/news`
  - `POST /api/v1/articles/automation/harness/news`

## 用户中心

### 页面

- 账户：`apps/web/src/app/account/page.tsx`
- 我的文章：`apps/web/src/app/account/articles/page.tsx`
- API Keys：`apps/web/src/app/account/api-keys/page.tsx`
- 订单：`apps/web/src/app/account/orders/page.tsx`
- 自选股：`apps/web/src/app/watchlist/page.tsx`
- 通知：`apps/web/src/app/notifications/page.tsx`

### 前端数据入口

- `apps/web/src/hooks/useAccount.ts`
- `apps/web/src/hooks/useApiKey.ts`
- `apps/web/src/hooks/useOrder.ts`
- `apps/web/src/hooks/useWatchlist.ts`
- `apps/web/src/hooks/useNotification.ts`
- `apps/web/src/hooks/usePriceAlerts.ts`

### 后端入口

- `account`：`apps/server/src/domain/account/*`
- `api-key`：`apps/server/src/domain/api-key/*`
- `order`：`apps/server/src/domain/order/*`
- `payment`：`apps/server/src/domain/payment/*`
- `watchlist`：`apps/server/src/domain/watchlist/*`
- `price-alert`：`apps/server/src/domain/price-alert/*`
- `notification`：`apps/server/src/domain/notification/*`

## 认证

### 页面

- 登录：`apps/web/src/app/login/page.tsx`
- 注册：`apps/web/src/app/register/page.tsx`
- 找回密码：`apps/web/src/app/forgot-password/page.tsx`

### 后端入口

- Controller：`apps/server/src/domain/auth/auth.controller.ts`
- Service：`apps/server/src/domain/auth/auth.service.ts`

## 管理后台

### 页面

- 首页：`apps/web/src/app/admin/page.tsx`
- 同步：`apps/web/src/app/admin/sync/page.tsx`
- 用户：`apps/web/src/app/admin/users/page.tsx`
- 订单：`apps/web/src/app/admin/orders/page.tsx`
- API Keys：`apps/web/src/app/admin/api-keys/page.tsx`
- 广告：`apps/web/src/app/admin/ads/page.tsx`
- 牛散：`apps/web/src/app/admin/investors/page.tsx`

### 前端组件入口

- `apps/web/src/components/admin/SyncManagementPanel.tsx`

### 后端入口

- Controller：`apps/server/src/domain/admin/admin.controller.ts`
- Service：`apps/server/src/domain/admin/admin.service.ts`
- 用户投稿权限开关：`PUT /api/v1/admin/users/:id/upload-permission`

## 数据同步

### 定时任务

- 行情与基础同步：`apps/server/src/infrastructure/scheduler/data-sync.task.ts`
- 凌晨 4 点业务同步（双源切换）：`apps/server/src/infrastructure/scheduler/business-data-sync.task.ts`
- TradingKey 明星投资人每日同步：`apps/server/src/infrastructure/scheduler/data-sync.task.ts`

### 服务入口

- `apps/server/src/domain/data-sync/service/data-sync.service.ts`
- `apps/server/src/domain/data-sync/service/business-data-sync.service.ts`

### 手动触发入口

- 后端：`apps/server/src/domain/data-sync/controller/data-sync.controller.ts`
- 管理后台：`apps/web/src/components/admin/SyncManagementPanel.tsx`

## Tetegu 数据墙

- Module：`apps/server/src/domain/paywall/paywall.module.ts`
- Controller：`apps/server/src/domain/paywall/paywall.controller.ts`
- Service：`apps/server/src/domain/paywall/paywall.service.ts`
- 独立页面：`apps/web/src/app/data-wall/page.tsx`
- 前端入口：`apps/web/src/components/investor/ShareholderDirectoryPage.tsx`
- 前端 Hook：`apps/web/src/hooks/usePaywallFeatures.ts`
- 接口：
  - `GET /api/v1/paywall/features`
  - `GET /api/v1/paywall/features/:featureKey`
  - `GET /api/v1/paywall/features/:featureKey/preview`
- 数据口径：
  - 使用当前 `business_data_source_state.activeSlot`
  - 排名读取 `investors.totalMarketValue`、`stockCount`
  - 核心持仓读取 `holdings` 并按投资人 + 股票取最新报告期，再按市值取前三
  - 单支持股数据墙限定 `investors.stockCount = 1`
  - 机构数据墙对名称大小写、空格、全角/半角括号做轻量别名归并
  - 非 VIP 预览只展示预览条数，并对第 4 条后的主体名称、指标和核心持仓做掩码

## TradingKey 明星投资人

- Module：`apps/server/src/domain/star-investor/star-investor.module.ts`
- Controller：`apps/server/src/domain/star-investor/star-investor.controller.ts`
- Service：`apps/server/src/domain/star-investor/star-investor.service.ts`
- 定时任务：`apps/server/src/infrastructure/scheduler/data-sync.task.ts`
- Prisma 模型：`StarInvestorSnapshot`、`StarInvestorHolding`、`StarInvestorTrade`
- 前端页面：
  - `apps/web/src/app/buffett-holdings/page.tsx`
  - `apps/web/src/app/arkk-holdings/page.tsx`
- 前端组件：`apps/web/src/components/star-investor/StarInvestorHoldingsPage.tsx`
- 前端 Hook：`apps/web/src/hooks/useStarInvestors.ts`
  - `useStarInvestorHoldings`
  - `useStarInvestorTrades`
- 后台手动同步入口：`apps/web/src/components/admin/SyncManagementPanel.tsx`
- 接口：
  - `GET /api/v1/star-investors/:investor/summary`
  - `GET /api/v1/star-investors/:investor/holdings`
  - `GET /api/v1/star-investors/:investor/trades`
  - `POST /api/v1/admin/sync/star-investor-holdings`
- 数据口径：
  - 摘要从 TradingKey 明星投资人 HTML `window.__QUDE_LOADER_DATA__` 解析
  - 新报告期从 TradingKey `quotes-base/star-investors/investor/holding-history-list` 分页全量抓取持仓
  - 同报告期每日从 TradingKey `quotes-base/star-investors/investor/latest-trade-stock-list` 分页抓取股票买卖流水，并按返回的当前持仓数量更新 `star_investor_holdings`
  - `tradeQuantity` 为本期买卖数量，`previousHoldingQuantity = holdingQuantity - tradeQuantity`
  - TradingKey `OPEN` 归一为 `INCREASE`，`CLOSE` 归一为 `DECREASE`
- 当前验证：
  - 2026-05-22 同步后 Buffett 持仓 `67`、买卖 `46`
  - 2026-05-22 同步后 Catherine Wood 持仓 `328`、买卖 `291`
  - 前端页面已展示“当前持仓 / 买卖记录”双标签
