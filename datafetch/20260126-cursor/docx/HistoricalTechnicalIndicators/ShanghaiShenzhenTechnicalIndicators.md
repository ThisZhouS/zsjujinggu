## 沪深指数历史分时技术指标API接口文档（ShanghaiShenzhenTechnicalIndicators）

本文档描述沪深指数历史分时技术指标接口：
- 历史分时MA
- 历史分时MACD
- 历史分时BOLL
- 历史分时KDJ

### 目录

- [历史分时MA](#历史分时ma)
- [历史分时MACD](#历史分时macd)
- [历史分时BOLL](#历史分时boll)
- [历史分时KDJ](#历史分时kdj)
- [完整使用示例](#完整使用示例)
- [注意事项](#注意事项)

---

## 历史分时MA

### 接口信息

- **接口名称**: 历史分时MA
- **API接口地址**: `http://api.mairuiapi.com/hsindex/history/ma/{指数代码}/{分时级别}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据《指数列表》得到的指数代码和分时级别获取历史MA数据（交易时间升序）。分时级别支持 `5/15/30/60/d/w/m/y`。时间格式支持 `YYYYMMDD` 或 `YYYYMMDDhhmmss`。可用 `lt` 获取最新 N 条。
- **数据更新**: 分钟级盘中更新；日线及以上每日15:35更新
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| index_code | str | 是 | 指数代码 | `000001.SH` |
| level | str | 是 | 分时级别 | `d` / `5` |
| start_date | str | 否 | 开始时间 | `20240101` / `20240101103000` |
| end_date | str | 否 | 结束时间 | `20241231` / `20241231235959` |
| latest | int | 否 | 最新条数（lt） | `10` |

### 数据库表结构

**表名**: `index_history_ma`（模型：`IndexHistoryMa`）  
主键：`dm` + `t`

字段：`ma3/ma5/ma10/ma15/ma20/ma30/ma60/ma120/ma200/ma250`（float，缺失则为 null）等，详见模型文件 `api_clients/ShanghaiShenzhenTechnicalIndicators/ShanghaiShenzhenTechnicalIndicators_table.py`。

### 使用方法

```python
from api_clients.ShanghaiShenzhenTechnicalIndicators.ShanghaiShenzhenTechnicalIndicators import (
    ShanghaiShenzhenTechnicalIndicators,
)

client = ShanghaiShenzhenTechnicalIndicators()
data = client.fetch_history_ma("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
count = client.fetch_and_save_history_ma("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
```

---

## 历史分时MACD

### 接口信息

- **接口名称**: 历史分时MACD
- **API接口地址**: `http://api.mairuiapi.com/hsindex/history/macd/{指数代码}/{分时级别}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据指数代码和分时级别获取历史MACD数据（交易时间升序）。

### 数据库表结构

**表名**: `index_history_macd`（模型：`IndexHistoryMacd`）  
主键：`dm` + `t`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 指数代码 |
| t | string(25) | 交易时间 |
| diff | float | DIFF值 |
| dea | float | DEA值 |
| macd | float | MACD值 |
| ema12 | float | EMA（12）值 |
| ema26 | float | EMA（26）值 |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.ShanghaiShenzhenTechnicalIndicators.ShanghaiShenzhenTechnicalIndicators import (
    ShanghaiShenzhenTechnicalIndicators,
)

client = ShanghaiShenzhenTechnicalIndicators()
data = client.fetch_history_macd("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
count = client.fetch_and_save_history_macd("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
```

---

## 历史分时BOLL

### 接口信息

- **接口名称**: 历史分时BOLL
- **API接口地址**: `http://api.mairuiapi.com/hsindex/history/boll/{指数代码}/{分时级别}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据指数代码和分时级别获取历史BOLL数据（交易时间升序）。

### 数据库表结构

**表名**: `index_history_boll`（模型：`IndexHistoryBoll`）  
主键：`dm` + `t`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 指数代码 |
| t | string(25) | 交易时间 |
| u | float | 上轨 |
| d | float | 下轨 |
| m | float | 中轨 |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.ShanghaiShenzhenTechnicalIndicators.ShanghaiShenzhenTechnicalIndicators import (
    ShanghaiShenzhenTechnicalIndicators,
)

client = ShanghaiShenzhenTechnicalIndicators()
data = client.fetch_history_boll("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
count = client.fetch_and_save_history_boll("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
```

---

## 历史分时KDJ

### 接口信息

- **接口名称**: 历史分时KDJ
- **API接口地址**: `http://api.mairuiapi.com/hsindex/history/kdj/{指数代码}/{分时级别}/{您的licence}?st={开始时间}&et={结束时间}&lt={最新条数}`
- **接口说明**: 根据指数代码和分时级别获取历史KDJ数据（交易时间升序）。

### 数据库表结构

**表名**: `index_history_kdj`（模型：`IndexHistoryKdj`）  
主键：`dm` + `t`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 指数代码 |
| t | string(25) | 交易时间 |
| k | float | K值 |
| d | float | D值 |
| j | float | J值 |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.ShanghaiShenzhenTechnicalIndicators.ShanghaiShenzhenTechnicalIndicators import (
    ShanghaiShenzhenTechnicalIndicators,
)

client = ShanghaiShenzhenTechnicalIndicators()
data = client.fetch_history_kdj("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
count = client.fetch_and_save_history_kdj("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=10)
```

---

## 完整使用示例

```python
from api_clients.ShanghaiShenzhenTechnicalIndicators.ShanghaiShenzhenTechnicalIndicators import (
    ShanghaiShenzhenTechnicalIndicators,
)

client = ShanghaiShenzhenTechnicalIndicators()

client.fetch_and_save_history_ma("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=100)
client.fetch_and_save_history_macd("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=100)
client.fetch_and_save_history_boll("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=100)
client.fetch_and_save_history_kdj("000001.SH", level="d", start_date="20240101", end_date="20241231", latest=100)
```

---

## 注意事项

1. **License配置**: 请在 `.env` 中配置 `API_LICENSE`，或在初始化时传入 `license_key`。
2. **指数代码格式**: 本模块接口指数代码示例为 `000001.SH`（带后缀）。
3. **分时级别**: `level` 支持 `5/15/30/60/d/w/m/y`。
4. **时间格式**: 支持 `YYYYMMDD` 或 `YYYYMMDDhhmmss`；不传 `start_date/end_date` 则获取全量历史数据。

