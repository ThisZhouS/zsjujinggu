# Sync

## 业务数据串行阶段

业务数据同步必须按时间顺序执行，后一阶段依赖前一阶段完成结果：

```text
1/3 获取数据
  - 确认全 A 股股票池
  - 回填/刷新股票价格
  - 按 full/daily + targetDate 拉取 Mairui 原始数据
  - 原始数据写入 raw/source 表
  ↓
2/3 同步业务数据
  - 从 raw/source 表物化 investors
  - 从 raw/source 表物化 holdings 到 inactive slot
  - 从 raw/source 表物化 dividends 到 inactive slot
  - 从 Mairui/原始表物化 executive_trades 到 inactive slot
  ↓
3/3 切换数据源
  - 校验 inactive slot 的股东/持仓/分红不为空
  - 校验分红现金记录的股息率与分红总额已补齐
  - 更新投资人聚合字段
  - 切换 business_data_source_state.activeSlot
```

约束：

- 获取数据未完成，不允许进入业务物化
- 业务物化未完成，不允许进入数据源切换
- 校验失败，不允许切换 `activeSlot`
- `dividends` 中存在现金分红但 `dividendYield / totalDividend` 未补齐时，不允许切换 `activeSlot`
- 任一阶段抛错后，后续阶段直接阻断
- 前端只读取当前 `activeSlot`

## 双链路同步

### 1. 业务数据同步

- 定时：每天凌晨 4 点（`Asia/Shanghai`），`BusinessDataSyncTask`
- 入口：`apps/server/src/infrastructure/scheduler/business-data-sync.task.ts`
- 业务服务：`BusinessDataSyncService`
- 作用：
  - 同步全 A 股股票池
  - 刷新原始股东/流通股东/解禁/分红数据
  - 将业务数据物化到业务源双槽位后再切换前台读取源
  - 产出牛散/机构、持仓、分红、高管交易业务数据

### 业务同步当前顺序（已实现）

1. 确保全 A 股股票池
2. 回补股票最新价
3. 刷新原始表：
   - `company_top_holders`
   - `company_top_flow_holders`
   - `company_shareholder_count`
   - `company_capitals`
   - `lift_restriction`
   - `recent_dividend`
4. 原始表刷新后再次回补股票最新价 / 总市值
5. 将业务数据物化到当前非活跃槽位：
   - `investors` 统计快照
   - `holdings.dataSlot`
   - `dividends.dataSlot`
   - `executive_trades.dataSlot`
6. 同步完成后在事务内切换 `business_data_source_state.activeSlot`

### 当前实现口径（已核实）

- 双源切换：
  - Prisma 已新增 `BusinessDataSlot = PRIMARY | SECONDARY`
  - `business_data_source_state` 维护当前前台业务活跃源
  - 夜间任务永远先写入当前非活跃槽位，再切换活跃源
- `investors`
  - 保持稳定主键，不按槽位复制
  - 原因：避免收藏、路由、用户关联数据失效
  - 切源时只更新 `category / stockCount / totalMarketValue / isTracked`
- `holdings` / `dividends` / `executive_trades`
  - 以 `dataSlot` 区分业务源
  - 读取端统一按 `activeSlot` 过滤
- `dividends`
  - 当前仅由 `recent_dividend` 物化
  - 夜间任务已补同步 `company_capitals`
  - 已支持在总市值缺失时回退 `company_capital.zgb * currentPrice`
  - 物化后会补齐 `dividendYield / totalDividend`
  - 切源前会检查现金分红记录的 `dividendYield / totalDividend` 覆盖率，未补齐则阻断切换
  - 已过滤 Mairui 返回的“暂时没有数据”伪记录
  - 已在物化时过滤异常年份和无分红动作记录
  - 因原始来源只覆盖“近期分红”，历史覆盖缺口仍需后续补源
- `executive_member`
  - 作为高管增持真实判断基础表，不按业务槽位复制
  - 夜间业务同步会按代表性流通股东报告期筛出候选股票
  - 仅补齐 `executive_member` 缺失的候选股票，避免重复拉取
  - 管理员可用 `POST /api/v1/data-sync/sync` + `module=executive_member_candidates` 单独触发候选补齐
  - 可传 `params.limit` 进行分批补齐
- `executive_trades`
  - 仍通过 Mairui 高管交易接口拉取
  - 但已写入非活跃槽位，切源后整体生效
- 原始表刷新
  - `full` 模式按股票刷新全量原始数据
  - `daily` 模式使用目标日期参数，并按该日期窗口覆盖原始表记录
  - `company_top_holders` / `company_top_flow_holders` / `company_shareholder_count` / `company_capitals` / `lift_restriction` / `recent_dividend` 均已支持按目标日期清理再写入

### 夜间调度口径（已实现）

- 定时为每天凌晨 4 点（`Asia/Shanghai`）
- 若任务执行时间是 `2026-05-09 04:00`，每日增量参数使用 `2026-05-08`
- 同步策略拆为两种：
  - `full`
    - 首次无全量记录时自动执行
    - 也可人工触发全量重建
  - `daily`
    - 使用“前一日日期参数”拉取新增/变更数据
    - 先写入非活跃源，再整体切换
- 跳过规则：
  - 若 `latestFullSyncDate >= targetDate`，跳过当日 `daily`
  - 若 `latestDailySyncDate == targetDate`，跳过重复 `daily`
- 切换规则：
  - `syncNightlyBusinessData()` 先判断是否已有全量记录
  - 没有全量记录则先跑 `full`
  - 有全量记录才进入 `daily`

### 分红修复专用回填（已新增）

- 目的：
  - 在不触发整套业务双槽位切换的前提下，先把 `company_capitals` 补齐
  - 优先修复 `dividends.totalDividend` 的股本依赖
- 脚本：
  - `apps/server/scripts/backfill-company-capitals.ts`
  - `pnpm --filter @king/server sync:company-capitals`
- 特点：
  - 只拉取全 A 股 `company_capital`
  - 支持 `--codes=300750.SZ,000001.SZ`
  - 支持 `--limit=500 --offset=0`
  - 支持 `--startDate=YYYYMMDD --endDate=YYYYMMDD`
  - 支持 `--concurrency=4`
- 当前验证：
  - 已单股验证 `300750.SZ`
  - 已确认接口可从 Mairui 拉取并写入 `company_capitals`
  - 已完成当前 canonical A 股股票池覆盖：
    - 股票表原始行数 `10409`
    - canonical 股票数 `5206`
  - `company_capitals` 覆盖股票数 `5206`
  - 缺失数 `0`

### 分红数据清洗与双源补齐（2026-05-12）

- 已修复 Mairui 近期分红客户端：
  - `licence` 继续按路径密钥拼接，不使用 `licence=` 查询参数
  - 过滤 `暂时没有数据`、`--`、空值和非实施状态
  - 统一规范 `YYYYMMDD / YYYY-MM-DD` 日期
- 已修复 `recent_dividend -> dividends` 物化：
  - 跳过 `1990` 年前和超过当前年份 + 1 的异常年份
  - 跳过现金分红、送股、转增均为空或 0 的记录
- 已完成现有库数据修复：
  - 删除无效 `recent_dividend` 伪记录 `3` 条
  - 删除异常年份 `dividends` 记录 `6` 条
  - 从完整槽位补齐 `PRIMARY` 的 `totalDividend` `68754` 条
- 修复后验证：
  - `dividends.PRIMARY`：`68754` 条，覆盖 `5195` 只股票，年份 `1991-2026`，`totalDividend/dividendYield` 空值 `0`
  - `dividends.SECONDARY`：`68754` 条，覆盖 `5195` 只股票，年份 `1991-2026`，`totalDividend/dividendYield` 空值 `0`
  - `GET /api/v1/dividends/stock/300750` 返回 `currentPrice/totalDividend`
  - 带 Admin JWT 调用 `GET /api/v1/dividends/yield-ranking?mode=rolling1y&page=1&page_size=3` 返回 200，前三条均有 `currentPrice/totalDividend/dividendYield`

### 股东分类口径

- `investors` 不再只承载“牛散”，而是统一承载：
  - `personal`
  - `institution`
- 分类字段会在同步时落库到 `investors.category`
- 当前粗过滤规则：
  - `gdlx = 自然人` 时，优先按个人名规则判断
  - `gdlx` 非空且不是 `自然人` 时，直接判为机构
  - `gdlx` 为空时，回退到名称粗过滤
- 名称粗过滤会使用：
  - 中文 2-5 字个人名规则
  - 机构关键词
  - 短机构别名兜底
- 同步会跳过超长脏名称，避免再次写入业务表

### 近期验证结果

- 已确认定时表达式已改为 `0 4 * * *`
- 已落地 `PRIMARY / SECONDARY` 双业务源切换
- 已确认夜间任务使用“中国当前日期 - 1 天”作为 `daily targetDate`
- 已确认以下读取链路已按 `activeSlot` 读取：
  - `holdings`
  - `dividends`
  - `executive_trades`
  - 导出服务
  - 个股关联牛散持仓
- 已确认 `investors` 保持稳定主键，不因切源而重建 ID
- 已确认 `邵树伟` 这类 `gdlx` 为空的自然人不会再被误归到机构
- 已确认当前 `dividends` 物化来源仍是 `recent_dividend`
- 已确认当前 `executive_trades` 仍由外部高管交易接口拉取

### 2. 行情与衍生同步

- 定时：交易日内行情、涨停、K 线、涨幅榜预计算
- 入口：`apps/server/src/infrastructure/scheduler/data-sync.task.ts`
- 注册：`apps/server/src/infrastructure/scheduler/sync.module.ts`
- 作用：
  - 行情快照
  - 涨停池
  - K 线历史
  - 历史涨幅重算
- 当前已接入真实调度：
  - `stock_list`：交易日 09:30（Asia/Shanghai），调用 `StockSyncTask.syncStockList()`
  - `stock_realtime`：交易日 09:00-15:00（Asia/Shanghai）每 5 分钟，调用 `StockSyncTask.syncRealtimeQuotes()`
  - `major_market_lists`：交易日 16:00（Asia/Shanghai），同步涨停池 / 跌停池
  - `historical_trading`：交易日 17:30（Asia/Shanghai），同步今日 K 线并重算多周期涨幅榜
  - `star_investor_holdings`：每日 05:10（Asia/Shanghai），TradingKey 新报告期全量持仓，同报告期买卖流水增量
- TradingKey 明星投资人口径：
  - 目标：巴菲特 `warren-buffett`、Catherine Wood `catherine-wood`
  - 页面源：`window.__QUDE_LOADER_DATA__`
  - 全量持仓：`holding-history-list`
  - 日常买卖：`latest-trade-stock-list`
  - 新报告期或本地无持仓时跑全量；同报告期只抓买卖流水，并用返回的当前持仓数量 upsert 更新 `star_investor_holdings`
  - 2026-05-22 手动同步返回 `731`，当前落库 Buffett 持仓 `67` / 买卖 `46`，Catherine Wood 持仓 `328` / 买卖 `291`
- 调度保护：
  - `BaseSyncTask` 已阻止同名任务重入
  - `MairuiService.getRealtimeQuotes()` 已按股票代码去重并限制并发，失败只输出汇总样本，避免全 A 股逐只请求刷屏
- 重业务同步仍只由凌晨 4 点 `BusinessDataSyncTask` 执行：
  - `company_basic_info`
  - `shareholder_info`
  - `financial_indicators`
  - `financial_statements`
  - 上述模块手动触发时会显式调用业务全量同步，但不再额外配置晚间重复 Cron

## 手动同步

- 管理后台：`/admin/sync`
- 后端入口：`POST /api/v1/admin/sync/*`
- 日志入口：`GET /api/v1/admin/sync/logs`

## 新闻自动化预留接口

- 牛散相关新闻查询：`GET /api/v1/articles/investor/:investorId/news`
- 高管相关新闻查询：`GET /api/v1/articles/executive/news`
- 统一自动上传：`POST /api/v1/articles/automation/:provider/news`
- OpenClaw 自动上传：`POST /api/v1/articles/automation/openclaw/news`
- Harness 自动上传：`POST /api/v1/articles/automation/harness/news`
- 鉴权头：`x-news-ingest-key`
- 环境变量：`NEWS_AUTOMATION_KEY`
- 当前落库方式：
  - 统一写入 `articles`
  - 使用 `topicType` 区分 `general` / `investor` / `executive`
  - 使用 `automationProvider + automationExternalId` 做幂等
  - 兼容 `openclaw/open_claw/harness`
  - 兼容单条、批量、包装数组和常见别名字段

## 牛散连续追踪口径

- 原“清仓高亮”任务已取消
- 已替换为：牛散进入某只股票 `company_top_flow_holders` 后，持续追踪其后续每个代表性报告期记录
- 接口：`GET /api/v1/investors/:id/top-flow-tracking`
- 当前口径：
  - 原始来源仍取 `company_top_flow_holders`
  - 时间轴优先取业务 `holdings` 的代表性报告期
  - 若代表性报告期缺失，再回退原始 `jzrq`

## 关键日志

- `sync_logs` 记录同步任务状态
- 业务同步结果会写入后端日志并汇总统计

## 外部 API 配置口径

- Mairui 统一读取环境变量：`MAIRUI_API_KEY`
- `.env.example` 和 `apps/server/.env.example` 均使用 `MAIRUI_API_KEY`
- 密钥直接替换变量值，不使用 `licence=` 形式

## 2026-05-26 同步保护更新

- TradingKey 全量持仓：
  - 分页接口必须达到 `TRADINGKEY_MIN_LIST_COMPLETENESS` 完整度阈值，默认 `0.95`
  - 只有首屏数据量达到该阈值时才允许 fallback
  - 否则抛错，阻断快照更新和当前报告期覆盖
- TradingKey 日常买卖：
  - 接口失败不再视为“无更新”
  - 分页低于完整度阈值或请求失败会抛错并写入同步失败日志
  - 同报告期快照更新在买卖同步成功后执行
  - `TRADINGKEY_BLOCK_EMPTY_DAILY_TRADES=false` 默认不阻断真实无交易日；生产可开启，用于阻断本报告期无历史买卖记录时的异常空列表
- 全 A 股业务同步：
  - 新增 `BUSINESS_DATA_MIN_REFRESH_COVERAGE`
  - 默认 `0.8`
  - 原始数据刷新覆盖率低于阈值时，阻断“同步业务数据”和“切换数据源”
  - 新增 `BUSINESS_DATA_MIN_TARGET_DATE_COVERAGE`
  - 默认 `0`
  - 生产可开启目标日期有效数据覆盖校验；为避免正常无披露日误阻断，默认不强制
- 高管交易：
  - 取消第一只股票探测
  - 改为逐只股票尝试同步
  - 改用严格接口，不再读取缓存或吞异常
  - 单股失败记录 warn 并继续处理其他股票
  - `BUSINESS_DATA_BLOCK_EMPTY_EXECUTIVE_TRADES=false`，全 A 股结果为空时默认记录 warn 并继续，生产可开启强阻断
