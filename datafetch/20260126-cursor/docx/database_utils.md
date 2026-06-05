# 数据库工具使用文档

本文档介绍项目中数据库相关工具的使用方法。

## 目录

1. [数据库配置](#数据库配置)
2. [数据库连接管理](#数据库连接管理)
3. [数据库工具函数](#数据库工具函数)
4. [数据库迁移](#数据库迁移)
5. [使用示例](#使用示例)

## 数据库配置

### 环境变量配置

在 `.env` 文件中配置数据库相关参数：

```env
# 基础配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_data
DB_USER=postgres
DB_PASSWORD=your_password

# 连接池配置
DB_POOL_SIZE=10              # 连接池大小
DB_MAX_OVERFLOW=20           # 最大溢出连接数
DB_POOL_TIMEOUT=30           # 连接池超时时间（秒）
DB_POOL_RECYCLE=3600        # 连接回收时间（秒）
DB_ECHO=False                # 是否打印SQL语句
DB_CONNECT_TIMEOUT=10        # 连接超时时间（秒）
```

## 数据库连接管理

### 初始化数据库

```python
from config import init_database, create_tables

# 初始化数据库连接
init_database()

# 创建所有表
create_tables()
```

### 获取数据库会话

#### 方式1：使用生成器（推荐用于FastAPI等框架）

```python
from config import get_db

def some_function():
    db = next(get_db())
    try:
        # 使用db进行数据库操作
        result = db.query(Model).all()
        return result
    finally:
        db.close()
```

#### 方式2：使用上下文管理器

```python
from config import get_db_context

def some_function():
    with get_db_context() as db:
        # 使用db进行数据库操作
        result = db.query(Model).all()
        return result
```

### 数据库健康检查

```python
from config import check_database_health

health = check_database_health()
print(health)
# 输出示例：
# {
#     'status': 'healthy',
#     'response_time_ms': 12.34,
#     'pool_size': 10,
#     'checked_in': 8,
#     'checked_out': 2,
#     'overflow': 0
# }
```

### 表管理

```python
from config import get_table_names, table_exists, drop_tables

# 获取所有表名
tables = get_table_names()
print(f"数据库中的表: {tables}")

# 检查表是否存在
if table_exists("company_basic_info"):
    print("表存在")

# 删除所有表（谨慎使用）
# drop_tables()
```

## 数据库工具函数

### 批量插入数据

```python
from utils.db_utils import bulk_insert
from config import get_db_context
from api_clients.CompanyBasicInfo.CompanyBasicInfo_table import CompanyBasicInfo

data_list = [
    {"company_code": "000001", "company_name": "公司A"},
    {"company_code": "000002", "company_name": "公司B"},
]

with get_db_context() as session:
    count = bulk_insert(
        session=session,
        model_class=CompanyBasicInfo,
        data_list=data_list,
        ignore_duplicates=False,  # 是否忽略重复数据
    )
    print(f"成功插入 {count} 条记录")
```

### 批量更新数据

```python
from utils.db_utils import bulk_update
from config import get_db_context

data_list = [
    {"id": 1, "company_name": "更新后的公司名"},
    {"id": 2, "company_name": "另一个更新后的公司名"},
]

with get_db_context() as session:
    count = bulk_update(
        session=session,
        model_class=CompanyBasicInfo,
        data_list=data_list,
        update_keys=["id"],  # 用于匹配记录的键
    )
    print(f"成功更新 {count} 条记录")
```

### 执行原始SQL

```python
from utils.db_utils import execute_raw_sql

# 执行查询
sql = "SELECT COUNT(*) FROM company_basic_info WHERE company_code = :code"
result = execute_raw_sql(sql, parameters={"code": "000001"})

# 执行更新
sql = "UPDATE company_basic_info SET company_name = :name WHERE id = :id"
execute_raw_sql(
    sql,
    parameters={"name": "新名称", "id": 1}
)
```

### 查询结果转换为DataFrame

```python
from utils.db_utils import query_to_dataframe
from config import get_db_context

with get_db_context() as session:
    sql = """
        SELECT company_code, company_name, create_time
        FROM company_basic_info
        WHERE create_time >= :start_date
    """
    df = query_to_dataframe(
        session=session,
        sql=sql,
        parameters={"start_date": "2024-01-01"},
    )
    print(df.head())
```

### DataFrame写入数据库

```python
import pandas as pd
from utils.db_utils import dataframe_to_database

# 创建DataFrame
df = pd.DataFrame({
    "company_code": ["000001", "000002"],
    "company_name": ["公司A", "公司B"],
})

# 写入数据库
count = dataframe_to_database(
    df=df,
    table_name="company_basic_info",
    if_exists="append",  # "fail", "replace", "append"
    index=False,
    chunksize=1000,  # 分块写入，提高性能
)
print(f"成功写入 {count} 条记录")
```

### 获取记录数

```python
from utils.db_utils import get_record_count
from config import get_db_context
from api_clients.CompanyBasicInfo.CompanyBasicInfo_table import CompanyBasicInfo

with get_db_context() as session:
    count = get_record_count(session, CompanyBasicInfo)
    print(f"表中共有 {count} 条记录")
```

### 条件删除

```python
from utils.db_utils import delete_by_condition
from config import get_db_context
from api_clients.CompanyBasicInfo.CompanyBasicInfo_table import CompanyBasicInfo

with get_db_context() as session:
    # 删除创建时间早于2024-01-01的记录
    from sqlalchemy import and_
    from datetime import date
    
    condition = CompanyBasicInfo.create_time < date(2024, 1, 1)
    deleted_count = delete_by_condition(
        session=session,
        model_class=CompanyBasicInfo,
        condition=condition,
    )
    print(f"成功删除 {deleted_count} 条记录")
```

## 数据库迁移

### 初始化Alembic

项目已配置好Alembic，无需额外初始化。

### 创建迁移文件

```bash
# 自动生成迁移文件（推荐）
alembic revision --autogenerate -m "添加公司基本信息表"

# 手动创建空迁移文件
alembic revision -m "手动迁移描述"
```

### 执行迁移

```bash
# 升级到最新版本
alembic upgrade head

# 升级到指定版本
alembic upgrade <revision_id>

# 升级一个版本
alembic upgrade +1
```

### 回滚迁移

```bash
# 回滚一个版本
alembic downgrade -1

# 回滚到指定版本
alembic downgrade <revision_id>

# 回滚到基础版本
alembic downgrade base
```

### 查看迁移历史

```bash
# 查看当前版本
alembic current

# 查看迁移历史
alembic history

# 查看指定版本的详细信息
alembic history <revision_id>
```

## 使用示例

### 完整的数据保存流程

```python
from config import init_database, get_db_context
from utils.db_utils import bulk_insert
from api_clients.CompanyBasicInfo.CompanyBasicInfo_table import CompanyBasicInfo

# 1. 初始化数据库
init_database()

# 2. 准备数据
data_list = [
    {
        "company_code": "000001",
        "company_name": "平安银行",
        "create_time": "2024-01-01",
    },
    {
        "company_code": "000002",
        "company_name": "万科A",
        "create_time": "2024-01-01",
    },
]

# 3. 批量插入
with get_db_context() as session:
    try:
        count = bulk_insert(
            session=session,
            model_class=CompanyBasicInfo,
            data_list=data_list,
            ignore_duplicates=True,
        )
        print(f"成功保存 {count} 条记录")
    except Exception as e:
        print(f"保存失败: {e}")
```

### 数据查询和分析

```python
from config import get_db_context
from utils.db_utils import query_to_dataframe
import pandas as pd

with get_db_context() as session:
    # 查询数据
    sql = """
        SELECT 
            company_code,
            company_name,
            create_time
        FROM company_basic_info
        WHERE create_time >= :start_date
        ORDER BY create_time DESC
    """
    
    df = query_to_dataframe(
        session=session,
        sql=sql,
        parameters={"start_date": "2024-01-01"},
    )
    
    # 使用pandas进行分析
    print(f"总记录数: {len(df)}")
    print(df.describe())
```

## 注意事项

1. **连接管理**：始终使用上下文管理器或确保正确关闭数据库连接
2. **事务处理**：批量操作会自动提交事务，失败时会自动回滚
3. **性能优化**：对于大量数据，使用`chunksize`参数进行分块处理
4. **错误处理**：所有数据库操作都应包含适当的异常处理
5. **连接池**：合理配置连接池参数，避免连接数过多或过少

## 相关文件

- `config/database.py` - 数据库配置和连接管理
- `config/settings.py` - 应用配置（包含数据库配置）
- `utils/db_utils.py` - 数据库工具函数
- `alembic/` - 数据库迁移配置


