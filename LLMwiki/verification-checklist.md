# Verification Checklist

面向“逐项验收”的执行清单。

更新时间：`2026-05-22`

## 验收前准备

- 前端：`http://localhost:3000`
- 后端：`http://localhost:4000`
- 管理员账号：`13800138000 / admin123`
- 先通过 `GET /api/v1/health` 确认后端可用

## 本轮已完成验收

- [x] `GET /api/v1/top-gainers?page=1&page_size=5`
- [x] `GET /api/v1/top-gainers?page=1&page_size=5&period=1w`
- [x] `GET /api/v1/holdings/increase?page=1&page_size=5`
- [x] `GET /api/v1/holdings/decrease?page=1&page_size=5`
- [x] `GET /api/v1/holdings/new?page=1&page_size=5`
- [x] `GET /api/v1/stocks/top-increase?page=1&page_size=5`
- [x] `GET /api/v1/executives/increase?page=1&page_size=5`
- [x] `GET /api/v1/investors/24747/top-flow-tracking`
- [x] `GET /api/v1/articles/investor/24747/news?page=1&page_size=3`
- [x] `GET /api/v1/articles/executive/news?page=1&page_size=3`
- [x] `POST /api/v1/auth/login`
- [x] `POST /api/v1/articles/upload`
- [x] `GET /uploads/articles/...` 经 `3000` / `4000` 可访问
- [x] `GET /api/v1/search?keyword=300750&limit=3`
- [x] `GET /api/v1/stocks/300750`
- [x] `GET /api/v1/dividends/yield-ranking?page=1&page_size=3&mode=rolling1y`
- [x] `GET /api/v1/dividends/yield-ranking?page=1&page_size=3&mode=annual&year=2025`
- [x] `GET /api/v1/dividends/metrics/coverage?dataSlot=ALL`
- [x] `POST /api/v1/dividends/backfill-metrics`
- [x] `POST /api/v1/dividends/backfill-metrics` 幂等复验：`PRIMARY/SECONDARY` 均 `48812` 条，现金分红各 `46879` 条，缺 `dividendYield=0`，缺 `totalDividend=0`
- [x] `GET /api/v1/dividends/stock/300750`
- [x] `GET /api/v1/holdings/common?page=1&page_size=2`
- [x] `GET /stocks/300750`
- [x] `GET /common-holdings`
- [x] `POST /api/v1/admin/sync/star-investor-holdings`
- [x] `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=1`
- [x] `GET /api/v1/star-investors/buffett/trades?page=1&page_size=1`
- [x] `GET /api/v1/star-investors/catherine-wood/holdings?page=1&page_size=1`
- [x] `GET /api/v1/star-investors/catherine-wood/trades?page=1&page_size=1`
- [x] `GET /api/v1/star-investors/buffett/holdings?page=-1&page_size=20` 应返回 400
- [x] `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=0` 应返回 400
- [x] `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=101` 应返回 400
- [x] `GET /buffett-holdings`
- [x] `GET /arkk-holdings`
- [x] `GET /data-wall`
- [x] `GET /api/v1/health`
- [x] `pnpm --filter @king/server build`
- [x] `pnpm --filter @king/web build`
- [x] `pnpm prisma validate`
- [x] 新增正式迁移 `20260525093000_add_business_slots_star_investors_video_paywall`
- [x] `pnpm prisma migrate deploy`
- [x] `pnpm prisma migrate status`
- [x] 后台同步任务名统一为 `star_investor_holdings`
- [x] 业务同步主流程已拆为 `获取数据 -> 同步业务数据 -> 切换数据源` 串行阶段

## 一级待验收

### 公开页面

- [x] 首页 `/`
  - 检查牛散列表、文章列表、市场概览是否出数
- [x] 个股详情 `/stocks/[code]`
  - 检查公司概览、K 线、关联牛散持仓
- [ ] 牛散列表 `/investors`
  - 检查分页、排序、搜索
- [ ] 牛散详情 `/investors/[id]`
  - 检查概览、持仓、饼图、历史、十大流通股东追踪、相关新闻
- [ ] 高管增持 `/executive-increase`
  - 检查榜单、筛选、高管相关新闻板块
- [x] 同姓牛散 `/same-surname-investors`
  - 检查分组、共享持仓
- [x] 股息率 `/dividend-yield`
  - 检查滚动近 1 年 / 按年度 / 近 3 年平均模式，现价与股息率字段
- [ ] 文章列表 `/articles`
  - 检查分类、分页、搜索
- [ ] 文章详情 `/articles/[id]`
  - 检查封面、正文、阅读量增长
- [ ] 文章投稿入口
  - 检查左侧导航、文章中心右上角、右上角账户菜单
  - 检查未登录不显示，已登录显示
- [x] 巴菲特持仓 `/buffett-holdings`
  - 检查当前持仓、买卖记录、筛选、TradingKey 来源链接
- [x] 木头姐持仓 `/arkk-holdings`
  - 检查当前持仓、买卖记录、筛选、TradingKey 来源链接

### 市场相关

- [ ] 涨停榜 `/limit-up`
- [ ] 跌停榜 `/limit-down`
- [ ] 涨跌停统计 `/limit-stats`

### VIP 页面

- [x] 共同持仓 `/common-holdings`
  - 检查默认结果与指定牛散组合
- [ ] 个人股东 `/individual-shareholders`
- [ ] 自然人大股东相关页面
  - 检查列表、隐藏在涨幅榜、隐藏在涨停榜

### 用户体系

- [x] 注册 `/register`
  - 已验证手机号、邮箱、短信验证码、邮箱验证码必填
  - 已验证错误验证码拒绝、真实验证码注册成功、重复手机号/邮箱拒绝
  - 已验证 `/login` 注册 Tab 与 `/register` 使用共享注册组件
- [x] 找回密码 `/forgot-password`
  - 已验证未注册手机号拒绝、错误验证码拒绝、真实验证码重置成功
  - 已验证旧密码失效、新密码可登录、验证码重置后删除
  - 已验证测试账号密码已恢复
- [x] 用户中心 `/account`
  - 已验证未登录 401、登录后读取 profile
  - 已验证非法头像 URL 拒绝、合法昵称/头像更新成功、空头像清空
  - 已验证前后端均限制昵称长度和头像 URL 格式
- [x] 用户投稿页 `/account/articles`
  - 未授权用户：应显示权限提示
  - 已授权用户：应能拉取自己的文章列表
  - 检查创建、编辑、删除、封面上传
  - 已验证未登录 401、未授权 403、管理员创建/置顶、普通用户不能操作管理员文章
  - 已验证授权用户创建、列表、编辑、删除本人文章，临时数据已清理
  - 已补后端 DTO 与前端表单字段长度/格式边界
- [x] 自选股 `/watchlist`
  - 已验证未登录 401、非法股票代码 400、添加成功、重复添加 409
  - 已验证列表现价和涨跌幅来自数据库链路
  - 已验证排序、非法排序 400、删除和测试数据清理
- [x] 价格提醒创建/停用/删除
  - 已验证未登录 401、非法股票代码/提醒类型/目标价 400
  - 已验证创建使用本地 `stocks`、列表仅返回本人提醒、越权删除 404
  - 已验证本人停用、删除和测试数据清理
- [ ] 通知 `/notifications`
- [ ] 用户侧 API Key `/account/api-keys`
- [ ] 用户侧订单 `/account/orders`

### 支付/订单边界

- [x] 支付页面 `/payment`
  - 前台明确展示“付费购买已停用”
- [x] 创建订单接口
  - `POST /api/v1/orders` 返回 `400`，提示数据服务已对登录用户开放
- [x] 创建支付接口
  - `POST /api/v1/payment/create` 返回 `400`，提示数据服务已对登录用户开放
- [x] 支付回调接口
  - `POST /api/v1/payment/callback` 返回 `400`，不再处理会员支付回调
- [x] 会员字段边界
  - 当前库 `users.vipExpiresAt` 活跃记录 `0`
  - 当前库 `users.vipExpiresAt` 非空记录 `0`

### 管理后台

- [ ] 管理后台首页 `/admin`
- [ ] 用户管理 `/admin/users`
  - 检查 `canUploadArticles` 开关是否可切换
- [ ] 订单管理 `/admin/orders`
- [ ] API Key 管理 `/admin/api-keys`
- [ ] 广告管理 `/admin/ads`
- [ ] 牛散管理 `/admin/investors`
- [ ] 同步管理 `/admin/sync`

## 二级待验收

### 仅接口

- [ ] `POST /api/v1/articles/automation/openclaw/news`
  - 配置 `NEWS_AUTOMATION_KEY` 后再验
- [ ] `POST /api/v1/articles/automation/harness/news`
  - 配置 `NEWS_AUTOMATION_KEY` 后再验
- [ ] `GET /api/v1/articles/mine`
- [ ] `POST /api/v1/articles`
- [ ] `PUT /api/v1/articles/:id`
- [ ] `DELETE /api/v1/articles/:id`
- [ ] `PUT /api/v1/admin/users/:id/upload-permission`
- [ ] `GET /api/v1/executives/members`
- [ ] `GET /api/v1/executives/stock/:code`
- [ ] `GET /api/v1/stocks/market/overview`
- [x] `GET /api/v1/search`

### 同步能力

- [ ] 手动触发 `POST /api/v1/admin/sync/business-data`
- [x] 手动触发 `POST /api/v1/admin/sync/star-investor-holdings`
- [ ] 查看 `GET /api/v1/admin/sync/logs`
- [ ] 检查 `sync_logs` 是否记录成功/失败/耗时

## 每项验收建议记录

- 页面/接口名
- 验收日期
- 是否通过
- 失败现象
- 复现步骤
- 关联日志/SQL/截图

## 建议顺序

1. 公开页面
2. VIP 页面
3. 用户中心
4. 支付
5. 管理后台
6. 同步任务
