# Financial Data Platform

金融数据平台 — 基于 Python 的金融数据采集、存储与定时同步平台。

## 项目简介

本项目是一个模块化的金融数据平台，支持从多个数据源采集金融数据并存储到 PostgreSQL 数据库。  
采用「**先全量初始化、后定时增量同步**」的数据管道模式，配合 Docker 实现一键部署。

## 技术栈

| 组件 | 版本 |
|------|------|
| Python | 3.11.5 |
| PostgreSQL | 16 |
| SQLAlchemy | 2.0 |
| psycopg | 3.2 |
| Alembic | 1.18 |
| pandas / numpy | 最新稳定版 |
| loguru | 0.7 |
| python-dotenv | 1.0 |

## 项目结构

```
financial_data_platform/
├── api_clients/         # 各模块 API 客户端实现和数据模型
│   ├── CompanyBasicInfo/      # 公司基本信息模块
│   ├── FinancialCoreIndicators/ # 财务核心指标模块
│   └── ...                  # 其他19个模块
├── config/              # 配置文件（数据库、环境变量加载）
│   ├── settings.py           # 全局配置管理
│   └── database.py           # 数据库连接和管理
├── core/                # 核心异常定义
│   └── exceptions.py        # 自定义异常类
├── models/              # 数据模型（已废弃，使用 api_clients/*_table.py）
├── utils/               # 工具类（日志、日期、数据处理）
│   ├── logger.py            # 日志管理
│   ├── db_utils.py          # 数据库工具函数
│   ├── date_utils.py         # 日期处理工具
│   └── script_base.py       # 脚本基类和公共函数
├── example/             # 生产环境同步脚本
│   ├── company_basic_info_sync.py        # 公司基本信息同步
│   ├── financial_core_indicators_sync.py # 财务核心指标同步
│   └── ...                             # 其他14个模块同步脚本
├── useful/              # 开发和测试工具
│   ├── financial_core_indicators_fetch_and_save_financial_main_indicators.py
│   └── ...                            # 其他68个独立接口脚本
├── scripts/             # 部署与调度脚本
│   ├── init_full_sync.sh    # 全量初始化（首次执行）
│   ├── run_incremental.sh   # 增量同步（定时执行）
│   └── run_useful_full_fetch.py  # 并发执行 useful/ 脚本
├── log/                 # 日志目录（持久化到宿主机）
├── docx/                # 模块文档
├── alembic/             # 数据库迁移配置
├── Dockerfile           # 多阶段镜像构建
├── docker-compose.yml   # 服务编排
├── requirements.txt     # Python 依赖
└── .env                 # 环境变量（不提交 git）
```

### 目录职责说明

**example/ 与 useful/ 的区别：**

| 目录 | 用途 | 调用方式 | 执行方式 | 适用场景 |
|------|------|----------|----------|----------|
| `example/` | 生产环境脚本 | `scripts/init_full_sync.sh`<br>`scripts/run_incremental.sh` | 串行执行 | 日常生产环境的数据同步任务 |
| `useful/` | 开发和测试工具 | `scripts/run_useful_full_fetch.py` | 异步并发执行 | 单接口测试、调试、大规模全量获取 |

**选择建议：**
- **日常数据更新** → 使用 `example/` 目录中的脚本
- **接口测试/调试** → 使用 `useful/` 目录中的脚本
- **大规模全量获取** → 使用 `scripts/run_useful_full_fetch.py` 调用 useful/ 脚本

---

## Ubuntu 快速部署（推荐）

### 前置条件

```bash
# 安装 Docker（如未安装）
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker --version
docker compose version
```

### 第一步：克隆项目

```bash
git clone <your-repo-url> /opt/financial/platform
cd /opt/financial/platform
```

### 第二步：配置环境变量

```bash
cp env.example .env
nano .env   # 或 vim .env
```

最少需要配置：

```env
DB_PASSWORD=your_strong_password
API_LICENSE=your_api_license_key
```

其余参数均有默认值，按需修改。

### 第三步：构建镜像

```bash
docker compose build
```

### 第四步：全量初始化（首次执行一次）

```bash
bash scripts/init_full_sync.sh
```

该脚本会自动：
1. 启动 PostgreSQL 并等待就绪
2. 创建所有表结构
3. 按模块顺序执行全量数据抓取并入库
4. 输出执行报告并写入 `log/init_full_sync_<timestamp>.log`

### 第五步：配置定时增量同步

```bash
sudo bash scripts/setup_cron.sh
```

按提示选择调度频率（每小时 / 每天 02:00 等），脚本会自动写入 `crontab`。

配置完成后可验证：

```bash
crontab -l                              # 查看定时任务
tail -f /var/log/financial_incremental.log   # 实时查看日志
```

---

## 手动执行单个同步脚本

```bash
# 确保数据库已启动
docker compose up -d db

# 执行任意同步脚本
docker compose run --rm app python example/company_basic_info_sync.py
docker compose run --rm app python example/historical_trading_data_sync.py
docker compose run --rm app python example/stock_real_time_data_sync.py
# ... 更多脚本见 example/ 目录
```

## 手动触发增量同步

```bash
bash scripts/run_incremental.sh
```

---

## 数据库迁移（Alembic）

```bash
# 生成迁移文件
docker compose run --rm app alembic revision --autogenerate -m "描述信息"

# 执行迁移
docker compose run --rm app alembic upgrade head

# 回滚一步
docker compose run --rm app alembic downgrade -1
```

---

## 日志

- 运行日志挂载至宿主机 `./log/` 目录，容器重建后日志不丢失
- 每个模块日志按日期轮转，保留 30 天
- 全量初始化日志：`log/init_full_sync_<timestamp>.log`
- 增量同步日志：`log/incremental_<date>.log`
- cron 执行日志：`/var/log/financial_incremental.log`

---

## API 客户端模块

| 模块 | 说明 |
|------|------|
| CompanyBasicInfo | 公司基本信息 |
| CompanyHistoricalData | 公司历史数据 |
| FinancialCoreIndicators | 财务核心指标 |
| FinancialQuartersEvents | 财务季度事件 |
| FinancialStatements | 财务报表 |
| IndexTechnicalIndicators | 指数技术指标 |
| ShanghaiShenzhenTechnicalIndicators | 沪深技术指标 |
| HistoricalTradingData | 历史交易数据 |
| IndexRelationshipMapping | 指数关系映射 |
| MajorMarketLists | 主要市场列表 |
| OtherMarketLists | 其他市场列表 |
| MarketDepthData | 市场深度数据 |
| IndexRealTimeData | 指数实时数据 |
| StockRealTimeData | 股票实时数据 |
| RealTimeTradingInterfaces | 实时交易接口 |
| ShareholderBasicInfo | 股东基本信息 |
| ShareholderDetailedData | 股东详细数据 |
| StockPoolClassification | 股票池分类 |
| TradingDetailsSpecialData | 交易明细特殊数据 |

各模块详细文档见 `docx/` 目录。

---

## 开发规范

- 遵循 PEP 8，所有函数必须包含类型注解
- 单函数 ≤ 50 行，单模块 ≤ 500 行
- 每个 API 类必须实现 `fetch_*` / `save_*` / `fetch_and_save_*` 三个方法
- 敏感配置统一放 `.env`，禁止硬编码

| StockRealTimeData | 股票实时数据 |
| RealTimeTradingInterfaces | 实时交易接口 |
| ShareholderBasicInfo | 股东基本信息 |
| ShareholderDetailedData | 股东详细数据 |
| StockPoolClassification | 股票池分类 |
| TradingDetailsSpecialData | 交易明细特殊数据 |

各模块详细文档见 `docx/` 目录。

---

## 开发规范

- 遵循 PEP 8，所有函数必须包含类型注解
- 单函数 ≤ 50 行，单模块 ≤ 500 行
- 每个 API 类必须实现 `fetch_*` / `save_*` / `fetch_and_save_*` 三个方法
- 敏感配置统一放 `.env`，禁止硬编码
