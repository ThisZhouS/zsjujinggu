# 财务季度事件API接口文档

本文档描述了财务季度事件相关的API接口，包括近年分红、近年增发、近一年各季度利润和近一年各季度现金流四个接口。

## 目录

1. [近年分红](#近年分红)
2. [近年增发](#近年增发)
3. [近一年各季度利润](#近一年各季度利润)
4. [近一年各季度现金流](#近一年各季度现金流)

---

## 近年分红

### 接口信息

- **接口名称**: 近年分红
- **API接口地址**: `http://api.mairuiapi.com/hscp/jnfh/{股票代码}/{您的licence}`
- **接口说明**: 根据《股票列表》得到的股票代码获取上市公司的近年来的分红实施结果。按公告日期倒序。
- **数据更新**: 每日03:30
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| stock_code | str | 是 | 股票代码 | "000001" |

### 数据库表结构

**表名**: `recent_dividend`

| 字段名称 | 数据类型 | 字段说明 | 主键 |
|---------|---------|---------|------|
| dm | string(20) | 股票代码 | √ |
| sdate | string(20) | 公告日期yyyy-MM-dd | √ |
| give | string(50) | 每10股送股(单位：股) | |
| change | string(50) | 每10股转增(单位：股) | |
| send | string(50) | 每10股派息(税前，单位：元) | |
| line | string(100) | 进度 | |
| cdate | string(20) | 除权除息日yyyy-MM-dd | |
| edate | string(20) | 股权登记日yyyy-MM-dd | |
| hdate | string(20) | 红股上市日yyyy-MM-dd | |
| created_at | datetime | 创建时间 | |

### 使用方法

#### 导入模块

```python
from api_clients.FinancialQuartersEvents.FinancialQuartersEvents import FinancialQuartersEvents
```

#### 初始化客户端

```python
# 使用配置文件中的license
client = FinancialQuartersEvents()

# 或指定license
client = FinancialQuartersEvents(license_key="your_license_key")
```

#### 获取数据

```python
# 获取近年分红数据
data = client.fetch_recent_dividend(stock_code="000001")
```

#### 获取并存储数据

```python
# 获取并存储近年分红数据
count = client.fetch_and_save_recent_dividend(stock_code="000001")
```

---

## 近年增发

### 接口信息

- **接口名称**: 近年增发
- **API接口地址**: `http://api.mairuiapi.com/hscp/jnzf/{股票代码}/{您的licence}`
- **接口说明**: 根据《股票列表》得到的股票代码获取上市公司的近年来的增发情况。按公告日期倒序。
- **数据更新**: 每日03:30
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| stock_code | str | 是 | 股票代码 | "000001" |

### 数据库表结构

**表名**: `recent_additional_issue`

| 字段名称 | 数据类型 | 字段说明 | 主键 |
|---------|---------|---------|------|
| dm | string(20) | 股票代码 | √ |
| sdate | string(20) | 公告日期yyyy-MM-dd | √ |
| type | string(100) | 发行方式 | |
| price | string(50) | 发行价格 | |
| tprice | string(50) | 实际公司募集资金总额 | |
| fprice | string(50) | 发行费用总额 | |
| amount | string(50) | 实际发行数量 | |
| created_at | datetime | 创建时间 | |

### 使用方法

#### 导入模块

```python
from api_clients.FinancialQuartersEvents.FinancialQuartersEvents import FinancialQuartersEvents
```

#### 初始化客户端

```python
# 使用配置文件中的license
client = FinancialQuartersEvents()

# 或指定license
client = FinancialQuartersEvents(license_key="your_license_key")
```

#### 获取数据

```python
# 获取近年增发数据
data = client.fetch_recent_additional_issue(stock_code="000001")
```

#### 获取并存储数据

```python
# 获取并存储近年增发数据
count = client.fetch_and_save_recent_additional_issue(stock_code="000001")
```

---

## 近一年各季度利润

### 接口信息

- **接口名称**: 近一年各季度利润
- **API接口地址**: `http://api.mairuiapi.com/hscp/jdlr/{股票代码}/{您的licence}`
- **接口说明**: 根据《股票列表》得到的股票代码获取上市公司近一年各个季度的利润。按截止日期倒序。
- **数据更新**: 每日03:30
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| stock_code | str | 是 | 股票代码 | "000001" |

### 数据库表结构

**表名**: `quarterly_profit`

| 字段名称 | 数据类型 | 字段说明 | 主键 |
|---------|---------|---------|------|
| dm | string(20) | 股票代码 | √ |
| date | string(20) | 截止日期yyyy-MM-dd | √ |
| income | string(50) | 营业收入（万元） | |
| expend | string(50) | 营业支出（万元） | |
| profit | string(50) | 营业利润（万元） | |
| totalp | string(50) | 利润总额（万元） | |
| reprofit | string(50) | 净利润（万元） | |
| basege | string(50) | 基本每股收益(元/股) | |
| ettege | string(50) | 稀释每股收益(元/股) | |
| otherp | string(50) | 其他综合收益（万元） | |
| totalcp | string(50) | 综合收益总额（万元） | |
| created_at | datetime | 创建时间 | |

### 使用方法

#### 导入模块

```python
from api_clients.FinancialQuartersEvents.FinancialQuartersEvents import FinancialQuartersEvents
```

#### 初始化客户端

```python
# 使用配置文件中的license
client = FinancialQuartersEvents()

# 或指定license
client = FinancialQuartersEvents(license_key="your_license_key")
```

#### 获取数据

```python
# 获取近一年各季度利润数据
data = client.fetch_quarterly_profit(stock_code="000001")
```

#### 获取并存储数据

```python
# 获取并存储近一年各季度利润数据
count = client.fetch_and_save_quarterly_profit(stock_code="000001")
```

---

## 近一年各季度现金流

### 接口信息

- **接口名称**: 近一年各季度现金流
- **API接口地址**: `http://api.mairuiapi.com/hscp/jdxj/{股票代码}/{您的licence}`
- **接口说明**: 根据《股票列表》得到的股票代码获取上市公司近一年各个季度的现金流。按截止日期倒序。
- **数据更新**: 每日03:30
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| stock_code | str | 是 | 股票代码 | "000001" |

### 数据库表结构

**表名**: `quarterly_cash_flow`

| 字段名称 | 数据类型 | 字段说明 | 主键 |
|---------|---------|---------|------|
| dm | string(20) | 股票代码 | √ |
| date | string(20) | 截止日期yyyy-MM-dd | √ |
| jyin | string(50) | 经营活动现金流入小计（万元） | |
| jyout | string(50) | 经营活动现金流出小计（万元） | |
| jyfinal | string(50) | 经营活动产生的现金流量净额（万元） | |
| tzin | string(50) | 投资活动现金流入小计（万元） | |
| tzout | string(50) | 投资活动现金流出小计（万元） | |
| tzfinal | string(50) | 投资活动产生的现金流量净额（万元） | |
| czin | string(50) | 筹资活动现金流入小计（万元） | |
| czout | string(50) | 筹资活动现金流出小计（万元） | |
| czfinal | string(50) | 筹资活动产生的现金流量净额（万元） | |
| hl | string(50) | 汇率变动对现金及现金等价物的影响（万元） | |
| cashinc | string(50) | 现金及现金等价物净增加额（万元） | |
| cashs | string(50) | 期初现金及现金等价物余额（万元） | |
| cashe | string(50) | 期末现金及现金等价物余额（万元） | |
| created_at | datetime | 创建时间 | |

### 使用方法

#### 导入模块

```python
from api_clients.FinancialQuartersEvents.FinancialQuartersEvents import FinancialQuartersEvents
```

#### 初始化客户端

```python
# 使用配置文件中的license
client = FinancialQuartersEvents()

# 或指定license
client = FinancialQuartersEvents(license_key="your_license_key")
```

#### 获取数据

```python
# 获取近一年各季度现金流数据
data = client.fetch_quarterly_cash_flow(stock_code="000001")
```

#### 获取并存储数据

```python
# 获取并存储近一年各季度现金流数据
count = client.fetch_and_save_quarterly_cash_flow(stock_code="000001")
```

---

## 完整使用示例

```python
from api_clients.FinancialQuartersEvents.FinancialQuartersEvents import FinancialQuartersEvents

# 初始化客户端
client = FinancialQuartersEvents()

# 1. 获取近年分红数据
dividend_data = client.fetch_recent_dividend(stock_code="000001")
print(f"获取到 {len(dividend_data)} 条近年分红数据")

# 2. 获取并存储近年分红数据
count1 = client.fetch_and_save_recent_dividend(stock_code="000001")
print(f"成功存储 {count1} 条近年分红数据")

# 3. 获取近年增发数据
issue_data = client.fetch_recent_additional_issue(stock_code="000001")
print(f"获取到 {len(issue_data)} 条近年增发数据")

# 4. 获取并存储近年增发数据
count2 = client.fetch_and_save_recent_additional_issue(stock_code="000001")
print(f"成功存储 {count2} 条近年增发数据")

# 5. 获取近一年各季度利润数据
profit_data = client.fetch_quarterly_profit(stock_code="000001")
print(f"获取到 {len(profit_data)} 条近一年各季度利润数据")

# 6. 获取并存储近一年各季度利润数据
count3 = client.fetch_and_save_quarterly_profit(stock_code="000001")
print(f"成功存储 {count3} 条近一年各季度利润数据")

# 7. 获取近一年各季度现金流数据
cashflow_data = client.fetch_quarterly_cash_flow(stock_code="000001")
print(f"获取到 {len(cashflow_data)} 条近一年各季度现金流数据")

# 8. 获取并存储近一年各季度现金流数据
count4 = client.fetch_and_save_quarterly_cash_flow(stock_code="000001")
print(f"成功存储 {count4} 条近一年各季度现金流数据")
```

---

## 注意事项

1. **License配置**: 确保在 `.env` 文件中配置了 `API_LICENSE` 参数，或者在初始化客户端时传入 `license_key` 参数。

2. **股票代码格式**: 所有接口都使用不带后缀的股票代码格式（如 "000001"）。

3. **数据存储**: 使用 `fetch_and_save_*` 方法时，如果数据已存在（基于主键），会自动忽略重复数据。

4. **异常处理**: 所有方法都可能抛出以下异常：
   - `ValidationException`: 参数验证失败
   - `APIException`: API请求失败
   - `DatabaseException`: 数据库操作失败

5. **日志记录**: 所有操作都会记录日志，日志文件位于 `log/api_clients/FinancialQuartersEvents/` 目录下。

6. **字段映射**: 
   - 近年分红接口中，API返回的字段名是 `Send`（首字母大写），但表模型中字段名是 `send`（小写），代码会自动处理这个映射。
   - 近年增发接口中，`type` 字段是Python关键字，但在SQLAlchemy中可以直接使用。

