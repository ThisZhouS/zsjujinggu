# APIs

## Public

- `GET /api/v1/top-gainers`
- `GET /api/v1/stocks/:code`
- `GET /api/v1/stocks/:code/quote`
- `GET /api/v1/stocks/:code/kline`
- `GET /api/v1/stocks/:code/performance`
- `GET /api/v1/stocks/:code/limit-history`
- `GET /api/v1/stocks/:code/realtime`
- `GET /api/v1/stocks/:code/holders`
- `GET /api/v1/dividends/stock/:code`
- `GET /api/v1/investors/:id/top-flow-tracking`
- `GET /api/v1/articles`
- `GET /api/v1/articles/:id`
- `GET /api/v1/articles/investor/:investorId/news`
- `GET /api/v1/articles/executive/news`
- `GET /api/v1/stocks/market/overview`
- `GET /api/v1/ads`
- `GET /api/v1/ads/:position`
- `GET /api/v1/videos`
- `GET /api/v1/videos/:id`
- `GET /api/v1/paywall/features`
- `GET /api/v1/paywall/features/:featureKey`
- `GET /api/v1/paywall/features/:featureKey/preview`
- `GET /api/v1/star-investors/:investor/summary`
- `GET /api/v1/star-investors/:investor/holdings`
- `GET /api/v1/star-investors/:investor/trades`

## 登录用户数据接口

- `GET /api/v1/holdings/increase`
- `GET /api/v1/holdings/decrease`
- `GET /api/v1/holdings/new`
- `GET /api/v1/stocks/top-increase`
- `GET /api/v1/executives/increase`

说明：

- 历史代码中仍保留 `VipGuard` 命名
- 当前实际口径为登录用户可访问，不再校验付费会员到期时间

## JWT

- `GET /api/v1/account/profile`
- `GET /api/v1/articles/mine`

## JWT + 指定投稿用户 / Admin

- `POST /api/v1/articles`
- `PUT /api/v1/articles/:id`
- `DELETE /api/v1/articles/:id`
- `POST /api/v1/articles/upload`

## Key Protected Automation

- `POST /api/v1/articles/automation/:provider/news`
- `POST /api/v1/articles/automation/openclaw/news`
- `POST /api/v1/articles/automation/harness/news`

补充说明：

- `POST /api/v1/articles`
  - 管理员可发布任意文章
  - 被授权用户可发布文章，文章归属写入 `createdByUserId`
- `PUT /api/v1/articles/:id`
  - 管理员可修改任意文章
  - 被授权用户仅可修改自己创建的文章
- `DELETE /api/v1/articles/:id`
  - 管理员可删除任意文章
  - 被授权用户仅可删除自己创建的文章
- `POST /api/v1/articles/automation/:provider/news`
- `POST /api/v1/articles/automation/openclaw/news`
- `POST /api/v1/articles/automation/harness/news`
  - 三个路由都需要请求头：`x-news-ingest-key`
  - 三个路由都依赖环境变量：`NEWS_AUTOMATION_KEY`
  - 统一写入 `articles`
  - 兼容 `openclaw` / `open_claw` / `harness`
  - 兼容单条对象、批量数组，以及 `items/list/articles/news/data/result` 包装格式
  - 兼容 `headline`、`description`、`body`、`stock_code`、`executive_name`、`external_id` 等常见别名字段
  - 当前用于自动化新闻上传链路，不依赖后台登录

## Admin

- `PUT /api/v1/admin/users/:id/upload-permission`
- `PUT /api/v1/admin/users/:id/video-permission`
- `GET /api/v1/videos/admin/list`
- `POST /api/v1/videos/upload`
- `POST /api/v1/videos`
- `PUT /api/v1/videos/:id`
- `DELETE /api/v1/videos/:id`
- `POST /api/v1/admin/sync/star-investor-holdings`

## 计划预留接口（未实现）

- 暂无。Tetegu 数据墙接口已接入真实业务排名数据，后续只保留更严格 VIP 掩码与独立数据墙页扩展。

说明：

- 个股新闻当前复用文章查询接口，不单独提供 `GET /api/v1/stocks/:code/news`：
  - `GET /api/v1/articles?topicType=general&relatedStockCode=:code`
- `GET /api/v1/dividends/stock/:code`
  - 公开接口
  - 支持纯代码与带后缀代码候选匹配
  - 返回股票历史分红记录
  - `totalDividend` 原始为空时使用 `cashDividend * totalMarketCap / currentPrice` 估算
  - 返回 `currentPrice` 用于展示和核验估算口径
- `POST /api/v1/dividends/backfill-metrics`
  - 管理员接口
  - 参数：`dataSlot=PRIMARY | SECONDARY | ALL`
  - 用最新价格和总股本补齐 `dividendYield / totalDividend`
  - `ALL` 会同时处理双槽位并返回每个槽位的覆盖统计
- `GET /api/v1/dividends/metrics/coverage`
  - 管理员接口
  - 参数：`dataSlot=PRIMARY | SECONDARY | ALL`
  - 查询双槽位股息率数据完整性
  - `totalDividend = 0` 视为未补齐
  - 返回缺 `dividendYield`、缺 `totalDividend` 和 `isComplete`
- `GET /api/v1/paywall/features`
  - 使用可选 JWT
  - 返回 Tetegu 数据墙功能列表
  - 当前包含前 50 牛散、前 100 牛散、前 100 机构持仓数据墙
- `GET /api/v1/paywall/features/:featureKey`
  - 使用可选 JWT
  - 返回单个功能权限配置和当前用户 `canAccess`
- `GET /api/v1/paywall/features/:featureKey/preview`
  - 使用可选 JWT
  - 返回真实业务排名数据，来源为当前双槽位激活源的 `investors`、`holdings`、`stocks`
  - 支持 `top-personal-investors-50`、`top-personal-investors-100`、`top-institution-holders-100`
  - 支持 `single-stock-personal-investors-100`、`single-stock-institution-holders-100`
  - 排名按 `investors.totalMarketValue` 降序，核心持仓先按投资人 + 股票取最新报告期，再取市值前三，避免同一股票多报告期重复
  - 单支持股数据墙额外限定 `investors.stockCount = 1`
  - 机构类数据墙会按大小写、空格、全角/半角括号做轻量别名归并，避免同一机构重复排名
  - VIP/Admin 可见完整条数，未登录/非 VIP 只返回预览条数，并对第 4 条后主体名称、指标和核心持仓做字段级掩码
- `GET /api/v1/videos`
  - 使用可选 JWT
  - 会根据当前用户权限仅返回可访问的视频列表
- `GET /api/v1/videos/:id`
  - 使用可选 JWT
  - 对未满足权限的用户返回 `code=403` 业务态，并区分 `user / video / vip`
- `POST /api/v1/videos/upload`
  - 仅 Admin
  - 上传到本地 `/uploads/videos`
  - 也被首页视频广告后台复用
- `POST /api/v1/videos`
  - 仅 Admin
  - 支持 `accessLevel=PUBLIC|USER|VIDEO|VIP`
- `PUT /api/v1/admin/users/:id/video-permission`
  - 仅 Admin
  - 控制 `users.canAccessVideos`
- `POST /api/v1/ads` / `PUT /api/v1/ads/:id`
  - 已支持 `mediaType`
  - 视频广告使用 `position=HOME_VIDEO_HERO`
  - 视频素材写入 `videoUrl`
- `GET /api/v1/star-investors/:investor/holdings`
  - `:investor` 支持 `buffett`、`warren-buffett`、`catherine-wood`、`arkk`、`cathie-wood`
  - 支持 `page`、`page_size`、`holdingType=ALL|INCREASE|DECREASE|KEEP|UNKNOWN`、`keyword`
  - 当前持仓来源为 `star_investor_holdings`
  - 新报告期由 TradingKey 明星投资人页和 `quotes-base/star-investors/investor/holding-history-list` 全量重建
  - 同报告期每日只抓取 `quotes-base/star-investors/investor/latest-trade-stock-list`，按股票买卖记录增量更新当前持仓
  - `tradeQuantity` 为本期买卖数量，`previousHoldingQuantity = holdingQuantity - tradeQuantity`
  - TradingKey `OPEN` 归一为 `INCREASE`，`CLOSE` 归一为 `DECREASE`
- `GET /api/v1/star-investors/:investor/trades`
  - `:investor` 支持同上
  - 支持 `page`、`page_size`、`holdingType=ALL|INCREASE|DECREASE|KEEP|UNKNOWN`、`keyword`
  - 返回最新报告期股票买卖流水，来源为 `star_investor_trades`
  - 使用 `sourceKey` 去重，重复抓取只更新 `lastSeenAt`
  - 2026-05-22 实测：Buffett `46` 条，Catherine Wood `291` 条
- `POST /api/v1/admin/sync/star-investor-holdings`
  - 仅 Admin
  - 手动触发巴菲特与凯茜·伍德同步
  - 如果 TradingKey 最新报告期与本地不同，先全量抓取持仓并写入 `star_investor_snapshots`、`star_investor_holdings`、`star_investor_trades`
  - 如果仍处于同一报告期，只抓取股票买卖流水，写入 `star_investor_trades` 并 upsert 更新 `star_investor_holdings`
  - 2026-05-22 同报告期日常模式实测返回记录数 `337`
  - 2026-05-22 当前实际可取持仓明细为 Buffett `67` 条、Catherine Wood `328` 条；快照摘要显示 `68/329`，公开分页接口仍不返回缺口明细
