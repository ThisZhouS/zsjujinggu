# Known Risks

记录当前已知风险、技术债和优先级。

更新时间：`2026-06-04`

## P1 风险

### 0. 高管成员候选股票仍有 22 只 Mairui 当前无返回

现象：

- 高管增持使用 `company_top_flow_holders` 与 `executive_member` 真实姓名交叉匹配
- 2026-06-04 已按代表报告期 `20260331` 补齐候选股票高管成员
- 候选股票 `4396` 只，已覆盖 `4374` 只
- 剩余 `22` 只重试后新增 `0` 条：
  - `001220.SZ`
  - `001257.SZ`
  - `001280.SZ`
  - `001369.SZ`
  - `001396.SZ`
  - `301563.SZ`
  - `301638.SZ`
  - `301667.SZ`
  - `301687.SZ`
  - `600938.SH`
  - `600941.SH`
  - `601112.SH`
  - `603248.SH`
  - `603334.SH`
  - `603352.SH`
  - `603376.SH`
  - `688396.SH`
  - `688428.SH`
  - `688728.SH`
  - `688795.SH`
  - `688816.SH`
  - `688818.SH`

影响：

- 高管增持页面已恢复真实数据，当前返回 `302` 只股票
- 但上述 22 只股票若存在高管持股匹配，当前可能缺失

建议：

- 后续定时重试 `module=executive_member_candidates`
- 若 Mairui 持续无返回，补接交易所/公告来源的董监高成员信息
- 页面仍保持真实数据原则，不对缺失股票生成模拟高管数据

### 1. 分红历史覆盖仍受 `recent_dividend` 来源限制

现象：

- 当前 `company_capitals` 已完成 canonical A 股覆盖，`rolling1y / annual / avg3y` 三种股息率模式已能返回 `totalDividend/currentPrice/dividendYield`
- 但 `dividends` 业务表仍主要由 `recent_dividend` 物化
- 2026-05-12 已清理 Mairui “暂时没有数据”伪记录，并补齐 `PRIMARY / SECONDARY` 双槽位 `totalDividend`

影响：

- 当前字段空白问题已修，但更长历史覆盖范围仍取决于原始分红来源和接口返回边界
- 早期年份、特殊分红事件或非近期分红仍可能缺失

建议：

- 后续补接完整分红历史源
- 同步后重新物化 `dividends` 并补验年度覆盖率
- 在页面或字段文档注明历史覆盖边界

### 2. `totalDividend` 存在估算口径

现象：

- 当 `dividends.totalDividend` 原始字段为空或为 0 时，当前会按 `cashDividend * company_capitals.zgb` 回推
- 股票分红历史接口在缺少原始总额时优先按 `cashDividend * company_capitals.zgb` 回推，再回退 `cashDividend * totalMarketCap / currentPrice`
- 2026-05-12 当前库内 `dividends.PRIMARY / SECONDARY` 已无 `totalDividend` 空值

影响：

- 该字段可用于排序与展示，但不是交易所直接披露的原始分红总额
- 股本变动日与分红实施日若不完全一致，极端情况下会产生估算偏差

建议：

- 前端文案使用“分红总额/估算”
- 后续若接入原始总额字段，应优先使用原始披露值

### 3. 股票表存在纯代码与带后缀代码重复格式

现象：

- `stocks` 表当前原始行数为 `10409`
- 按 canonical 口径去重后 A 股约 `5206` 只

影响：

- 简单 SQL `IN` 对比容易误判缺失覆盖
- 新增模块若不做代码归一化，仍可能出现榜单为空、价格缺失或跨表 join 失败

建议：

- 继续推进统一股票代码归一化工具
- 所有新接口都明确使用 canonical code 或 normalize code
- 数据同步阶段逐步清理重复格式

### 4. 行情覆盖仍不完整，Mairui 会触发限流

现象：

- `apps/server/src/infrastructure/scheduler/data-sync.task.ts` 已注册到 `SyncModule`
- 股票列表、实时行情、涨跌停池、今日 K 线与历史涨幅重算已接入真实任务
- 2026-05-13 后端运行时观察到 `stock_realtime` 定时任务触发后，Mairui 单股实时接口大量 `timeout of 3000ms exceeded`
- 2026-05-14 已补调度时区、同名任务重入保护、实时行情请求去重/限流/汇总日志，仍需交易时段复验真实返回数量
- 2026-05-22 已确认旧 `/hslt/realtime` 与 `/hslt/kline` 端点返回 404，实时行情已改用 `/hsstock/latest/{code}/d/n`
- 2026-05-22 轻量回填最近两日日线成功 `2589` 只股票、失败 `2617` 只，主要为 Mairui `429`
- 2026-05-22 后端定时 `stock_realtime` 使用新端点后成功更新 `3557` 条，仍有部分代码失败

影响：

- 涨幅榜当前能返回部分股票，但不是全 A 股完整覆盖
- 投资人持仓市值排序对缺价股票仍会低估
- 涨跌停池、完整历史周期涨幅仍依赖后续补齐行情与涨跌停池数据
- 交易时段高频任务需要观察 `sync_logs` 与接口耗时

建议：

- 将全 A 股日线回填改为低并发、断点续跑、失败队列重试
- `KlineSyncTask` 后续应正式切换到 `HistoricalTradingDataClient.fetchHsStockLatestTrading`
- 在页面标注行情覆盖时间和覆盖率，避免将部分样本误认为全市场排名

### 5. 历史订单只读兼容仍需保持

现象：

- 会员支付链路已停用
- 用户侧创建订单、创建支付、支付回调均返回明确停用错误
- 历史订单查询与后台订单管理仍保留

影响：

- 前端或外部调用方仍可能看到历史订单与历史会员计划字段
- 需要避免后续需求误把历史会员字段重新接入数据访问控制

建议：

- 保持 `/pricing`、`/payment`、订单页文案为“登录用户可访问/支付已停用”
- 后续如恢复付费，必须重新设计订单状态、支付签名、退款和权限生效链路

### 6. 多数“已实现”页面未逐项验收

现象：

- `status-matrix.md` 中仍有大量 `已实现 / 未单测`

影响：

- 代码存在不代表真实可用

建议：

- 依照 `verification-checklist.md` 逐项补验

### 7. 自动化新闻上传接口尚未在实际环境启用

现象：

- 路由已实现
- 但若未配置 `NEWS_AUTOMATION_KEY`，会直接返回 `403`

影响：

- OpenClaw / Harness 暂时无法真实入库新闻
- 页面会长期只显示空新闻列表或仅手工录入内容

建议：

- 在实际服务环境补齐 `NEWS_AUTOMATION_KEY`
- 配置后补做一次端到端上传验收

### 8. TradingKey 持仓总数与公开分页明细存在缺口

现象：

- 2026-05-22 手动同步成功后，快照摘要显示 Buffett `68`、Catherine Wood `329`
- 公开分页接口 `holding-history-list` 实际落库 Buffett `67`、Catherine Wood `328`
- 2026-05-13 已新增 `latest-trade-stock-list` 买卖流水增量同步，但仍受 TradingKey 公开接口返回范围限制
- 2026-05-22 已修复公开接口分页参数校验和 `instrumentCode` 空值唯一键风险，当前剩余问题主要是源站摘要数与公开分页明细数不一致
- 2026-06-04 已补齐非零持仓 `latestPrice/latestMarketValue`
- 2026-06-04 当前持仓接口已默认排除 `holdingQuantity=0` 的清仓/零持仓记录

影响：

- 新报告期全量持仓会按可取明细落库，可能少于 TradingKey 摘要总数
- 同报告期每日交易流水可更新已返回股票的当前持仓，但不能补齐源接口不返回的缺口明细
- 0 持仓记录不再进入当前持仓页；若要查看清仓变化，应通过买卖流水页查看

建议：

- 继续跟踪 TradingKey 是否存在额外端点或参数可补全缺口
- 同步日志保留 `total` 与实际落库数，用于发现源接口变化

### 9. 前端布局已统一，但不是全站逐页视觉验收

现象：

- 本轮 D8 已覆盖首页、侧栏、核心榜单页和牛散/机构目录页
- 已通过 `pnpm --filter @king/web build`
- 管理后台、账户中心、支付、自选股等页面仍主要沿用原有布局

影响：

- 全站视觉一致性仍可能存在局部差异
- 个别旧页面筛选区和字段顺序未纳入本轮统一验收

建议：

- 按 `verification-checklist.md` 补逐页 UI 验收
- 后续将 `PageHeader / FilterBar` 继续扩展到管理后台和账户相关页面

## P2 风险

### 10. Redis 不可用时会退化为数据库查询

现象：

- 后端日志已出现 Redis 降级告警

影响：

- 涨停池、统计类接口可能变慢
- 部分缓存命中能力缺失

建议：

- 单独确认 Redis 连接配置
- 记录有无缓存时的响应耗时差异

### 11. 若股票代码口径再次漂移，多个榜单会再次出错

现象：

- 系统中同时存在纯代码和带后缀代码

高风险位置：

- `stocks.code`
- `holdings.stockCode`
- `company_top_flow_holders.stockCode`
- `executive_member.dm`
- `hs_stock_history_trading.dm`

影响：

- 牛散增减持
- 十大增持
- 高管增持
- 涨幅榜

建议：

- 统一沉淀“代码归一化工具”
- 新功能一律显式注明输入输出口径

### 12. 牛散连续追踪的“掉出前十后持股=0”容易被误读

现象：

- 连续追踪在 `isInTopFlowHolders=false` 时固定返回 `holdAmount=0`

影响：

- 若前端或后续接入方忽略 `isInTopFlowHolders`，可能误解为真实清仓

建议：

- 任何展示或导出都必须同时展示 `isInTopFlowHolders`
- 后续若有更高质量的全市场持仓来源，再考虑补真实持股推断

### 13. 文章上传使用本地文件系统

现象：

- 文件落到 `apps/server/uploads`

影响：

- 多实例部署时文件不共享
- 容器重建可能丢失

建议：

- 后续切到对象存储或挂载卷

### 14. 高管增持的 `totalAmount` 是估算值，不是成交额

现象：

- 当前聚合逻辑使用 `currentPrice * increaseShares`

影响：

- 容易被误解为真实高管成交金额

建议：

- 前端文案明确为“估算增持市值”
- 或改字段名避免误导

## P3 风险

### 15. 共同持仓 N+1 风险已缓解，仍需压测

现象：

- 当前 `HoldingService.getCommonHoldings()` 已通过 `enrichStockBusinessFields()` 批量调用：
  - `stockRepository.findByCodes()`
  - `stockRepository.findLatestRevenueByCodes()`

影响：

- N+1 查询风险已缓解
- 但共同持仓在大数据量下仍可能受 `holdingRepository.findCommonHoldings()` 聚合耗时影响

建议：

- 后续用真实大页码和多牛散组合做接口耗时压测
- 必要时将共同持仓聚合下推到 SQL 或物化表

### 16. 股息率数据价格来源存在回退路径

现象：

- 优先用最新历史行情，再回退到 `stocks.currentPrice`

影响：

- 若行情同步延迟，股息率可能不是完全同口径

建议：

- 在页面或文档中标明价格来源

### 17. 高管交易历史接口仍依赖 `executive_trades`

现象：

- 高管增持榜已改用真实交叉逻辑
- 但历史接口仍走 `executive_trades`

影响：

- 若底层原始样本不可信，历史接口质量存疑

建议：

- 单独审计 `executive_trades` 数据质量
- 视情况重做历史接口口径

### 18. Prisma 正式迁移已补且当前库已执行，仍需提交完整迁移目录

现象：

- 2026-05-22 已新增正式迁移 `20260525093000_add_business_slots_star_investors_video_paywall`
- 迁移覆盖业务双槽、文章新闻字段、视频/广告、TradingKey 明星投资人结构和 `instrumentCode NOT NULL DEFAULT ''`
- 当前迁移采用幂等 SQL，兼容已手工 `db push` 的环境和未升级的新环境
- 2026-05-26 已在当前数据库执行 `pnpm prisma migrate deploy`，`migrate status` 显示 up to date
- 由于此前 `.gitignore` 忽略了 migrations 目录，提交时必须包含历史迁移和新增迁移文件

影响：

- 当前开发库迁移状态已正常
- 若提交时遗漏历史迁移文件，其他环境会出现迁移历史漂移

建议：

- 提交时一并纳入 `packages/prisma/prisma/migrations/20260418074531_init`
- 提交时一并纳入 `packages/prisma/prisma/migrations/20260419103358_add_phase3_p2_tables`
- 提交时一并纳入 `packages/prisma/prisma/migrations/20260525093000_add_business_slots_star_investors_video_paywall`
- 若迁移报重复数据或约束冲突，先导出冲突行再处理，禁止直接使用破坏性 data-loss 操作

## 2026-05-26 已降低风险

### TradingKey 持仓/买卖同步静默成功风险已处理

- 全量持仓分页失败或低于 `TRADINGKEY_MIN_LIST_COMPLETENESS=0.95` 会阻断同步，不再用严重不完整首屏数据覆盖当前报告期。
- 日常买卖接口失败会阻断同步，不再伪装为“无更新”。
- 若源站异常返回 `success=true,total=0,list=[]`，可通过 `TRADINGKEY_BLOCK_EMPTY_DAILY_TRADES=true` 在本报告期无历史买卖记录时阻断。
- 剩余风险：TradingKey 页面结构或接口参数发生变化时仍需人工复验解析字段。

### 全 A 股原始数据大面积失败后切源风险已处理

- 新增 `BUSINESS_DATA_MIN_REFRESH_COVERAGE` 覆盖率阈值，默认 `0.8`。
- 新增 `BUSINESS_DATA_MIN_TARGET_DATE_COVERAGE`，默认 `0`，用于生产按目标日期有效数据覆盖率强校验。
- 低于阈值时阻断业务数据源切换。
- 剩余风险：默认不强制目标日期覆盖，避免正常无披露日误阻断；生产开启阈值后需根据披露日实际数据量调参。

### 高管交易首股探测误判风险已处理

- 已取消“第一只股票无数据则跳过全量高管交易”的逻辑。
- 当前改为逐只股票同步，单股失败只影响该股票。
- 高管交易改用严格接口；全部请求失败会阻断同步。
- `BUSINESS_DATA_BLOCK_EMPTY_EXECUTIVE_TRADES=false` 默认不因全市场结果为空阻断，避免未实盘确认的高管接口导致凌晨 4 点业务同步长期失败。
- 剩余风险：如果生产需要强一致，可开启该开关；开启前必须先确认高管交易接口稳定返回真实数据。

## 当前优先级建议

1. 继续补接更完整的分红历史源并复验年度覆盖
2. 交易时段补验行情/涨跌停池/K 线定时同步
3. 补验支付/订单/会员闭环
4. 逐项验收 `status-matrix.md` 中未单测能力
5. 为自动化新闻上传补环境密钥与验收
6. 提交时确认完整 migrations 目录已纳入版本控制
