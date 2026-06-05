# Status Matrix

按“是否实现 + 是否已验证 + 数据来源/依赖”记录当前功能状态。

状态定义：

- `已验证`：已实际请求接口或运行页面验证
- `已实现`：代码已存在，但本轮未逐项验收
- `部分实现`：能用，但仍有明显缺口或口径风险
- `未确认`：仓库中有代码入口，但尚未确认实际可用性

更新时间：`2026-05-22`

| 功能 | 前端 | 后端 | 数据源 | 权限 | 当前状态 | 验证日期 | 备注 |
|---|---|---|---|---|---|---|---|
| 首页概览 | 有 | 有 | `investors` `articles` `stocks` | 公开 | 已验证 | 2026-05-10 | 首页搜索框、模块入口、牛散榜、文章区已回测；已补业务工作台头部与统一布局 |
| 个股详情基础版 | 有 | 有 | `stocks` + `kline_daily` + `holdings` | 公开 | 已验证 | 2026-05-09 | `/stocks/:code` 已接入详情、K 线、关联牛散持仓 |
| 个股详情增强版 | 有 | 有 | `stocks` + `kline_daily` + `holdings` + `articles` + 实时行情预留 | 公开 | 已实现 | 2026-05-09 | 已接入公司信息、历史涨幅、历史涨跌停、股票新闻、实时接口预留；前后端 build 通过 |
| 牛散列表 | 有 | 有 | `investors(category=personal)` | 公开 | 已验证 | 2026-05-22 | 已从 `company_top_flow_holders` 物化 `holdings=2571123`、跟踪牛散 `151457`，按持仓市值排序已复验 |
| 牛散详情 | 有 | 有 | `investors` `holdings` | 公开/VIP | 已验证 | 2026-05-08 | 详情接口已回测 |
| 牛散持仓历史 | 有 | 有 | `holdings` | 公开/VIP | 已实现 | 未单测 | 接口存在，未本轮单独复验 |
| 牛散十大流通股东连续追踪 | 有 | 有 | `company_top_flow_holders` + `holdings` 代表性报告期 | 公开 | 已验证 | 2026-05-08 | 已改为进入前十后按代表性报告期持续追踪，不再输出日级噪音 |
| 牛散相关新闻板块 | 有 | 有 | `articles(topicType=investor)` | 公开 | 已实现 | 未单测 | 详情页已接入，内容可由手工或自动化后续补录 |
| 机构列表 | 有 | 有 | `investors(category=institution)` | 公开 | 已验证 | 2026-05-22 | 已从业务持仓物化跟踪机构 `91747`，按持仓市值排序已复验 |
| 机构详情 | 有 | 有 | `investors` `holdings` | 公开/VIP | 已验证 | 2026-05-08 | 与牛散详情同构 |
| 机构强势股反查 | 有 | 有 | `holdings` + `investors(category=institution)` + `top_gainers` | 公开 | 已验证 | 2026-05-08 | 已修复查询过慢与混入个人问题 |
| 同姓牛散 | 有 | 有 | `investors` `holdings` | 公开 | 已验证 | 2026-05-08 | 页面已支持按姓氏/人数/市值排序，默认按姓氏升序 |
| 牛散增持 | 有 | 有 | `holdings` + 历史行情价格回补 | VIP | 已验证 | 2026-05-08 | 已补平均增持均价（报告期附近最近交易日估算） |
| 牛散减持 | 有 | 有 | `holdings` + 历史行情价格回补 | VIP | 已验证 | 2026-05-08 | 已补平均减持均价（报告期附近最近交易日估算） |
| 牛散新进 | 有 | 有 | `holdings` + 价格回补 | VIP | 已验证 | 2026-05-08 | 已支持新进明细 / 按股票聚合双视图 |
| 共同持仓 | 有 | 有 | `holdings` | VIP | 已验证 | 2026-05-09 | 已验证 API 返回主营收入字段与牛散明细，前端支持跳转详情 |
| 涨幅榜今日 | 有 | 有 | `stocks` + `hs_stock_history_trading` + `kline_daily` | 公开 | 部分实现 | 2026-05-22 | 已修复尾缀代码过滤问题并回填最近两日日线；当前可返回 `2589` 只股票，剩余受 Mairui 429 限流待低并发续跑 |
| 涨幅榜历史周期 | 有 | 有 | `hs_stock_history_trading` | 公开 | 部分实现 | 2026-05-22 | `1w` 已实测返回；目前只有最近两日轻量行情，完整周期需补历史行情 |
| 涨停榜 | 有 | 有 | Redis / 历史行情 | 公开 | 已实现 | 未单测 | 接口存在 |
| 跌停榜 | 有 | 有 | Redis / 历史行情 | 公开 | 已实现 | 未单测 | 接口存在 |
| 涨跌停统计 | 有 | 有 | Redis / 历史行情 | 公开 | 已实现 | 未单测 | 接口存在 |
| 十大增持 | 有 | 有 | `company_top_flow_holders` + `stocks` | VIP | 已验证 | 2026-05-09 | 已改为股票聚合榜，输出股票名称/代码/现价/增持牛散/总增持数量 |
| 高管增持 | 有 | 有 | `executive_member` + `company_top_flow_holders` + `stocks` + `income_statements` | VIP | 已验证 | 2026-06-04 | 已切到真实高管成员与代表性报告期对比链路；已修复 `executive_member` 唯一键丢数据问题并新增候选股票批量补齐；当前 `executive_member` 覆盖 4375 只股票；代表报告期 `20260331` 候选 4396 只，已覆盖 4374 只，真实匹配 865 条/302 只股票；高管增持接口当前返回 302 只股票；剩余 22 只候选为 Mairui 当前无返回或失败风险 |
| 高管相关新闻板块 | 有 | 有 | `articles(topicType=executive)` | 公开 | 已实现 | 未单测 | 页面板块、后台录入字段、用户投稿字段已接入 |
| 自动化新闻上传接口 | 无专页 | 有 | `articles` | `x-news-ingest-key` | 已验证 | 2026-05-08 | 已支持统一 `:provider` 路由、旧路由兼容、单条/批量入参兼容；本地已验证命中鉴权逻辑 |
| 高管成员列表 | 无专页 | 有 | `executive_member` | 公开 | 已实现 | 未单测 | 只有接口 |
| 高管交易历史 | 无专页 | 有 | `executive_trades` | 公开 | 已实现 | 未单测 | 只有接口 |
| 股息率排行 | 有 | 有 | `dividends` + `company_capitals` + `stocks.currentPrice` + `hs_stock_history_trading` | VIP | 已验证 | 2026-06-05 | 已新增管理员双槽位补齐入口和覆盖率查询接口；管理端 `/admin/sync` 可查看 `PRIMARY/SECONDARY` 覆盖率；业务同步切源前会阻断 `dividendYield/totalDividend` 未补齐的现金分红槽位；当前 `PRIMARY/SECONDARY` 均覆盖 `48812` 条、`5097` 只股票、年份 `1991-2026`，现金分红记录各 `46879` 条，缺 `dividendYield=0`、缺 `totalDividend=0`；补齐接口可从另一槽位补缺且重复执行不重复插入；`totalDividend=0` 统一视为未补齐；更长历史覆盖仍受 `recent_dividend` 源范围限制 |
| 个人股东 | 有 | 有 | `investors(category)` + `holdings` | 公开 | 已验证 | 2026-05-08 | 已切到牛散单支持股/机构单支持股双榜 |
| 自然人大股东 | 有 | 有 | 原始股东表 + 业务表 | VIP | 已实现 | 未单测 | 页面与多接口已接入 |
| 文章列表 | 有 | 有 | `articles` | 公开 | 已实现 | 未单测 | 前台列表/详情已接入 |
| 文章详情 | 有 | 有 | `articles` | 公开 | 已实现 | 未单测 | 阅读数会累加 |
| 文章后台管理 | 有 | 有 | `articles` | Admin | 已实现 | 未单测 | CRUD 已接入 |
| 用户文章投稿 | 有 | 有 | `articles` + `users` | JWT + 指定用户/Admin | 已验证 | 2026-06-05 | 已补文章 DTO 和前端表单字段边界；已验证未登录 401、未授权 403、管理员创建/置顶、普通用户不能编辑/删除管理员文章、授权用户创建/列表/编辑/删除本人文章、普通用户不能置顶、非法来源链接 400；临时文章已清理 |
| 文章投稿权限管理 | 有 | 有 | `users` | Admin | 已实现 | 未单测 | `/admin/users` 可开关 `canUploadArticles` |
| 文章封面上传 | 有 | 有 | 本地静态文件 | Admin/指定用户 | 已实现 | 未单测 | `/uploads` 可访问已于 2026-05-06 验证，本轮权限已扩展 |
| 登录 | 有 | 有 | `users` | 公开 | 已验证 | 2026-06-05 | 管理员账号和新注册普通用户均可登录；普通用户登录后可访问登录用户数据接口 |
| 注册 | 有 | 有 | `users` | 公开 | 已验证 | 2026-06-05 | 必填手机号、邮箱、短信验证码、邮箱验证码；开发环境验证码写入 Redis；已验证错误验证码拒绝、真实验证码注册成功、`emailVerifiedAt` 写入、重复手机号/邮箱返回 409；`/register` 与 `/login` 注册 Tab 已复用共享注册组件 |
| 找回密码 | 有 | 有 | `users` | 公开 | 已验证 | 2026-06-05 | 已验证未注册手机号 404、错误验证码 400、真实验证码重置成功、旧密码失效、新密码可登录、验证码重置后删除；前端已补 6 位短信验证码校验 |
| 用户中心 | 有 | 有 | `users` | JWT | 已验证 | 2026-06-05 | 已验证未登录 401、资料读取、非法头像 URL 拒绝、合法昵称/头像更新、空头像清空；后端新增 DTO 限制昵称 50 位、头像 URL 500 位且必须带协议 |
| API Key 用户侧 | 有 | 有 | `api_keys` | JWT | 已实现 | 未单测 | 页面与接口存在 |
| API Key 管理侧 | 有 | 有 | `api_keys` | Admin | 已实现 | 未单测 | 页面与接口存在 |
| 订单中心 | 有 | 有 | `orders` | JWT/Admin | 已验证 | 2026-06-05 | 用户侧/管理侧保留历史订单查询；用户侧创建会员订单已停用并返回明确错误 |
| 支付页 | 有 | 有 | `payment_settings` | 公开/Admin | 已验证 | 2026-06-05 | 前台展示“付费购买已停用”；后端 `payment/create` 与 `payment/callback` 均拒绝会员支付；不会再写入 `users.vipExpiresAt` |
| 自选股 | 有 | 有 | `watchlists` + `stocks` + `kline_daily` + `hs_stock_history_trading` | JWT | 已验证 | 2026-06-05 | 已改为全数据库展示链路，不再请求时调用 Mairui；已验证未登录 401、非法代码 400、添加、重复添加 409、列表现价/涨跌幅、排序、非法排序 400、删除；测试数据已清理 |
| 价格提醒 | 有 | 有 | `price_alerts` + `stocks` | JWT | 已验证 | 2026-06-05 | 创建提醒改为查本地 `stocks`，不再在用户请求链路调用 Mairui；已补 DTO；已验证未登录 401、非法参数 400、创建、列表、越权删除 404、停用、删除、测试数据清理 |
| 通知 | 有 | 有 | `notifications` | JWT | 已验证 | 2026-06-05 | 已验证未登录 401、列表只返回本人通知、单条已读/删除带 `userId` 边界、越权返回 404、全部已读仅作用本人；页面支持刷新、全部已读、单条已读和删除；临时数据已清理 |
| 管理后台总览 | 有 | 有 | 多表聚合 | Admin | 已实现 | 未单测 | 页面存在 |
| 管理后台同步 | 有 | 有 | `sync_logs` + 调度服务 | Admin | 已实现 | 未单测 | 任务入口存在 |
| 凌晨 4 点业务同步（双源切换） | 无 | 有 | Mairui + 原始表 + 业务双槽位 | 定时任务 | 已实现 | 2026-05-09 | 已改为 `0 4 * * *`；无全量记录时先 `full`，否则按前一日参数跑 `daily`；先写 inactive slot，再切 `activeSlot` |
| 行情与衍生定时同步 | 无 | 有 | Mairui + `stocks` + `kline_daily` + 涨跌停池 | 定时任务 | 部分实现 | 2026-05-22 | 实时行情已切到可用 `/hsstock/latest/{code}/d/n` 端点；本轮定时任务成功更新 `3557` 条，仍有 Mairui 429/个股异常 |
| 首页视频广告 | 有 | 有 | `ads(HOME_VIDEO_HERO)` | 公开 | 已验证 | 2026-05-22 | 已补 `ads.mediaType/videoUrl` 与 `AdPosition.HOME_VIDEO_HERO`；接口 200，当前无广告数据 |
| 视频专区 | 有 | 有 | `videos` + `users.canAccessVideos` | 公开 / USER / VIDEO / 兼容旧 VIP | 已验证 | 2026-05-22 | 已补 `videos` 表与索引；`GET /videos` 返回 200，当前无视频数据 |
| Tetegu 数据墙 | 有独立页 + 牛散/机构目录已嵌入 | 有 | `investors` + `holdings` + `stocks` + 双槽位激活源 | 公开预览 / 登录用户完整 | 已验证 | 2026-05-22 | 已验证前 50 牛散预览返回，核心持仓市值 join 已修复；历史 VIP 口径已降级为登录用户 |
| TradingKey 明星投资人持仓 | 有 | 有 | TradingKey 页面 + `holding-history-list` + `latest-trade-stock-list` | 公开展示 / Admin 同步 | 已验证 | 2026-06-04 | 已接入巴菲特与凯茜·伍德持仓页；每日 5:10 单次同步；新报告期全量抓持仓，同报告期只抓股票买卖并更新当前持仓；买卖流水落 `star_investor_trades`；当前持仓接口默认排除 `holdingQuantity=0` 记录；非零持仓 `286` 条，`latestPrice/latestMarketValue` 空值为 0；Buffett 非零持仓 `38` 条、Catherine Wood 非零持仓 `248` 条；0 持仓清仓记录保留在库中，由买卖流水展示 |
| 视频独立权限 | 有 | 有 | `users.canAccessVideos` + `videos.accessLevel` | JWT / 视频专属权限 / 兼容旧 VIP | 已实现 | 2026-05-09 | 已实现 `PUBLIC / USER / VIDEO / VIP` 四级访问，并支持后台开关；`VIP` 仅作为历史枚举兼容，等同登录可看 |
| 前端整体布局重构 | 有 | 无 | 现有页面 | 公开/登录用户 | 已验证 | 2026-05-10 | 已新增统一 `PageHeader / FilterBar`，重组侧栏，覆盖首页、牛散/机构目录、涨幅榜、股息率、牛散持仓、十大增持、高管增持；`pnpm --filter @king/web build` 通过 |

## 本轮重点已验证项

- `GET /api/v1/investors?page=1&page_size=10&sort=totalMarketValue&category=personal`
- `GET /api/v1/investors?page=1&page_size=10&sort=totalMarketValue&category=institution`
- `GET /api/v1/investors/24747`
- `GET /api/v1/investors/24747/top-flow-tracking`
- `GET /api/v1/natural-person-holders/hidden-in-gainers?period=1m&limit=3&stock_limit=40&category=institution`
- `GET /api/v1/natural-person-holders/hidden-in-limit-up?period=1m&limit=5&stock_limit=40&category=institution`
- `GET /api/v1/top-gainers?page=1&page_size=5`
- `GET /api/v1/top-gainers?page=1&page_size=5&period=1w`
- `GET /api/v1/holdings/increase?page=1&page_size=5`
- `GET /api/v1/holdings/decrease?page=1&page_size=5`
- `GET /api/v1/holdings/increase?page=1&page_size=2`
- `GET /api/v1/holdings/decrease?page=1&page_size=2`
- `GET /api/v1/holdings/new?page=1&page_size=5`
- `GET /api/v1/holdings/new?page=1&page_size=5&mode=stock`
- `GET /api/v1/stocks/top-increase?page=1&page_size=5`
- `GET /api/v1/executives/increase?page=1&page_size=5`
- `GET /api/v1/dividends/yield-ranking?page=1&page_size=5&mode=rolling1y`
- `GET /api/v1/dividends/yield-ranking?page=1&page_size=5&mode=avg3y`
- `GET /api/v1/dividends/stock/300750`
- `POST /api/v1/articles/upload`
- `POST /api/v1/admin/sync/star-investor-holdings`
- `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=5`
- `GET /api/v1/star-investors/catherine-wood/holdings?page=1&page_size=5`
- `GET /api/v1/star-investors/buffett/trades?page=1&page_size=5`
- `GET /api/v1/star-investors/catherine-wood/trades?page=1&page_size=5`

## 当前优先级建议

1. 交易时段补验行情与衍生定时同步
2. 后续接入更完整分红历史源，突破 `recent_dividend` 覆盖边界
3. 跟踪 TradingKey `total` 与可取明细不一致问题，后续发现补充端点后补全缺口
4. 触发一次真实业务同步，观察 Mairui 限流、耗时和双源切换日志
5. 按 `verification-checklist.md` 补核心页面端到端验收
