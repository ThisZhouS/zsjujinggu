## 历史分时交易数据API接口文档（HistoricalTradingData）

本文档描述历史/最新分时交易相关接口：
- HS 指数历史分时交易（hsindex/history）
- HS 指数最新分时交易（hsindex/latest）
- HS 股票最新分时交易（hsstock/latest）
- HK（文档所述）股票历史分时交易（hsstock/history）

### 目录

- [HS指数历史分时交易](#hs指数历史分时交易)
- [HS指数最新分时交易](#hs指数最新分时交易)
- [HS股票最新分时交易](#hs股票最新分时交易)
- [HK股票历史分时交易](#hk股票历史分时交易)
- [完整使用示例](#完整使用示例)
- [注意事项](#注意事项)

---

## HS指数历史分时交易

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hsindex/history/{指数代码.市场}/{分时级别}/{您的licence}?st={开始时间}&et={结束时间}`
- **接口说明**: 根据《指数列表》得到的指数代码与分时级别获取历史交易数据（交易时间升序）。分时级别支持 `5/15/30/60/d/w/m/y`；时间格式支持 `YYYYMMDD` 或 `YYYYMMDDhhmmss`；不传 `st/et` 则全量。
- **数据更新**: 日线及以上每日下午15:30开始更新，预计17:10完成

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| index_code | str | 是 | 指数代码.市场 | `000001.SH` |
| level | str | 是 | 分时级别 | `d` / `5` |
| start_date | str | 否 | 开始时间 | `20240601` / `20240101103000` |
| end_date | str | 否 | 结束时间 | `20250430` / `20241231235959` |

### 数据库表结构

**表名**: `hs_index_history_trading`（模型：`HsIndexHistoryTrading`）  
主键：`dm` + `t`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 指数代码 |
| t | string(25) | 交易时间 |
| o/h/l/c | float | 开/高/低/收 |
| v | float | 成交量 |
| a | float | 成交额 |
| pc | float | 前收盘价 |
| st | string(20) | 开始时间（记录用） |
| et | string(20) | 结束时间（记录用） |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.HistoricalTradingData.HistoricalTradingData import HistoricalTradingData

client = HistoricalTradingData()
data = client.fetch_hs_index_history_trading("000001.SH", level="d", start_date="20240601", end_date="20250430")
count = client.fetch_and_save_hs_index_history_trading("000001.SH", level="d", start_date="20240601", end_date="20250430")
```

---

## HS指数最新分时交易

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hsindex/latest/{指数代码.市场}/{分时级别}/{您的licence}`
- **接口说明**: 根据《指数列表》得到的指数代码与分时级别获取最新交易数据（交易时间升序）。分时级别支持 `5/15/30/60/d/w/m/y`。
- **数据更新**: 实时

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| index_code | str | 是 | 指数代码.市场 | `000001.SH` |
| level | str | 是 | 分时级别 | `d` / `5` |

### 数据库表结构

**表名**: `hs_index_latest_trading`（模型：`HsIndexLatestTrading`）  
主键：`dm` + `t`

### 使用方法

```python
from api_clients.HistoricalTradingData.HistoricalTradingData import HistoricalTradingData

client = HistoricalTradingData()
data = client.fetch_hs_index_latest_trading("000001.SH", level="d")
count = client.fetch_and_save_hs_index_latest_trading("000001.SH", level="d")
```

---

## HS股票最新分时交易

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hsstock/latest/{股票代码.市场}/{分时级别}/{除权方式}/{您的licence}?lt={最新条数}`
- **接口说明**: 根据《股票列表》得到的股票代码与分时级别获取最新交易数据（交易时间升序）。分时级别支持 `5/15/30/60/d/w/m/y`；日线以上除权方式支持 `n/f/b/fr/br`，分钟级仅 `n`；可通过 `lt` 获取最新 N 条。
- **数据更新**: 实时

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码.市场 | `000001.SZ` |
| level | str | 是 | 分时级别 | `d` / `5` |
| adjust_type | str | 是 | 除权方式 | `n` / `f` |
| latest | int | 否 | 最新条数（lt） | `5` |

### 数据库表结构

**表名**: `hs_stock_latest_trading`（模型：`HsStockLatestTrading`）  
主键：`dm` + `t`

### 使用方法

```python
from api_clients.HistoricalTradingData.HistoricalTradingData import HistoricalTradingData

client = HistoricalTradingData()
data = client.fetch_hs_stock_latest_trading("000001.SZ", level="d", adjust_type="n", latest=5)
count = client.fetch_and_save_hs_stock_latest_trading("000001.SZ", level="d", adjust_type="n", latest=5)
```

---

## HK股票历史分时交易

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hsstock/history/{股票代码.市场}/{分时级别}/{除权方式}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据《股票列表》得到的股票代码与分时级别获取历史交易数据（交易时间升序）。分时级别支持 `5/15/30/60/d/w/m/y`；日线以上除权方式支持 `n/f/b/fr/br`，分钟级仅 `n`；时间格式支持 `YYYYMMDD` 或 `YYYYMMDDhhmmss`；可通过 `lt` 获取最新 N 条。
- **数据更新**: 分钟级盘中更新；日线及以上每日15:30开始更新，预计17:10完成

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码.市场 | `000001.SZ` |
| level | str | 是 | 分时级别 | `d` / `5` |
| adjust_type | str | 是 | 除权方式 | `n` / `f` |
| start_date | str | 否 | 开始时间 | `20240101` / `20240101103000` |
| end_date | str | 否 | 结束时间 | `20241231` / `20241231235959` |
| latest | int | 否 | 最新条数（lt） | `100` |

### 数据库表结构

**表名**: `hk_stock_history_trading`（模型：`HkStockHistoryTrading`）  
主键：`dm` + `t` + `model`

### 使用方法

```python
from api_clients.HistoricalTradingData.HistoricalTradingData import HistoricalTradingData

client = HistoricalTradingData()
data = client.fetch_hk_stock_history_trading("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=100)
count = client.fetch_and_save_hk_stock_history_trading("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=100)
```

---

## 完整使用示例

```python
from api_clients.HistoricalTradingData.HistoricalTradingData import HistoricalTradingData

client = HistoricalTradingData()

client.fetch_and_save_hs_index_history_trading("000001.SH", level="d", start_date="20240601", end_date="20250430")
client.fetch_and_save_hs_index_latest_trading("000001.SH", level="d")
client.fetch_and_save_hs_stock_latest_trading("000001.SZ", level="d", adjust_type="n", latest=5)
client.fetch_and_save_hk_stock_history_trading("000001.SZ", level="d", adjust_type="n", start_date="20240101", end_date="20241231", latest=100)
```

---

## 注意事项

1. **License配置**: 请在 `.env` 中配置 `API_LICENSE`，或在初始化时传入 `license_key`。
2. **代码格式**: `index_code`/`stock_code` 使用文档所示的 `代码.市场` 格式（如 `000001.SH`、`000001.SZ`）。
3. **分时级别**: `level` 支持 `5/15/30/60/d/w/m/y`。
4. **除权方式**: `adjust_type` 支持 `n/f/b/fr/br`（分钟级仅 `n`）。

