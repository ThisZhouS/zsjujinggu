# 项目结构说明

本文档详细说明金融数据平台的项目结构、目录职责和模块组织。

## 目录概览

```
financial_data_platform/
├── api_clients/         # API 客户端实现和数据模型
├── config/              # 配置管理
├── core/                # 核心异常定义
├── utils/               # 工具函数
├── example/             # 生产环境脚本
├── useful/              # 开发和测试工具
├── scripts/             # 部署与调度脚本
├── log/                 # 日志目录
├── docx/                # 模块文档
├── alembic/             # 数据库迁移配置
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env
```

---

## 核心模块

### config/ - 配置管理

负责应用配置的加载和管理，包括数据库连接参数、API 密钥等。

| 文件 | 说明 |
|------|------|
| `settings.py` | 全局配置类，从环境变量加载配置 |
| `database.py` | 数据库连接管理、会话工厂、表操作 |

**主要功能：**
- 环境变量加载（支持 UTF-8/GBK 编码兼容）
- 数据库连接池管理
- 会话上下文管理器
- 表创建/删除/查询
- 数据库健康检查

**使用示例：**
```python
from config.settings import settings
from config.database import init_database, get_db_context

# 初始化数据库
init_database()

# 获取配置
print(settings.DB_HOST)
print(settings.API_LICENSE)

# 使用数据库会话
with get_db_context() as session:
    # 执行数据库操作
    pass
```

### core/ - 核心异常定义

自定义异常类，用于统一错误处理。

| 文件 | 说明 |
|------|------|
| `exceptions.py` | 自定义异常类定义 |

**异常类型：**
- `APIException`: API 请求相关异常
- `DatabaseException`: 数据库操作相关异常
- `ValidationException`: 参数验证相关异常

**使用示例：**
```python
from core.exceptions import APIException, DatabaseException, ValidationException

if not stock_code:
    raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")
```

### utils/ - 工具函数

提供项目中常用的工具函数。

| 文件 | 说明 |
|------|------|
| `logger.py` | 日志管理（基于 loguru） |
| `db_utils.py` | 数据库工具函数（批量插入等） |
| `date_utils.py` | 日期处理工具 |
| `script_base.py` | 脚本基类和公共函数 |

**主要功能：**
- 日志记录和格式化
- 批量数据插入
- 日期格式转换和计算
- 脚本路径管理
- 股票代码获取
- 日期范围管理

**使用示例：**
```python
from utils.logger import get_logger
from utils.script_base import add_project_root_to_sys_path, get_stock_codes_from_db

# 获取日志器
logger = get_logger("my_module")
logger.info("开始处理")

# 获取股票代码
codes = get_stock_codes_from_db(max_count=10)
logger.info("获取到 {} 个股票代码", len(codes))
```

---

## 数据层

### api_clients/ - API 客户端实现

包含所有外部 API 的客户端实现和对应的数据模型。

每个 API 模块包含：
- `{ModuleName}.py`: API 客户端类，处理 HTTP 请求和数据转换
- `{ModuleName}_table.py`: SQLAlchemy 表模型，定义数据库表结构

#### 模块列表

| 模块名 | 说明 | 接口数量 |
|--------|------|---------|
| CompanyBasicInfo | 公司基本信息 | 4 |
| CompanyHistoricalData | 公司历史数据 | 3 |
| FinancialCoreIndicators | 财务核心指标 | 3 |
| FinancialQuartersEvents | 财务季度事件 | 4 |
| FinancialStatements | 财务报表 | 3 |
| HistoricalTradingData | 历史交易数据 | 4 |
| IndexRealTimeData | 指数实时数据 | 1 |
| IndexRelationshipMapping | 指数关系映射 | 4 |
| IndexTechnicalIndicators | 指数技术指标 | 5 |
| MajorMarketLists | 主要市场列表 | 5 |
| MarketDepthData | 市场深度数据 | 4 |
| OtherMarketLists | 其他市场列表 | 4 |
| RealTimeTradingInterfaces | 实时交易接口 | 5 |
| ShanghaiShenzhenTechnicalIndicators | 沪深技术指标 | 4 |
| ShareholderBasicInfo | 股东基本信息 | 3 |
| ShareholderDetailedData | 股东详细数据 | 4 |
| StockPoolClassification | 股票池分类 | 5 |
| StockRealTimeData | 股票实时数据 | 5 |
| TradingDetailsSpecialData | 交易明细特殊数据 | 3 |

#### API 客户端标准结构

```python
class FinancialCoreIndicators:
    """财务核心指标 API 客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key=None):
        self.license_key = license_key or settings.API_LICENSE

    def _make_request(self, url):
        """发送 HTTP 请求并返回 JSON 数据。"""
        # 统一的请求逻辑
        pass

    def fetch_financial_main_indicators(self, stock_code, start_date=None, end_date=None):
        """获取财务主要指标数据。"""
        # API 调用
        pass

    def fetch_and_save_financial_main_indicators(self, stock_code, start_date=None, end_date=None):
        """获取并存储财务主要指标数据。"""
        # 获取数据并保存到数据库
        pass
```

---

## 脚本层

### example/ - 生产环境脚本

用于生产环境的批量数据同步，被部署脚本调用。

**特点：**
- 每个脚本处理一个完整的业务模块
- 串行执行，按顺序调用多个 API 接口
- 支持参数控制和灵活配置
- 适合生产环境的批量同步

**主要脚本：**
- `company_basic_info_sync.py` - 公司基本信息同步
- `financial_core_indicators_sync.py` - 财务核心指标同步
- `financial_statements_sync.py` - 财务报表同步
- `historical_trading_data_sync.py` - 历史交易数据同步
- `stock_real_time_data_sync.py` - 股票实时数据同步
- 以及其他 12 个模块同步脚本

**调用方式：**
```bash
# 通过部署脚本调用
bash scripts/init_full_sync.sh      # 全量初始化
bash scripts/run_incremental.sh      # 增量更新

# 或直接运行
python example/major_market_lists_sync.py
```

### useful/ - 开发和测试工具

用于开发环境的单接口测试和调试。

**特点：**
- 每个脚本处理一个 API 接口
- 可独立运行，无相互依赖
- 支持高度并发执行
- 支持断点续跑和进度跟踪
- 适合大规模全量数据获取

**脚本数量：** 69 个独立接口脚本

**命名规范：**
`{模块名}_fetch_and_save_{具体数据类型}.py`

**示例：**
- `financial_major_market_lists_fetch_and_save_stock_list.py`
- `financial_core_indicators_fetch_and_save_financial_main_indicators.py`
- `historical_trading_data_fetch_and_save_hs_stock_history_trading.py`

**调用方式：**
```bash
# 单独运行
python useful/major_market_lists_fetch_and_save_stock_list.py

# 通过并发脚本运行
python scripts/run_useful_full_fetch.py --concurrency 5 --global-qps 10

# 指定脚本运行
python scripts/run_useful_full_fetch.py --scripts major_market_lists_fetch_and_save_stock_list.py
```

---

## 部署与调度

### scripts/ - 部署脚本

| 脚本 | 说明 |
|------|------|
| `init_full_sync.sh` | 全量初始化脚本，首次部署时执行 |
| `run_incremental.sh` | 增量同步脚本，用于日常数据更新 |
| `run_useful_full_fetch.py` | 并发执行 useful/ 脚本的 Python 脚本 |
| `setup_cron.sh` | 配置 cron 定时任务 |
| `run_20260323_phase1.sh` | 一期项目特定运行脚本 |

---

## 数据库管理

### alembic/ - 数据库迁移

Alembic 数据库迁移工具配置。

| 文件 | 说明 |
|------|------|
| `env.py` | Alembic 环境配置 |
| `script.py.mako` | 迁移脚本模板 |
| `versions/` | 迁移版本文件目录 |

**使用方式：**
```bash
# 生成迁移文件
alembic revision --autogenerate -m "描述信息"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

---

## 其他目录

| 目录 | 说明 |
|------|------|
| `log/` | 日志文件目录，按模块和日期组织 |
| `docx/` | 模块文档目录，包含各 API 的详细说明 |
| `models/` | 数据模型（已废弃，使用 api_clients/*_table.py） |

---

## 依赖关系

```
config.settings → 标准库
config.database → config.settings, core.exceptions
core.exceptions → 标准库
utils.* → config.*, core.*
api_clients.* → config.*, core.*, utils.*
example/* → api_clients.*
useful/* → api_clients.*
scripts/* → example/*
alembic/env.py → config.database
```

所有依赖关系都是单向的，无循环依赖。

---

## 配置文件

| 文件 | 说明 |
|------|------|
| `.env` | 环境变量配置（不提交到 git） |
| `.env.utf8` | UTF-8 编码的环境变量文件（优先加载） |
| `requirements.txt` | Python 依赖包列表 |
| `Dockerfile` | Docker 镜像构建文件 |
| `docker-compose.yml` | Docker 服务编排文件 |
| `.dockerignore` | Docker 构建忽略文件 |

---

## 开发指南

### 1. 添加新的 API 客户端

1. 在 `api_clients/` 下创建新目录 `NewModule/`
2. 创建 `NewModule/NewModule.py` 实现客户端类
3. 创建 `NewModule/NewModule_table.py` 定义表模型
4. 创建 `NewModule/__init__.py`（空文件）
5. 在 `api_clients/` 目录运行测试

### 2. 添加新的同步脚本

**对于 example/：**
1. 创建 `example/new_module_sync.py`
2. 使用 `utils.script_base` 中的公共函数
3. 实现 `main()` 函数
4. 在 `scripts/init_full_sync.sh` 中添加调用

**对于 useful/：**
1. 创建 `useful/new_module_fetch_and_save_xxx.py`
2. 使用 `utils.script_base` 中的公共函数
3. 实现 `main()` 函数
4. 可通过 `scripts/run_useful_full_fetch.py` 调用

### 3. 数据库迁移

1. 修改表模型后生成迁移文件
2. 审查迁移文件确保正确
3. 执行迁移应用到数据库
4. 验证表结构和数据完整性

---

## 注意事项

1. **API 密钥安全**：所有敏感信息必须通过环境变量配置，禁止硬编码
2. **数据库连接**：使用 `get_db_context()` 上下文管理器确保资源释放
3. **日志记录**：使用 `utils.logger.get_logger()` 获取日志器
4. **错误处理**：使用自定义异常类，提供错误代码和描述
5. **类型注解**：所有函数必须包含类型注解
6. **代码风格**：遵循 PEP 8 规范

---

**最后更新**: 2026-04-09
