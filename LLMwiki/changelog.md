# Changelog

按日期记录关键口径调整、实现补齐和已知变更。

## 2026-06-05

### 付费/VIP 边界收口

- 后端会员支付链路明确停用：
  - `POST /api/v1/orders` 返回 `400`：数据服务已对登录用户开放，无需创建会员订单
  - `POST /api/v1/payment/create` 返回 `400`：数据服务已对登录用户开放，无需创建会员订单
  - `POST /api/v1/payment/callback` 返回 `400`：付费购买已停用，不再处理会员支付回调
- 后端订单支付状态更新不再写入 `users.vipExpiresAt`，也不再创建会员权益日志
- 当前数据库验证：
  - `users.vipExpiresAt` 活跃记录 `0`
  - `users.vipExpiresAt` 非空记录 `0`
- 权限口径：
  - 原 VIP 数据服务继续按登录用户访问
  - 视频专属权限仍由 `users.canAccessVideos` 独立控制
- 已验证：
  - 普通用户 `13906030002` 可访问 `GET /api/v1/dividends/yield-ranking?page=1&page_size=1&mode=rolling1y`
  - `pnpm --filter @king/server build` 通过
  - 后端已重启，`GET /api/v1/health` 返回 `ok`

### 通知模块用户边界复验

- 后端通知仓储确认：
  - 列表按 `userId` 查询
  - 单条已读使用 `id + userId`
  - 删除使用 `id + userId`
  - 越权访问统一返回 `404 通知不存在`
- 前端 `/notifications`：
  - 已支持刷新、全部已读、单条已读、单条删除
  - 列表分页读取后端 `meta.total`
- 接口验证：
  - 未登录访问 `GET /api/v1/notifications` 返回 `401`
  - 用户 `13906059999` 只能看到自己的临时通知
  - 用户 `13906059999` 标记/删除用户 `13906030002` 的通知返回 `404`
  - 用户 `13906059999` 标记自己的通知已读返回 `200`
  - 用户 `13906059999` 删除自己的通知返回 `200`
  - 用户 `13906030002` 只能看到自己的临时通知
  - 临时通知数据已清理，残留 `0`

### 股息率补齐功能完善

- 后端新增 `GET /api/v1/dividends/metrics/coverage`：
  - 管理员接口
  - 支持 `dataSlot=PRIMARY | SECONDARY | ALL`
  - 返回 `totalRecords / cashDividendRecords / recordsWithPrice / yieldReadyRecords / totalDividendReadyRecords`
  - 返回 `missingYieldRecords / missingTotalDividendRecords / isComplete`
- 完整性口径修正：
  - `totalDividend = 0` 统一视为未补齐
  - 管理员补齐接口、覆盖率接口、业务同步切源校验保持同一口径
- 管理端 `/admin/sync` 新增“股息率数据覆盖率”卡片：
  - 展示双槽位 `PRIMARY / SECONDARY` 覆盖情况
  - 手动执行“业务数据同步”或“股息率数据补齐”后自动刷新覆盖率
- 后端 `POST /api/v1/dividends/backfill-metrics` 增强：
  - 支持 `dataSlot=ALL` 批量补齐双槽位
  - 当目标槽位缺少分红业务数据时，会从另一槽位按唯一键补齐缺失记录
  - 使用 `(stockCode, dividendYear, dataSlot)` 冲突跳过，接口可重复执行，不会重复插入
- 当前库验证：
  - `dividends.PRIMARY`：`48812` 条，覆盖 `5097` 只股票，年份 `1991-2026`
  - `dividends.SECONDARY`：`48812` 条，覆盖 `5097` 只股票，年份 `1991-2026`
  - 双槽位 `cashDividend > 0` 现金分红记录各 `46879` 条
  - 双槽位缺 `dividendYield` 记录均为 `0`
  - 双槽位缺 `totalDividend` 记录均为 `0`
  - 首次执行 `POST /api/v1/dividends/backfill-metrics` 将 `PRIMARY` 镜像补齐 `48812` 条
  - 重复执行 `POST /api/v1/dividends/backfill-metrics` 返回 `mirroredRecords=0`，确认不会重复插入
  - 普通用户访问 `GET /api/v1/dividends/yield-ranking?page=1&page_size=3&mode=rolling1y` 返回 `currentPrice / totalDividend / dividendYield`
  - `GET /api/v1/dividends/stock/300750` 返回 `PRIMARY` 槽位分红历史，包含 `currentPrice / totalDividend / dividendYield`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过
  - 后端已重启，`GET /api/v1/health` 返回 `ok`

## 2026-06-04

### 登录用户权限边界复验

- 后端 `VipGuard` 复核：
  - 历史命名保留为 `VipGuard`
  - 实际只校验登录用户是否存在
  - 未登录返回 `code=403`、`requiredPlan=user`
- 前端付费入口复核：
  - `/pricing` 明确展示“数据服务已开放给登录用户”
  - `/payment` 明确展示“付费购买已停用”
- 接口验证：
  - 未登录访问 `GET /api/v1/dividends/yield-ranking` 返回 `requiredPlan=user`
  - 未登录访问 `GET /api/v1/holdings/increase` 返回 `requiredPlan=user`
  - 未登录访问 `GET /api/v1/executives/increase` 返回 `requiredPlan=user`
  - 普通用户 `13906030002` 可访问股息率排行、牛散增持、高管增持和数据墙

### TradingKey 明星投资人最新价补齐

- 修复巴菲特 / 木头姐持仓 `latestPrice/latestMarketValue` 空白：
  - `latestPrice` 优先使用 TradingKey `latestPrice`
  - 缺失时回退 TradingKey `tradePrice`
  - 再缺失时按 `reportMarketValue / holdingQuantity` 回推
  - `latestMarketValue` 按 `latestPrice * holdingQuantity` 计算
- 查询口径调整：
  - `GET /api/v1/star-investors/:investor/holdings` 默认排除 `holdingQuantity = 0` 的清仓/零持仓记录
  - 0 持仓记录仍保留在库中，买卖变化由 `star_investor_trades` 展示
- 当前库验证：
  - 回填 `star_investor_holdings` 价格/市值字段 `375` 条
  - 非零持仓 `286` 条，`latestPrice/latestMarketValue` 空值均为 `0`
  - Buffett 非零持仓 `38` 条，空最新价 `0`
  - Catherine Wood 非零持仓 `248` 条，空最新价 `0`
  - `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=3` 返回 `latestPrice/latestMarketValue`
  - `GET /api/v1/star-investors/arkk/holdings?page=1&page_size=3` 返回 `latestPrice/latestMarketValue`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - 后端已重启，`GET /api/v1/health` 返回 `ok`

### 高管成员与高管增持真实数据修复

- 修复 `executive_member` 表结构：
  - 新增自增主键 `id`
  - 唯一键从 `(dm, sdate, edate)` 改为 `(dm, name, sdate, edate)`
  - 避免同一任期内多个高管被错误去重，导致真实成员数据丢失
- 后端业务同步补齐：
  - `BusinessDataSyncService` 新增候选股票高管成员补齐
  - 基于高管增持使用的代表性流通股东报告期，从 `company_top_flow_holders` 找候选股票
  - 只同步 `executive_member` 缺失的候选股票，避免每日重复拉取
  - `POST /api/v1/data-sync/sync` 新增 `module=executive_member_candidates`，支持 `params.limit` 做可控批量补齐
- 当前库验证：
  - `POST /api/v1/data-sync/sync` 同步 `executive_member` 单股 `000001` 返回 64，实际入库 `000001` 为 60 条，不再只有 32 条
  - 分批执行 `executive_member_candidates`：`limit=10 / 200 / 1000 / 1000 / 3000`
  - `executive_member` 当前 `89331` 条，覆盖 `4375` 只股票
  - 代表报告期 `20260331` 候选股票 `4396` 只，已覆盖 `4374` 只
  - 剩余 `22` 只候选重试后新增 `0` 条，判定为 Mairui 当前无高管成员返回或接口失败，需要保留为数据源风险
  - 代表报告期下 `company_top_flow_holders` 与 `executive_member` 真实姓名匹配 `865` 条，覆盖 `302` 只股票
  - `GET /api/v1/executives/increase?page=1&page_size=5` 返回真实高管增持数据，当前总数 `302`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm db:push` 已加载环境变量后执行，Prisma Client 已重新生成
  - 后端已重启，`GET /api/v1/health` 返回 `ok`

### 股息率数据补齐入口

- 后端 `POST /api/v1/dividends/backfill-metrics` 支持 `dataSlot=ALL`：
  - 同时补齐 `PRIMARY / SECONDARY` 双槽位
  - 价格优先使用最新日线收盘价，回退 `stocks.currentPrice`
  - 总分红优先使用 `company_capitals.zgb`，回退 `totalMarketCap / currentPrice`
- 2026-06-04 继续加固：
  - 个股分红历史接口 `GET /api/v1/dividends/stock/:code` 缺少原始总分红额时，优先使用 `company_capitals.zgb` 估算
  - 补齐 SQL 将 `totalDividend=0` 视为未补齐，避免历史脏数据导致现金分红总额空白
  - 补齐统计和同步切源校验改为只统计 `cashDividend > 0` 的现金分红记录，送股/转增但无现金分红的记录不参与股息率完整性判断
- 管理端 `/admin/sync` 新增“股息率数据补齐”按钮：
  - 调用 `POST /api/v1/dividends/backfill-metrics`，参数 `{ dataSlot: 'ALL' }`
  - 返回 `updatedRecords / totalRecords / yieldReadyRecords / totalDividendReadyRecords`
- 业务同步新增切换前完整性校验：
  - `syncDividendsFromRaw()` 物化到 inactive slot 后统计 `cashDividend / dividendYield / totalDividend` 覆盖率
  - 若存在现金分红记录但 `dividendYield` 或 `totalDividend` 未补齐，阻断 `activeSlot` 切换
  - 防止每日同步把半成品分红槽位切给前端，导致股息率页面空白
- 当前库验证：
  - `dividends.SECONDARY`：`48809` 条，覆盖 `5097` 只股票，年份 `1991-2026`
  - `cashDividend / dividendYield / totalDividend` 空值均为 `0`
  - `cashDividend > 0` 现金分红记录中 `dividendYield/totalDividend` 缺失或为 0 的记录为 `0`
  - `POST /api/v1/dividends/backfill-metrics` 返回 200，本次复验更新 `0` 条，说明当前字段已完整
  - `GET /api/v1/dividends/yield-ranking?mode=rolling1y&page=1&page_size=3` 返回 200，字段包含 `currentPrice / dividendPerShare / totalDividend / dividendYield`
  - `GET /api/v1/dividends/yield-ranking?mode=avg3y&page=1&page_size=3` 返回 200，字段包含 `currentPrice / dividendPerShare / totalDividend / dividendYield`
  - `GET /api/v1/dividends/stock/600340.SH` 返回 200，历史分红字段完整
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过

### 生产级目标审计推进

- 静态扫描：
  - 模拟/示例写入脚本均为禁用态，未发现仍会写入主库的 mock/seed 业务数据脚本
  - 未发现前端空 `onClick`、`href="#"`、空函数点击入口
  - 原 VIP 数据接口仍使用历史命名 `VipGuard`，但守卫实际按登录用户校验
- 修复个人订单页历史付费入口：
  - `/account/orders` 中 `PENDING` 订单不再显示“继续支付”
  - 改为禁用态“支付已停用”，避免用户点击进入已停用支付流程
- 接口验证：
  - 未登录访问 `GET /api/v1/dividends/yield-ranking?page=1&page_size=1&mode=rolling1y` 返回 `code=403, requiredPlan=user`
  - 普通登录用户访问同一接口返回 200 和真实榜单数据
  - 未登录访问 `GET /api/v1/holdings/increase?page=1&page_size=1` 返回 `code=403, requiredPlan=user`
  - 普通登录用户访问同一接口返回 200 和真实增持数据
- 已验证：
  - `pnpm --filter @king/web build` 通过

### 注册与验证码边界加固

- 后端注册/登录 DTO 加强格式校验：
  - 手机号必须匹配 `^1\d{10}$`
  - 注册短信验证码、邮箱验证码、重置密码短信验证码必须为 6 位数字
- 验证码生成改为 `node:crypto.randomInt`：
  - 不再使用 `Math.random()`
  - 生成固定 6 位数字字符串
- 163 SMTP 约束复核：
  - `.env.example` 和 `apps/server/.env.example` 已提供 `smtp.163.com`、`SMTP_USER/SMTP_FROM` 的 163 邮箱模板
  - 生产环境未配置 SMTP 会拒绝发送邮箱验证码
  - 生产环境 SMTP host/user/from 非 163.com 会拒绝发送邮箱验证码
- 前端注册入口去重：
  - 新增共享组件 `apps/web/src/components/auth/RegisterForm.tsx`
  - `/register` 独立页与 `/login` 注册 Tab 统一复用同一套手机号、邮箱、短信验证码、邮箱验证码、注册提交逻辑
  - 避免两个入口后续出现验证码格式、字段、接口调用不一致
- 前端找回密码入口加固：
  - `/forgot-password` 发送验证码前改为复用表单手机号校验
  - 重置密码短信验证码新增 6 位数字格式校验，与后端 DTO 保持一致
- 接口验证：
  - `POST /api/v1/auth/login` 使用无效手机号返回 `400`
  - `POST /api/v1/auth/sms-code` 使用无效手机号返回 `400`
  - `POST /api/v1/auth/register` 使用无效手机号和非 6 位验证码返回 `400`
  - 开发环境发送短信验证码和邮箱验证码均返回 `200`，验证码写入 Redis
  - 使用错误短信验证码注册返回 `400`
  - 使用真实 Redis 验证码注册测试用户 `13906059999 / codex-reg-20260605@example.com` 返回 `200`
  - 注册后 `users.emailVerifiedAt` 已写入
  - 重复手机号注册返回 `409 该手机号已注册`
  - 重复邮箱注册返回 `409 该邮箱已注册`
  - 新注册用户可登录，并可访问登录用户数据接口 `GET /api/v1/dividends/yield-ranking`
  - 找回密码未注册手机号返回 `404`
  - 找回密码错误验证码返回 `400 验证码错误`
  - 找回密码真实验证码重置成功，旧密码失效，新密码可登录，验证码重置后删除
  - 测试账号 `13906059999` 已恢复为原测试密码 `King@2026`
  - `GET /api/v1/health` 返回 `ok`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过

### 用户中心资料边界加固

- 后端账户资料更新新增 DTO：
  - `nickname` 最多 50 位
  - `avatar` 必须是带协议的 URL，最多 500 位
  - 空字符串会规范化为 `null`，支持用户清空昵称/头像
  - 全局 `ValidationPipe` 白名单会拒绝未声明字段
- 前端 `/account` 表单同步限制：
  - 昵称最多 50 位
  - 头像 URL 做 URL 格式与 500 位长度校验
- 接口验证：
  - 未登录访问 `GET /api/v1/account/profile` 返回 `401`
  - 非法头像 URL 更新返回 `400 头像 URL 格式不正确`
  - 合法昵称和头像 URL 更新返回 `200`
  - 再次读取 `GET /api/v1/account/profile` 与更新结果一致
  - 空头像提交后返回 `avatar: null`
  - 测试用户资料已恢复为 `nickname=Codex测试用户, avatar=null`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过

### 用户文章投稿边界加固

- 后端文章 DTO 增加字段边界：
  - `title` 必填、非空、最多 200 字
  - `content` 必填、非空、最多 20000 字
  - `summary` 最多 500 字
  - `author` 最多 50 字
  - `coverImage` 仅允许 `http(s)` URL 或 `/uploads/articles/` 路径，最多 500 位
  - `sourceUrl` 必须是带协议 URL，最多 500 位
  - `relatedStockCode` 最多 10 位
  - `relatedExecutiveName` 最多 100 字
  - `sourceMetadata` 最多 5000 字
  - `tags` 最多 20 个，单个最多 30 字
  - 自动化新闻 `externalId` 必填、非空、最多 191 位
- 前端 `/account/articles` 表单同步限制：
  - 标题、摘要、正文、署名、来源链接、封面图、股票代码、高管名、标签均增加长度/格式校验
  - 封面图 URL 与后端一致，仅允许外链 `http(s)` 或上传后的 `/uploads/articles/` 路径
- 权限和 CRUD 验证：
  - 未登录 `POST /api/v1/articles` 返回 `401`
  - 未授权普通用户 `POST /api/v1/articles` 返回 `403 未获得文章上传权限`
  - 管理员创建文章成功，`isPinned=true` 生效
  - 普通用户不能编辑或删除管理员文章，分别返回 `403 无权编辑该文章`、`403 无权删除该文章`
  - 管理员临时授权用户 `canUploadArticles=true` 后，普通用户可创建文章
  - 普通用户提交 `isPinned=true` 时服务层强制返回 `isPinned=false`
  - 授权用户 `GET /api/v1/articles/mine` 只返回本人文章
  - 授权用户可编辑和删除本人文章
  - 非法 `sourceUrl=bad-url` 返回 `400 来源链接格式不正确`
  - 临时文章 `权限边界临时测试-20260605-*` 已清理，数据库残留为 `0`
  - 测试用户 `13906059999` 的 `canUploadArticles` 已恢复为 `false`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过

### 自选股数据来源与边界加固

- 后端自选股改为全数据库链路：
  - 列表不再在请求时调用 Mairui 实时行情
  - 现价来自 `stocks.currentPrice`
  - 涨跌幅优先来自 `kline_daily.changePct`
  - 缺失时回退 `hs_stock_history_trading` 最新 `c / pc` 计算
  - 添加股票只查本地 `stocks` 表，不再请求 Mairui 股票列表
- 后端新增自选股 DTO：
  - `GET /watchlist` 分页限制为 `page >= 1`、`page_size <= 100`
  - `POST /watchlist` 股票代码必须为 `6` 位数字，可带 `.SH/.SZ/.BJ`
  - `POST /watchlist/reorder` 最多 100 个股票代码，逐项校验代码格式
  - 服务层统一规范化股票代码，裸代码自动转为 canonical A 股代码
- 接口验证：
  - 未登录 `GET /api/v1/watchlist` 返回 `401`
  - 非法股票代码添加返回 `400 股票代码格式不正确`
  - 添加 `300750` 返回 `300750.SZ / 宁德时代`
  - 重复添加 `300750.SZ` 返回 `409 该股票已在自选股中`
  - 列表返回本地库 `currentPrice` 和数据库计算的 `changePercent`
  - 添加 `600519` 后可按 `600519.SH, 300750.SZ` 排序
  - 非法排序参数返回 `400 股票代码格式不正确`
  - 删除本轮添加的自选股后列表为空
  - 数据库 `watchlists` 中测试用户 `13906059999` 残留为 `0`
- 已验证：
  - `pnpm --filter @king/server build` 通过

### 价格提醒边界与本地股票来源加固

- 后端价格提醒创建改为本地数据库链路：
  - 创建提醒不再请求 Mairui 股票列表
  - 股票名称和 canonical 股票代码来自 `stocks`
  - 后台定时触发检查仍保留行情接口调用，仅用于定时任务，不在用户请求链路中执行
- 后端新增价格提醒 DTO：
  - `stockCode` 必须为 6 位数字，可带 `.SH/.SZ/.BJ`
  - `alertType` 仅允许 `ABOVE / BELOW`
  - `targetPrice` 必须大于 0，最多 2 位小数，最大 `999999.99`
- 前端 `PriceAlertModal` 同步修复：
  - 目标价最小值从 `0` 改为 `0.01`
  - 前端提示和后端“必须大于 0”口径一致
- 接口验证：
  - 未登录 `GET /api/v1/price-alerts` 返回 `401`
  - 非法股票代码创建返回 `400 股票代码格式不正确`
  - 非法提醒类型返回 `400`
  - `targetPrice=0` 返回 `400 目标价格必须大于0`
  - 创建 `300750 / ABOVE / 500.12` 返回 `300750.SZ / 宁德时代`
  - 当前用户列表只返回自己的提醒
  - 其他用户删除提醒返回 `404 价格提醒记录不存在`
  - 本人停用提醒成功，列表中 `isActive=false`
  - 本人删除提醒成功，列表恢复为空
  - 数据库 `price_alerts` 中测试用户残留为 `0`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过

### 用户上传与随机性边界加固

- 清理后端弱随机残留：
  - 文章封面上传文件名改用 `crypto.randomUUID`
  - 视频上传文件名改用 `crypto.randomUUID`
  - 收款码上传文件名改用 `crypto.randomUUID`
  - 历史订单号随机段改用 `crypto.randomBytes`
  - 源码扫描确认 `apps/server/src / apps/web/src / packages` 中无 `Math.random()` 残留
- 文章发布权限验证：
  - 未登录 `POST /api/v1/articles` 返回 `401`
  - 普通未授权用户 `POST /api/v1/articles` 返回 `403 未获得文章上传权限`
  - 管理员 `POST /api/v1/articles` 返回 `200`
  - 临时文章 `权限边界临时测试-20260604` 已删除，数据库残留为 `0`
- 已验证：
  - `pnpm --filter @king/server build` 通过

## 2026-05-22

### 评审问题修复

- 补正式 Prisma 迁移：
  - 新增 `20260525093000_add_business_slots_star_investors_video_paywall`
  - 覆盖业务双槽、文章自动化新闻字段、视频/广告、TradingKey 明星投资人表与关键索引
  - `.gitignore` 调整为允许 migrations 目录进入版本控制
- 修复 TradingKey 新报告期空持仓风险：
  - 新报告期全量同步时，如果归一化后持仓明细为空，阻断最新快照切换
  - 避免源站结构变化时页面切到空 period
- 修复权限旧 JWT 快照问题：
  - VIP Guard、文章上传 Guard、文章编辑/置顶判断、视频访问、数据墙 VIP 判断均改为按 `user.id` 实时查库
  - 后台开关权限或支付更新会员后，不再依赖旧 token 中的权限字段
  - 数据墙 feature 列表请求改为一次查库后复用权限结果，避免每个 feature 重复查同一用户
- 明确业务同步串行阶段：
  - `1/3 获取数据`：全 A 股股票池、价格回填、Mairui 原始数据拉取
  - `2/3 同步业务数据`：物化牛散/机构持仓、分红、高管交易到 inactive slot
  - `3/3 切换数据源`：校验通过后才更新 `activeSlot`
  - 任一阶段失败会阻断后续阶段，不会提前切换前端业务数据源
- 修复后台同步体验：
  - `star_investor_holdings` 任务名与同步日志筛选统一
  - 手动触发明星投资人同步返回 `recordCount`
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过
  - `pnpm prisma validate` 在 `packages/prisma` 且加载 `apps/server/.env` 后通过
  - `pnpm prisma migrate deploy` 已成功应用 `20260525093000_add_business_slots_star_investors_video_paywall`
  - `pnpm prisma migrate status` 显示当前数据库 schema up to date

### 项目审核修复与稳定性补强

- 修复业务双槽位切换安全问题：
  - inactive slot 物化完成后先校验核心业务数据不为空，再允许切换 `activeSlot`
  - 若股东/持仓或分红物化为空，直接阻断切换并抛出明确错误
  - `investors` 聚合字段重置/更新与 `business_data_source_state.activeSlot` 切换放入同一事务，避免前端读到半切换状态
  - 投资人聚合更新改为批量 `UPDATE ... FROM (VALUES ...)`，降低大数据量更新超时风险
- 修复 TradingKey 明星投资人公开接口参数问题：
  - `page` 必须为大于等于 1 的整数
  - `page_size` 必须为 `1-100` 的整数
  - `holdingType` 仅允许 `ALL / INCREASE / DECREASE / KEEP / UNKNOWN`
  - 非法参数返回 `400`，不再造成分页 meta 异常或后端 500
- 修复 TradingKey 持仓唯一键空值风险：
  - `star_investor_holdings.instrumentCode` 改为非空，默认 `''`
  - `star_investor_trades.instrumentCode` 改为非空，默认 `''`
  - 同步落库时统一归一化 `instrumentCode`，空值写入 `''`
- 修复前端明星投资人页面排名问题：
  - 当前持仓与买卖记录使用独立分页状态
  - 买卖记录表不再复用持仓表分页排名
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - `pnpm --filter @king/web build` 通过
  - `pnpm prisma validate` 通过
  - `GET /api/v1/star-investors/buffett/holdings?page=-1&page_size=20` 返回 400
  - `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=0` 返回 400
  - `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=101` 返回 400
  - `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=5` 返回 200
  - `GET /api/v1/star-investors/buffett/trades?page=1&page_size=5` 返回 200
  - `GET /api/v1/health` 返回 OK
  - `/buffett-holdings`、`/data-wall` 页面可返回 HTML

### TradingKey 巴菲特 / 木头姐同步与展示复验

- 手动触发 `POST /api/v1/star-investors/sync` 成功：
  - 返回 `count=731`
  - Buffett 当前持仓明细 `67` 条，买卖流水 `46` 条
  - Catherine Wood 当前持仓明细 `328` 条，买卖流水 `291` 条
- 管理后台同步入口 `POST /api/v1/admin/sync/star-investor-holdings` 已复验：
  - 返回 `success=true`
  - 同报告期日常增量记录数 `337`
- 前端 `/buffett-holdings`、`/arkk-holdings` 已补齐“当前持仓 / 买卖记录”双标签页：
  - 当前持仓展示最新报告期最终仓位、上期持仓、买卖方向、组合占比和报告日市值
  - 买卖记录展示每日抓取的 `latest-trade-stock-list` 流水，用于解释日常股票买卖如何更新当前仓位
  - 两个标签页共用股票代码 / 名称 / 行业搜索与买卖方向筛选
- 已验证：
  - `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=5`
  - `GET /api/v1/star-investors/buffett/trades?page=1&page_size=5`
  - `GET /api/v1/star-investors/catherine-wood/holdings?page=1&page_size=5`
  - `GET /api/v1/star-investors/catherine-wood/trades?page=1&page_size=5`
  - `pnpm --filter @king/web build` 通过
  - 前端 `:3000` 已重启并加载新构建

### 业务持仓物化与启动修复

- 修复业务双槽位切换时长事务超时风险：
  - `switchBusinessDataSource` 不再把 24 万级投资人批量更新放入 5 秒交互事务
  - 避免出现 `holdings` 已写入但 `investors.isTracked` 全部为 `false` 的半切换状态
- 使用已有 `company_top_flow_holders` 物化业务数据：
  - active slot：`PRIMARY`
  - `holdings=2571123`
  - `tracked investors=243204`
  - `personal=151457`
  - `institution=91747`
- 修复股票代码归一化：
  - 兼容纯六码、尾缀格式、前缀格式
  - 扩大候选匹配，降低跨表 join 失败概率
- 回填投资人聚合字段：
  - `stockCount`
  - `totalMarketValue`
  - `isTracked`

### 行情、涨幅榜与数据墙

- 确认旧行情端点不可用：
  - `/hslt/realtime` 返回 404
  - `/hslt/kline` 返回 404
  - `/hsstock/latest/{code}/d/n/{key}?lt=2` 可用
- 轻量回填全 A 股最近两日日线：
  - 成功 `2589` 只
  - 失败 `2617` 只，主要为 Mairui `429`
  - 落地 `hs_stock_history_trading=5178`
  - 落地 `kline_daily=5178`
  - 回填 `stocks.currentPrice=2589`
- 修复涨幅榜尾缀股票被过滤的问题：
  - 移除 `POSITION('.' IN s.code) = 0`
  - 今日涨幅榜和 `1w` 已复验返回 `2589` 条
- 修复数据墙核心持仓市值 join：
  - 使用股票代码归一化 join `stocks`
  - `top-personal-investors-50` 预览已复验返回

### 视频与广告数据库补齐

- 补齐广告字段：
  - `ads.mediaType`
  - `ads.videoUrl`
  - `AdPosition.HOME_VIDEO_HERO`
- 补齐视频表：
  - `videos`
  - `VideoAccessLevel`
  - 视频访问索引
- 已验证：
  - `GET /api/v1/ads/HOME_VIDEO_HERO` 返回 200
  - `GET /api/v1/videos?page=1&page_size=4&featured=true` 返回 200
  - 当前广告/视频内容为空，属于数据未录入而非接口错误

## 2026-05-14

### 行情调度与 TradingKey 日常增量稳定性

- 修复交易时段调度时区：
  - `stock_list`、`stock_realtime`、`major_market_lists`、`historical_trading` 显式使用 `Asia/Shanghai`
  - `star_investor_holdings` 显式使用 `Asia/Shanghai`
  - 价格提醒 `checkPriceAlerts` 显式使用 `Asia/Shanghai`
- 增加同步任务重入保护：
  - `BaseSyncTask` 对同名任务运行中重复触发直接跳过，避免长任务被 Cron 再次叠加
- 优化 Mairui 实时行情同步：
  - 股票代码先去重
  - 默认并发限制为 `8`，可用 `MAIRUI_REALTIME_CONCURRENCY` 调整，最大限制 `20`
  - 单股失败不再逐条输出堆栈，只输出失败数量和样本，避免全 A 股实时行情超时刷屏

### Tetegu 数据墙补齐

- 新增数据墙功能：
  - `single-stock-personal-investors-100`：牛散单支持股 Top100
  - `single-stock-institution-holders-100`：机构单支持股 Top100
- 数据口径：
  - 复用当前双槽位激活源
  - 单支持股榜限定 `investors.stockCount = 1`
  - 按 `investors.totalMarketValue` 降序
  - 机构榜按大小写、空格、全角/半角括号做轻量别名归并，避免“中国移动香港(BVI )有限公司 / 中国移动香港(BVI)有限公司”这类重复排名
- 权限口径：
  - VIP/Admin 返回完整条数
  - 非 VIP 仍返回预览条数，但第 4 条后对主体名称、指标和核心持仓做字段级掩码
- 前端：
  - `/data-wall` 增加两个单支持股榜单切换项
  - 牛散/机构目录页数据墙卡片支持切换单支持股榜

## 2026-05-13

### TradingKey 明星投资人持仓

- 新增 TradingKey 星级投资者模块：
  - `StarInvestorSnapshot`
  - `StarInvestorHolding`
  - `StarInvestorTrade`
  - `GET /api/v1/star-investors/:investor/summary`
  - `GET /api/v1/star-investors/:investor/holdings`
  - `GET /api/v1/star-investors/:investor/trades`
  - `POST /api/v1/admin/sync/star-investor-holdings`
- 新增页面：
  - `/buffett-holdings`
  - `/arkk-holdings`
- 已实现每日定时同步：
  - `DataSyncTask.syncStarInvestorHoldings`
  - Cron：`10 5 * * *`
  - 新报告期：全量抓取 TradingKey 巴菲特与凯茜·伍德持仓，并记录买卖流水
  - 同报告期：只抓取 `latest-trade-stock-list` 股票买卖流水，用返回的当前持仓数量 upsert 更新持仓表
- 已实现买卖流水存储与更新持仓：
  - `star_investor_trades.sourceKey` 用于幂等去重
  - 重复抓取同一条买卖记录只更新 `lastSeenAt`
  - `tradeQuantity > 0` 归一为 `INCREASE`
  - `tradeQuantity < 0` 归一为 `DECREASE`
  - `tradeQuantity = 0` 归一为 `KEEP`
  - TradingKey `OPEN` 归一为 `INCREASE`
  - TradingKey `CLOSE` 归一为 `DECREASE`
  - `previousHoldingQuantity = holdingQuantity - tradeQuantity`
- 已修复同股票不同证券标识被去重的问题：
  - 唯一键由 `investorType + period + stockCode` 调整为 `investorType + period + stockCode + instrumentCode`
- 已验证：
  - `POST /api/v1/admin/sync/star-investor-holdings` 在同报告期日常模式返回成功，记录数 `296`
  - `GET /api/v1/star-investors/buffett/holdings?page=1&page_size=5` 返回 `64` 条明细 meta
  - `GET /api/v1/star-investors/catherine-wood/holdings?page=1&page_size=5` 返回 `324` 条明细 meta
  - `GET /api/v1/star-investors/buffett/trades?page=1&page_size=1` 返回 `34` 条买卖流水 meta
  - `GET /api/v1/star-investors/catherine-wood/trades?page=1&page_size=1` 返回 `262` 条买卖流水 meta
  - Catherine Wood `latest-trade-stock-list` 本轮原始抓取 `295` 行，其中重复 `sourceKey` 去重后落库 `262` 行
- 已知数据源风险：
  - TradingKey 摘要 `total` 分别为 Buffett `65`、Catherine Wood `326`
  - 当前公开分页 API 实际可取 Buffett `64`、Catherine Wood `324`
  - 已记录到 `known-risks.md`

## 2026-05-12

### 分红股息数据修复

- 修复 Mairui 近期分红客户端：
  - 密钥继续按 `/hscp/jnfh/{code}/{key}` 路径拼接
  - 过滤 `暂时没有数据`、空值、`--` 和非实施状态
  - 规范 `YYYYMMDD / YYYY-MM-DD` 日期
- 修复 `recent_dividend -> dividends` 物化：
  - 过滤 `1990` 年前和超过当前年份 + 1 的异常年份
  - 过滤现金分红、送股、转增均为空或 0 的记录
- 完成现有数据修复：
  - 删除无效 `recent_dividend` 伪记录 `3` 条
  - 删除异常年份 `dividends` 记录 `6` 条
  - 补齐 `PRIMARY` 槽位 `totalDividend` `68754` 条
- 验证结果：
  - `dividends.PRIMARY / SECONDARY` 均覆盖 `5195` 只股票，年份 `1991-2026`
  - 双槽位 `totalDividend/dividendYield` 空值均为 `0`
  - `GET /api/v1/dividends/stock/300750` 返回 `currentPrice/totalDividend`
  - 带 Admin JWT 调用 `GET /api/v1/dividends/yield-ranking?mode=rolling1y&page=1&page_size=3` 返回 200
- 后端 `pnpm --filter @king/server build` 通过，并已重启 `:4000`

## 2026-05-10

### LLMwiki 风险更新

- 已将以下风险写入 `known-risks.md`：
  - 分红历史覆盖仍受 `recent_dividend` 来源限制
  - `totalDividend` 在原始总额缺失时存在估算口径
  - `stocks` 存在纯代码与带后缀代码重复格式

### 前端布局重构

- 新增统一页面组件：
  - `apps/web/src/components/common/PageChrome.tsx`
  - `PageHeader`
  - `FilterBar`
- 重构主布局与全局样式：
  - `LayoutContent` 增加统一页面宽度容器
  - `AppHeader` 增加业务数据平台说明与双源标识
  - `AppSidebar` 按“股东洞察 / 市场榜单 / VIP服务 / 内容中心 / 工作台”重新分组
  - `globals.css` 增加页面头、筛选条、表格、卡片与侧栏样式
- 已统一核心页面结构和字段顺序：
  - `/`
  - `/top-gainers`
  - `/dividend-yield`
  - `/investor-increase`
  - `/top-increase`
  - `/executive-increase`
  - `/investors`
  - `/institutions`

### 构建验证

- `pnpm --filter @king/web build` 通过
- `pnpm --filter @king/server build` 通过

### 分红历史接口修复

- 修复 `GET /api/v1/dividends/stock/:code`：
  - 支持纯代码与带后缀代码候选匹配，例如 `300750` 可匹配 `300750.SZ`
  - 避免 `Dividend.id` BigInt 直接返回导致 JSON 序列化 500
  - 原始 `totalDividend` 为空时按 `cashDividend * totalMarketCap / currentPrice` 估算
  - 返回 `currentPrice` 方便前端展示与字段核验
- 已验证：
  - `GET /api/v1/dividends/stock/300750` 返回 200
  - 返回数据包含历史分红记录、`totalDividend` 与 `currentPrice`

### 行情与衍生同步调度修复

- 注册 `DataSyncTask` 到 `SyncModule`
- 已将原占位调度接到真实任务：
  - `stock_list` -> `StockSyncTask.syncStockList()`
  - `stock_realtime` -> `StockSyncTask.syncRealtimeQuotes()`
  - `major_market_lists` -> `StockSyncTask.syncLimitUp()` + `syncLimitDown()`
  - `historical_trading` -> `KlineSyncTask.syncTodayKline()` + `recalcAllPeriodGainers()`
- 避免晚间重复全量重跑：
  - `company_basic_info`
  - `shareholder_info`
  - `financial_indicators`
  - `financial_statements`
  - 这些重业务模块仍由凌晨 4 点双源任务统一处理，手动触发时才调用业务同步
- 已验证：
  - `pnpm --filter @king/server build` 通过
  - 后端重启成功
  - `GET /api/v1/health` 返回 200

### 风险复核

- 复核共同持仓 N+1 风险：
  - 当前 `HoldingService.getCommonHoldings()` 已走 `enrichStockBusinessFields()`
  - 股票信息与主营收入已使用批量查询回填
  - 风险已从“待改 N+1”调整为“已缓解，待大数据量压测”

## 2026-05-09

### 文档与任务

- 更新 `LLMwiki` 索引，新增本轮任务文档链接：
  - `../20260509-任务文档.md`
- 更新以下文档以反映当前真实状态与待修复项：
  - `sync.md`
  - `status-matrix.md`
  - `modules.md`
  - `pages.md`
  - `apis.md`
  - `phase1-requirements.md`

### 本轮已核实问题

- 分红股息：
  - 当前 `dividends` 业务表仅从 `recent_dividend` 物化
  - 因此存在覆盖不完整、字段空白、现价回填不稳定的问题
- 高管增持：
  - 当前榜单仍走 `executive_trades` 聚合链路
  - 需要切换到“高管成员 + 十大流通股东报告期对比”的真实数据口径
- 十大增持：
  - 当前返回仍是“股东-股票明细榜”
  - 本轮目标改为“股票聚合榜”
- 个股详情：
  - 当前只有基础信息、K 线、关联牛散持仓
  - 尚未覆盖股票新闻、历史涨幅、历史涨跌停、实时接口、增强图表
- 业务同步：
  - 当前凌晨 3 点任务仍偏全量重刷
  - 还未实现生产目标要求的“全量一次 + 每日前一日参数追加 + 全量优先跳过增量”
- 视频能力：
  - 当前仅有 `ads` 广告模块
  - 尚未形成视频广告与视频专区能力

### 本轮已完成实现

- Tetegu 数据墙：
  - 新增后端模块：
    - `apps/server/src/domain/paywall/paywall.module.ts`
    - `apps/server/src/domain/paywall/paywall.controller.ts`
    - `apps/server/src/domain/paywall/paywall.service.ts`
  - 新增接口：
    - `GET /api/v1/paywall/features`
    - `GET /api/v1/paywall/features/:featureKey`
    - `GET /api/v1/paywall/features/:featureKey/preview`
  - 当前预留功能：
    - 前 50 牛散数据墙
    - 前 100 牛散数据墙
    - 前 100 机构持仓数据墙
  - 已从占位预览升级为真实业务数据：
    - 排名来源：`investors.totalMarketValue`、`stockCount`
    - 核心持仓来源：当前双槽位激活源的 `holdings` + `stocks.currentPrice`
    - 同一投资人同一股票按最新报告期去重后再取市值前三
  - 新增 `/data-wall` 独立页面，并在侧栏和首页模块入口展示
  - 牛散/机构目录页已嵌入 Tetegu 核心数据墙卡片，VIP/Admin 可见完整条数，游客/普通用户只看到预览条数
- 高管增持：
  - 页面榜单已切换到真实高管成员 + 代表性报告期持仓对比链路
  - 接口返回字段改为真实聚合口径：
    - `totalIncreaseShares`
    - `estimatedIncreaseMarketValue`
    - `executives`
    - `reportDate`
- 十大增持：
  - 已从“股东-股票明细榜”改为“股票聚合榜”
  - 当前输出：
    - `stockName`
    - `stockCode`
    - `currentPrice`
    - `shareholderNames`
    - `totalIncreaseShares`
- 分红股息：
  - 已修复默认 `rolling1y` 榜单查询超时
  - 改为数据库侧聚合
  - 前端在 `totalDividend` 缺失时会回退展示 `dividendPerShare`
  - 夜间业务同步已纳入 `company_capital`
  - 新增全 A 股股本专用回填脚本：
    - `apps/server/scripts/backfill-company-capitals.ts`
    - `pnpm --filter @king/server sync:company-capitals`
  - 已验证 `300750.SZ` 可真实拉取并写入 `company_capitals`
  - 已完成当前 A 股 canonical 股票池股本回填：
    - 股票表原始行数：`10409`
    - canonical A 股数：`5206`
    - `company_capitals` 覆盖股票数：`5206`
    - 缺失数：`0`
  - 修复 `dividends.dataSlot` 原始 SQL 与 Postgres enum 比较的类型错误
  - 修复 `avg3y` 口径下 `totalDividend=0` 时不回退股本估算的问题
  - 已验证 `rolling1y / annual / avg3y` 三种模式均能返回 `totalDividend/currentPrice/dividendYield`
  - 原始股本刷新后会再次回补 `stocks.totalMarketCap`
  - 分红榜单的股本回退已兼容带后缀/不带后缀股票代码
- 业务同步：
  - 夜间调度已从 `03:00` 改为 `04:00`
  - 新增 `BusinessDataSlot = PRIMARY | SECONDARY`
  - 新增 `business_data_source_state` 维护当前业务活跃源
  - 夜间任务改为：
    - 无全量记录时先执行 `full`
    - 否则使用前一日中国日期参数执行 `daily`
    - 若全量已覆盖目标日或当日 `daily` 已执行，则直接跳过
  - `holdings / dividends / executive_trades` 已切到槽位化读取
  - 同步完成后在事务内切换前台业务数据源
- 个股详情增强：
  - 新增后端接口：
    - `GET /api/v1/stocks/:code/performance`
    - `GET /api/v1/stocks/:code/limit-history`
    - `GET /api/v1/stocks/:code/realtime`
  - `/stocks/[code]` 已接入：
    - 公司基础信息
    - 历史涨幅摘要
    - 历史涨跌停记录
    - 关联新闻
    - 实时数据接口预留
    - 原有 K 线与关联牛散持仓
- 视频广告与视频专区：
  - Prisma 新增：
    - `users.canAccessVideos`
    - `videos`
    - `VideoAccessLevel = PUBLIC | USER | VIDEO | VIP`
    - `ads.mediaType`
    - `ads.videoUrl`
    - `AdPosition.HOME_VIDEO_HERO`
  - 新增后端接口：
    - `GET /api/v1/videos`
    - `GET /api/v1/videos/:id`
    - `GET /api/v1/videos/admin/list`
    - `POST /api/v1/videos/upload`
    - `POST /api/v1/videos`
    - `PUT /api/v1/videos/:id`
    - `DELETE /api/v1/videos/:id`
    - `PUT /api/v1/admin/users/:id/video-permission`
  - 新增前端页面：
    - `/videos`
    - `/videos/[id]`
    - `/admin/videos`
  - 首页已接入：
    - `HOME_VIDEO_HERO` 循环视频广告
    - 精选视频区块
  - `/admin/ads` 已支持：
    - 图片 / 视频广告类型
    - 视频素材上传并回填 `videoUrl`
  - 已实现四级访问控制：
    - `PUBLIC`
    - `USER`
    - `VIDEO`
    - `VIP`

### 构建验证

- `pnpm db:push` 通过
- `pnpm db:generate` 通过
- `pnpm --filter @king/server build` 通过
- `pnpm --filter @king/web build` 通过

### 本轮已验证接口

- `GET /api/v1/executives/increase?page=1&page_size=2`
- `GET /api/v1/stocks/top-increase?page=1&page_size=2`
- `GET /api/v1/dividends/yield-ranking?page=1&page_size=2&mode=rolling1y`
- `GET /api/v1/dividends/yield-ranking?page=1&page_size=3&mode=annual`
- `GET /api/v1/dividends/yield-ranking?page=1&page_size=3&mode=avg3y`

## 2026-05-06

### 文档

- 新建 `LLMwiki`
- 建立架构、模块、数据库、接口、同步、排障、字段口径、源码导航等文档
- 新增功能状态矩阵与变更日志

### 涨幅榜

- 修复“涨幅榜页面数据为空”
- 调整今日涨幅榜数据拼装逻辑：
  - 对股票代码做归一化
  - 避免基础表纯代码与行情表带后缀不匹配
- 缩小今日行情查询范围：
  - 只取最新交易日数据
  - 降低全表扫描成本

### 牛散增持 / 减持 / 新进

- 改为“代表性报告期”而不是绝对最大日期
- 修复上一期持仓对比逻辑
- 修复 `stockCode` 错误归一化导致的：
  - 增持被误判成新进
  - 减持结果为空
- 补回前端展示字段：
  - `investorName`
  - `currentShares`
  - `previousShares`
  - `changeMarketValue`

### 十大增持

- 模块重做为基于 `company_top_flow_holders`
- `reportDate` 支持 `YYYY-MM-DD`
- 默认使用有效覆盖报告期
- 返回 `meta.report_date`

### 高管增持

- 放弃依赖不可信的 `executive_trades` 伪样本
- 改为使用：
  - `executive_member`
  - `company_top_flow_holders`
  - `stocks`
- 修复 `executive_member.dm` 与 `stockCode` 格式不一致问题
- 页面参数由 `months` 切换为 `reportDate`

### 文章上传

- 新增 `POST /api/v1/articles/upload`
- 后端挂载 `/uploads`
- 前端 `next.config.js` 代理 `/uploads`
- 后台文章管理页支持上传封面图并自动回填 `coverImage`
- 已实测上传成功并可从 `3000` / `4000` 访问

### 运行与依赖

- 补装后端运行依赖 `multer`
- 修复 `main.ts` 中静态资源类型问题
- 重新 build 并拉起前后端

### 已验证接口

- `GET /api/v1/health`
- `GET /api/v1/top-gainers`
- `GET /api/v1/top-gainers?period=1w`
- `GET /api/v1/holdings/increase`
- `GET /api/v1/holdings/decrease`
- `GET /api/v1/holdings/new`
- `GET /api/v1/stocks/top-increase`
- `GET /api/v1/executives/increase`
- `POST /api/v1/auth/login`
- `POST /api/v1/articles/upload`

## 2026-05-07

### 用户文章投稿与权限

- 新增用户投稿页：`/account/articles`
- 新增我的文章接口：`GET /api/v1/articles/mine`
- 文章创建/修改/删除权限从“仅 Admin”扩展为：
  - 管理员可操作全部文章
  - 被授权用户可操作自己创建的文章
- 新增用户字段：
  - `users.canUploadArticles`
- 新增文章归属字段：
  - `articles.createdByUserId`
- 新增后台权限开关接口：
  - `PUT /api/v1/admin/users/:id/upload-permission`
- 新增文章上传守卫：
  - `ArticleUploadGuard`

### 前端入口调整

- 登录用户可在以下位置进入投稿页：
  - 左侧导航 `文章投稿`
  - `/articles` 右上角按钮
  - 右上角账户菜单 `我的文章 / 文章投稿`
- 未授权用户可看到入口，但进入 `/account/articles` 后只显示权限提示

### 构建与运行

- `pnpm db:generate` 通过
- 使用 `apps/server/.env` 执行 `pnpm db:push` 同步数据库
- `pnpm --dir apps/server build` 通过
- `pnpm --dir apps/web build` 通过
- 已重启前端以应用最新入口改动

## 2026-05-08

### 股东分类与机构页面

- 为 `investors` 新增持久化分类字段：
  - `category = personal | institution`
- 新增数据库索引：
  - `idx_investors_category_tracked`
- 新增机构页面：
  - `/institutions`
  - `/institutions/[id]`
- 机构页面复用牛散页同构组件：
  - 列表、搜索、排序
  - 详情、最新持仓、持股历史
  - “强势股里隐藏的股东”榜单支持按 `category` 切换个人/机构

### 股东同步口径修复

- 将粗过滤规则写入业务同步，而不是仅在运行时筛掉脏数据
- 名称分类规则新增机构关键词与短机构别名兜底
- 修复原始流通股东 `gdlx` 为空时的误判问题：
  - 旧逻辑会把空类型直接归到机构
  - 新逻辑改为：
    - `自然人` 优先判个人
    - 明确非空且非 `自然人` 判机构
    - 空 `gdlx` 再回退到名称粗过滤
- 已确认修复样本：
  - `邵树伟` 不再被错误归到机构
  - `淡马锡`、`集团` 等不再泄漏到个人榜

### 机构榜单查询性能

- 优化机构页“隐藏在涨幅榜/涨停榜中的机构”查询
- 不再把全历史持仓拉回内存后去重
- 改为在数据库侧按“机构 + 股票”取最新持仓快照
- 修复前端页面长时间无返回的问题

### 数据重建与验证

- 使用现有原始表本地重建股东与持仓业务数据，不走外网
- 本次重建结果：
  - `qualifiedInvestorCount = 74399`
  - `investorUpdated = 74399`
  - `investorDisabled = 64`
  - `holdingRecordCount = 1893704`
- 已验证：
  - `GET /api/v1/investors?category=personal`
  - `GET /api/v1/investors?category=institution`
  - `GET /api/v1/natural-person-holders/hidden-in-gainers?category=institution`
  - `GET /api/v1/natural-person-holders/hidden-in-limit-up?category=institution`
  - `GET /api/v1/investors/24747`
  - `GET /api/v1/health`
  - `GET /institutions` 页面返回 `200`

### 个人股东模块

- `/individual-shareholders` 已从旧自然人明细页切换为任务要求的双榜页
- 新口径：
  - 牛散单支持股
  - 机构单支持股
- 统一规则：
  - `investors.isTracked = true`
  - `investors.stockCount = 1`
  - 按 `totalMarketValue DESC`
- 前端已支持：
  - 双榜切换
  - 关键词搜索

### 牛散连续追踪与相关新闻

- 取消原“清仓高亮”推进任务
- 替换为牛散详情页“进入某只股票十大流通股东后的连续期次追踪”
- 新增接口：
  - `GET /api/v1/investors/:id/top-flow-tracking`
- 连续追踪时间轴已修正为：
  - 优先使用业务 `holdings` 的代表性报告期
  - 不再把原始日级 `jzrq` 全量返回给前端
- 牛散详情页新增：
  - `十大流通股东追踪`
  - `相关新闻`
- 高管增持页新增：
  - `高管相关新闻`

### 牛散增持 / 减持均价

- 为增持榜和减持榜补充：
  - `averageChangePrice`
  - `averageChangePriceDate`
- 当前均价口径：
  - 取报告期当日或之前最近交易日
  - 优先使用历史收盘价
  - 收盘价缺失时回退开盘价
- 前端页面已新增：
  - `平均增持均价`
  - `平均减持均价`

### 新闻自动化预留接口

- `articles` 新增新闻关联字段：
  - `topicType`
  - `relatedInvestorId`
  - `relatedStockCode`
  - `relatedExecutiveName`
  - `automationProvider`
  - `automationExternalId`
  - `sourceUrl`
  - `sourceMetadata`
- 新增接口：
  - `GET /api/v1/articles/investor/:investorId/news`
  - `GET /api/v1/articles/executive/news`
  - `POST /api/v1/articles/automation/:provider/news`
  - `POST /api/v1/articles/automation/openclaw/news`
  - `POST /api/v1/articles/automation/harness/news`
- 自动化上传要求：
  - 请求头 `x-news-ingest-key`
  - 环境变量 `NEWS_AUTOMATION_KEY`
- 自动化上传增强：
  - 新增统一 `:provider` 新闻上传入口
  - 保留 `openclaw` / `harness` 旧路由兼容
  - 兼容单条对象、批量数组与常见包装字段
  - 兼容 `headline`、`description`、`body`、`stock_code`、`executive_name`、`external_id` 等常见别名字段
  - 未显式传 `externalId` 时自动生成稳定幂等键
- 手工录入增强：
  - `/admin/articles`
  - `/account/articles`
  - 已支持填写 `topicType`、`relatedInvestorId`、`relatedStockCode`、`relatedExecutiveName`、`sourceUrl`、`sourceMetadata`
  - 跳转牛散详情 / 机构详情 / 个股详情
- 已验证：
  - `GET /api/v1/individual-shareholders?category=personal`
  - `GET /api/v1/individual-shareholders?category=institution`

### 牛散新进 / 高管增持 / 十大增持 / 股息率排行

- 牛散新进：
  - `GET /api/v1/holdings/new` 新增 `mode=stock`
  - `/investor-new` 支持：
    - 新进明细
    - 按股票聚合统计新进牛散数量
- 高管增持：
  - 重新切回真实 `executive_trades`
  - 页面参数恢复为 `months=1..12`
  - 按最近 `1-12` 月滚动区间聚合
  - 补齐主营收入字段
- 十大增持：
  - 后端已固化前 100 口径
  - 前端分页限定在 Top 100 内
- 股息率排行：
  - `GET /api/v1/dividends/yield-ranking` 新增 `mode=rolling1y`
  - `GET /api/v1/dividends/yield-ranking` 新增 `mode=avg3y`
  - `/dividend-yield` 支持：
    - 滚动近 1 年排行
    - 按年度排行
    - 3 年平均排行
  - 页面字段从“每股分红”补齐为“分红金额”
- 同姓牛散：
  - `/same-surname-investors`
  - `GET /api/v1/investors/same-surname-groups`
  - 已支持按姓氏 / 人数 / 市值排序，默认按姓氏升序

## 记录规则

- 只记录已实际发生的实现或口径变化
- 每次修复要写清“现象 / 根因 / 处理”
- 涉及日期时使用绝对日期，不使用“今天 / 昨天”

## 2026-05-26 同步完整性修复

### TradingKey 明星投资人同步

- 现象：全量持仓分页接口失败时可能回退首屏数据，并覆盖当前报告期持仓，造成巴菲特 / 木头姐持仓不完整。
- 根因：分页失败被降级为首屏 fallback，且未校验 `fetched >= total`。
- 处理：全量分页严重不完整时直接抛错阻断同步；默认要求达到 `TRADINGKEY_MIN_LIST_COMPLETENESS=0.95`，兼容源站摘要 `total` 与公开分页明细存在少量计数偏差的情况。
- 现象：日常买卖接口失败会被记录为“无更新”，同步日志可能显示成功。
- 根因：`latest-trade-stock-list` 异常时返回空数组。
- 处理：日常买卖接口失败或分页严重不完整时抛错阻断；同报告期快照更新延后到买卖同步成功之后。
- 处理：新增 `TRADINGKEY_BLOCK_EMPTY_DAILY_TRADES`，开启后当日常买卖返回空且本报告期无历史买卖记录时阻断同步，避免异常空列表被当成成功。

### 全 A 股业务同步

- 现象：高管交易可能因为第一只股票没有数据而跳过全 A 股同步。
- 根因：同步前使用第一只股票作为全局可用性探测。
- 处理：取消首股探测，改为逐只股票拉取；单股失败只记录警告，不阻断其他股票。
- 现象：外部原始接口大面积失败时仍可能切换 A/B 数据源。
- 根因：单股原始数据失败只记录 warn，没有全局覆盖率阈值。
- 处理：新增 `BUSINESS_DATA_MIN_REFRESH_COVERAGE`，默认 `0.8`；低于阈值时阻断后续物化和切源。
- 处理：新增 `BUSINESS_DATA_MIN_TARGET_DATE_COVERAGE`，默认 `0`，生产可按目标日期有效数据覆盖率开启增量校验。
- 处理：高管交易改用严格接口，不再读取缓存或吞异常；新增 `BUSINESS_DATA_BLOCK_EMPTY_EXECUTIVE_TRADES=false`，默认只在全部请求失败时阻断，全 A 股结果为空时记录 warn 并继续，生产可按需要开启强阻断。
- 处理：根 `.env.example` 中迈瑞密钥字段统一为 `MAIRUI_API_KEY`，与代码读取项一致；密钥值直接替换为真实 key，不使用 `licence=` 形式。
