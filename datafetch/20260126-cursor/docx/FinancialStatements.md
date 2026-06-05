## 财务报表API接口文档

本文档描述了财务报表相关的API接口，包括：利润表、现金流量表、资产负债表。

### 目录

- [利润表](#利润表)
- [现金流量表](#现金流量表)
- [资产负债表](#资产负债表)
- [完整使用示例](#完整使用示例)
- [注意事项](#注意事项)

---

## 利润表

### 接口信息

- **接口名称**: 利润表
- **API接口地址**: `http://api.mairuiapi.com/hsstock/financial/income/{股票代码}/{您的licence}?st={开始时间}&et={结束时间}`
- **接口说明**: 根据《股票列表》得到的股票代码获取利润表；开始时间与结束时间格式为 YYYYMMDD（如 `20240101`）。不设置开始/结束时间则获取全部数据。
- **数据更新**: 每日0点
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码（带后缀） | `000001.SZ` |
| start_date | str | 否 | 开始时间 YYYYMMDD | `20240101` |
| end_date | str | 否 | 结束时间 YYYYMMDD | `20241231` |

### 数据库表结构

**表名**: `income_statement`（模型：`IncomeStatement`）

主键：`dm` + `jzrq` + `plrq`

字段较多，完整字段以模型文件 `api_clients/FinancialStatements/FinancialStatements_table.py` 为准；其字段命名与接口字段一一对应，已包含中文注释。

### 使用方法

#### 导入模块

```python
from api_clients.FinancialStatements.FinancialStatements import FinancialStatements
```

#### 初始化客户端

```python
client = FinancialStatements()
```

#### 获取数据

```python
data = client.fetch_income_statement(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231",
)
```

#### 获取并存储数据

```python
count = client.fetch_and_save_income_statement(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231",
)
```

---

## 现金流量表

### 接口信息

- **接口名称**: 现金流量表
- **API接口地址**: `http://api.mairuiapi.com/hsstock/financial/cashflow/{股票代码}/{您的licence}?st={开始时间}&et={结束时间}`
- **接口说明**: 根据《股票列表》得到的股票代码获取现金流量表；开始时间与结束时间格式为 YYYYMMDD（如 `20240101`）。不设置开始/结束时间则获取全部数据。
- **数据更新**: 每日0点
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码（带后缀） | `000001.SZ` |
| start_date | str | 否 | 开始时间 YYYYMMDD | `20240101` |
| end_date | str | 否 | 结束时间 YYYYMMDD | `20241231` |

### 数据库表结构

**表名**: `cashflow_statement`（模型：`CashFlowStatement`）

主键：`dm` + `jzrq` + `plrq`

说明：
- 现金流量表字段中存在如 `qz:fzgszfgsssgdglr`、`dysyzj(j:js)` 这类**不适合作为 Python 属性名**的字段。
- 在表模型中使用 `Column("原始字段名", ...)` 将数据库列名保持为原始字段名，同时使用安全的 Python 属性名访问/写入。
- 在客户端 `fetch_cashflow_statement` 中已完成对应字段映射。

### 使用方法

```python
from api_clients.FinancialStatements.FinancialStatements import FinancialStatements

client = FinancialStatements()
data = client.fetch_cashflow_statement("000001.SZ", start_date="20240101", end_date="20241231")
count = client.fetch_and_save_cashflow_statement("000001.SZ", start_date="20240101", end_date="20241231")
```

---

## 资产负债表

### 接口信息

- **接口名称**: 资产负债表
- **API接口地址**: `http://api.mairuiapi.com/hsstock/financial/balance/{股票代码}/{您的licence}?st={开始时间}&et={结束时间}`
- **接口说明**: 根据《股票列表》得到的股票代码获取资产负债表；开始时间与结束时间格式为 YYYYMMDD（如 `20240101`）。不设置开始/结束时间则获取全部数据。
- **数据更新**: 每日0点
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码（带后缀） | `000001.SZ` |
| start_date | str | 否 | 开始时间 YYYYMMDD | `20240101` |
| end_date | str | 否 | 结束时间 YYYYMMDD | `20241231` |

### 数据库表结构

**表名**: `balance_sheet`（模型：`BalanceSheet`）

主键：`dm` + `jzrq` + `plrq`

字段较多，完整字段以模型文件 `api_clients/FinancialStatements/FinancialStatements_table.py` 为准；已包含中文注释。

### 使用方法

```python
from api_clients.FinancialStatements.FinancialStatements import FinancialStatements

client = FinancialStatements()
data = client.fetch_balance_sheet("000001.SZ", start_date="20240101", end_date="20241231")
count = client.fetch_and_save_balance_sheet("000001.SZ", start_date="20240101", end_date="20241231")
```

---

## 完整使用示例

```python
from api_clients.FinancialStatements.FinancialStatements import FinancialStatements

client = FinancialStatements()

# 利润表
income = client.fetch_income_statement("000001.SZ", start_date="20240101", end_date="20241231")
income_saved = client.fetch_and_save_income_statement("000001.SZ", start_date="20240101", end_date="20241231")

# 现金流量表
cashflow = client.fetch_cashflow_statement("000001.SZ", start_date="20240101", end_date="20241231")
cashflow_saved = client.fetch_and_save_cashflow_statement("000001.SZ", start_date="20240101", end_date="20241231")

# 资产负债表
balance = client.fetch_balance_sheet("000001.SZ", start_date="20240101", end_date="20241231")
balance_saved = client.fetch_and_save_balance_sheet("000001.SZ", start_date="20240101", end_date="20241231")

print(len(income), income_saved, len(cashflow), cashflow_saved, len(balance), balance_saved)
```

---

## 注意事项

1. **License配置**: 请在 `.env` 中配置 `API_LICENSE`，或在初始化时传入 `license_key`。
2. **股票代码格式**: 本模块三个接口均要求股票代码带市场后缀（如 `000001.SZ`）。
3. **时间格式**: `start_date` / `end_date` 格式为 YYYYMMDD（如 `20240101`）。
4. **数据存储**: `fetch_and_save_*` 使用 `bulk_insert(..., ignore_duplicates=True)`，基于主键存在则 merge 更新/插入。
5. **异常**:
   - `ValidationException`: 参数校验失败
   - `APIException`: API 请求/响应异常
   - `DatabaseException`: 数据库存储异常

