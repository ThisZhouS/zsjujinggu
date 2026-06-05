# ShareholderDetailedData 股东明细数据接口

## 1. 十大股东

- **接口名**：十大股东
- **API接口地址**：`http://api.mairuiapi.com/hscp/sdgd/股票代码(如000001)/您的licence`
- **接口说明**：根据《股票列表》得到的股票代码获取上市公司的十大股东数据。按截止日期倒序。
- **数据更新**：每日03:30
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`shareholder_top10`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| jzrq | string | 截止日期yyyy-MM-dd | √ |
| ggrq | string | 公告日期yyyy-MM-dd | √ |
| gdsm | string | 股东说明 |  |
| gdzs | number | 股东总数 |  |
| pjcg | number | 平均持股(单位：股，按总股本计算) |  |
| sdgd_json | string | 十大股东明细（JSON字符串，来自sdgd数组） |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.ShareholderDetailedData.ShareholderDetailedData import ShareholderDetailedData

client = ShareholderDetailedData()

stock_code = "000001"

# 仅获取
data = client.fetch_top10_shareholders(stock_code=stock_code)

# 获取并存储
count = client.fetch_and_save_top10_shareholders(stock_code=stock_code)
```

## 2. 十大流通股东

- **接口名**：十大流通股东
- **API接口地址**：`http://api.mairuiapi.com/hscp/ltgd/股票代码(如000001)/您的licence`
- **接口说明**：根据《股票列表》得到的股票代码获取上市公司的十大流通股东数据。按公告日期倒序。
- **数据更新**：每日03:30
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`shareholder_top10_float`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| jzrq | string | 截止日期yyyy-MM-dd | √ |
| ggrq | string | 公告日期yyyy-MM-dd | √ |
| sdgd_json | string | 十大流通股东明细（JSON字符串，来自sdgd数组） |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.ShareholderDetailedData.ShareholderDetailedData import ShareholderDetailedData

client = ShareholderDetailedData()

stock_code = "000001"

# 仅获取
data = client.fetch_top10_float_shareholders(stock_code=stock_code)

# 获取并存储
count = client.fetch_and_save_top10_float_shareholders(stock_code=stock_code)
```

## 3. 股东变化趋势

- **接口名**：股东变化趋势
- **API接口地址**：`http://api.mairuiapi.com/hscp/gdbh/股票代码(如000001)/您的licence`
- **接口说明**：根据《股票列表》得到的股票代码获取上市公司的股东变化趋势数据。按截止日期倒序。
- **数据更新**：每日03:30
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`shareholder_change_trend`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| jzrq | string | 截止日期yyyy-MM-dd | √ |
| gdhs | string | 股东户数 |  |
| bh | string | 比上期变化情况 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.ShareholderDetailedData.ShareholderDetailedData import ShareholderDetailedData

client = ShareholderDetailedData()

stock_code = "000001"

# 仅获取
data = client.fetch_shareholder_change_trend(stock_code=stock_code)

# 获取并存储
count = client.fetch_and_save_shareholder_change_trend(stock_code=stock_code)
```

## 4. 基金持股

- **接口名**：基金持股
- **API接口地址**：`http://api.mairuiapi.com/hscp/jjcg/股票代码(如000001)/您的licence`
- **接口说明**：根据《股票列表》得到的股票代码获取该股票最近500家左右的基金持股情况。按截止日期倒序。
- **数据更新**：每周六18:00
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`fund_holdings`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| jzrq | string | 截止日期yyyy-MM-dd | √ |
| jjmc | string | 基金名称 |  |
| jjdm | string | 基金代码 | √ |
| ccsl | number | 持仓数量(股) |  |
| ltbl | number | 占流通股比例(%) |  |
| cgsz | number | 持股市值（元） |  |
| jzbl | number | 占净值比例（%） |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.ShareholderDetailedData.ShareholderDetailedData import ShareholderDetailedData

client = ShareholderDetailedData()

stock_code = "000001"

# 仅获取
data = client.fetch_fund_holdings(stock_code=stock_code)

# 获取并存储
count = client.fetch_and_save_fund_holdings(stock_code=stock_code)
```


