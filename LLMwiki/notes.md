# Notes

## 已修复项

- 涨幅榜数据为空
- 牛散增持与减持不完整
- 十大增持模块重做
- 高管增持模块重做
- 文章上传功能
- 用户文章投稿与权限控制

## 当前注意点

- `company_top_flow_holders.stockCode` 与 `executive_member.dm` 编码格式不同
- 文章上传文件会落到 `apps/server/uploads`
- 前端通过 `/uploads` 代理访问静态文件
- 未登录用户不会显示文章投稿入口
- 已登录未授权用户可进入 `/account/articles`，但只能看到权限提示
