# 掘金股生产部署

## 服务器要求

- Docker 24+
- Docker Compose v2+
- 建议 2 核 CPU、4GB 内存、40GB 磁盘起步；100 人以内访问建议 4GB+ 内存。

## 首次部署

```bash
git clone git@github.com:ThisZhouS/zsjujinggu.git
cd zsjujinggu
cp .env.production.example .env.production
vi .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

必须替换 `.env.production` 中的：

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `MAIRUI_API_KEY`
- `NEWS_AUTOMATION_KEY`
- `CORS_ORIGIN`，生产域名访问时改为真实域名。

## 常用运维命令

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f server
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
docker compose --env-file .env.production -f docker-compose.prod.yml restart server web
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## 数据持久化

生产 Compose 使用 Docker volumes 持久化：

- `postgres_data`：数据库
- `redis_data`：Redis AOF 数据
- `uploads_data`：文章、视频、广告等上传文件

升级代码不会删除这些 volume。不要执行 `docker compose down -v`，除非明确要清空生产数据。

## 访问入口

默认只暴露 Web：

- 前端：`http://服务器IP:3000`
- 后端 API 由前端 `/api/v1/*` 代理到 server 容器。

如使用 Nginx/HTTPS，将 Nginx 反代到 `127.0.0.1:3000`，并把 `.env.production` 的 `CORS_ORIGIN` 改为正式域名。
