# Troubleshooting

## 涨幅榜页面为空

常见原因：

- 前端通过 `3000` 访问时，Next 代理未生效
- 今日行情查询扫描范围过大，接口超时
- 股票代码后缀与基础表不一致

优先检查：

- `GET /api/v1/top-gainers`
- `GET /api/v1/top-gainers?period=1w`
- `GET /api/v1/health`
- `GET /api/v1/top-gainers` 是否在 `3000` 代理下也能返回

## 牛散增持全变成新进，减持为空

常见原因：

- 当前持仓与上一期持仓的 `stockCode` 匹配口径不一致
- 直接取最大 `reportDate` 落到低覆盖日期

已确认修复方向：

- 使用代表性报告期，不取绝对最大日期
- 上一期对比时保留真实 `stockCode`，不要误归一化到另一种格式

## 牛散十大流通股东连续追踪返回大量日级日期

常见原因：

- 直接把原始 `company_top_flow_holders.jzrq` 全部当成“每期”
- 没有复用业务 `holdings` 的代表性报告期口径

当前处理：

- 连续追踪时间轴优先使用 `holdings` 的代表性报告期
- 仅在代表性报告期不可用时才回退原始 `jzrq`

检查点：

- `GET /api/v1/investors/:id/top-flow-tracking`
- 返回是否以 `2026-03-31 / 2025-12-31 / 2025-09-30` 这类报告期为主

## 高管增持为空

常见原因：

- `executive_member.dm` 是纯代码
- `company_top_flow_holders.stockCode` 带交易所后缀
- 直接等值 join 会命中 0 条

处理方式：

- 比较前统一归一化股票代码

## 机构榜里混入自然人，或自然人被归到机构

常见原因：

- `company_top_flow_holders.gdlx` 本身存在空值或脏值
- 同步时把空 `gdlx` 直接当成机构
- 名称粗过滤规则未覆盖短机构别名

当前处理：

- 同步时使用三段式分类：
  - `自然人` 优先判个人
  - 非空且非 `自然人` 判机构
  - 空 `gdlx` 再回退到名称粗过滤
- 已补充短机构别名兜底
- 已执行过一次基于现有原始表的本地业务重建

检查点：

- `GET /api/v1/investors?category=personal&keyword=...`
- `GET /api/v1/investors?category=institution&keyword=...`
- `GET /api/v1/investors/:id`
- 原始表中该名称的 `gdlx` 是否为空

已知修复样本：

- `邵树伟`：已从机构纠正回个人
- `淡马锡`：不会再出现在个人榜

## 文章上传成功但前端显示不了

常见原因：

- 后端未挂载 `/uploads`
- 前端 `next.config.js` 未代理 `/uploads`
- 文件实际已保存，但 URL 仍指向后端直连地址

检查点：

- `http://localhost:4000/uploads/...`
- `http://localhost:3000/uploads/...`

## 看不到文章投稿入口

常见原因：

- 当前未登录
- 前端仍跑的是旧 build / 旧进程
- 浏览器缓存了旧页面资源

当前设计：

- 未登录用户不显示投稿入口
- 已登录用户会看到入口
- 未被授权用户进入 `/account/articles` 后只会看到权限提示页

检查点：

- `GET /api/v1/account/profile`
- 返回里是否包含 `role` 与 `canUploadArticles`
- `http://localhost:3000/articles`
- `http://localhost:3000/account/articles`

## 能看到文章投稿入口，但无法发布

常见原因：

- 当前用户 `canUploadArticles=false`
- 当前用户不是管理员，尝试设置 `isPinned`
- 修改/删除的文章不属于当前用户

检查点：

- `GET /api/v1/account/profile`
- `GET /api/v1/articles/mine`
- 管理后台是否已执行 `PUT /api/v1/admin/users/:id/upload-permission`

## 自动化新闻上传返回 403

常见原因：

- 实际运行环境未配置 `NEWS_AUTOMATION_KEY`
- 请求头 `x-news-ingest-key` 缺失或不匹配

检查点：

- `POST /api/v1/articles/automation/:provider/news`
- `POST /api/v1/articles/automation/openclaw/news`
- `POST /api/v1/articles/automation/harness/news`
- 后端环境变量里是否存在 `NEWS_AUTOMATION_KEY`

当前已知现状：

- 路由已实现
- 本地已验证：未配置 `NEWS_AUTOMATION_KEY` 时会返回 `403`

## 启动时报 `Cannot find module 'multer'`

原因：

- 上传接口已接入，但后端依赖未安装

处理：

- 安装 `multer`
- 重新 build 后端

## React vendor-chunks 缺失

现象：

- Next 启动后页面报 `Cannot find module './vendor-chunks/...js'`

处理：

- 重新 build 前端
- 必要时清理 `.next` / `.next-dev`
- 再次 `pnpm start`

## Redis 降级警告

现象：

- 后端日志出现 Redis 不可用，自动降级数据库查询

影响：

- 功能通常还能跑
- 但部分列表与统计会更慢

## 建议排障顺序

1. 先确认 `4000` 后端健康
2. 再确认接口直连是否返回
3. 再确认 `3000` 代理访问是否返回
4. 最后再看页面渲染和前端状态
