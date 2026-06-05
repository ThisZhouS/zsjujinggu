## 指数关系映射API接口文档（IndexRelationshipMapping）

本文档描述指数/行业/概念与股票之间关系的API接口：
- 指数、行业、概念树
- 根据股票找相关指数、行业、概念
- 根据指数、行业、概念找相关股票
- 所属指数

### 目录

- [指数、行业、概念树](#指数行业概念树)
- [根据股票找相关指数、行业、概念](#根据股票找相关指数行业概念)
- [根据指数、行业、概念找相关股票](#根据指数行业概念找相关股票)
- [所属指数](#所属指数)
- [完整使用示例](#完整使用示例)
- [注意事项](#注意事项)

---

## 指数、行业、概念树

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hszg/list/{您的licence}`
- **接口说明**: 获取指数、行业、概念（包含基金、债券、美股、外汇、期货、黄金等）树结构数据。`isleaf=1` 的节点 `Code` 可作为后续接口参数。
- **数据更新**: 每周六03:05

### 接口参数

无。

### 数据库表结构

**表名**: `zg_tree`（模型：`ZgTree`）  
主键：`Code`

| 字段 | 类型 | 说明 |
|---|---|---|
| Code | string(100) | 代码 |
| name | string | 名称 |
| type1 | int | 一级分类 |
| type2 | int | 二级分类 |
| Level | int | 层级 |
| pcode | string | 父节点代码 |
| pname | string | 父节点名称 |
| isleaf | int | 是否叶子节点（0/1） |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.IndexRelationshipMapping.IndexRelationshipMapping import IndexRelationshipMapping

client = IndexRelationshipMapping()
data = client.fetch_zg_tree()
count = client.fetch_and_save_zg_tree()
```

---

## 根据股票找相关指数、行业、概念

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hszg/zg/{股票代码}/{您的licence}`
- **接口说明**: 根据股票代码获取相关的指数、行业、概念代码及名称。
- **数据更新**: 每周六11:00

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码 | `000001` |

### 数据库表结构

**表名**: `stock_to_zg_mapping`（模型：`StockToZgMapping`）  
主键：`dm` + `Code`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 股票代码 |
| Code | string(100) | 指数/行业/概念代码 |
| name | string | 指数/行业/概念名称 |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.IndexRelationshipMapping.IndexRelationshipMapping import IndexRelationshipMapping

client = IndexRelationshipMapping()
data = client.fetch_related_codes_by_stock("000001")
count = client.fetch_and_save_related_codes_by_stock("000001")
```

---

## 根据指数、行业、概念找相关股票

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hszg/gg/{指数、行业、概念代码}/{您的licence}`
- **接口说明**: 根据“指数、行业、概念树”接口得到的 `Code` 作为参数，获取该 code 下的相关股票。
- **数据更新**: 每周六11:00

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| code | str | 是 | 指数/行业/概念代码 | `sw2_650300` |

### 数据库表结构

**表名**: `zg_to_stock_mapping`（模型：`ZgToStockMapping`）  
主键：`Code` + `dm`

| 字段 | 类型 | 说明 |
|---|---|---|
| Code | string(100) | 指数/行业/概念代码 |
| dm | string(20) | 代码（可能是A股股票代码等） |
| mc | string | 名称 |
| jys | string | 交易所（sh/sz），非A股可能为空 |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.IndexRelationshipMapping.IndexRelationshipMapping import IndexRelationshipMapping

client = IndexRelationshipMapping()
data = client.fetch_related_stocks_by_code("sw2_650300")
count = client.fetch_and_save_related_stocks_by_code("sw2_650300")
```

---

## 所属指数

### 接口信息

- **API接口地址**: `http://api.mairuiapi.com/hscp/sszs/{股票代码}/{您的licence}`
- **接口说明**: 根据股票代码获取上市公司的所属指数。
- **数据更新**: 每日03:30

### 接口参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| stock_code | str | 是 | 股票代码 | `000001` |

### 数据库表结构

**表名**: `stock_belonging_indices`（模型：`StockBelongingIndices`）  
主键：`dm` + `index_code` + `Ind`

| 字段 | 类型 | 说明 |
|---|---|---|
| dm | string(20) | 股票代码 |
| index_code | string(50) | 指数代码 |
| mc | string | 指数名称 |
| Ind | string | 进入日期 yyyy-MM-dd |
| outd | string | 退出日期 yyyy-MM-dd |
| created_at | datetime | 创建时间 |

### 使用方法

```python
from api_clients.IndexRelationshipMapping.IndexRelationshipMapping import IndexRelationshipMapping

client = IndexRelationshipMapping()
data = client.fetch_belonging_indices("000001")
count = client.fetch_and_save_belonging_indices("000001")
```

---

## 完整使用示例

```python
from api_clients.IndexRelationshipMapping.IndexRelationshipMapping import IndexRelationshipMapping

client = IndexRelationshipMapping()

# 1) 拉取并存储“指数、行业、概念树”
client.fetch_and_save_zg_tree()

# 2) 股票 -> 指数/行业/概念
client.fetch_and_save_related_codes_by_stock("000001")

# 3) 指数/行业/概念 -> 股票
client.fetch_and_save_related_stocks_by_code("sw2_650300")

# 4) 所属指数
client.fetch_and_save_belonging_indices("000001")
```

---

## 注意事项

1. **License配置**: 请在 `.env` 中配置 `API_LICENSE`，或在初始化时传入 `license_key`。
2. **code 参数来源**: `hszg/gg` 的 `code` 建议来自 `hszg/list` 返回且 `isleaf=1` 的节点 `Code`。

