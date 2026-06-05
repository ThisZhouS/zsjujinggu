## 证券/基金实时交易数据（StockRealTimeData）

本模块封装了股票/指数/基金的实时交易数据接口，并提供存储到 PostgreSQL 的能力。

对应代码模块：
- `api_clients/StockRealTimeData/StockRealTimeData.py`
- `api_clients/StockRealTimeData/StockRealTimeData_table.py`

使用前请确保：
- 已在 `.env` 中正确配置 `API_LICENSE`
- 已完成数据库初始化与迁移

---

### 1. 科创股票实时数据

- **API 地址**：`http://api.mairuiapi.com/kc/real/time/股票代码(如688001)/您的licence`
- **接口说明**：根据《科创股票列表》得到的股票代码获取实时交易数据（可理解为日线的最新数据），该接口为券商数据源。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次

#### 1.1 表结构

- **表名**：`kc_stock_real_time_data`
- **模型类**：`KcStockRealTimeData`
- **主键**：`(dm, t)`

#### 1.2 使用方法

```python
from api_clients.StockRealTimeData.StockRealTimeData import StockRealTimeData

client = StockRealTimeData()
data = client.fetch_kc_stock_real_time_data(stock_code="688001")
count = client.fetch_and_save_kc_stock_real_time_data(stock_code="688001")
```

---

### 2. 实时交易数据（沪深指数）

- **API 地址**：`http://api.mairuiapi.com/hsindex/real/time/指数代码(如：000001.SH)/证书您的licence`
- **接口说明**：根据《指数列表》得到的指数代码获取实时交易数据（可理解为日线的最新数据）。
- **数据更新**：实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次

#### 2.1 表结构

- **表名**：`hs_index_real_time_data`
- **模型类**：`HsIndexRealTimeData`
- **主键**：`(dm, t, created_at)`（按文档将 `created_at` 作为主键字段）

#### 2.2 使用方法

```python
from api_clients.StockRealTimeData.StockRealTimeData import StockRealTimeData

client = StockRealTimeData()
data = client.fetch_hs_index_real_time_data(index_code="000001.SH")
count = client.fetch_and_save_hs_index_real_time_data(index_code="000001.SH")
```

---

### 3. 实时数据（沪深基金）

- **API 地址**：`http://api.mairuiapi.com/hf/real/time/基金代码(如159001)/您的licence`
- **接口说明**：根据《沪深基金列表》得到的基金代码获取实时交易数据（可理解为日线的最新数据），该接口为券商数据源。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次

#### 3.1 表结构

- **表名**：`hf_fund_real_time_data`
- **模型类**：`HfFundRealTimeData`
- **主键**：`(dm, t)`

#### 3.2 使用方法

```python
from api_clients.StockRealTimeData.StockRealTimeData import StockRealTimeData

client = StockRealTimeData()
data = client.fetch_hf_fund_real_time_data(fund_code="159001")
count = client.fetch_and_save_hf_fund_real_time_data(fund_code="159001")
```

---

### 4. 香港股票实时数据

- **API 地址**：`http://api.mairuiapi.com/hk/stock/real/time/股票代码(如00001)/您的licence`
- **接口说明**：根据《港股股票列表》得到的股票代码获取实时交易数据（可理解为日线的最新数据），该接口为券商数据源。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次

#### 4.1 表结构

- **表名**：`hk_stock_real_time_data`
- **模型类**：`HkStockRealTimeData`
- **主键**：`(dm, t)`（接口返回字段可能为 `Dm`，代码已做兼容映射到 `dm`）

#### 4.2 使用方法

```python
from api_clients.StockRealTimeData.StockRealTimeData import StockRealTimeData

client = StockRealTimeData()
data = client.fetch_hk_stock_real_time_data(stock_code="00001")
count = client.fetch_and_save_hk_stock_real_time_data(stock_code="00001")
```

---

### 5. 京市股票实时数据

- **API 地址**：`http://api.mairuiapi.com/bj/stock/real/time/股票代码(如430017)/您的licence`
- **接口说明**：根据《京市股票列表》得到的股票代码获取实时交易数据（可理解为日线的最新数据），该接口为券商数据源。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次

#### 5.1 表结构

- **表名**：`bj_stock_real_time_data`
- **模型类**：`BjStockRealTimeData`
- **主键**：`(dm, t)`

#### 5.2 使用方法

```python
from api_clients.StockRealTimeData.StockRealTimeData import StockRealTimeData

client = StockRealTimeData()
data = client.fetch_bj_stock_real_time_data(stock_code="430017")
count = client.fetch_and_save_bj_stock_real_time_data(stock_code="430017")
```


