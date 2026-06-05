# CompanyBasicInfo - 公司基本信息API接口文档

本文档介绍公司基本信息相关的API接口，包括公司简介、公司股本表、股票基础信息和解禁限售四个接口。

## 目录

1. [公司简介接口](#公司简介接口)
2. [公司股本表接口](#公司股本表接口)
3. [股票基础信息接口](#股票基础信息接口)
4. [解禁限售接口](#解禁限售接口)
5. [使用示例](#使用示例)

---

## 公司简介接口

### API接口地址

```
http://api.mairuiapi.com/hscp/gsjj/股票代码(如000001)/您的licence
```

### 接口说明

根据《股票列表》得到的股票代码获取上市公司的简介。包括公司基本信息，概念以及发行信息等。

**数据更新频率**：每日03:30

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`company_intro`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| name | String(200) | 公司名称 | | |
| ename | String(500) | 公司英文名称 | | |
| market | String(50) | 上市市场 | | |
| idea | String(1000) | 概念及板块，多个概念由英文逗号分隔 | | |
| ldate | String(20) | 上市日期，格式yyyy-MM-dd | √ | NOT NULL |
| sprice | String(50) | 发行价格（元） | | |
| principal | String(200) | 主承销商 | | |
| rdate | String(50) | 成立日期 | | |
| rprice | String(50) | 注册资本 | | |
| instype | String(100) | 机构类型 | | |
| organ | String(100) | 组织形式 | | |
| secre | String(100) | 董事会秘书 | | |
| phone | String(50) | 公司电话 | | |
| sphone | String(50) | 董秘电话 | | |
| fax | String(50) | 公司传真 | | |
| sfax | String(50) | 董秘传真 | | |
| email | String(200) | 公司电子邮箱 | | |
| semail | String(200) | 董秘电子邮箱 | | |
| site | String(500) | 公司网站 | | |
| post | String(20) | 邮政编码 | | |
| infosite | String(500) | 信息披露网址 | | |
| oname | String(500) | 证券简称更名历史 | | |
| addr | String(1000) | 注册地址 | | |
| oaddr | String(1000) | 办公地址 | | |
| desc | String(5000) | 公司简介 | | |
| bscope | String(5000) | 经营范围 | | |
| printype | String(100) | 承销方式 | | |
| referrer | String(200) | 上市推荐人 | | |
| putype | String(100) | 发行方式 | | |
| pe | String(50) | 发行市盈率（按发行后总股本） | | |
| firgu | String(50) | 首发前总股本（万股） | | |
| lastgu | String(50) | 首发后总股本（万股） | | |
| realgu | String(50) | 实际发行量（万股） | | |
| planm | String(50) | 预计募集资金（万元） | | |
| realm | String(50) | 实际募集资金合计（万元） | | |
| pubfee | String(50) | 发行费用总额（万元） | | |
| collect | String(50) | 募集资金净额（万元） | | |
| signfee | String(50) | 承销费用（万元） | | |
| pdate | String(50) | 招股公告日 | | |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, ldate)`

### 使用方法

#### 导入模块

```python
from api_clients.CompanyBasicInfo.CompanyBasicInfo import CompanyBasicInfo
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001"

#### 方法说明

1. **fetch_company_intro(stock_code: str) -> List[Dict[str, Any]]**
   - 功能：获取公司简介数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：公司简介数据列表

2. **fetch_and_save_company_intro(stock_code: str) -> int**
   - 功能：获取并存储公司简介数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：成功存储的记录数

---

## 公司股本表接口

### API接口地址

```
http://api.mairuiapi.com/hsstock/financial/capital/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
```

### 接口说明

根据《股票列表》得到的股票代码获取公司股本表，开始时间以及结束时间的格式均为 YYYYMMDD，例如：'20240101'。不设置开始时间和结束时间则为全部数据。

**数据更新频率**：每日0点

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`company_capital`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| zgb | Float | 总股本 | | |
| ysltag | Float | 已上市流通A股 | | |
| xsltgf | Float | 限售流通股份 | | |
| bdrq | String(20) | 变动日期 | √ | NOT NULL |
| plrq | String(20) | 公告日 | √ | NOT NULL |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, bdrq, plrq)`

### 使用方法

#### 导入模块

```python
from api_clients.CompanyBasicInfo.CompanyBasicInfo import CompanyBasicInfo
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001.SZ"
- `start_date` (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None（获取全部数据）
- `end_date` (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None（获取全部数据）

#### 方法说明

1. **fetch_company_capital(stock_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]**
   - 功能：获取公司股本表数据
   - 参数：
     - `stock_code` (str): 股票代码
     - `start_date` (Optional[str]): 开始时间，格式YYYYMMDD
     - `end_date` (Optional[str]): 结束时间，格式YYYYMMDD
   - 返回：公司股本表数据列表

2. **fetch_and_save_company_capital(stock_code: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> int**
   - 功能：获取并存储公司股本表数据
   - 参数：
     - `stock_code` (str): 股票代码
     - `start_date` (Optional[str]): 开始时间，格式YYYYMMDD
     - `end_date` (Optional[str]): 结束时间，格式YYYYMMDD
   - 返回：成功存储的记录数

---

## 股票基础信息接口

### API接口地址

```
http://api.mairuiapi.com/hsstock/instrument/股票代码（如000001.SZ）/您的licence
```

### 接口说明

依据《股票列表》中的股票代码获取股票的基础信息。

**数据更新频率**：每日1点

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`stock_basic_info`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| ei | String(20) | 市场代码 | | |
| ii | String(20) | 股票代码 | | |
| name | String(200) | 股票名称 | | |
| od | String(20) | 上市日期(股票IPO日期) | √ | NOT NULL |
| pc | Float | 前收盘价格 | | |
| up | Float | 当日涨停价 | | |
| dp | Float | 当日跌停价 | | |
| fv | Float | 流通股本 | | |
| tv | Float | 总股本 | | |
| pk | Float | 最小价格变动单位 | | |
| is_stop | Integer | 股票停牌状态(<=0:正常交易（-1:复牌）;>=1停牌天数;) | | |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, od)`

### 使用方法

#### 导入模块

```python
from api_clients.CompanyBasicInfo.CompanyBasicInfo import CompanyBasicInfo
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001.SZ"

#### 方法说明

1. **fetch_stock_basic_info(stock_code: str) -> List[Dict[str, Any]]**
   - 功能：获取股票基础信息数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：股票基础信息数据列表

2. **fetch_and_save_stock_basic_info(stock_code: str) -> int**
   - 功能：获取并存储股票基础信息数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：成功存储的记录数

---

## 解禁限售接口

### API接口地址

```
http://api.mairuiapi.com/hscp/jjxs/股票代码(如000001)/您的licence
```

### 接口说明

根据《股票列表》得到的股票代码获取上市公司的解禁限售情况。按解禁日期倒序。

**数据更新频率**：每日03:30

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`lift_restriction`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| rdate | String(20) | 解禁日期yyyy-MM-dd | √ | NOT NULL |
| ramount | NUMERIC(20, 4) | 解禁数量(万股) | | |
| rprice | NUMERIC(20, 4) | 解禁股流通市值(亿元) | | |
| batch | Integer | 上市批次 | | |
| pdate | String(20) | 公告日期yyyy-MM-dd | √ | NOT NULL |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, rdate, pdate)`

### 使用方法

#### 导入模块

```python
from api_clients.CompanyBasicInfo.CompanyBasicInfo import CompanyBasicInfo
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001"

#### 方法说明

1. **fetch_lift_restriction(stock_code: str) -> List[Dict[str, Any]]**
   - 功能：获取解禁限售数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：解禁限售数据列表

2. **fetch_and_save_lift_restriction(stock_code: str) -> int**
   - 功能：获取并存储解禁限售数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：成功存储的记录数

---

## 使用示例

### 基本使用

```python
from api_clients.CompanyBasicInfo.CompanyBasicInfo import CompanyBasicInfo

# 初始化客户端（会自动从.env文件读取API_LICENSE）
client = CompanyBasicInfo()

# 或者手动指定许可证
# client = CompanyBasicInfo(license_key="your_license_key")
```

### 示例1：获取公司简介

```python
# 仅获取数据
data = client.fetch_company_intro("000001")
print(f"获取到 {len(data)} 条公司简介数据")

# 获取并存储数据
count = client.fetch_and_save_company_intro("000001")
print(f"成功存储 {count} 条公司简介数据")
```

### 示例2：获取公司股本表

```python
# 获取指定时间范围的数据
data = client.fetch_company_capital(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
print(f"获取到 {len(data)} 条公司股本表数据")

# 获取全部数据（不指定时间范围）
data_all = client.fetch_company_capital("000001.SZ")

# 获取并存储数据
count = client.fetch_and_save_company_capital(
    stock_code="000001.SZ",
    start_date="20240101",
    end_date="20241231"
)
print(f"成功存储 {count} 条公司股本表数据")
```

### 示例3：获取股票基础信息

```python
# 仅获取数据
data = client.fetch_stock_basic_info("000001.SZ")
print(f"获取到 {len(data)} 条股票基础信息数据")

# 获取并存储数据
count = client.fetch_and_save_stock_basic_info("000001.SZ")
print(f"成功存储 {count} 条股票基础信息数据")
```

### 示例4：获取解禁限售数据

```python
# 仅获取数据
data = client.fetch_lift_restriction("000001")
print(f"获取到 {len(data)} 条解禁限售数据")

# 获取并存储数据
count = client.fetch_and_save_lift_restriction("000001")
print(f"成功存储 {count} 条解禁限售数据")
```

### 批量处理示例

```python
# 批量获取多个股票的公司简介
stock_codes = ["000001", "000002", "600000", "600001"]

for stock_code in stock_codes:
    try:
        count = client.fetch_and_save_company_intro(stock_code)
        print(f"股票 {stock_code} 成功存储 {count} 条公司简介数据")
    except Exception as e:
        print(f"股票 {stock_code} 处理失败: {str(e)}")
```

### 错误处理示例

```python
from core.exceptions import APIException, ValidationException, DatabaseException

try:
    # 尝试获取数据
    data = client.fetch_company_intro("000001")
except ValidationException as e:
    print(f"参数验证失败: {str(e)}")
except APIException as e:
    print(f"API请求失败: {str(e)}")
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
   - 公司简介和解禁限售接口使用简单格式，如"000001"
   - 公司股本表和股票基础信息接口使用完整格式，如"000001.SZ"

2. **时间格式**：
   - 公司股本表接口的时间参数格式为YYYYMMDD，如"20240101"

3. **数据更新频率**：
   - 公司简介：每日03:30
   - 公司股本表：每日0点
   - 股票基础信息：每日1点
   - 解禁限售：每日03:30

4. **请求频率限制**：
   - 请根据您的许可证类型控制请求频率，避免超出限制

5. **数据存储**：
   - 所有`fetch_and_save_*`方法在存储时会自动处理重复数据（使用`ignore_duplicates=True`）
   - 数据存储基于主键约束，重复的主键数据会被忽略或更新

