# StockPoolClassification 股票池分类接口

## 1. 跌停股池

- **接口名**：跌停股池
- **API接口地址**：`http://api.mairuiapi.com/hslt/dtgc/日期(如2020-01-15)/您的licence`
- **接口说明**：根据日期（格式yyyy-MM-dd，从2019-11-28开始到现在的每个交易日）作为参数，得到每天的跌停股票列表，根据封单资金升序。
- **数据更新**：交易时间段每10分钟
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`limit_down_pool`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 代码 | √ |
| date | string | 日期参数 | √ |
| mc | string | 名称 |  |
| p | number | 价格（元） |  |
| zf | number | 跌幅（%） |  |
| cje | number | 成交额（元） |  |
| lt | number | 流通市值（元） |  |
| zsz | number | 总市值（元） |  |
| pe | number | 动态市盈率 |  |
| hs | number | 换手率（%） |  |
| lbc | number | 连续跌停次数 |  |
| lbt | string | 最后封板时间（HH:mm:ss） | √ |
| zj | number | 封单资金（元） |  |
| fba | number | 板上成交额（元） |  |
| zbc | number | 开板次数 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.StockPoolClassification.StockPoolClassification import StockPoolClassification

client = StockPoolClassification()

date = "2020-01-15"

# 仅获取
data = client.fetch_limit_down_pool(date=date)

# 获取并存储
count = client.fetch_and_save_limit_down_pool(date=date)
```

## 2. 强势股池

- **接口名**：强势股池
- **API接口地址**：`http://api.mairuiapi.com/hslt/qsgc/日期(如2020-01-15)/您的licence`
- **接口说明**：根据日期（格式yyyy-MM-dd，从2019-11-28开始到现在的每个交易日）作为参数，得到每天的强势股票列表，根据涨幅倒序。
- **数据更新**：交易时间段每10分钟
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`strong_pool`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 代码 | √ |
| date | string | 日期参数 | √ |
| mc | string | 名称 |  |
| p | number | 价格（元） |  |
| ztp | number | 涨停价（元） |  |
| zf | number | 涨幅（%） |  |
| cje | number | 成交额（元） |  |
| lt | number | 流通市值（元） |  |
| zsz | number | 总市值（元） |  |
| zs | number | 涨速（%） |  |
| nh | number | 是否新高（0：否，1：是） |  |
| lb | number | 量比 |  |
| hs | number | 换手率（%） |  |
| tj | string | 涨停统计（x天/y板） | √ |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.StockPoolClassification.StockPoolClassification import StockPoolClassification

client = StockPoolClassification()

date = "2020-01-15"

# 仅获取
data = client.fetch_strong_pool(date=date)

# 获取并存储
count = client.fetch_and_save_strong_pool(date=date)
```

## 3. 炸板股池

- **接口名**：炸板股池
- **API接口地址**：`http://api.mairuiapi.com/hslt/zbgc/日期(如2020-01-15)/您的licence`
- **接口说明**：根据日期（格式yyyy-MM-dd，从2019-11-28开始到现在的每个交易日）作为参数，得到每天的炸板股票列表，根据首次封板时间升序。
- **数据更新**：交易时间段每10分钟
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`limit_up_break_pool`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 代码 | √ |
| date | string | 日期参数 | √ |
| mc | string | 名称 |  |
| p | number | 价格（元） |  |
| ztp | number | 涨停价（元） |  |
| zf | number | 涨跌幅（%） |  |
| cje | number | 成交额（元） |  |
| lt | number | 流通市值（元） |  |
| zsz | number | 总市值（元） |  |
| zs | number | 涨速（%） |  |
| hs | number | 转手率（%） |  |
| tj | string | 涨停统计（x天/y板） |  |
| fbt | string | 首次封板时间（HH:mm:ss） | √ |
| zbc | number | 炸板次数 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.StockPoolClassification.StockPoolClassification import StockPoolClassification

client = StockPoolClassification()

date = "2020-01-15"

# 仅获取
data = client.fetch_limit_up_break_pool(date=date)

# 获取并存储
count = client.fetch_and_save_limit_up_break_pool(date=date)
```

## 4. 涨停股池

- **接口名**：涨停股池
- **API接口地址**：`http://api.mairuiapi.com/hslt/ztgc/日期(如2020-01-15)/您的licence`
- **接口说明**：根据日期（格式yyyy-MM-dd，从2019-11-28开始到现在的每个交易日）作为参数，得到每天的涨停股票列表，根据封板时间升序。
- **数据更新**：交易时间段每10分钟
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`limit_up_pool`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 代码 | √ |
| date | string | 日期参数 | √ |
| mc | string | 名称 |  |
| p | number | 价格（元） |  |
| zf | number | 涨幅（%） |  |
| cje | number | 成交额（元） |  |
| lt | number | 流通市值（元） |  |
| zsz | number | 总市值（元） |  |
| hs | number | 换手率（%） |  |
| lbc | number | 连板数 |  |
| fbt | string | 首次封板时间（HH:mm:ss） | √ |
| lbt | string | 最后封板时间（HH:mm:ss） | √ |
| zj | number | 封板资金（元） |  |
| zbc | number | 炸板次数 |  |
| tj | string | 涨停统计（x天/y板） |  |
| hy | string | 所属行业 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.StockPoolClassification.StockPoolClassification import StockPoolClassification

client = StockPoolClassification()

date = "2020-01-15"

# 仅获取
data = client.fetch_limit_up_pool(date=date)

# 获取并存储
count = client.fetch_and_save_limit_up_pool(date=date)
```

## 5. 次新股池

- **接口名**：次新股池
- **API接口地址**：`http://api.mairuiapi.com/hslt/cxgc/日期(如2020-01-15)/您的licence`
- **接口说明**：根据日期（格式yyyy-MM-dd，从2019-11-28开始到现在的每个交易日）作为参数，得到每天的次新股票列表，根据开板几日升序。
- **数据更新**：交易时间段每10分钟
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`sub_new_pool`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 代码 | √ |
| date | string | 日期参数 | √ |
| mc | string | 名称 |  |
| p | number | 价格（元） |  |
| ztp | number | 涨停价（元，无涨停价为null） |  |
| zf | number | 涨跌幅（%） |  |
| cje | number | 成交额（元） |  |
| lt | number | 流通市值（元） |  |
| zsz | number | 总市值（元） |  |
| nh | number | 是否新高（0：否，1：是） |  |
| hs | number | 转手率（%） |  |
| tj | string | 涨停统计（x天/y板） |  |
| kb | number | 开板几日 |  |
| od | string | 开板日期（yyyyMMdd） | √ |
| ipod | string | 上市日期（yyyyMMdd） | √ |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.StockPoolClassification.StockPoolClassification import StockPoolClassification

client = StockPoolClassification()

date = "2020-01-15"

# 仅获取
data = client.fetch_sub_new_pool(date=date)

# 获取并存储
count = client.fetch_and_save_sub_new_pool(date=date)
```


