# 项目环境要求

本文档详细说明金融数据平台项目所需的所有环境依赖。

## 一、系统环境要求

### 1.1 操作系统
- **Windows**: Windows 10/11 或更高版本
- **Linux**: Ubuntu 20.04+ / CentOS 7+ / Debian 11+ 或其他主流发行版
- **macOS**: macOS 10.15+ 或更高版本

### 1.2 系统资源
- **内存**: 建议至少 4GB RAM（运行 PostgreSQL + Python 应用）
- **磁盘空间**: 建议至少 10GB 可用空间（用于数据库、日志、依赖包）
- **网络**: 需要能够访问外部 API 数据源

---

## 二、Python 环境

### 2.1 Python 版本
- **必需版本**: Python **3.11.5**（严格版本要求）
- **不支持**: Python 3.10 及以下、Python 3.12+（可能存在兼容性问题）

### 2.2 Python 安装方式

#### Windows
```powershell
# 方式1: 从官网下载安装
# https://www.python.org/downloads/release/python-3115/

# 方式2: 使用 pyenv-win（推荐）
pyenv install 3.11.5
pyenv local 3.11.5
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev

# CentOS/RHEL
sudo yum install python3.11 python3.11-devel
```

#### macOS
```bash
# 使用 Homebrew
brew install python@3.11

# 或使用 pyenv
pyenv install 3.11.5
pyenv local 3.11.5
```

### 2.3 虚拟环境（强烈推荐）
```bash
# 创建虚拟环境
python3.11 -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

---

## 三、数据库环境

### 3.1 PostgreSQL 版本
- **推荐版本**: PostgreSQL **12+**（项目使用 PostgreSQL 16 进行测试）
- **最低版本**: PostgreSQL 10+
- **Docker 镜像**: `postgres:16-alpine`（如使用 Docker）

### 3.2 PostgreSQL 安装方式

#### Windows
- 从官网下载安装包: https://www.postgresql.org/download/windows/
- 或使用 Chocolatey: `choco install postgresql`

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
# 使用 Homebrew
brew install postgresql@16
brew services start postgresql@16
```

### 3.3 数据库初始化
```sql
-- 创建数据库（如需要）
CREATE DATABASE financial_data;

-- 创建用户（如需要）
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE financial_data TO your_user;
```

---

## 四、Python 依赖包

### 4.1 核心依赖
项目依赖包列表见 `requirements.txt`，主要包括：

#### 数据库相关
- `psycopg[binary]==3.2.4` - PostgreSQL 驱动
- `SQLAlchemy==2.0.46` - ORM 框架
- `alembic==1.18.2` - 数据库迁移工具

#### HTTP 请求
- `requests==2.31.0` - HTTP 客户端
- `httpx==0.25.2` - 异步 HTTP 客户端

#### 数据处理
- `pandas==2.3.3` - 数据处理库
- `numpy==2.3.5` - 数值计算库

#### 其他工具
- `python-dotenv==1.0.0` - 环境变量管理
- `loguru==0.7.2` - 日志处理
- `pydantic==2.5.2` - 数据验证
- `python-dateutil==2.8.2` - 日期时间处理
- `typing-extensions>=4.12.0,<5.0` - 类型扩展

### 4.2 安装依赖
```bash
# 确保已激活虚拟环境
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 系统级依赖（某些包可能需要）
- **编译工具**: `gcc`, `g++`, `make`（Linux/macOS）
- **PostgreSQL 开发库**: `libpq-dev` (Ubuntu) / `postgresql-devel` (CentOS)
- **Python 开发头文件**: `python3.11-dev` (Ubuntu) / `python3.11-devel` (CentOS)

---

## 五、环境变量配置

### 5.1 必需配置
在项目根目录创建 `.env` 文件，配置以下参数：

```env
# ========== 数据库配置（必需） ==========
DB_HOST=localhost          # 数据库主机地址
DB_PORT=5432              # 数据库端口
DB_NAME=financial_data    # 数据库名称
DB_USER=postgres          # 数据库用户名
DB_PASSWORD=your_password # 数据库密码

# ========== 数据库连接池配置（可选） ==========
DB_POOL_SIZE=10           # 连接池大小，默认 10
DB_MAX_OVERFLOW=20        # 最大溢出连接数，默认 20
DB_POOL_TIMEOUT=30        # 连接池超时时间（秒），默认 30
DB_POOL_RECYCLE=3600      # 连接回收时间（秒），默认 3600
DB_ECHO=False             # 是否打印 SQL 语句，默认 False
DB_CONNECT_TIMEOUT=30     # 连接超时时间（秒），默认 30
DB_CLIENT_ENCODING=UTF8   # 客户端编码，默认 UTF8

# ========== API 配置（必需，如果使用外部 API） ==========
API_LICENSE=your_license  # API 许可证密钥
API_REQUEST_RATE_LIMIT=60 # 每分钟请求次数限制，默认 60

# ========== 日志配置（可选） ==========
LOG_LEVEL=INFO            # 日志级别：DEBUG/INFO/WARNING/ERROR，默认 INFO
LOG_DIR=log               # 日志目录，默认 log
```

### 5.2 环境变量加载优先级
1. 系统环境变量（最高优先级）
2. `.env.utf8` 文件
3. `.env.local` 文件
4. `.env` 文件（最低优先级）

---

## 六、可选工具（推荐）

### 6.1 Docker & Docker Compose
如果使用 Docker 方式运行，需要安装：
- **Docker Desktop** (Windows/macOS): https://www.docker.com/products/docker-desktop
- **Docker Engine** (Linux): https://docs.docker.com/engine/install/

### 6.2 Git
用于版本控制：
- **Windows**: https://git-scm.com/download/win
- **Linux**: `sudo apt install git` 或 `sudo yum install git`
- **macOS**: `brew install git` 或已预装

### 6.3 代码编辑器/IDE（推荐）
- **VS Code**: https://code.visualstudio.com/
- **PyCharm**: https://www.jetbrains.com/pycharm/
- **Cursor**: https://cursor.sh/

---

## 七、环境验证

### 7.1 验证 Python 环境
```bash
python --version
# 应输出: Python 3.11.5

pip --version
# 应输出: pip 23.x.x 或更高版本
```

### 7.2 验证 PostgreSQL
```bash
# 检查 PostgreSQL 服务状态
# Windows
Get-Service postgresql*

# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# 测试连接
psql -U postgres -h localhost -p 5432 -d postgres
```

### 7.3 验证项目依赖
```bash
# 激活虚拟环境后
python -c "import sqlalchemy; print(sqlalchemy.__version__)"
python -c "import psycopg; print(psycopg.__version__)"
python -c "import pandas; print(pandas.__version__)"
```

### 7.4 验证数据库连接
```python
# 运行测试脚本
python -c "from config.database import init_database, check_database_health; init_database(); print(check_database_health())"
```

---

## 八、快速启动检查清单

- [ ] Python 3.11.5 已安装并可用
- [ ] 虚拟环境已创建并激活
- [ ] `requirements.txt` 中的所有依赖已安装
- [ ] PostgreSQL 已安装并运行
- [ ] 数据库已创建（或使用默认 `financial_data`）
- [ ] `.env` 文件已配置（包含数据库连接信息）
- [ ] 数据库连接测试通过
- [ ] 项目日志目录 `log/` 已创建（或可自动创建）

---

## 九、常见问题

### 9.1 Python 版本不匹配
**问题**: 提示 Python 版本错误  
**解决**: 确保使用 Python 3.11.5，使用 `pyenv` 或重新安装指定版本

### 9.2 PostgreSQL 连接失败
**问题**: `psycopg` 连接超时或拒绝连接  
**解决**: 
- 检查 PostgreSQL 服务是否运行
- 检查 `.env` 中的 `DB_HOST`、`DB_PORT` 是否正确
- 检查防火墙是否允许连接
- 确认 `DB_HOST` 不是 `127.0.0.0`（应使用 `127.0.0.1` 或 `localhost`）

### 9.3 依赖包安装失败
**问题**: `pip install` 报错，特别是 `psycopg` 或 `numpy`  
**解决**:
- 确保已安装编译工具（Linux/macOS）
- 确保已安装 PostgreSQL 开发库
- 使用 `pip install --upgrade pip` 升级 pip
- 对于 Windows，确保已安装 Visual C++ Build Tools

### 9.4 编码问题（Windows）
**问题**: `.env` 文件读取时出现编码错误  
**解决**: 
- 将 `.env` 文件另存为 UTF-8 编码
- 或创建 `.env.utf8` 文件（项目会优先加载）

---

## 十、Docker 方式运行（推荐用于生产环境）

如果使用 Docker，则无需单独安装 Python 和 PostgreSQL：

```bash
# 1. 确保已安装 Docker 和 Docker Compose
docker --version
docker compose version

# 2. 配置 .env 文件（同上）

# 3. 启动数据库
docker compose up -d db

# 4. 运行应用脚本
docker compose run --rm app python example/create_all_tables.py
```

---

## 十一、参考资源

- **Python 官方文档**: https://docs.python.org/3.11/
- **PostgreSQL 官方文档**: https://www.postgresql.org/docs/
- **SQLAlchemy 文档**: https://docs.sqlalchemy.org/
- **项目 README**: 查看项目根目录的 `README.md`

---

**最后更新**: 2026-03-13



