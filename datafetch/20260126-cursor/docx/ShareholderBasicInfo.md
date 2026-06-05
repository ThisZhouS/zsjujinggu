# ShareholderBasicInfo 股东基础信息接口

## 1. 公司股东数

- **接口名**：公司股东数
- **API接口地址**：`http://api.mairuiapi.com/hsstock/financial/hm/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间`
- **接口说明**：根据《股票列表》得到的股票代码获取公司股东数，开始时间以及结束时间的格式均为 YYYYMMDD，例如：`20240101`。不设置开始时间和结束时间则为全部数据。
- **数据更新**：每日0点
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`company_shareholder_count`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| plrq | string | 公告日期 | √ |
| jzrq | string | 截止日期 | √ |
| gdzs | string | 股东总数 |  |
| agdhs | string | A股东户数 |  |
| bgdhs | string | B股东户数 |  |
| hgdhs | string | H股东户数 |  |
| yltgdhs | string | 已流通股东户数 |  |
| wltgdhs | string | 未流通股东户数 |  |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.ShareholderBasicInfo.ShareholderBasicInfo import ShareholderBasicInfo

client = ShareholderBasicInfo()

stock_code = "000001.SZ"
start_date = "20240101"
end_date = "20241231"

# 仅获取
data = client.fetch_company_shareholder_count(
    stock_code=stock_code,
    start_date=start_date,
    end_date=end_date,
)

# 获取并存储
count = client.fetch_and_save_company_shareholder_count(
    stock_code=stock_code,
    start_date=start_date,
    end_date=end_date,
)
```

## 2. 公司十大股东

- **接口名**：公司十大股东
- **API接口地址**：`http://api.mairuiapi.com/hsstock/financial/topholder/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间`
- **接口说明**：根据《股票列表》得到的股票代码获取公司十大股东，开始时间以及结束时间的格式均为 YYYYMMDD，例如：`20240101`。不设置开始时间和结束时间则为全部数据。
- **数据更新**：每日0点
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`company_top_holders`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| plrq | string | 公告日期 | √ |
| jzrq | string | 截止日期 | √ |
| gdmc | string | 股东名称 |  |
| gdlx | string | 股东类型 |  |
| cgsl | string | 持股数量 |  |
| bdyy | string | 变动原因 |  |
| cgbl | string | 持股比例 |  |
| gfxz | string | 股份性质 |  |
| cgpm | string | 持股排名 | √ |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.ShareholderBasicInfo.ShareholderBasicInfo import ShareholderBasicInfo

client = ShareholderBasicInfo()

stock_code = "000001.SZ"
start_date = "20240101"
end_date = "20241231"

# 仅获取
data = client.fetch_company_top_holders(
    stock_code=stock_code,
    start_date=start_date,
    end_date=end_date,
)

# 获取并存储
count = client.fetch_and_save_company_top_holders(
    stock_code=stock_code,
    start_date=start_date,
    end_date=end_date,
)
```

## 3. 公司十大流通股东

- **接口名**：公司十大流通股东
- **API接口地址**：`http://api.mairuiapi.com/hsstock/financial/flowholder/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间`
- **接口说明**：根据《股票列表》得到的股票代码获取公司十大流通股东，开始时间以及结束时间的格式均为 YYYYMMDD，例如：`20240101`。不设置开始时间和结束时间则为全部数据。
- **数据更新**：每日0点
- **请求频率**：1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次

### 表结构（`company_top_flow_holders`）

| 字段名 | 数据类型 | 字段说明 | 主键 |
| --- | --- | --- | --- |
| dm | string | 股票代码 | √ |
| ggrq | string | 公告日期 | √ |
| jzrq | string | 截止日期 | √ |
| gdmc | string | 股东名称 |  |
| gdlx | string | 股东类型 |  |
| cgsl | string | 持股数量 |  |
| bdyy | string | 变动原因 |  |
| cgbl | string | 持股比例 |  |
| gfxz | string | 股份性质 |  |
| cgpm | string | 持股排名 | √ |
| created_at | datetime | 创建时间 |  |

### 使用方法

```python
from api_clients.ShareholderBasicInfo.ShareholderBasicInfo import ShareholderBasicInfo

client = ShareholderBasicInfo()

stock_code = "000001.SZ"
start_date = "20240101"
end_date = "20241231"

# 仅获取
data = client.fetch_company_top_flow_holders(
    stock_code=stock_code,
    start_date=start_date,
    end_date=end_date,
)

# 获取并存储
count = client.fetch_and_save_company_top_flow_holders(
    stock_code=stock_code,
    start_date=start_date,
    end_date=end_date,
)
```


