## 指数技术指标API接口文档（IndexTechnicalIndicators）

本文档描述指数/行情技术指标相关接口：
- 历史分时BOLL
- 历史分时KDJ
- 历史分时MA
- 历史分时MACD
- 行情指标

### 目录

- [历史分时BOLL](#历史分时boll)
- [历史分时KDJ](#历史分时kdj)
- [历史分时MA](#历史分时ma)
- [历史分时MACD](#历史分时macd)
- [行情指标](#行情指标)
- [完整使用示例](#完整使用示例)
- [注意事项](#注意事项)

---

## 历史分时BOLL

### 接口信息

- **接口名称**: 历史分时BOLL
- **API接口地址**: `http://api.mairuiapi.com/hsstock/history/boll/{股票代码}/{分时级别}/{除权类型}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据股票代码和分时级别获取历史BOLL数据（交易时间升序）。分时级别支持 `5/15/30/60/d/w/m/y`；日线以上除权方式支持 `n/f/b/fr/br`，分钟级仅支持 `n`。时间格式支持 `YYYYMMDD` 或 `YYYYMMDDhhmmss`。可用 `lt` 获取最新 N 条。
- **数据更新**: 分钟级盘中更新；日线及以上每日15:35更新
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码 | `000001.SZ` |
| level | str | 是 | 分时级别 | `d` / `5` |
| adjust_type | str | 是 | 除权类型 | `n` / `f` |
| start_date | str | 否 | 开始时间 | `20240101` / `20240101103000` |
| end_date | str | 否 | 结束时间 | `20241231` / `20241231235959` |
| latest | int | 否 | 最新条数（lt） | `10` |

### 数据库表结构

**表名**: `history_boll`（模型：`HistoryBoll`）  
主键：`dm` + `t` + `model`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 股票代码 |
| t | string(25) | 交易时间 |
| model | string(10) | 除权方式 |
| u | float | 上轨 |
| d | float | 下轨 |
| m | float | 中轨 |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators import IndexTechnicalIndicators

client = IndexTechnicalIndicators()
data = client.fetch_history_boll(
    "000001.SZ",
    level="d",
    adjust_type="n",
    start_date="20240101",
    end_date="20241231",
    latest=10,
)
count = client.fetch_and_save_history_boll(
    "000001.SZ",
    level="d",
    adjust_type="n",
    start_date="20240101",
    end_date="20241231",
    latest=10,
)
```

---

## 历史分时KDJ

### 接口信息

- **接口名称**: 历史分时KDJ
- **API接口地址**: `http://api.mairuiapi.com/hsstock/history/kdj/{股票代码}/{分时级别}/{除权类型}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据股票代码和分时级别获取历史KDJ数据（交易时间升序）。分时级别与除权方式规则同上。

### 数据库表结构

**表名**: `history_kdj`（模型：`HistoryKdj`）  
主键：`dm` + `t` + `model`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 股票代码 |
| t | string(25) | 交易时间 |
| model | string(10) | 除权方式 |
| k | float | K值 |
| d | float | D值 |
| j | float | J值 |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators import IndexTechnicalIndicators

client = IndexTechnicalIndicators()
data = client.fetch_history_kdj("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=10)
count = client.fetch_and_save_history_kdj("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=10)
```

---

## 历史分时MA

### 接口信息

- **接口名称**: 历史分时MA
- **API接口地址**: `http://api.mairuiapi.com/hsstock/history/ma/{股票代码}/{分时级别}/{除权类型}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据股票代码和分时级别获取历史MA数据（交易时间升序）。分时级别与除权方式规则同上。

### 数据库表结构

**表名**: `history_ma`（模型：`HistoryMa`）  
主键：`dm` + `t` + `model`

字段：`ma3/ma5/ma10/ma15/ma20/ma30/ma60/ma120/ma200/ma250`（float，缺失则为 null）等，详见模型文件 `api_clients/IndexTechnicalIndicators/IndexTechnicalIndicators_table.py`。

### 使用方法

```python
from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators import IndexTechnicalIndicators

client = IndexTechnicalIndicators()
data = client.fetch_history_ma("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=10)
count = client.fetch_and_save_history_ma("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=10)
```

---

## 历史分时MACD

### 接口信息

- **接口名称**: 历史分时MACD
- **API接口地址**: `http://api.mairuiapi.com/hsstock/history/macd/{股票代码}/{分时级别}/{除权类型}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据股票代码和分时级别获取历史MACD数据（交易时间升序）。分时级别与除权方式规则同上。

### 数据库表结构

**表名**: `history_macd`（模型：`HistoryMacd`）  
主键：`dm` + `t` + `model`

| 字段 | 类型 | 说明 |
|---|---|---|
| diff | float | DIFF值 |
| dea | float | DEA值 |
| macd | float | MACD值 |
| ema12 | float | EMA（12）值 |
| ema26 | float | EMA（26）值 |

### 使用方法

```python
from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators import IndexTechnicalIndicators

client = IndexTechnicalIndicators()
data = client.fetch_history_macd("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=10)
count = client.fetch_and_save_history_macd("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=10)
```

---

## 行情指标

### 接口信息

- **接口名称**: 行情指标
- **API接口地址**: `http://api.mairuiapi.com/hsstock/indicators/{股票代码}/{您的licence}?st={开始时间}&et={结束时间}`
- **接口说明**: 获取各项行情指标；时间格式为 YYYYMMDD，不传则全量。
- **数据更新**: 每日下午16:30开始更新，预计20:00完成更新

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码 | `000001.SZ` |
| start_date | str | 否 | 开始时间 YYYYMMDD | `20240101` |
| end_date | str | 否 | 结束时间 YYYYMMDD | `20241231` |

### 数据库表结构

**表名**: `market_indicators`（模型：`MarketIndicators`）  
主键：`dm` + `time`

说明：接口字段存在 `3d/5d/10d/3t/5t/10t` 这类非法 Python 标识符，模型中已用 `d3/d5/d10/t3/t5/t10` 映射到原始列名。

### 使用方法

```python
from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators import IndexTechnicalIndicators

client = IndexTechnicalIndicators()
data = client.fetch_market_indicators("000001.SZ", start_date="20240101", end_date="20241231")
count = client.fetch_and_save_market_indicators("000001.SZ", start_date="20240101", end_date="20241231")
```

---

## 完整使用示例

```python
from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators import IndexTechnicalIndicators

client = IndexTechnicalIndicators()

client.fetch_and_save_history_boll("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=100)
client.fetch_and_save_history_kdj("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=100)
client.fetch_and_save_history_ma("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=100)
client.fetch_and_save_history_macd("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=100)
client.fetch_and_save_market_indicators("000001.SZ", start_date="20240101", end_date="20241231")
```

---

## 注意事项

1. **License配置**: 请在 `.env` 中配置 `API_LICENSE`，或在初始化时传入 `license_key`。
2. **股票代码格式**: 本模块接口股票代码示例为 `000001.SZ`（带后缀）。
3. **分时级别**: `level` 支持 `5/15/30/60/d/w/m/y`。
4. **除权类型**: `adjust_type` 支持 `n/f/b/fr/br`（分钟级仅 `n`）。
5. **时间格式**: 历史分时接口支持 `YYYYMMDD` 或 `YYYYMMDDhhmmss`；行情指标接口为 `YYYYMMDD`。

