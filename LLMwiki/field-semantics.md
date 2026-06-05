# Field Semantics

记录核心业务字段的真实口径与计算方式。

## 报告期口径

### `reportDate`

- 在牛散增减持、十大增持、高管增持中，不默认取绝对最大日期
- 默认取“代表性报告期”
- 规则：
  - 先按报告期统计记录数
  - 取记录数 `>= maxRowCount * 30%` 的日期集合
  - 默认使用这个集合中的最新日期

适用位置：

- `holding.repository.ts`
- `stock.service.ts`
- `executive.repository.ts`
- `natural-person-holder.service.ts` 的牛散持股历史与十大流通股东连续追踪

## 牛散增减持字段

### `currentShares`

- 当前代表性报告期的持股数量
- 来源：`holdings.holdCount`

### `previousShares`

- 上一个有效报告期的持股数量
- 来源：同一 `investorId + stockCode` 的上一期快照

### `changeShares`

- 公式：`currentShares - previousShares`

### `changePercent`

- 公式：`previousShares > 0 ? changeShares / previousShares * 100 : null`

### `totalMarketValue`

- 公式：`currentPrice * currentShares`

### `changeMarketValue`

- 增持：
  - 公式：`currentPrice * changeShares`
- 减持：
  - 公式：`currentPrice * abs(changeShares)`
- 新进：
  - 公式：`totalMarketValue`

### `averageChangePrice`

- 当前不是逐笔真实成交均价
- 当前实现口径：
  - 取目标报告期当日或之前最近一个交易日
  - 优先使用历史收盘价 `c`
  - 若 `c` 缺失，则回退开盘价 `o`

### `averageChangePriceDate`

- 表示 `averageChangePrice` 实际引用的交易日

### `currentPrice`

- 价格优先级：
  - `stocks.currentPrice`
  - 若缺失，再回退到 `hs_stock_history_trading` 最新收盘价

## 十大增持字段

### `increaseShares`

- 公式：`currentShares - previousShares`

### `increaseRate`

- 公式：`previousShares > 0 ? increaseShares / previousShares * 100 : null`

### `increaseMarketValue`

- 公式：`currentPrice != null ? increaseShares * currentPrice : 0`

### `holderRank`

- 来源：`company_top_flow_holders.cgpm`

### `announcementDate`

- 来源：`company_top_flow_holders.ggrq`
- 含义：公告日期

### `reportDate`

- 来源：`company_top_flow_holders.jzrq`
- 含义：持股快照所属报告期

## 牛散十大流通股东连续追踪字段

### `firstEntryReportDate`

- 不是原始表里的任意最早日期
- 当前实现口径：
  - 先取业务 `holdings` 的代表性报告期集合
  - 找到该股票在代表性报告期中首次进入前十的日期

### `reportDate`

- 连续追踪默认只输出代表性报告期
- 若代表性报告期缺失，才回退原始 `company_top_flow_holders.jzrq`

### `isInTopFlowHolders`

- `true`：该代表性报告期仍在 `company_top_flow_holders`
- `false`：该代表性报告期已掉出前十，但为了满足“持续追踪”仍保留一条记录

### `holdAmount`

- 在 `isInTopFlowHolders = false` 时，当前固定返回 `0`
- 这表示“该期未进入前十”，不是“全市场真实持股为 0”

## 新闻文章字段

### `topicType`

- `general`：普通文章
- `investor`：牛散相关新闻
- `executive`：高管相关新闻

### `automationProvider`

- 当前预留：
  - `openclaw`
  - `harness`

### `automationExternalId`

- 用于自动化新闻幂等更新
- 同一 `provider + externalId` 会走更新而不是重复插入

## 高管增持字段

### `executives`

- 前端榜单展示的是聚合后的高管列表
- 单项格式：`姓名（职务）`

### `tradeCount`

- 不是交易笔数
- 是聚合后命中的高管人数

### `totalAmount`

- 不是原始成交额
- 当前实现口径：
  - 公式：`sum(currentPrice * increaseShares)`
  - 含义：高管关联自然人持仓增加对应的估算市值

### `latestTradeDate`

- 当前实现实际对应 `reportDate`
- 不是逐笔真实成交日期

## 涨幅榜字段

### `startPrice`

- 今日涨幅榜：
  - 来源：最新交易日的昨收价 `pc`
- 历史周期涨幅榜：
  - 来源：目标周期起始后的首个有效收盘价

### `currentPrice`

- 今日涨幅榜：
  - 优先用最新历史行情收盘价
  - 再回退到 `stocks.currentPrice`
- 历史周期涨幅榜：
  - 来源：最新有效收盘价

### `change`

- 公式：`currentPrice - startPrice`

### `changePercent`

- 公式：`(currentPrice - startPrice) / startPrice * 100`
- 保留两位小数

## 分红与股息率字段

### `dividendPerShare`

- 当前接口中通常映射自 `cashDividend`
- 含义：每股现金分红

### `totalDividend`

- 来源：`dividends.totalDividend`
- 含义：总分红金额
- `mode=rolling1y` 时为最近 1 年窗口内累计值
- `mode=avg3y` 时为最近 3 个分红年度累计值
- 若原始总额缺失，当前会按 `cashDividend * totalMarketCap / currentPrice` 或 `cashDividend * totalShares` 回推
- `GET /api/v1/dividends/stock/:code` 中该字段同样使用上述估算回退

### `dividendYield`

- 业务同步物化口径：
  - 公式：`cashDividend / latestPrice * 100`
  - 保留四位小数
- `mode=rolling1y` 时：
  - 汇总最近 1 年窗口内的 `cashDividend`
  - 再除以当前最新价格，得到滚动近 1 年股息率
- `mode=avg3y` 时：
  - 取最近 3 个分红年度的 `dividendYield`
  - 计算简单平均值

### `currentPrice`

- 分红排行接口优先使用最新历史行情价格
- 若没有，再回退到 `stocks.currentPrice`

### `periodLabel`

- `mode=rolling1y` 时：
  - 格式：`2025-06-27~2026-04-24`
- `mode=annual` 时：
  - 格式：`2025年`
- `mode=avg3y` 时：
  - 格式：`2023-2025`

## 编码归一化口径

### 股票代码

- 常见两种格式：
  - 纯代码：`300750`
  - 带后缀：`300750.SZ`

### 当前约定

- 比较和匹配时常需要归一化到纯代码
- 展示时保留原业务字段

高风险场景：

- `executive_member.dm`
- `company_top_flow_holders.stockCode`
- `stocks.code`
- `hs_stock_history_trading.dm`
