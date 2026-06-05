# Ops

## 启动

- 前端：`pnpm --filter @king/web start`
- 后端：
  - `pnpm --filter @king/server build`
  - `bash -lc "set -a; . apps/server/.env; set +a; node apps/server/dist/src/main.js"`

## 环境变量

- 自动化新闻上传依赖：`NEWS_AUTOMATION_KEY`
- 未配置时：
  - `POST /api/v1/articles/automation/:provider/news`
  - `POST /api/v1/articles/automation/openclaw/news`
  - `POST /api/v1/articles/automation/harness/news`
  - 会返回 `403`

## 自动化新闻上传示例

- 请求头固定使用：
  - `x-news-ingest-key: REPLACE_WITH_REAL_KEY`
- 注意：
  - 这里直接替换为真实密钥值，不要写成 `x-news-ingest-key=...`
  - `:provider` 支持 `openclaw`、`open_claw`、`harness`
  - 支持单条、批量和包装对象

### OpenClaw 单条示例

示例文件：

- [news-ingest-openclaw.json](/usr/src/20260417/LLMwiki/examples/news-ingest-openclaw.json)

请求：

```bash
curl -X POST "http://localhost:4000/api/v1/articles/automation/openclaw/news" \
  -H "Content-Type: application/json" \
  -H "x-news-ingest-key: REPLACE_WITH_REAL_KEY" \
  --data @/usr/src/20260417/LLMwiki/examples/news-ingest-openclaw.json
```

### Harness 批量示例

示例文件：

- [news-ingest-harness-batch.json](/usr/src/20260417/LLMwiki/examples/news-ingest-harness-batch.json)

请求：

```bash
curl -X POST "http://localhost:4000/api/v1/articles/automation/harness/news" \
  -H "Content-Type: application/json" \
  -H "x-news-ingest-key: REPLACE_WITH_REAL_KEY" \
  --data @/usr/src/20260417/LLMwiki/examples/news-ingest-harness-batch.json
```

### 通用 Provider 路由示例

示例文件：

- [news-ingest-generic-provider.json](/usr/src/20260417/LLMwiki/examples/news-ingest-generic-provider.json)

请求：

```bash
curl -X POST "http://localhost:4000/api/v1/articles/automation/open_claw/news" \
  -H "Content-Type: application/json" \
  -H "x-news-ingest-key: REPLACE_WITH_REAL_KEY" \
  --data @/usr/src/20260417/LLMwiki/examples/news-ingest-generic-provider.json
```

### 字段映射速查

- `headline` / `title` -> 标题
- `description` / `summary` / `excerpt` -> 摘要
- `body` / `content` / `text` / `markdown` -> 正文
- `investor_id` / `relatedInvestorId` -> 牛散 ID
- `stock_code` / `relatedStockCode` / `symbol` -> 股票代码
- `executive_name` / `relatedExecutiveName` -> 高管姓名
- `source_url` / `sourceUrl` / `url` / `link` -> 原始来源链接
- `source_metadata` / `sourceMetadata` / `metadata` / `meta` -> 来源附加信息
- `external_id` / `externalId` / `news_id` / `id` / `uuid` -> 幂等外部 ID

## 验证

- 健康检查：`GET /api/v1/health`
- 涨幅榜：`GET /api/v1/top-gainers`
- 牛散增减持：`GET /api/v1/holdings/increase|decrease|new`
- 高管增持：`GET /api/v1/executives/increase`
- 牛散连续追踪：`GET /api/v1/investors/:id/top-flow-tracking`
- 牛散新闻：`GET /api/v1/articles/investor/:investorId/news`
- 高管新闻：`GET /api/v1/articles/executive/news`

## 已确认账号

- 管理员：`13800138000 / test123456`
