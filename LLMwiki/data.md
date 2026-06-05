# Data

## 业务数据来源

- 牛散持仓：`holdings`
- 股东信息：`investors`
- 股票基础信息：`stocks`
- K线日线：`kline_daily`
- 高管交易：`executive_trades`
- 新闻/文章：`articles`
- 十大流通股东：`company_top_flow_holders`
- 收入数据：`income_statements`
- TradingKey 明星投资人：
  - 摘要：`star_investor_snapshots`
  - 当前持仓：`star_investor_holdings`
  - 买卖流水：`star_investor_trades`

## 股东业务表口径

- `investors` 当前统一承载两类业务股东：
  - `personal`
  - `institution`
- 分类结果持久化到 `investors.category`
- 列表页通过 `category` 查询：
  - 牛散页：`category=personal`
  - 机构页：`category=institution`

## 原始数据脏点与当前处理

- `company_top_flow_holders.gdlx` 存在脏数据：
  - 明显机构被标成 `自然人`
  - 真实自然人存在 `gdlx` 为空
- 当前处理策略：
  - 同步时优先参考 `gdlx`
  - `gdlx` 为空时回退到名称粗过滤
  - 对短机构别名单独兜底
  - 跳过超长名称，避免脏数据再次写入业务表

## 口径规则

- 牛散增减持按有效报告期对比上一有效报告期
- 牛散进入十大流通股东后的连续追踪：
  - 原始明细来自 `company_top_flow_holders`
  - 时间轴优先使用 `holdings` 的代表性报告期
  - 掉出前十后仍保留该期记录，但 `holdAmount=0` 仅表示“该期未在前十”
- 十大增持按代表性报告期计算，不取绝对最大日期
- 牛散新进支持：
  - 明细榜
  - 按股票聚合统计新进牛散数量
- 高管增持按 `executive_trades` 最近 `1-12` 月滚动区间聚合
- 牛散/高管相关新闻统一落到 `articles`
  - `topicType=investor`
  - `topicType=executive`
  - 自动化上传幂等键：`automationProvider + automationExternalId`
- 股息率排行支持：
  - 单年排行
  - 最近 3 年平均排行
- 涨幅榜今日数据优先用最新行情快照，历史周期按交易日计算
- 巴菲特 / 木头姐持仓：
  - 新报告期：解析 TradingKey 明星投资人页摘要，并分页抓取 `holding-history-list` 全量重建当前报告期持仓
  - 同报告期：每日抓取 `latest-trade-stock-list` 买卖流水，写入 `star_investor_trades`，并用返回的当前持仓数量更新 `star_investor_holdings`
  - `tradeQuantity > 0` 归一为买入/增持，`tradeQuantity < 0` 归一为卖出/减持
  - `previousHoldingQuantity = holdingQuantity - tradeQuantity`
  - 2026-05-22 当前落库：Buffett 持仓 `67` / 买卖 `46`，Catherine Wood 持仓 `328` / 买卖 `291`

## 最近一次业务重建

- 日期：`2026-05-08`
- 结果：
  - `qualifiedInvestorCount = 74399`
  - `investorUpdated = 74399`
  - `investorDisabled = 64`
  - `holdingRecordCount = 1893704`

## 定时任务

- 凌晨 4 点同步业务数据，并在完成后切换业务活跃源
- 交易日内定时同步行情、涨停池、K 线、涨幅榜
- 每日 05:10（Asia/Shanghai）同步 TradingKey 巴菲特 / 木头姐持仓与买卖流水
