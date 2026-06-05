# 财务核心指标API接口文档

本文档描述了财务核心指标相关的API接口，包括财务主要指标、财务指标和近年业绩预告三个接口。

## 目录

1. [财务主要指标](#财务主要指标)
2. [财务指标](#财务指标)
3. [近年业绩预告](#近年业绩预告)

---

## 财务主要指标

### 接口信息

- **接口名称**: 财务主要指标
- **API接口地址**: `http://api.mairuiapi.com/hsstock/financial/pershareindex/{股票代码}/{您的licence}?st={开始时间}&et={结束时间}`
- **接口说明**: 根据《股票列表》得到的股票代码获取财务主要指标，开始时间以及结束时间的格式均为 YYYYMMDD，例如：'20240101'。不设置开始时间和结束时间则为全部数据。
- **数据更新**: 每日0点
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| stock_code | str | 是 | 股票代码 | "000001.SZ" |
| start_date | str | 否 | 开始时间，格式YYYYMMDD | "20240101" |
| end_date | str | 否 | 结束时间，格式YYYYMMDD | "20241231" |

### 数据库表结构

**表名**: `financial_main_indicators`

| 字段名称 | 数据类型 | 字段说明 | 主键 |
|---------|---------|---------|------|
| dm | string(20) | 股票代码 | √ |
| jzrq | string(20) | 截止日期 | √ |
| plrq | string(20) | 披露日期 | |
| mgjyhdxjl | float | 每股经营活动现金流量 | |
| mgjzc | float | 每股净资产 | |
| jbmgsy | float | 基本每股收益 | |
| xsmgsy | float | 稀释每股收益 | |
| mgwfplr | float | 每股未分配利润 | |
| mgzbgjj | float | 每股资本公积金 | |
| kfmgsy | float | 扣非每股收益 | |
| jzcsyl | float | 净资产收益率 | |
| xsmlv | float | 销售毛利率 | |
| zyyrsrzz | float | 主营收入同比增长 | |
| jlrzz | float | 净利润同比增长 | |
| gsmgsyzzdjlrzz | float | 归属于母公司所有者的净利润同比增长 | |
| kfjlrzz | float | 扣非净利润同比增长 | |
| yyzsrgdhbzz | float | 营业总收入滚动环比增长 | |
| sljlrjqhbzz | float | 归属净利润滚动环比增长 | |
| kfjlrgdhbzz | float | 扣非净利润滚动环比增长 | |
| jqjzcsyl | float | 加权净资产收益率 | |
| tbjzcsyl | float | 摊薄净资产收益率 | |
| tbzzcsyl | float | 摊薄总资产收益率 | |
| mlv | float | 毛利率 | |
| jlv | float | 净利率 | |
| sjslv | float | 实际税率 | |
| yskyysr | float | 预收款营业收入 | |
| xsxjlyysr | float | 销售现金流营业收入 | |
| zcfzl | float | 资产负债比率 | |
| chzzl | float | 存货周转率 | |
| created_at | datetime | 创建时间 | |

### 使用方法

#### 导入模块

```python
from api_clients.FinancialCoreIndicators.FinancialCoreIndicators import FinancialCoreIndicators
```

#### 初始化客户端

```python
# 使用配置文件中的license
client = FinancialCoreIndicators()

# 或指定license
client = FinancialCoreIndicators(license_key="your_license_key")
```

#### 获取数据

```python
# 获取财务主要指标数据（不指定时间范围）
data = client.fetch_financial_main_indicators(stock_code="000001.SZ")

# 获取财务主要指标数据（指定时间范围）
data = client.fetch_financial_main_indicators(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
```

#### 获取并存储数据

```python
# 获取并存储财务主要指标数据（不指定时间范围）
count = client.fetch_and_save_financial_main_indicators(stock_code="000001.SZ")

# 获取并存储财务主要指标数据（指定时间范围）
count = client.fetch_and_save_financial_main_indicators(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
```

---

## 财务指标

### 接口信息

- **接口名称**: 财务指标
- **API接口地址**: `http://api.mairuiapi.com/hscp/cwzb/{股票代码}/{您的licence}`
- **接口说明**: 根据《股票列表》得到的股票代码获取上市公司近四个季度的主要财务指标。按报告日期倒序。
- **数据更新**: 每日03:30
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| stock_code | str | 是 | 股票代码 | "000001" |

### 数据库表结构

**表名**: `financial_indicators`

| 字段名称 | 数据类型 | 字段说明 | 主键 |
|---------|---------|---------|------|
| dm | string(20) | 股票代码 | √ |
| date | string(20) | 报告日期yyyy-MM-dd | √ |
| tbmg | string(50) | 摊薄每股收益(元) | |
| jqmg | string(50) | 加权每股收益(元) | |
| mgsy | string(50) | 每股收益_调整后(元) | |
| kfmg | string(50) | 扣除非经常性损益后的每股收益(元) | |
| mgjz | string(50) | 每股净资产_调整前(元) | |
| mgjzad | string(50) | 每股净资产_调整后(元) | |
| mgjy | string(50) | 每股经营性现金流(元) | |
| mggjj | string(50) | 每股资本公积金(元) | |
| mgwly | string(50) | 每股未分配利润(元) | |
| zclr | string(50) | 总资产利润率(%) | |
| zylr | string(50) | 主营业务利润率(%) | |
| zzlr | string(50) | 总资产净利润率(%) | |
| cblr | string(50) | 成本费用利润率(%) | |
| yylr | string(50) | 营业利润率(%) | |
| zycb | string(50) | 主营业务成本率(%) | |
| xsjl | string(50) | 销售净利率(%) | |
| gbbc | string(50) | 股本报酬率(%) | |
| jzbc | string(50) | 净资产报酬率(%) | |
| zcbc | string(50) | 资产报酬率(%) | |
| xsml | string(50) | 销售毛利率(%) | |
| xxbz | string(50) | 三项费用比重 | |
| fzy | string(50) | 非主营比重 | |
| zybz | string(50) | 主营利润比重 | |
| gxff | string(50) | 股息发放率(%) | |
| tzsy | string(50) | 投资收益率(%) | |
| zyyw | string(50) | 主营业务利润(元) | |
| jzsy | string(50) | 净资产收益率(%) | |
| jqjz | string(50) | 加权净资产收益率(%) | |
| kflr | string(50) | 扣除非经常性损益后的净利润(元) | |
| zysr | string(50) | 主营业务收入增长率(%) | |
| jlzz | string(50) | 净利润增长率(%) | |
| jzzz | string(50) | 净资产增长率(%) | |
| zzzz | string(50) | 总资产增长率(%) | |
| yszz | string(50) | 应收账款周转率(次) | |
| yszzt | string(50) | 应收账款周转天数(天) | |
| chzz | string(50) | 存货周转天数(天) | |
| chzzl | string(50) | 存货周转率(次) | |
| gzzz | string(50) | 固定资产周转率(次) | |
| zzzzl | string(50) | 总资产周转率(次) | |
| zzzzt | string(50) | 总资产周转天数(天) | |
| ldzz | string(50) | 流动资产周转率(次) | |
| ldzzt | string(50) | 流动资产周转天数(天) | |
| gdzz | string(50) | 股东权益周转率(次) | |
| ldbl | string(50) | 流动比率 | |
| sdbl | string(50) | 速动比率 | |
| xjbl | string(50) | 现金比率(%) | |
| lxzf | string(50) | 利息支付倍数 | |
| zjbl | string(50) | 长期债务与营运资金比率(%) | |
| gdqy | string(50) | 股东权益比率(%) | |
| cqfz | string(50) | 长期负债比率(%) | |
| gdgd | string(50) | 股东权益与固定资产比率(%) | |
| fzqy | string(50) | 负债与所有者权益比率(%) | |
| zczjbl | string(50) | 长期资产与长期资金比率(%) | |
| zblv | string(50) | 资本化比率(%) | |
| gdzcjz | string(50) | 固定资产净值率(%) | |
| zbgdh | string(50) | 资本固定化比率(%) | |
| cqbl | string(50) | 产权比率(%) | |
| qxjzb | string(50) | 清算价值比率(%) | |
| gdzcbz | string(50) | 固定资产比重(%) | |
| zcfzl | string(50) | 资产负债率(%) | |
| zzc | string(50) | 总资产(元) | |
| jyxj | string(50) | 经营现金净流量对销售收入比率(%) | |
| zcjyxj | string(50) | 资产的经营现金流量回报率(%) | |
| jylrb | string(50) | 经营现金净流量与净利润的比率(%) | |
| jyfzl | string(50) | 经营现金净流量对负债比率(%) | |
| xjlbl | string(50) | 现金流量比率(%) | |
| dqgptz | string(50) | 短期股票投资(元) | |
| dqzctz | string(50) | 短期债券投资(元) | |
| dqjytz | string(50) | 短期其它经营性投资(元) | |
| qcgptz | string(50) | 长期股票投资(元) | |
| cqzqtz | string(50) | 长期债券投资(元) | |
| cqjyxtz | string(50) | 长期其它经营性投资(元) | |
| yszk1 | string(50) | 1年以内应收帐款(元) | |
| yszk12 | string(50) | 1-2年以内应收帐款(元) | |
| yszk23 | string(50) | 2-3年以内应收帐款(元) | |
| yszk3 | string(50) | 3年以内应收帐款(元) | |
| yfhk1 | string(50) | 1年以内预付货款(元) | |
| yfhk12 | string(50) | 1-2年以内预付货款(元) | |
| yfhk23 | string(50) | 2-3年以内预付货款(元) | |
| yfhk3 | string(50) | 3年以内预付货款(元) | |
| ysk1 | string(50) | 1年以内其它应收款(元) | |
| ysk12 | string(50) | 1-2年以内其它应收款(元) | |
| ysk23 | string(50) | 2-3年以内其它应收款(元) | |
| ysk3 | string(50) | 3年以内其它应收款(元) | |
| created_at | datetime | 创建时间 | |

### 使用方法

#### 导入模块

```python
from api_clients.FinancialCoreIndicators.FinancialCoreIndicators import FinancialCoreIndicators
```

#### 初始化客户端

```python
# 使用配置文件中的license
client = FinancialCoreIndicators()

# 或指定license
client = FinancialCoreIndicators(license_key="your_license_key")
```

#### 获取数据

```python
# 获取财务指标数据
data = client.fetch_financial_indicators(stock_code="000001")
```

#### 获取并存储数据

```python
# 获取并存储财务指标数据
count = client.fetch_and_save_financial_indicators(stock_code="000001")
```

---

## 近年业绩预告

### 接口信息

- **接口名称**: 近年业绩预告
- **API接口地址**: `http://api.mairuiapi.com/hscp/yjyg/{股票代码}/{您的licence}`
- **接口说明**: 根据《股票列表》得到的股票代码获取上市公司近年来的业绩预告。按公告日期倒序。
- **数据更新**: 每日03:30
- **请求频率**: 1分钟300次 | 包年版1分钟3千次 | 钻石版1分钟6千次
- **返回格式**: 标准Json格式 `[{},...{}]`

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| stock_code | str | 是 | 股票代码 | "000001" |

### 数据库表结构

**表名**: `performance_forecast`

| 字段名称 | 数据类型 | 字段说明 | 主键 |
|---------|---------|---------|------|
| dm | string(20) | 股票代码 | √ |
| pdate | string(20) | 公告日期yyyy-MM-dd | √ |
| rdate | string(20) | 报告期yyyy-MM-dd | |
| type | string(100) | 类型 | |
| abs | string(5000) | 业绩预告摘要 | |
| old | string(50) | 上年同期每股收益(元) | |
| created_at | datetime | 创建时间 | |

### 使用方法

#### 导入模块

```python
from api_clients.FinancialCoreIndicators.FinancialCoreIndicators import FinancialCoreIndicators
```

#### 初始化客户端

```python
# 使用配置文件中的license
client = FinancialCoreIndicators()

# 或指定license
client = FinancialCoreIndicators(license_key="your_license_key")
```

#### 获取数据

```python
# 获取近年业绩预告数据
data = client.fetch_performance_forecast(stock_code="000001")
```

#### 获取并存储数据

```python
# 获取并存储近年业绩预告数据
count = client.fetch_and_save_performance_forecast(stock_code="000001")
```

---

## 完整使用示例

```python
from api_clients.FinancialCoreIndicators.FinancialCoreIndicators import FinancialCoreIndicators

# 初始化客户端
client = FinancialCoreIndicators()

# 1. 获取财务主要指标数据（指定时间范围）
main_indicators = client.fetch_financial_main_indicators(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
print(f"获取到 {len(main_indicators)} 条财务主要指标数据")

# 2. 获取并存储财务主要指标数据
count1 = client.fetch_and_save_financial_main_indicators(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
print(f"成功存储 {count1} 条财务主要指标数据")

# 3. 获取财务指标数据
financial_indicators = client.fetch_financial_indicators(stock_code="000001")
print(f"获取到 {len(financial_indicators)} 条财务指标数据")

# 4. 获取并存储财务指标数据
count2 = client.fetch_and_save_financial_indicators(stock_code="000001")
print(f"成功存储 {count2} 条财务指标数据")

# 5. 获取近年业绩预告数据
forecast = client.fetch_performance_forecast(stock_code="000001")
print(f"获取到 {len(forecast)} 条近年业绩预告数据")

# 6. 获取并存储近年业绩预告数据
count3 = client.fetch_and_save_performance_forecast(stock_code="000001")
print(f"成功存储 {count3} 条近年业绩预告数据")
```

---

## 注意事项

1. **License配置**: 确保在 `.env` 文件中配置了 `API_LICENSE` 参数，或者在初始化客户端时传入 `license_key` 参数。

2. **股票代码格式**: 
   - 财务主要指标接口需要使用带后缀的股票代码格式（如 "000001.SZ"）
   - 财务指标和近年业绩预告接口使用不带后缀的股票代码格式（如 "000001"）

3. **时间格式**: 财务主要指标接口的时间参数格式为 YYYYMMDD（如 "20240101"），不需要分隔符。

4. **数据存储**: 使用 `fetch_and_save_*` 方法时，如果数据已存在（基于主键），会自动忽略重复数据。

5. **异常处理**: 所有方法都可能抛出以下异常：
   - `ValidationException`: 参数验证失败
   - `APIException`: API请求失败
   - `DatabaseException`: 数据库操作失败

6. **日志记录**: 所有操作都会记录日志，日志文件位于 `log/api_clients/FinancialCoreIndicators/` 目录下。

