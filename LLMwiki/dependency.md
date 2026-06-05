# Dependency

## Monorepo 依赖

```text
apps/web
  -> packages/shared

apps/server
  -> packages/shared
  -> packages/prisma

packages/prisma
  -> PostgreSQL
```

## 前端运行依赖

- Next.js 14
- React 18
- Ant Design 5
- SWR
- axios

## 后端运行依赖

- NestJS 10
- Prisma
- PostgreSQL
- Redis
- Schedule
- multer

## 外部依赖

- Mairui 数据接口
- 本地 PostgreSQL 容器：`king-postgres`
- 本地 Redis 容器：`king-redis`

## 关键调用关系

### 页面层

```text
page.tsx -> hook -> apiClient -> /api/v1/*
```

### 后端层

```text
Controller -> Service -> Repository -> Prisma
Service -> Infrastructure -> External API
```

### 数据同步层

```text
Cron Task
  -> DataSyncService / BusinessDataSyncService
  -> External API / Raw Tables
  -> Business Tables
  -> API / Frontend
```

