# Database

## 核心模型

- `User`
- `Investor`
- `Holding`
- `Stock`
- `KlineDaily`
- `Article`
- `ExecutiveTrade`
- `Dividend`
- `UserFavorite`
- `Watchlist`
- `PriceAlert`
- `Notification`
- `SyncLog`
- `ApiKey`
- `StarInvestorSnapshot`
- `StarInvestorHolding`
- `StarInvestorTrade`

## 主要关系

```text
User -> UserFavorite / Watchlist / PriceAlert / Notification / ApiKey / Order / MemberLog / Article
Investor -> Holding / UserFavorite
Stock -> Holding / KlineDaily / Dividend / ExecutiveTrade / Watchlist
Holding -> Investor + Stock
Article -> User(createdByUserId, optional)
ExecutiveTrade -> Stock
Dividend -> Stock
StarInvestorSnapshot -> StarInvestorHolding / StarInvestorTrade by investorType + period
```

## 业务表

- `investors`：股东主数据，当前同时承载 `personal` 与 `institution`
- `holdings`：牛散持仓快照
- `stocks`：股票基础数据
- `kline_daily`：日线行情
- `executive_trades`：高管交易历史
- `articles`：资讯文章与预留新闻落库表，支持记录 `createdByUserId`
- `dividends`：分红数据
- `star_investor_snapshots`：TradingKey 明星投资人最新报告期摘要
- `star_investor_holdings`：巴菲特 / 木头姐当前报告期持仓明细
- `star_investor_trades`：TradingKey `latest-trade-stock-list` 买卖流水，支持每日增量更新当前持仓

## 近期结构补充

- `investors.category`
  - 类型：`varchar(20)`
  - 默认值：`personal`
  - 用途：区分牛散与机构列表、详情、反查榜单
- `articles.topicType`
  - 枚举：`GENERAL | INVESTOR | EXECUTIVE`
  - 用途：区分通用文章、牛散相关新闻、高管相关新闻
- `articles.relatedInvestorId`
  - 类型：`bigint`
  - 用途：关联牛散新闻
- `articles.relatedStockCode`
  - 类型：`varchar(10)`
  - 用途：关联高管新闻对应股票
- `articles.relatedExecutiveName`
  - 类型：`varchar(100)`
  - 用途：关联高管新闻对应姓名
- `articles.automationProvider + articles.automationExternalId`
  - 用途：兼容 `OpenClaw/Harness` 自动化新闻上传幂等
- 索引：
  - `idx_investors_category_tracked`
  - `idx_articles_topic_investor_date`
  - `idx_articles_topic_stock_date`
  - `idx_articles_topic_exec_name_date`
- `star_investor_holdings` 唯一键：
  - `investorType + period + stockCode + instrumentCode`
  - 用途：避免同一股票不同证券标识被误去重
  - `instrumentCode` 非空，默认 `''`，避免 nullable 字段参与唯一键导致重复或 upsert 不稳定
- `star_investor_trades.sourceKey`
  - 用途：同报告期买卖流水幂等去重，重复抓取只更新 `lastSeenAt`
- `star_investor_trades.instrumentCode`
  - 非空，默认 `''`
  - 用途：与持仓表保持同一证券标识口径，空源值统一归一化为空字符串

## 原始数据表

- `company_top_holders`
- `company_top_flow_holders`
- `company_shareholder_count`
- `company_lift_restriction`
- `stock_list`
- `stock_realtime`
- `hs_stock_history_trading`
- `hs_index_realtime`
