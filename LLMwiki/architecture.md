# Architecture

## 总体结构

- Monorepo
- 前端：`apps/web`，Next.js 14
- 后端：`apps/server`，NestJS 10
- 公共类型：`packages/shared`
- Prisma Schema：`packages/prisma`

## 后端分层

```text
Controller -> Service -> Repository -> Database
                     -> Infrastructure -> External APIs
```

## 关键约束

- Controller 不直接查库
- Service 不直接使用 Prisma Client
- Repository 只做数据访问
- 所有 `Decimal` / `BigInt` 必须转 `number`
- 响应统一使用 `{ code, message, data }`

## 运行端口

- 前端：`3000`
- 后端：`4000`
- PostgreSQL：`5432`
- Redis：`6379`

