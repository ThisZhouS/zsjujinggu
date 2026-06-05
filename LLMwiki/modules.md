# Modules

## 核心业务模块

- `investor`：牛散列表、详情、筛选、十大流通股东连续追踪
- `holding`：牛散增持、减持、新进、共同持仓
- `stock`：股票列表、市场概览、个股详情、K 线、十大增持
- `executive`：高管增持、历届高管成员、相关新闻板块
- `dividend`：股息率、分红
- `article`：文章列表、详情、后台管理、用户投稿、封面上传、牛散/高管相关新闻、自动化新闻上传预留接口
- `ad`：首页广告、后台广告管理，已扩展 `HOME_VIDEO_HERO` 首页视频广告位与图片/视频素材
- `video`：视频列表、详情播放、后台管理、视频上传、独立权限分层
- `paywall`：Tetegu 数据墙接口，提供前 50/100 牛散、前 100 机构排名、权限配置与真实业务预览数据
- `star-investor`：TradingKey 明星投资人持仓，抓取巴菲特/凯茜·伍德最新持仓；新报告期全量同步，同报告期每日只同步股票买卖流水并更新当前持仓
- `web-layout`：前端统一布局、侧栏业务分组、页面头、筛选工具条、榜单字段顺序与基础视觉样式
- `auth`：登录、注册、短信验证码
- `payment`：支付
- `watchlist` / `price-alert`：用户自选与提醒

## 本轮重点待改模块

- `dividend`
  - 当前业务表仅由 `recent_dividend` 物化，覆盖面不足
  - 需补全分红历史、现价回填与空白字段处理
- `executive`
  - 当前榜单仍基于 `executive_trades` 聚合
  - 已存在“真实报告期对比”查询雏形，需正式切换
- `stock`
  - 当前个股页仅有基础信息 + K 线 + 关联牛散
  - 需补历史涨幅、历史涨跌停、新闻板块、实时接口、更多可视化
- `video`
  - 已完成列表、播放、后台管理和四级访问控制
  - 后续仍需继续补前端视觉重构与实际视频内容灌库
- `paywall`
  - 已接入真实业务排名接口和牛散/机构目录页嵌入展示
  - 后续可继续补独立数据墙页、更严格 VIP 掩码和机构别名归并
- `web-layout`
  - 已完成首页、侧栏、牛散/机构目录与核心榜单页统一改造
  - 后续仍可继续扩展到管理后台和所有账户页的统一视觉
- `star-investor`
  - 已接入 TradingKey 页面解析 + 官方前端同源 API 分页抓取
  - 已完成每日 5:10 单次同步和后台手动同步
  - 已新增 `star_investor_trades` 存储买卖流水，`latest-trade-stock-list` 同报告期增量更新当前持仓
  - 前端已完成 `/buffett-holdings`、`/arkk-holdings` 当前持仓 / 买卖记录双标签展示
  - 2026-05-22 已复验：Buffett 持仓 `67` / 买卖 `46`，Catherine Wood 持仓 `328` / 买卖 `291`
  - 当前风险：TradingKey 摘要数量略大于实际分页可取列表，已按实际返回明细落库并在文档记录缺口

## 重点页面

- `apps/web/src/app/top-gainers/page.tsx`
- `apps/web/src/app/investor-increase/page.tsx`
- `apps/web/src/app/investor-decrease/page.tsx`
- `apps/web/src/app/investor-new/page.tsx`
- `apps/web/src/app/investors/[id]/page.tsx`
- `apps/web/src/app/stocks/[code]/page.tsx`
- `apps/web/src/app/executive-increase/page.tsx`
- `apps/web/src/app/dividend-yield/page.tsx`
- `apps/web/src/app/top-increase/page.tsx`
- `apps/web/src/app/admin/ads/page.tsx`
- `apps/web/src/app/videos/page.tsx`
- `apps/web/src/app/videos/[id]/page.tsx`
- `apps/web/src/app/admin/videos/page.tsx`
- `apps/web/src/app/admin/articles/page.tsx`
- `apps/web/src/app/account/articles/page.tsx`
- `apps/web/src/app/buffett-holdings/page.tsx`
- `apps/web/src/app/arkk-holdings/page.tsx`
