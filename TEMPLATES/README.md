# 项目文件样板间

本目录包含项目中各类文件的"样板间"函数模板，遵循项目的架构规范和编码规则。

## 文件类型索引

### 后端层

| 文件类型 | 模板 | 说明 |
|---------|------|------|
| Controller | `controller.template.ts` | 路由处理、请求验证、响应格式化 |
| Service | `service.template.ts` | 业务逻辑、数据聚合、跨Repository调用 |
| Repository | `repository.template.ts` | 数据访问、CRUD操作、Prisma查询 |

### 公共组件

| 文件类型 | 模板 | 说明 |
|---------|------|------|
| Guard | `guard.template.ts` | 权限守卫、认证验证 |
| Decorator | `decorator.template.ts` | 自定义装饰器、元数据标记 |
| Interceptor | `interceptor.template.ts` | 请求/响应拦截、日志、缓存 |
| Filter | `filter.template.ts` | 异常处理、错误格式化 |

### 基础设施层

| 文件类型 | 模板 | 说明 |
|---------|------|------|
| Infrastructure Service | `infrastructure.service.template.ts` | 外部API、Redis、日志服务 |
| Scheduler Task | `scheduler.task.template.ts` | 定时任务、后台同步 |

### 前端层

| 文件类型 | 模板 | 说明 |
|---------|------|------|
| React Page | `react.page.template.tsx` | 页面组件、路由页面 |
| React Component | `react.component.template.tsx` | 可复用UI组件 |
| SWR Hook | `swr.hook.template.ts` | 数据获取、状态管理 |

### 类型定义

| 文件类型 | 模板 | 说明 |
|---------|------|------|
| Type Definition | `type.definition.template.ts` | TypeScript类型定义 |

## 关键规则说明

### 样板中体现的规则

- **R1**: Decimal/BigInt类型转换
- **R2**: 可空字段处理
- **R3**: Redis操作注意事项
- **R4**: 类型安全
- **R5**: 日期处理
- **R8**: JOIN查询
- **R9**: 批量查询避免N+1
- **R11**: 统一响应格式
- **R12**: VIP拦截处理
- **R13**: 外部API降级
- **R14**: 分页参数
- **R15**: 命名规范
- **R16**: 错误处理
- **R20**: 管理员权限
- **R21**: IDOR保护
- **R22**: 数据脱敏

## 使用建议

1. **Controller**: 复制 `controller.template.ts`，根据需要修改路由和方法
2. **Service/Repository**: 通常成对创建，遵循3层架构
3. **Guard**: 样板已包含常用的JWT、VIP、Admin守卫
4. **Component**: 前端组件建议拆分为Form、Card、Table等小组件
5. **Hook**: SWR hook应包含onError回调处理

## 架构图

```
Controller → Service → Repository → Database
                     → Infrastructure → External APIs
```

禁止的调用关系已通过注释在模板中标注。
