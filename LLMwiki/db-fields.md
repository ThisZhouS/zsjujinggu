# DB Fields

## `users`

- `id`：主键
- `phone`：手机号，唯一
- `password`：bcrypt hash
- `role`：`USER` / `ADMIN`
- `canUploadArticles`：是否允许该用户发布/上传文章
- `vipExpiresAt`：VIP 到期时间
- `avatar`
- `createdAt`
- `updatedAt`

## `investors`

- `id`
- `name`：牛散名称，唯一
- `avatar`
- `bio`
- `totalMarketValue`
- `stockCount`
- `isTracked`：是否纳入跟踪池
- `createdAt`
- `updatedAt`

## `holdings`

- `id`
- `investorId`
- `stockCode`
- `stockName`
- `holdCount`
- `holdRatio`
- `actualCost`
- `reportDate`
- `createdAt`
- `updatedAt`

关键约束：

- 唯一键：`(investorId, stockCode, reportDate)`

## `stocks`

- `id`
- `code`：股票代码，唯一
- `name`
- `industry`
- `market`
- `listingDate`
- `currentPrice`
- `totalMarketCap`
- `priceUpdatedAt`
- `createdAt`
- `updatedAt`

## `articles`

- `id`
- `title`
- `content`
- `summary`
- `coverImage`
- `author`
- `createdByUserId`：创建该文章的用户 ID，可空
- `category`
- `publishDate`
- `isPinned`
- `viewCount`
- `tags`
- `createdAt`
- `updatedAt`

关键语义：

- 普通授权用户创建文章时，`createdByUserId` 会被写入当前登录用户
- 管理员可编辑/删除任意文章
- 被授权用户仅可编辑/删除 `createdByUserId = 自己` 的文章

## `executive_trades`

- `id`
- `stockCode`
- `stockName`
- `executiveName`
- `executivePosition`
- `tradeType`
- `tradeCount`
- `tradePrice`
- `tradeAmount`
- `tradeDate`
- `reportDate`
- `createdAt`

## `dividends`

- `id`
- `stockCode`
- `stockName`
- `dividendYear`
- `dividendDate`
- `cashDividend`
- `bonusShare`
- `transferShare`
- `totalDividend`
- `dividendYield`
- `createdAt`
- `updatedAt`

关键约束：

- 唯一键：`(stockCode, dividendYear)`

## `star_investor_snapshots`

- `id`
- `investorType`：`BUFFETT` / `CATHERINE_WOOD`
- `investorName`
- `organizationName`
- `description`
- `logoUrl`
- `period`
- `reportDate`
- `holdingStockCount`
- `holdingValue`
- `tradeProportion`
- `topTenPercent`
- `topIncreaseCode`
- `topIncreaseName`
- `topDecreaseCode`
- `topDecreaseName`
- `sourceUrl`
- `scrapedAt`
- `rawPayload`

关键约束：

- 唯一键：`(investorType, period)`

## `star_investor_holdings`

- `id`
- `investorType`
- `investorName`
- `period`
- `stockCode`
- `stockName`
- `instrumentCode`
- `industry`
- `holdingType`：`INCREASE` / `DECREASE` / `KEEP` / `UNKNOWN`
- `tradePrice`
- `tradeQuantity`
- `previousHoldingQuantity`
- `holdingQuantity`
- `reportDate`
- `reportMarketValue`
- `changeRate`
- `proportion`
- `latestPrice`
- `latestMarketValue`
- `sourceUrl`
- `scrapedAt`

关键约束：

- 唯一键：`(investorType, period, stockCode, instrumentCode)`
- `instrumentCode` 非空，默认 `''`，同步时空源值统一写入空字符串

## `star_investor_trades`

- `id`
- `investorType`
- `investorName`
- `period`
- `sourceKey`：买卖流水幂等键
- `stockCode`
- `stockName`
- `instrumentCode`
- `industry`
- `holdingType`
- `tradePrice`
- `tradeQuantity`
- `holdingQuantity`
- `reportDate`
- `reportMarketValue`
- `changeRate`
- `proportion`
- `latestPrice`
- `sourceUrl`
- `scrapedAt`
- `lastSeenAt`

关键语义：

- `latest-trade-stock-list` 重复抓取时按 `sourceKey` upsert，只更新 `lastSeenAt` 和最新字段
- 同报告期日常同步会用买卖流水返回的当前持仓数量 upsert 更新 `star_investor_holdings`
- `instrumentCode` 非空，默认 `''`，用于保持与持仓表一致的证券标识口径

## `sync_logs`

- `id`
- `taskName`
- `status`
- `message`
- `startTime`
- `endTime`
- `recordCount`
- `createdAt`

## 原始表中最关键的字段

### `company_top_flow_holders`

- `stockCode`
- `gdmc`
- `gdlx`
- `cgsl`
- `cgbl`
- `cgpm`
- `jzrq`
- `ggrq`
- `bdyy`

### `executive_member`

- `dm`
- `name`
- `title`
- `sdate`
- `edate`

注意：

- `executive_member.dm` 通常是纯代码
- `company_top_flow_holders.stockCode` 通常带交易所后缀
