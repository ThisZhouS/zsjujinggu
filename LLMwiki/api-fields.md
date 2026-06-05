# API Fields

## 通用响应格式

所有接口统一返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页列表通常为：

```json
{
  "list": [],
  "meta": {
    "total": 0,
    "page": 1,
    "page_size": 20,
    "total_pages": 0
  }
}
```

## 核心查询参数

### `GET /api/v1/top-gainers`

- `page`
- `page_size`
- `period`
  - 支持：`1w` `2w` `3w` `1m` `2m` `3m` `4m` `6m` `12m`
- `keyword`

返回字段：

- `code`
- `name`
- `currentPrice`
- `changePercent`
- `change`
- `startPrice`
- `industry`
- `volume`
- `turnover`
- `amount`
- `marketCap`

### `GET /api/v1/holdings/increase|decrease|new`

- `page`
- `page_size`
- `keyword`
  - 支持股票名、股票代码、牛散名
- `reportDate`
  - 格式：`YYYY-MM-DD`

返回字段：

- `id`
- `investorId`
- `investorName`
- `investorAvatar`
- `stockCode`
- `stockName`
- `currentPrice`
- `averageChangePrice`
- `averageChangePriceDate`
- `currentShares`
- `previousShares`
- `totalMarketValue`
- `changeShares`
- `changePercent`
- `changeMarketValue`
- `reportDate`

口径：

- `averageChangePrice`
  - 当前为估算均价
  - 来源：报告期附近最近交易日的历史收盘价，若收盘价缺失则回退开盘价
- `averageChangePriceDate`
  - 上述估算均价实际使用的交易日

### `GET /api/v1/stocks/top-increase`

- `page`
- `page_size`
- `keyword`
- `reportDate`

返回字段：

- `id`
- `stockCode`
- `stockName`
- `shareholderName`
- `currentPrice`
- `currentShares`
- `previousShares`
- `increaseShares`
- `increaseRate`
- `currentHoldRatio`
- `increaseMarketValue`
- `holderRank`
- `changeReason`
- `announcementDate`
- `reportDate`

额外分页字段：

- `meta.report_date`

### `GET /api/v1/executives/increase`

- `page`
- `page_size`
- `keyword`
  - 支持股票代码、股票名、高管名
- `reportDate`

返回字段：

- `stockCode`
- `stockName`
- `totalAmount`
- `tradeCount`
- `executives`
- `industry`
- `currentPrice`
- `totalMarketCap`
- `latestTradeDate`

额外分页字段：

- `meta.report_date`

### `GET /api/v1/dividends/stock/:code`

- `code`
  - 支持纯代码和带交易所后缀代码
  - 示例：`300750`、`300750.SZ`

返回字段：

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
- `currentPrice`
- `dataSlot`
- `createdAt`
- `updatedAt`

口径：

- `totalDividend`
  - 优先使用 `dividends.totalDividend`
  - 缺失时按 `cashDividend * totalMarketCap / currentPrice` 估算
- `currentPrice`
  - 来源：`stocks.currentPrice`

### `GET /api/v1/articles`

- `page`
- `page_size`
- `category`
  - `buffett` `arkk` `general`
- `keyword`
- `topicType`
  - `general` `investor` `executive`
- `relatedInvestorId`
- `relatedStockCode`
- `relatedExecutiveName`

返回字段：

- `id`
- `title`
- `summary`
- `coverImage`
- `author`
- `category`
- `topicType`
- `relatedInvestorId`
- `relatedStockCode`
- `relatedExecutiveName`
- `automationProvider`
- `automationExternalId`
- `sourceUrl`
- `sourceMetadata`
- `publishDate`
- `isPinned`
- `viewCount`
- `tags`

### `GET /api/v1/investors/:id/top-flow-tracking`

- `stockCode`
  - 可选
  - 按单只股票过滤连续追踪结果

返回字段：

- `stockCode`
- `stockName`
- `firstEntryReportDate`
- `reportDate`
- `isInTopFlowHolders`
- `holderRank`
- `announcementDate`
- `holdAmount`
- `holdRatio`
- `currentPrice`
- `marketValue`
- `changeReason`
- `shareholderType`

口径：

- `reportDate` 默认只返回代表性报告期
- `isInTopFlowHolders=false` 时，`holdAmount=0` 表示“该期未在前十”，不是全市场真实持股为 0

### `GET /api/v1/articles/investor/:investorId/news`

- `page`
- `page_size`
- `keyword`

返回字段：

- 与 `GET /api/v1/articles` 一致
- 固定过滤：
  - `topicType=investor`
  - `relatedInvestorId=:investorId`

### `GET /api/v1/articles/executive/news`

- `page`
- `page_size`
- `keyword`
- `relatedStockCode`
- `relatedExecutiveName`

返回字段：

- 与 `GET /api/v1/articles` 一致
- 固定过滤：
  - `topicType=executive`

### `GET /api/v1/articles/mine`

- 认证：`JWT`
- 参数与 `GET /api/v1/articles` 一致
- 仅返回当前登录用户创建的文章

返回字段：

- `list`
- `meta`
- `list[*].id`
- `list[*].title`
- `list[*].summary`
- `list[*].coverImage`
- `list[*].author`
- `list[*].category`
- `list[*].publishDate`
- `list[*].isPinned`
- `list[*].viewCount`
- `list[*].tags`

### `POST /api/v1/articles`

- 认证：`JWT + (Admin 或 canUploadArticles=true)`

请求字段：

- `title`
- `content`
- `summary`
- `coverImage`
- `author`
- `category`
- `topicType`
- `relatedInvestorId`
- `relatedStockCode`
- `relatedExecutiveName`
- `sourceUrl`
- `sourceMetadata`
- `publishDate`
- `isPinned`
- `tags`

口径：

- 非管理员提交时，`isPinned` 会被忽略并固定为 `false`
- `author` 为空时，后端会按 `nickname -> username -> 脱敏手机号` 自动补默认署名
- 文章归属写入 `createdByUserId`

### `PUT /api/v1/articles/:id`

- 认证：`JWT`
- 管理员可修改任意文章
- 被授权用户仅可修改自己创建的文章

可更新字段：

- `title`
- `content`
- `summary`
- `coverImage`
- `author`
- `category`
- `topicType`
- `relatedInvestorId`
- `relatedStockCode`
- `relatedExecutiveName`
- `sourceUrl`
- `sourceMetadata`
- `publishDate`
- `isPinned`
- `tags`

口径：

- 非管理员更新时，`isPinned` 会被忽略

### `DELETE /api/v1/articles/:id`

- 认证：`JWT`
- 管理员可删除任意文章
- 被授权用户仅可删除自己创建的文章

### `POST /api/v1/articles/upload`

- 认证：`JWT + (Admin 或 canUploadArticles=true)`
- `multipart/form-data`
- 文件字段名：`file`

返回字段：

- `url`
- `filename`

### `POST /api/v1/articles/automation/:provider/news`

### `POST /api/v1/articles/automation/openclaw/news`

### `POST /api/v1/articles/automation/harness/news`

- 鉴权头：`x-news-ingest-key`
- 依赖环境变量：`NEWS_AUTOMATION_KEY`
- `:provider` 支持：
  - `openclaw`
  - `open_claw`
  - `harness`

请求字段：

- `externalId`
- `title`
- `content`
- `summary`
- `coverImage`
- `author`
- `category`
- `topicType`
- `relatedInvestorId`
- `relatedStockCode`
- `relatedExecutiveName`
- `sourceUrl`
- `sourceMetadata`
- `publishDate`
- `tags`

兼容输入形态：

- 单条对象
- 数组批量
- `items`
- `list`
- `articles`
- `news`
- `data`
- `result`

兼容别名字段：

- `headline -> title`
- `description` / `excerpt` / `desc` -> `summary`
- `body` / `text` / `markdown` -> `content`
- `cover_image` / `image_url` -> `coverImage`
- `topic_type` / `topic` -> `topicType`
- `investor_id` -> `relatedInvestorId`
- `stock_code` / `symbol` -> `relatedStockCode`
- `executive_name` -> `relatedExecutiveName`
- `source_url` / `url` / `link` -> `sourceUrl`
- `source_metadata` / `metadata` / `meta` -> `sourceMetadata`
- `external_id` / `news_id` / `id` / `uuid` -> `externalId`

幂等规则：

- 同一 `provider + externalId` 走更新，不重复插入
- 若未显式提供 `externalId`，后端会按标题/摘要/来源链接/发布日期/关联目标生成稳定哈希

返回：

- 单条上传时返回单篇文章对象
- 批量上传时返回 `list + meta(total/created/updated)`

### `PUT /api/v1/admin/users/:id/upload-permission`

- 认证：`JWT + Admin`

请求字段：

- `canUploadArticles`

返回字段：

- `id`
- `canUploadArticles`
