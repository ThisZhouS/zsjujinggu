# RealTimeTradingInterfaces 实时交易数据接口

## 1. 实时交易数据（全部 券商数据源）

- **接口名**：实时交易数据（全部 券商数据源）
- **API接口地址**：`http://a.mairuiapi.com/hsrl/ssjy/all/您的licence`
- **接口说明**：一次性获取《股票列表》中所有股票的实时交易数据（您可以理解为日线的最新数据），该接口仅限钻石版和包年版证书使用且限制每分钟请求1次。
- **数据更新**：实时
- **请求频率**：1分钟1次

### 表结构（`realtime_trading_all_broker`）

| 字段名 | 类型 | 说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| p | number | 最新价 |  |
| o | number | 开盘价 |  |
| h | number | 最高价 |  |
| l | number | 最低价 |  |
| yc | number | 前收盘价 |  |
| cje | number | 成交总额 |  |
| v | number | 成交总量 |  |
| pv | number | 原始成交总量 |  |
| ud | float | 涨跌额 |  |
| pc | float | 涨跌幅 |  |
| zf | float | 振幅 |  |
| t | string | 更新时间 | √ |
| pe | number | 市盈率 |  |
| tr | number | 换手率 |  |
| pb_ratio | number | 市净率 |  |
| tv | number | 成交量 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces import RealTimeTradingInterfaces

client = RealTimeTradingInterfaces()

# 仅获取
data = client.fetch_realtime_trading_all_broker()

# 获取并存储
count = client.fetch_and_save_realtime_trading_all_broker()
```

## 2. 实时交易数据（全部 网络数据源）

- **接口名**：实时交易数据（全部 网络数据源）
- **API接口地址**：`http://a.mairuiapi.com/hsrl/real/all/您的licence`
- **接口说明**：一次性获取《股票列表》中所有股票的实时交易数据（您可以理解为日线的最新数据），该接口仅限钻石版和包年版证书使用且限制每分钟请求1次。
- **数据更新**：交易时间段每1分钟
- **请求频率**：1分钟1次

### 表结构（`realtime_trading_all_network`）

| 字段名 | 类型 | 说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| fm | number | 五分钟涨跌幅（%） |  |
| h | number | 最高价（元） |  |
| hs | number | 换手（%） |  |
| lb | number | 量比（%） |  |
| l | number | 最低价（元） |  |
| lt | number | 流通市值（元） |  |
| o | number | 开盘价（元） |  |
| pe | number | 市盈率（动态） |  |
| pc | number | 涨跌幅（%） |  |
| p | number | 当前价格（元） |  |
| sz | number | 总市值（元） |  |
| cje | number | 成交额（元） |  |
| ud | number | 涨跌额（元） |  |
| v | number | 成交量（手） |  |
| yc | number | 昨日收盘价（元） |  |
| zf | number | 振幅（%） |  |
| zs | number | 涨速（%） |  |
| sjl | number | 市净率 |  |
| zdf60 | number | 60日涨跌幅（%） |  |
| zdfnc | number | 年初至今涨跌幅（%） |  |
| t | string | 更新时间yyyy-MM-ddHH:mm:ss | √ |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces import RealTimeTradingInterfaces

client = RealTimeTradingInterfaces()

# 仅获取
data = client.fetch_realtime_trading_all_network()

# 获取并存储
count = client.fetch_and_save_realtime_trading_all_network()
```

## 3. 实时交易数据（券商数据源）

- **接口名**：实时交易数据（券商数据源）
- **API接口地址**：`http://api.mairuiapi.com/hsstock/real/time/股票代码/证书您的licence`
- **接口说明**：根据《股票列表》得到的股票代码获取实时交易数据（您可以理解为日线的最新数据）。
- **数据更新**：实时
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`realtime_trading_broker`）

| 字段名 | 类型 | 说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| p | number | 最新价 |  |
| o | number | 开盘价 |  |
| h | number | 最高价 |  |
| l | number | 最低价 |  |
| yc | number | 前收盘价 |  |
| cje | number | 成交总额 |  |
| v | number | 成交总量 |  |
| pv | number | 原始成交总量 |  |
| ud | float | 涨跌额 |  |
| pc | float | 涨跌幅 |  |
| zf | float | 振幅 |  |
| t | string | 更新时间 | √ |
| pe | number | 市盈率 |  |
| tr | number | 换手率 |  |
| pb_ratio | number | 市净率 |  |
| tv | number | 成交量 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces import RealTimeTradingInterfaces

client = RealTimeTradingInterfaces()

stock_code = "000001"

# 仅获取
data = client.fetch_realtime_trading_broker(stock_code=stock_code)

# 获取并存储
count = client.fetch_and_save_realtime_trading_broker(stock_code=stock_code)
```

## 4. 实时交易数据（网络数据源）

- **接口名**：实时交易数据（网络数据源）
- **API接口地址**：`http://api.mairuiapi.com/hsrl/ssjy/股票代码(如000001)/您的licence`
- **接口说明**：根据《股票列表》得到的股票代码获取实时交易数据（您可以理解为日线的最新数据），该接口为网络公开数据源，非券商数据源。
- **数据更新**：交易时间段每1分钟
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`realtime_trading_network`）

| 字段名 | 类型 | 说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| fm | number | 五分钟涨跌幅（%） |  |
| h | number | 最高价（元） |  |
| hs | number | 换手（%） |  |
| lb | number | 量比（%） |  |
| l | number | 最低价（元） |  |
| lt | number | 流通市值（元） |  |
| o | number | 开盘价（元） |  |
| pe | number | 市盈率（动态） |  |
| pc | number | 涨跌幅（%） |  |
| p | number | 当前价格（元） |  |
| sz | number | 总市值（元） |  |
| cje | number | 成交额（元） |  |
| ud | number | 涨跌额（元） |  |
| v | number | 成交量（手） |  |
| yc | number | 昨日收盘价（元） |  |
| zf | number | 振幅（%） |  |
| zs | number | 涨速（%） |  |
| sjl | number | 市净率 |  |
| zdf60 | number | 60日涨跌幅（%） |  |
| zdfnc | number | 年初至今涨跌幅（%） |  |
| t | string | 更新时间yyyy-MM-ddHH:mm:ss | √ |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces import RealTimeTradingInterfaces

client = RealTimeTradingInterfaces()

stock_code = "000001"

# 仅获取
data = client.fetch_realtime_trading_network(stock_code=stock_code)

# 获取并存储
count = client.fetch_and_save_realtime_trading_network(stock_code=stock_code)
```

## 5. 实时交易数据（多股）

- **接口名**：实时交易数据（多股）
- **API接口地址**：`http://api.mairuiapi.com/hsrl/ssjy_more/您的licence?stock_codes=股票代码1,股票代码2……股票代码20`
- **接口说明**：一次性获取《股票列表》中不超过20支股票的实时交易数据（您可以理解为日线的最新数据）
- **数据更新**：实时
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`realtime_trading_multi_stock`）

| 字段名 | 类型 | 说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| p | number | 最新价 |  |
| o | number | 开盘价 |  |
| h | number | 最高价 |  |
| l | number | 最低价 |  |
| yc | number | 前收盘价 |  |
| cje | number | 成交总额 |  |
| v | number | 成交总量 |  |
| pv | number | 原始成交总量 |  |
| ud | float | 涨跌额 |  |
| pc | float | 涨跌幅 |  |
| zf | float | 振幅 |  |
| t | string | 更新时间 | √ |
| pe | number | 市盈率 |  |
| tr | number | 换手率 |  |
| pb_ratio | number | 市净率 |  |
| tv | number | 成交量 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces import RealTimeTradingInterfaces

client = RealTimeTradingInterfaces()

stock_codes = ["000001", "000002"]

# 仅获取
data = client.fetch_realtime_trading_multi_stock(stock_codes=stock_codes)

# 获取并存储
count = client.fetch_and_save_realtime_trading_multi_stock(stock_codes=stock_codes)
```

> 说明：该接口返回字段文档未包含 `dm`。若实际响应也缺少 `dm`，本项目会按 `stock_codes` 的传入顺序为每条记录补齐 `dm`；若返回条数与传入数量不一致，将直接报错以避免错配入库。


