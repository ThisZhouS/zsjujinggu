# Pages

## 核心页面到接口

| 页面 | 主要 Hook / 请求 | 核心接口 |
|---|---|---|
| `/top-gainers` | `useTopGainers` | `GET /api/v1/top-gainers` |
| `/investor-increase` | `useHoldingsChange(type=increase)` | `GET /api/v1/holdings/increase` |
| `/investor-decrease` | `useHoldingsChange(type=decrease)` | `GET /api/v1/holdings/decrease` |
| `/investor-new` | `useHoldingsChange(type=new)` | `GET /api/v1/holdings/new` |
| `/top-increase` | `useTopIncrease` | `GET /api/v1/stocks/top-increase` |
| `/executive-increase` | `useExecutiveIncrease`, `useExecutiveNews` | `GET /api/v1/executives/increase`, `GET /api/v1/articles/executive/news` |
| `/dividend-yield` | `useDividendYield` | `GET /api/v1/dividends/yield-ranking` |
| `/stocks/[code]` | `useStockDetail`, `useStockKline`, `useStockPerformance`, `useStockLimitHistory`, `useStockRealtime`, `useStockTrackedHolders`, `useArticles(relatedStockCode)` | `GET /api/v1/stocks/:code`, `GET /api/v1/stocks/:code/kline`, `GET /api/v1/stocks/:code/performance`, `GET /api/v1/stocks/:code/limit-history`, `GET /api/v1/stocks/:code/realtime`, `GET /api/v1/stocks/:code/holders`, `GET /api/v1/articles?topicType=general&relatedStockCode=:code` |
| `/investors` | `useInvestors` | `GET /api/v1/investors` |
| `/investors/[id]` | `useInvestorDetail`, `useInvestorHoldingsHistory`, `useInvestorTopFlowTracking`, `useInvestorNews` | `GET /api/v1/investors/:id`, `GET /api/v1/investors/:id/holdings-history`, `GET /api/v1/investors/:id/top-flow-tracking`, `GET /api/v1/articles/investor/:investorId/news` |
| `/institutions` | `useInvestors(category=institution)` + `useHiddenShareholdersInGainers/LimitUp(category=institution)` | `GET /api/v1/investors?category=institution`, `GET /api/v1/natural-person-holders/hidden-in-gainers?category=institution`, `GET /api/v1/natural-person-holders/hidden-in-limit-up?category=institution` |
| `/institutions/[id]` | `useInvestorDetail`, `useInvestorHoldingsHistory` | `GET /api/v1/investors/:id`, `GET /api/v1/investors/:id/holdings-history` |
| `/articles` | `useArticles` | `GET /api/v1/articles` |
| `/articles/[id]` | `useArticleDetail` | `GET /api/v1/articles/:id` |
| `/admin/articles` | `useArticles` + create/update/upload | `POST/PUT/DELETE /api/v1/articles`, `POST /api/v1/articles/upload` |
| `/account/articles` | `useAccount` + `GET /api/v1/articles/mine` + create/update/delete/upload | `GET /api/v1/account/profile`, `GET /api/v1/articles/mine`, `POST/PUT/DELETE /api/v1/articles`, `POST /api/v1/articles/upload` |
| `/admin/users` | 用户列表 + 上传权限开关 | `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/:id/upload-permission` |
| `/admin/sync` | `SyncManagementPanel` | `GET /api/v1/admin/sync/logs`, `POST /api/v1/admin/sync/*` |
| `/admin/ads` | `useSWR` + ad CRUD + 视频广告上传 | `GET /api/v1/ads/admin/list`, `POST/PUT/DELETE /api/v1/ads`, `POST /api/v1/videos/upload` |
| `/videos` | `useVideos`, `useAccount` | `GET /api/v1/videos`, `GET /api/v1/account/profile` |
| `/videos/[id]` | `useVideoDetail`, `useAccount` | `GET /api/v1/videos/:id`, `GET /api/v1/account/profile` |
| `/admin/videos` | `useSWR` + video CRUD + upload | `GET /api/v1/videos/admin/list`, `POST/PUT/DELETE /api/v1/videos`, `POST /api/v1/videos/upload` |
| `/buffett-holdings` | `useStarInvestorHoldings`, `useStarInvestorTrades` | `GET /api/v1/star-investors/buffett/holdings`, `GET /api/v1/star-investors/buffett/trades` |
| `/arkk-holdings` | `useStarInvestorHoldings`, `useStarInvestorTrades` | `GET /api/v1/star-investors/catherine-wood/holdings`, `GET /api/v1/star-investors/catherine-wood/trades` |

## 已实现但待增强

- `/stocks/[code]`
  - 当前已实现：
    - 股票基础信息
    - 公司简介 / 地址 / 法人 / 官网
    - 历史涨幅摘要
    - K 线
    - 历史涨停 / 跌停记录
    - 关联牛散持仓
    - 股票新闻板块
    - 实时数据接口占位
  - 后续仍可继续增强：
    - 更多图表与可视化
    - 页面样式重构

## 已实现的新页面 / 区块

- 全局前端布局
  - `PageHeader / FilterBar` 已作为核心榜单和目录页的统一页面头与筛选容器
  - 左侧导航已按业务分组：股东洞察、市场榜单、VIP服务、内容中心、工作台
  - 首页、涨幅榜、股息率、牛散持仓分析、十大增持、高管增持、牛散列表、机构列表已完成统一结构改造
  - 2026-05-10 已执行 `pnpm --filter @king/web build` 并通过
- `/videos`
  - 视频列表页
  - 按当前用户权限自动裁剪公开视频、登录可看、视频专属和 VIP 内容
- `/videos/[id]`
  - 单视频播放详情
  - 对未满足权限的用户返回登录、视频专属或 VIP 引导
- `/admin/videos`
  - 视频内容管理
  - 支持上传视频文件、配置封面、权限、精选和上下架
- 首页视频广告位
  - 基于 `ads` 的 `HOME_VIDEO_HERO` 广告位
  - 支持图片/视频素材与循环播放
- `/buffett-holdings` / `/arkk-holdings`
  - TradingKey 明星投资人持仓页
  - 支持当前持仓与买卖记录双标签页
  - 支持按股票代码 / 名称 / 行业搜索和按买卖方向筛选
  - 买卖记录用于展示同报告期日常 `latest-trade-stock-list` 如何更新当前仓位

## 约定

- 所有 SWR hook 都应处理 `onError`
- 所有参数使用 camelCase
- 受保护数据页面默认依赖 JWT；历史 VIP 数据页已降级为登录用户可访问
- `investors` 与 `institutions` 共用同一套详情接口，通过 `category` 区分列表口径
- 视频板块已单独区分“公开浏览权限”和“视频专属权限”，不直接复用现有 VIP 数据页口径
- 首页已新增视频广告轮播与精选视频区块
- 登录用户可在以下位置进入文章投稿页：
  - 左侧导航 `文章投稿`
  - `/articles` 右上角按钮
  - 右上角账户菜单 `我的文章 / 文章投稿`
- 未被授权的登录用户进入 `/account/articles` 时，只显示权限提示，不允许发文
