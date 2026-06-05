# TradingDetailsSpecialData - 交易明细特殊数据API接口文档

本文档介绍交易明细特殊数据相关的API接口，包括资金流向数据、当天逐笔交易和历史涨跌停价格三个接口。

## 目录

1. [资金流向数据接口](#资金流向数据接口)
2. [当天逐笔交易接口](#当天逐笔交易接口)
3. [历史涨跌停价格接口](#历史涨跌停价格接口)
4. [使用示例](#使用示例)

---

## 资金流向数据接口

### API接口地址

```
http://api.mairuiapi.com/hsstock/history/transaction/股票代码(如000001)/您的licence?st=开始时间&et=结束时间&lt=最新条数
```

### 接口说明

根据《股票列表》得到的股票代码获取资金流向数据。开始时间以及结束时间的格式均为 YYYYMMDD，例如：'20240101'，不设置开始时间和结束时间则为全部历史数据。同时可以指定获取数据条数，例如指定lt=10，则获取最新的10条数据。

**字段说明**：
- 特大单为成交金额大于或等于100万元或成交量大于或等于5000手
- 大单为成交金额大于或等于20万元或成交量大于或等于1000手
- 中单为成交金额大于或等于4万元或成交量大于或等于200手
- 其他为小单

**数据更新频率**：每日21:30

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`hs_stock_money_flow`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| t | BigInteger | 交易时间 | √ | NOT NULL |
| zmbzds | Integer | 主买单总单数 | | |
| zmszds | Integer | 主卖单总单数 | | |
| dddx | Float | 大单动向 | | |
| zddy | Float | 涨跌动因 | | |
| ddcf | Float | 大单差分 | | |
| zmbzdszl | Integer | 主买单总单数增量 | | |
| zmszdszl | Integer | 主卖单总单数增量 | | |
| cjbszl | Integer | 成交笔数增量 | | |
| zmbtdcje | Float | 主买特大单成交额 | | |
| zmbddcje | Float | 主买大单成交额 | | |
| zmbzdcje | Float | 主买中单成交额 | | |
| zmbxdcje | Float | 主买小单成交额 | | |
| zmbljcje | Float | 主买累计成交额 | | |
| zmstdcje | Float | 主卖特大单成交额 | | |
| zmsddcje | Float | 主卖大单成交额 | | |
| zmszdcje | Float | 主卖中单成交额 | | |
| zmsxdcje | Float | 主卖小单成交额 | | |
| zmsljcje | Float | 主卖累计成交额 | | |
| bdmbtdcje | Float | 被动买特大单成交额 | | |
| bdmbddcje | Float | 被动买大单成交额 | | |
| bdmbzdcje | Float | 被动买中单成交额 | | |
| bdmbxdcje | Float | 被动买小单成交额 | | |
| bdmbljcje | Float | 被动买累计成交额 | | |
| bdmstdcje | Float | 被动卖特大单成交额 | | |
| bdmsddcje | Float | 被动卖大单成交额 | | |
| bdmszdcje | Float | 被动卖中单成交额 | | |
| bdmsxdcje | Float | 被动卖小单成交额 | | |
| bdmsljcje | Float | 被动卖累计成交额 | | |
| jlrcdcje | Float | 净流入超大单成交额 | | |
| jlrddcje | Float | 净流入大单成交额 | | |
| jlrzdcje | Float | 净流入中单成交额 | | |
| jlrxdcje | Float | 净流入小单成交额 | | |
| zmbtdcjl | Integer | 主买特大单成交量 | | |
| zmbddcjl | Integer | 主买大单成交量 | | |
| zmbzdcjl | Integer | 主买中单成交量 | | |
| zmbxdcjl | Integer | 主买小单成交量 | | |
| zmbljcjl | Integer | 主买累计成交量 | | |
| zmstdcjl | Integer | 主卖特大单成交量 | | |
| zmsddcjl | Integer | 主卖大单成交量 | | |
| zmszdcjl | Integer | 主卖中单成交量 | | |
| zmsxdcjl | Integer | 主卖小单成交量 | | |
| zmsljcjl | Integer | 主卖累计成交量 | | |
| bdmbtdcjl | Integer | 被动买特大单成交量 | | |
| bdmbddcjl | Integer | 被动买大单成交量 | | |
| bdmbzdcjl | Integer | 被动买中单成交量 | | |
| bdmbxdcjl | Integer | 被动买小单成交量 | | |
| bdmbljcjl | Integer | 被动买累计成交量 | | |
| bdmstdcjl | Integer | 被动卖特大单成交量 | | |
| bdmsddcjl | Integer | 被动卖大单成交量 | | |
| bdmszdcjl | Integer | 被动卖中单成交量 | | |
| bdmsxdcjl | Integer | 被动卖小单成交量 | | |
| bdmsljcjl | Integer | 被动卖累计成交量 | | |
| jlrcdcjl | Integer | 净流入超大单成交量 | | |
| jlrddcjl | Integer | 净流入大单成交量 | | |
| jlrzdcjl | Integer | 净流入中单成交量 | | |
| jlrxdcjl | Integer | 净流入小单成交量 | | |
| zmbtdcjzl | Float | 主买特大单成交额增量 | | |
| zmbddcjzl | Float | 主买大单成交额增量 | | |
| zmbzdcjzl | Float | 主买中单成交额增量 | | |
| zmbxdcjzl | Float | 主买小单成交额增量 | | |
| zmbljcjzl | Float | 主买累计成交额增量 | | |
| zmstdcjzl | Float | 主卖特大单成交额增量 | | |
| zmsddcjzl | Float | 主卖大单成交额增量 | | |
| zmszdcjzl | Float | 主卖中单成交额增量 | | |
| zmsxdcjzl | Float | 主卖小单成交额增量 | | |
| zmsljcjzl | Float | 主卖累计成交额增量 | | |
| bdmbtdcjzl | Float | 被动买特大单成交额增量 | | |
| bdmbddcjzl | Float | 被动买大单成交额增量 | | |
| bdmbzdcjzl | Float | 被动买中单成交额增量 | | |
| bdmbxdcjzl | Float | 被动买小单成交额增量 | | |
| bdmbljcjzl | Float | 被动买累计成交额增量 | | |
| bdmstdcjzl | Float | 被动卖特大单成交额增量 | | |
| bdmsddcjzl | Float | 被动卖大单成交额增量 | | |
| bdmszdcjzl | Float | 被动卖中单成交额增量 | | |
| bdmsxdcjzl | Float | 被动卖小单成交额增量 | | |
| bdmsljcjzl | Float | 被动卖累计成交额增量 | | |
| jlrcdcjzl | Float | 净流入超大单成交额增量 | | |
| jlrddcjzl | Float | 净流入大单成交额增量 | | |
| jlrzdcjzl | Float | 净流入中单成交额增量 | | |
| jlrxdcjzl | Float | 净流入小单成交额增量 | | |
| zmbtdcjzlv | Integer | 主买特大单成交量增量 | | |
| zmbddcjzlv | Integer | 主买大单成交量增量 | | |
| zmbzdcjzlv | Integer | 主买中单成交量增量 | | |
| zmbxdcjzlv | Integer | 主买小单成交量增量 | | |
| zmbljcjzlv | Integer | 主买累计成交量增量 | | |
| zmstdcjzlv | Integer | 主卖特大单成交量增量 | | |
| zmsddcjzlv | Integer | 主卖大单成交量增量 | | |
| zmszdcjzlv | Integer | 主卖中单成交量增量 | | |
| zmsxdcjzlv | Integer | 主卖小单成交量增量 | | |
| zmsljcjzlv | Integer | 主卖累计成交量增量 | | |
| bdmbtdcjzlv | Integer | 被动买特大单成交量增量 | | |
| bdmbddcjzlv | Integer | 被动买大单成交量增量 | | |
| bdmbzdcjzlv | Integer | 被动买中单成交量增量 | | |
| bdmbxdcjzlv | Integer | 被动买小单成交量增量 | | |
| bdmbljcjzlv | Integer | 被动买累计成交量增量 | | |
| bdmstdcjzlv | Integer | 被动卖特大单成交量增量 | | |
| bdmsddcjzlv | Integer | 被动卖大单成交量增量 | | |
| bdmszdcjzlv | Integer | 被动卖中单成交量增量 | | |
| bdmsxdcjzlv | Integer | 被动卖小单成交量增量 | | |
| bdmsljcjzlv | Integer | 被动卖累计成交量增量 | | |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, t)`

### 使用方法

#### 导入模块

```python
from api_clients.TradingDetailsSpecialData.TradingDetailsSpecialData import TradingDetailsSpecialData
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001"
- `start_date` (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None（获取全部历史数据）
- `end_date` (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None（获取全部历史数据）
- `limit` (Optional[int]): 最新条数，如10表示获取最新的10条数据，默认为None

#### 方法说明

1. **fetch_money_flow(stock_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]**
   - 功能：获取资金流向数据
   - 参数：
     - `stock_code` (str): 股票代码
     - `start_date` (Optional[str]): 开始时间，格式YYYYMMDD
     - `end_date` (Optional[str]): 结束时间，格式YYYYMMDD
     - `limit` (Optional[int]): 最新条数
   - 返回：资金流向数据列表

2. **fetch_and_save_money_flow(stock_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None, limit: Optional[int] = None) -> int**
   - 功能：获取并存储资金流向数据
   - 参数：
     - `stock_code` (str): 股票代码
     - `start_date` (Optional[str]): 开始时间，格式YYYYMMDD
     - `end_date` (Optional[str]): 结束时间，格式YYYYMMDD
     - `limit` (Optional[int]): 最新条数
   - 返回：成功存储的记录数

---

## 当天逐笔交易接口

### API接口地址

```
http://api.mairuiapi.com/hsrl/zbjy/股票代码(如000001)/您的licence
```

### 接口说明

根据《股票列表》得到的股票代码获取当天逐笔交易数据，按时间倒序。

**数据更新频率**：每日21:00

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`hs_stock_today_tick_trade`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| d | String(20) | 数据归属日期（yyyy-MM-dd） | √ | NOT NULL |
| t | String(20) | 时间（HH:mm:ss） | √ | NOT NULL |
| v | BigInteger | 成交量（股） | | |
| p | Float | 成交价 | | |
| ts | Integer | 交易方向（0：中性盘，1：买入，2：卖出） | | |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, d, t)`

### 使用方法

#### 导入模块

```python
from api_clients.TradingDetailsSpecialData.TradingDetailsSpecialData import TradingDetailsSpecialData
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001"

#### 方法说明

1. **fetch_today_tick_trade(stock_code: str) -> List[Dict[str, Any]]**
   - 功能：获取当天逐笔交易数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：当天逐笔交易数据列表

2. **fetch_and_save_today_tick_trade(stock_code: str) -> int**
   - 功能：获取并存储当天逐笔交易数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：成功存储的记录数

---

## 历史涨跌停价格接口

### API接口地址

```
http://api.mairuiapi.com/hsstock/stopprice/history/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
```

### 接口说明

根据《股票列表》得到的股票代码获取历史涨跌停价格，开始时间以及结束时间的格式均为 YYYYMMDD，例如：'20240101'。不设置开始时间和结束时间则为全部历史数据。

**数据更新频率**：每日0点

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`hs_stock_stopprice_history`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| t | String(20) | 交易日期 | √ | NOT NULL |
| h | Float | 涨停价格 | | |
| l | Float | 跌停价格 | | |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, t)`

### 使用方法

#### 导入模块

```python
from api_clients.TradingDetailsSpecialData.TradingDetailsSpecialData import TradingDetailsSpecialData
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001.SZ"
- `start_date` (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None（获取全部历史数据）
- `end_date` (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None（获取全部历史数据）

#### 方法说明

1. **fetch_stop_price_history(stock_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]**
   - 功能：获取历史涨跌停价格数据
   - 参数：
     - `stock_code` (str): 股票代码
     - `start_date` (Optional[str]): 开始时间，格式YYYYMMDD
     - `end_date` (Optional[str]): 结束时间，格式YYYYMMDD
   - 返回：历史涨跌停价格数据列表

2. **fetch_and_save_stop_price_history(stock_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> int**
   - 功能：获取并存储历史涨跌停价格数据
   - 参数：
     - `stock_code` (str): 股票代码
     - `start_date` (Optional[str]): 开始时间，格式YYYYMMDD
     - `end_date` (Optional[str]): 结束时间，格式YYYYMMDD
   - 返回：成功存储的记录数

---

## 使用示例

### 基本使用

```python
from api_clients.TradingDetailsSpecialData.TradingDetailsSpecialData import TradingDetailsSpecialData

# 初始化客户端（会自动从.env文件读取API_LICENSE）
client = TradingDetailsSpecialData()

# 或者手动指定许可证
# client = TradingDetailsSpecialData(license_key="your_license_key")
```

### 示例1：获取资金流向数据

```python
# 仅获取数据（指定时间范围和最新条数）
data = client.fetch_money_flow(
    stock_code="000001",
    start_date="20240101",
    end_date="20241231",
    limit=10
)
print(f"获取到 {len(data)} 条资金流向数据")

# 获取全部历史数据
data_all = client.fetch_money_flow("000001")

# 获取并存储数据
count = client.fetch_and_save_money_flow(
    stock_code="000001",
    start_date="20240101",
    end_date="20241231",
    limit=10
)
print(f"成功存储 {count} 条资金流向数据")
```

### 示例2：获取当天逐笔交易数据

```python
# 仅获取数据
data = client.fetch_today_tick_trade("000001")
print(f"获取到 {len(data)} 条当天逐笔交易数据")

# 获取并存储数据
count = client.fetch_and_save_today_tick_trade("000001")
print(f"成功存储 {count} 条当天逐笔交易数据")
```

### 示例3：获取历史涨跌停价格数据

```python
# 获取指定时间范围的数据
data = client.fetch_stop_price_history(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
print(f"获取到 {len(data)} 条历史涨跌停价格数据")

# 获取全部历史数据（不指定时间范围）
data_all = client.fetch_stop_price_history("000001.SZ")

# 获取并存储数据
count = client.fetch_and_save_stop_price_history(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
print(f"成功存储 {count} 条历史涨跌停价格数据")
```

### 批量处理示例

```python
# 批量获取多个股票的资金流向数据
stock_codes = ["000001", "000002", "600000", "600001"]

for stock_code in stock_codes:
    try:
        count = client.fetch_and_save_money_flow(
            stock_code=stock_code,
            start_date="20240101",
            end_date="20241231"
        )
        print(f"股票 {stock_code} 成功存储 {count} 条资金流向数据")
    except Exception as e:
        print(f"股票 {stock_code} 处理失败: {str(e)}")
```

### 错误处理示例

```python
from core.exceptions import APIException, ValidationException, DatabaseException

try:
    # 尝试获取数据
    data = client.fetch_money_flow("000001")
except ValidationException as e:
    print(f"参数验证失败: {str(e)}")
except APIException as e:
    print(f"API请求失败: {str(e)}")
except DatabaseException as e:
    print(f"数据库操作失败: {str(e)}")
except Exception as e:
    print(f"发生未知错误: {str(e)}")
```

### 环境配置

在使用API之前，需要确保在`.env`文件中配置了API许可证：

```env
# API配置
API_LICENSE=your_license_here
```

### 注意事项

1. **股票代码格式**：
   - 资金流向数据和当天逐笔交易接口使用简单格式，如"000001"
   - 历史涨跌停价格接口使用完整格式，如"000001.SZ"

2. **时间格式**：
   - 所有接口的时间参数格式为YYYYMMDD，如"20240101"

3. **数据更新频率**：
   - 资金流向数据：每日21:30
   - 当天逐笔交易：每日21:00
   - 历史涨跌停价格：每日0点

4. **请求频率限制**：
   - 请根据您的许可证类型控制请求频率，避免超出限制

5. **数据存储**：
   - 所有`fetch_and_save_*`方法在存储时会自动处理重复数据（使用`ignore_duplicates=True`）
   - 数据存储基于主键约束，重复的主键数据会被忽略或更新

6. **资金流向数据字段说明**：
   - 特大单：成交金额≥100万元或成交量≥5000手
   - 大单：成交金额≥20万元或成交量≥1000手
   - 中单：成交金额≥4万元或成交量≥200手
   - 小单：其他

