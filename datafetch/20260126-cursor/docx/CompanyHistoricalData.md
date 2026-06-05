# CompanyHistoricalData - 公司历史数据API接口文档

本文档介绍公司历史数据相关的API接口，包括历届监事会成员、历届高管成员和历届董事会成员三个接口。

## 目录

1. [历届监事会成员接口](#历届监事会成员接口)
2. [历届高管成员接口](#历届高管成员接口)
3. [历届董事会成员接口](#历届董事会成员接口)
4. [使用示例](#使用示例)

---

## 历届监事会成员接口

### API接口地址

```
http://api.mairuiapi.com/hscp/ljjj/股票代码(如000001)/您的licence
```

### 接口说明

根据《股票列表》得到的股票代码获取上市公司的历届监事会成员名单。

**数据更新频率**：每日03:30

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`supervisory_board_member`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| name | String(100) | 姓名 | | |
| title | String(200) | 职务 | | |
| sdate | String(20) | 起始日期yyyy-MM-dd | √ | NOT NULL |
| edate | String(20) | 终止日期yyyy-MM-dd | √ | NOT NULL |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, sdate, edate)`

### 使用方法

#### 导入模块

```python
from api_clients.CompanyHistoricalData.CompanyHistoricalData import CompanyHistoricalData
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001"

#### 方法说明

1. **fetch_supervisory_board_member(stock_code: str) -> List[Dict[str, Any]]**
   - 功能：获取历届监事会成员数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：历届监事会成员数据列表

2. **fetch_and_save_supervisory_board_member(stock_code: str) -> int**
   - 功能：获取并存储历届监事会成员数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：成功存储的记录数

---

## 历届高管成员接口

### API接口地址

```
http://api.mairuiapi.com/hscp/ljgg/股票代码(如000001)/您的licence
```

### 接口说明

根据《股票列表》得到的股票代码获取上市公司的历届高管成员名单。

**数据更新频率**：每日03:30

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`executive_member`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| name | String(100) | 姓名 | | |
| title | String(200) | 职务 | | |
| sdate | String(20) | 起始日期yyyy-MM-dd | √ | NOT NULL |
| edate | String(20) | 终止日期yyyy-MM-dd | √ | NOT NULL |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, sdate, edate)`

### 使用方法

#### 导入模块

```python
from api_clients.CompanyHistoricalData.CompanyHistoricalData import CompanyHistoricalData
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001"

#### 方法说明

1. **fetch_executive_member(stock_code: str) -> List[Dict[str, Any]]**
   - 功能：获取历届高管成员数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：历届高管成员数据列表

2. **fetch_and_save_executive_member(stock_code: str) -> int**
   - 功能：获取并存储历届高管成员数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：成功存储的记录数

---

## 历届董事会成员接口

### API接口地址

```
http://api.mairuiapi.com/hscp/ljds/股票代码(如000001)/您的licence
```

### 接口说明

根据《股票列表》得到的股票代码获取上市公司的历届董事会成员名单。

**数据更新频率**：每日03:30

**请求频率限制**：
- 标准版：1分钟300次
- 包年版：1分钟3千次
- 钻石版：1分钟6千次

**返回格式**：标准Json格式 `[{},...{}]`

### 数据库表结构

**表名**：`board_member`

| 字段名称 | 数据类型 | 字段说明 | 主键 | 约束 |
|---------|---------|---------|------|------|
| dm | String(20) | 股票代码 | √ | NOT NULL |
| name | String(100) | 姓名 | | |
| title | String(200) | 职务 | | |
| sdate | String(20) | 起始日期yyyy-MM-dd | √ | NOT NULL |
| edate | String(20) | 终止日期yyyy-MM-dd | √ | NOT NULL |
| created_at | DateTime | 创建时间 | | |

**主键约束**：`(dm, sdate, edate)`

### 使用方法

#### 导入模块

```python
from api_clients.CompanyHistoricalData.CompanyHistoricalData import CompanyHistoricalData
```

#### 参数说明

- `stock_code` (str): 股票代码，如"000001"

#### 方法说明

1. **fetch_board_member(stock_code: str) -> List[Dict[str, Any]]**
   - 功能：获取历届董事会成员数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：历届董事会成员数据列表

2. **fetch_and_save_board_member(stock_code: str) -> int**
   - 功能：获取并存储历届董事会成员数据
   - 参数：
     - `stock_code` (str): 股票代码
   - 返回：成功存储的记录数

---

## 使用示例

### 基本使用

```python
from api_clients.CompanyHistoricalData.CompanyHistoricalData import CompanyHistoricalData

# 初始化客户端（会自动从.env文件读取API_LICENSE）
client = CompanyHistoricalData()

# 或者手动指定许可证
# client = CompanyHistoricalData(license_key="your_license_key")
```

### 示例1：获取历届监事会成员

```python
# 仅获取数据
data = client.fetch_supervisory_board_member("000001")
print(f"获取到 {len(data)} 条历届监事会成员数据")

# 获取并存储数据
count = client.fetch_and_save_supervisory_board_member("000001")
print(f"成功存储 {count} 条历届监事会成员数据")
```

### 示例2：获取历届高管成员

```python
# 仅获取数据
data = client.fetch_executive_member("000001")
print(f"获取到 {len(data)} 条历届高管成员数据")

# 获取并存储数据
count = client.fetch_and_save_executive_member("000001")
print(f"成功存储 {count} 条历届高管成员数据")
```

### 示例3：获取历届董事会成员

```python
# 仅获取数据
data = client.fetch_board_member("000001")
print(f"获取到 {len(data)} 条历届董事会成员数据")

# 获取并存储数据
count = client.fetch_and_save_board_member("000001")
print(f"成功存储 {count} 条历届董事会成员数据")
```

### 批量处理示例

```python
# 批量获取多个股票的历史数据
stock_codes = ["000001", "000002", "600000", "600001"]

for stock_code in stock_codes:
    try:
        # 获取并存储历届监事会成员
        count1 = client.fetch_and_save_supervisory_board_member(stock_code)
        print(f"股票 {stock_code} 成功存储 {count1} 条历届监事会成员数据")
        
        # 获取并存储历届高管成员
        count2 = client.fetch_and_save_executive_member(stock_code)
        print(f"股票 {stock_code} 成功存储 {count2} 条历届高管成员数据")
        
        # 获取并存储历届董事会成员
        count3 = client.fetch_and_save_board_member(stock_code)
        print(f"股票 {stock_code} 成功存储 {count3} 条历届董事会成员数据")
    except Exception as e:
        print(f"股票 {stock_code} 处理失败: {str(e)}")
```

### 错误处理示例

```python
from core.exceptions import APIException, ValidationException, DatabaseException

try:
    # 尝试获取数据
    data = client.fetch_supervisory_board_member("000001")
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
   - 所有接口使用简单格式，如"000001"

2. **数据更新频率**：
   - 所有接口：每日03:30

3. **请求频率限制**：
   - 请根据您的许可证类型控制请求频率，避免超出限制
   - 标准版：1分钟300次
   - 包年版：1分钟3千次
   - 钻石版：1分钟6千次

4. **数据存储**：
   - 所有`fetch_and_save_*`方法在存储时会自动处理重复数据（使用`ignore_duplicates=True`）
   - 数据存储基于主键约束`(dm, sdate, edate)`，重复的主键数据会被忽略或更新

5. **日期格式**：
   - 起始日期和终止日期格式为`yyyy-MM-dd`，例如："2024-01-01"

