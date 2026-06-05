# LLMwiki

项目维护与二次开发索引。

## 阅读顺序

1. [architecture.md](./architecture.md)
2. [database.md](./database.md)
3. [modules.md](./modules.md)
4. [backend.md](./backend.md)
5. [pages.md](./pages.md)
6. [data.md](./data.md)
7. [sync.md](./sync.md)
8. [apis.md](./apis.md)
9. [api-fields.md](./api-fields.md)
10. [db-fields.md](./db-fields.md)
11. [dependency.md](./dependency.md)
12. [field-semantics.md](./field-semantics.md)
13. [source-map.md](./source-map.md)
14. [status-matrix.md](./status-matrix.md)
15. [changelog.md](./changelog.md)
16. [verification-checklist.md](./verification-checklist.md)
17. [known-risks.md](./known-risks.md)
18. [ops.md](./ops.md)
19. [troubleshooting.md](./troubleshooting.md)
20. [notes.md](./notes.md)
21. [phase1-requirements.md](./phase1-requirements.md)
22. [../20260509-任务文档.md](../20260509-任务文档.md)

## 当前定位

- 目标：记录 King 财经数据平台的真实结构、数据口径和关键约束
- 受众：后续 LLM、开发者、运维
- 原则：只记录已验证信息，不写猜测
- 一期需求拆分：见 [phase1-requirements.md](./phase1-requirements.md)

## 当前重点变更

- 牛散“清仓高亮”任务已取消，替换为“进入十大流通股东后的连续期次追踪”
- 牛散详情页已新增：
  - 十大流通股东追踪
  - 相关新闻
- 高管增持页已新增：
  - 高管相关新闻
- 已预留自动化新闻上传接口：
  - `OpenClaw`
  - `Harness`
- 实际环境若要启用自动化上传，还需配置 `NEWS_AUTOMATION_KEY`
- `2026-05-09` 已新增一轮重点修复任务：
  - 分红股息数据补全
  - 高管增持改为真实数据链路
  - 十大增持改为股票聚合榜
  - 业务同步改为“全量一次 + 每日按前一日参数追加”
  - 个股详情增强
  - 视频广告 / 视频专区
  - 前端布局与数据墙权限预留
