# Backend

## Controller 索引

- `auth`
- `account`
- `investors`
- `holdings`
- `stocks`
- `top-gainers`
- `executives`
- `dividends`
- `articles`
- `watchlist`
- `price-alerts`
- `notifications`
- `orders`
- `payment`
- `admin`
- `data-sync`
- `search`
- `ad`
- `export`
- `individual-shareholders`
- `natural-person-holders`
- `star-investors`

## 高价值入口

- `apps/server/src/main.ts`
- `apps/server/src/domain/data-sync/service/business-data-sync.service.ts`
- `apps/server/src/domain/holding/holding.repository.ts`
- `apps/server/src/domain/top-gainer/top-gainer.repository.ts`
- `apps/server/src/domain/executive/executive.repository.ts`
- `apps/server/src/domain/article/article.controller.ts`
- `apps/server/src/domain/star-investor/star-investor.controller.ts`
- `apps/server/src/domain/star-investor/star-investor.service.ts`

## TradingKey 明星投资人

- Controller：`apps/server/src/domain/star-investor/star-investor.controller.ts`
- Service：`apps/server/src/domain/star-investor/star-investor.service.ts`
- Module：`apps/server/src/domain/star-investor/star-investor.module.ts`
- 调度入口：`apps/server/src/infrastructure/scheduler/data-sync.task.ts`
- 支持对象：
  - `buffett` / `warren-buffett`
  - `catherine-wood` / `arkk` / `cathie-wood`
- 公开接口：
  - `GET /api/v1/star-investors/:investor/summary`
  - `GET /api/v1/star-investors/:investor/holdings`
  - `GET /api/v1/star-investors/:investor/trades`
- 管理接口：
  - `POST /api/v1/admin/sync/star-investor-holdings`
