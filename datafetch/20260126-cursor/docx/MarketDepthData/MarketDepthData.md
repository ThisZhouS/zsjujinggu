## 市场深度数据（MarketDepthData）

本模块封装了市场深度数据中的“买卖五档盘口”相关接口，并提供存储到 PostgreSQL 的能力。

对应代码模块：
- `api_clients/MarketDepthData/MarketDepthData.py`
- `api_clients/MarketDepthData/MarketDepthData_table.py`

使用前请确保：
- 已在 `.env` 中正确配置 `API_LICENSE`
- 已完成数据库初始化与迁移

---

### 1. 沪深买卖五档盘口

- **接口名称**：沪深买卖五档盘口
- **API 地址**：`http://api.mairuiapi.com/hsstock/real/five/股票代码/证书您的licence`
- **接口说明**：根据《股票列表》得到的股票代码获取实时买卖五档盘口数据。
- **数据更新**：实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 1.1 表结构

- **表名**：`hs_stock_real_five`
- **模型类**：`HsStockRealFive`

| 字段名       | 类型        | 说明     | 主键 |
|------------|-----------|--------|------|
| dm         | String(30)| 股票代码   | √    |
| ps         | Float     | 委卖价    |      |
| pb         | Float     | 委买价    |      |
| vs         | Float     | 委卖量    |      |
| vb         | Float     | 委买量    |      |
| t          | String(50)| 更新时间   | √    |
| created_at | DateTime  | 创建时间   |      |

#### 1.2 使用方法

```python
from api_clients.MarketDepthData.MarketDepthData import MarketDepthData

client = MarketDepthData()

# 仅获取数据（不落库）
data = client.fetch_hs_stock_real_five(stock_code="000001")

# 获取并存储到数据库
count = client.fetch_and_save_hs_stock_real_five(stock_code="000001")
```

---

### 2. 科创买卖五档盘口

- **接口名称**：科创买卖五档盘口
- **API 地址**：`http://api.mairuiapi.com/kc/real/five/股票代码(如688001)/您的licence`
- **接口说明**：根据《科创股票列表》得到的股票代码获取实时买卖五档盘口数据。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 2.1 表结构

- **表名**：`kc_stock_real_five`
- **模型类**：`KcStockRealFive`

| 字段名       | 类型        | 说明     | 主键 |
|------------|-----------|--------|------|
| dm         | String(30)| 股票代码   | √    |
| ps         | Float     | 委卖价    |      |
| pb         | Float     | 委买价    |      |
| vs         | Float     | 委卖量    |      |
| vb         | Float     | 委买量    |      |
| t          | String(50)| 更新时间   | √    |
| created_at | DateTime  | 创建时间   |      |

#### 2.2 使用方法

```python
from api_clients.MarketDepthData.MarketDepthData import MarketDepthData

client = MarketDepthData()
data = client.fetch_kc_stock_real_five(stock_code="688001")
count = client.fetch_and_save_kc_stock_real_five(stock_code="688001")
```

---

### 3. 京市买卖五档盘口

- **接口名称**：京市买卖五档盘口
- **API 地址**：`http://api.mairuiapi.com/bj/stock/real/five/股票代码(如430017)/您的licence`
- **接口说明**：根据《京市股票列表》得到的股票代码获取实时买卖五档盘口数据。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 3.1 表结构

- **表名**：`bj_stock_real_five`
- **模型类**：`BjStockRealFive`

| 字段名       | 类型        | 说明     | 主键 |
|------------|-----------|--------|------|
| dm         | String(30)| 股票代码   | √    |
| ps         | Float     | 委卖价    |      |
| pb         | Float     | 委买价    |      |
| vs         | Float     | 委卖量    |      |
| vb         | Float     | 委买量    |      |
| t          | String(50)| 更新时间   | √    |
| created_at | DateTime  | 创建时间   |      |

#### 3.2 使用方法

```python
from api_clients.MarketDepthData.MarketDepthData import MarketDepthData

client = MarketDepthData()
data = client.fetch_bj_stock_real_five(stock_code="430017")
count = client.fetch_and_save_bj_stock_real_five(stock_code="430017")
```

---

### 4. 港股买卖五档盘口

- **接口名称**：港股买卖五档盘口
- **API 地址**：`http://api.mairuiapi.com/hk/stock/real/five/股票代码(如00001)/您的licence`
- **接口说明**：根据《港股股票列表》得到的股票代码获取实时买卖五档盘口数据。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 4.1 表结构

- **表名**：`hk_stock_real_five`
- **模型类**：`HkStockRealFive`

| 字段名       | 类型        | 说明     | 主键 |
|------------|-----------|--------|------|
| dm         | String(30)| 股票代码   | √    |
| ps         | Float     | 委卖价    |      |
| pb         | Float     | 委买价    |      |
| vs         | Float     | 委卖量    |      |
| vb         | Float     | 委买量    |      |
| t          | String(50)| 更新时间   | √    |
| updated_at | DateTime  | 更新时间   |      |

#### 4.2 使用方法

```python
from api_clients.MarketDepthData.MarketDepthData import MarketDepthData

client = MarketDepthData()
data = client.fetch_hk_stock_real_five(stock_code="00001")
count = client.fetch_and_save_hk_stock_real_five(stock_code="00001")
```


