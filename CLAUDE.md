# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

King 财经数据平台 is a financial data platform for tracking Chinese stock market investors (牛散), holdings, market data, and investment insights.

**Architecture**: Monorepo with frontend (Next.js 14) and backend (NestJS 10) separation, 3-layer backend architecture (Controller → Service → Repository), shared Prisma schema.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js (App Router) | 14.x |
| UI Library | Ant Design | 5.x |
| Charts | ECharts | 5.x |
| Data Fetching | SWR | 2.x |
| Backend | NestJS | 10.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15+ |
| Cache | Redis | 7.x |
| Package Manager | pnpm | 8.x |
| Deployment | Docker Compose | — |

## Project Structure

```
king/
├── packages/
│   ├── shared/          # Shared types, constants, utilities
│   └── prisma/          # Prisma schema (shared by frontend/backend)
├── apps/
│   ├── web/             # Next.js frontend (pure rendering, no API Routes)
│   └── server/          # NestJS backend (API server on :4000)
├── TEMPLATES/           # Code templates for rapid development
└── datafetch/           # Python data fetching scripts
```

## Key Development Commands

```bash
# Install dependencies
pnpm install

# Start development (both frontend and backend)
pnpm dev

# Start frontend only
cd apps/web && pnpm dev  # :3000

# Start backend only
cd apps/server && pnpm dev  # :4000

# Run database migrations
cd packages/prisma && pnpm prisma migrate dev

# Generate Prisma client
cd packages/prisma && pnpm prisma generate

# Production build
pnpm build

# Run single test file
cd apps/server && pnpm test -- --testPathPattern=xxx.spec.ts
```

## Backend Architecture (Critical)

**Strict 3-layer hierarchy** — MUST follow dependency rules:

```
Controller → Service → Repository → Database
                     → Infrastructure → External APIs

FORBIDDEN:
❌ Controller directly calling Repository
❌ Controller directly calling Infrastructure
❌ Service directly using Prisma Client (must use Repository)
❌ Repository calling Service
❌ Cross-layer calls
```

| Layer | Responsibility | Rules |
|-------|----------------|-------|
| **Controller** | Routes, validation, calls Service, formats response | No DB operations, no business logic |
| **Service** | Business logic, calculations, cross-Repository aggregation | Can call multiple Repositories and Infrastructure |
| **Repository** | Single table/simple relation data access | Only CRUD, no business calculations |
| **Infrastructure** | External APIs, wrapper, cache, logging, scheduled tasks | No Service dependency, called by Service |

## Critical Coding Rules (MUST FOLLOW)

### Data Type Safety
- **R1**: Prisma `Decimal` and `BigInt` fields MUST be converted with `Number()` before math operations. Direct operations on Prisma returns cause errors. All Decimal/BigInt must be converted to `number` before JSON serialization.
- **R2**: Nullable fields (`?`) MUST be guarded with `?? defaultValue` or `if (value != null)` before use.
- **R3**: `redis.mget()` returns Array, use Map/array indexing, NOT string keys.
- **R4**: `.filter(Boolean)` does NOT narrow types. Use type guards: `.filter((x): x is NonNullable<typeof x> => Boolean(x))`.

### Date/Time Rules
- **R5**: `Date.getMonth()` is 0-indexed (0=January, 11=December). Compare with actual values, not `+ 1`.
- **R6**: Use `YYYY-MM-DD` format for report periods (Prisma `DateTime @db.Date`). API responses use ISO 8601 format.
- **R7**: All dates stored/compared in UTC, convert to local timezone for display.

### Database Queries
- **R8**: JOIN fields NOT in query results unless explicitly `include`d. Manual JOIN required otherwise.
- **R9**: Use batch queries + Map to avoid N+1. No queries inside loops.
- **R10**: Prisma `upsert` `where` must be `@@unique` or `@@id` field.

### API Design
- **R11**: Unified response format: `{ code: number, message: string, data: T }`. Use `formatResponse()` utility.
- **R12**: VIP interception returns HTTP 200 + `{ code: 403, message: '该功能需要 VIP 会员', data: {...} }`, NOT HTTP 403.
- **R13**: External API failures (mairuiapi/DeepSeek) return cached data or empty array, NOT 500. Use `ExternalApiError`.
- **R14**: Pagination params: `page` (1-based) and `page_size` (default 20, max 100).

### Frontend Rules
- **R15**: All field names in camelCase (no snake_case like `publish_date`).
- **R16**: All SWR hooks must configure `onError` callback for user-friendly error messages.
- **R17**: Frontend env vars must start with `NEXT_PUBLIC_`.

### Security
- **R18**: `bcrypt.hash(password, 10)` requires saltRounds parameter (recommended 10).
- **R19**: API Key stored as bcrypt hash only. Validate by hashing input before comparison.
- **R20**: All `/admin/*` routes require BOTH `JwtAuthGuard` + `AdminGuard`.
- **R21**: IDOR protection: verify `resource.userId === currentUser.id` in Service layer for user resources (favorites, watchlist, alerts, API keys, orders).
- **R22**: Phone numbers must be masked as `138****1234` in responses. API Key returns first 8 chars only. Never include passwords/payment info in responses.
- **R23**: All `/admin/*` write operations must write audit logs (adminId, action, targetType, targetId, ip, timestamp).

## API Endpoints Summary

Base path: `/api/v1`

### Public (No Auth)
- `GET /investors` - Investor list
- `GET /investors/:id` - Investor detail (free: overview, VIP: full holdings)
- `GET /top-gainers` - Top gainers (free: top 20, VIP: all periods)
- `GET /articles` - Article list
- `GET /articles/:id` - Article detail
- `GET /search` - Global search
- `GET /ads` - Get ads
- `POST /ads/:id/click` - Record ad click
- `GET /market/overview` - Market overview (3 indices)
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `POST /auth/sms-code` - Send SMS code

### User (JWT Required)
- `GET|PUT /account/profile` - User profile
- `GET /account/favorites` - My favorites (investors)
- `POST /account/favorites/:investorId` - Add favorite
- `DELETE /account/favorites/:investorId` - Remove favorite
- `GET /watchlist` - Watchlist
- `POST|DELETE /watchlist` - Add/remove watchlist item
- `GET /price-alerts` - Price alerts
- `POST|DELETE /price-alerts` - Create/delete price alert
- `GET /notifications` - Notifications
- `PUT /notifications/read-all` - Mark all read
- `GET /account/api-keys` - API keys
- `POST|DELETE /account/api-keys` - Create/delete API key
- `GET /orders` - Orders
- `POST /payment/create` - Create payment order
- `GET /payment/status/:orderNo` - Payment status

### VIP (JWT + VIP Required)
- `GET /holdings/increase` - Investor increase
- `GET /holdings/decrease` - Investor decrease
- `GET /holdings/new` - New holdings
- `GET /holdings/common` - Common holdings
- `GET /top-increase` - Top increase
- `GET /dividend-yield` - Dividend yield
- `GET /executive-increase` - Executive increase
- `GET /individual-shareholders` - Individual shareholders
- `POST /export/:type` - Data export
- `GET /natural-person-holders` - Natural person shareholder list
- `GET /natural-person-holders/:name/holdings` - Shareholder holdings history
- `GET /natural-person-holders/:name/dividends` - Shareholder dividend records

### Admin (JWT + Admin Required)
- `POST|PUT|DELETE /admin/investors` - CRUD investors
- `POST|PUT|DELETE /admin/articles` - CRUD articles
- `POST /admin/sync/:task` - Manual sync trigger
- `GET /admin/sync/logs` - Sync logs
- `GET /admin/users` - User list
- `GET /admin/orders` - Orders
- `PUT /admin/orders/:id/refund` - Refund order
- `GET|POST /admin/ads` - List/create ads
- `GET|PUT /admin/api-keys` - List/update API keys

## Scheduled Tasks

| Task | Cron | Implementation |
|------|------|----------------|
| Stock list sync | `30 16 * * 1-5` | StockSyncTask.syncStockList() |
| Realtime quotes | `*/5 9-15 * * 1-5` | StockSyncTask.syncRealtimeQuotes() |
| Limit up data | `*/10 9-15 * * 1-5` | StockSyncTask.syncLimitUp() |
| K-line sync | `30 17 * * 1-5` | KlineSyncTask.syncTodayKline() |
| Historical gainers | `30 17 * * 1-5` | KlineSyncTask.recalcAllPeriodGainers() |
| Price alerts | `* 9-15 * * 1-5` | PriceAlertService.checkPriceAlerts() |
| Order expiry | `*/5 * * * *` | OrderService.expirePendingOrders() |

## Environment Variables

**Frontend** (`apps/web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend** (`apps/server/.env`):
```
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"
MAIRUI_API_KEY="..."
DEEPSEEK_API_KEY="..."
PORT=4000
```

## External API Dependencies

- **mairuiapi**: Stock market data source (quotes, holdings, etc.)
  - Endpoints: `/hsstock/financial/flowholder/{code}/{licence}`, `/hsstock/history/{code}/d/n/{licence}`, `/hscp/jnfh/{code}/{licence}`
  - Fallback on failure: return cached data or empty array
  - Timeout: 3 seconds max

- **DeepSeek**: AI for stock business description
  - Fallback on failure: return empty string
  - Retry logic with exponential backoff

## Data Model Highlights (20+ Prisma Models)

Key models include: `Stock`, `Investor`, `Holding`, `Article`, `Dividend`, `Executive`, `TopGainer`, `User`, `Order`, `ApiKey`, `SyncLog`, `Ad`, `CompanyTopFlowHolders`, `HsStockHistoryTrading`, `RecentDividend`.

See `packages/prisma/prisma/schema.prisma` for complete schema.

## Error Handling

All exceptions handled by `HttpExceptionFilter` (`apps/server/src/common/filters/http-exception.filter.ts`):

- `ExternalApiError`: Returns 200 + fallback data
- `HttpException`: Returns `{ code, message, data: null }` with HTTP status
- Unknown errors: Returns 500 with generic message

## Testing

- Backend tests use Jest with NestJS testing utilities
- Run tests: `pnpm test`
- Run single test: `pnpm test -- --testPathPattern=xxx.spec.ts`

## Code Templates (TEMPLATES/)

The project includes code templates (样板间) for rapid development and consistency:

**Backend**: `controller.template.ts`, `service.template.ts`, `repository.template.ts`, `guard.template.ts`, `decorator.template.ts`, `interceptor.template.ts`, `filter.template.ts`

**Infrastructure**: `infrastructure.service.template.ts`, `scheduler.task.template.ts`

**Frontend**: `react.page.template.tsx`, `react.component.template.tsx`, `swr.hook.template.ts`

**Types**: `type.definition.template.ts`

All templates follow the 23 coding rules and 3-layer architecture constraints. When creating new files, start from the appropriate template.

## Development Utilities

**src/constants.js**: Unified terminology constants for end-to-end consistency. Import from here rather than hardcoding values.

**src/env-check.js**: Environment self-check module. Auto-runs at application startup in both frontend (layout.tsx) and backend (main.ts).

**RULES.md**: Comprehensive development rules document covering architecture, coding standards, API design, database operations, security, and business logic.

## Data Sync Scripts

Located in `apps/server/scripts/`:
- `sync-natural-person-from-api.ts` - Sync natural person shareholders from Mairui API
- `sync-trading-dividend-fixed.ts` - Sync historical trading and dividend data
- `sync-all-data-from-api.ts` - Full data sync from Mairui API
