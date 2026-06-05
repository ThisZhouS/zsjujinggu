## 其他市场列表（OtherMarketLists）

本模块封装了市场基础信息中“其他市场列表”相关的 API 接口，并提供数据存储到 PostgreSQL 的能力。

对应代码模块：
- `api_clients/OtherMarketLists/OtherMarketLists.py`
- `api_clients/OtherMarketLists/OtherMarketLists_table.py`

使用前请确保：
- 已在 `.env` 中正确配置 `API_LICENSE`
- 已完成数据库初始化与迁移

---

### 1. 京市指数列表

- **接口名称**：京市指数列表
- **API 地址**：`http://api.mairuiapi.com/bj/list/index/您的licence`
- **接口说明**：获取基础的指数代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 16:20
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 1.1 表结构

- **表名**：`bj_index_list`
- **模型类**：`BjIndexList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(30)  | 指数代码，如：`899050.BJ`                     | √    |
| mc        | String(200) | 指数名称，如：`北证50`                           |      |
| jys       | String(50)  | 交易所                                     |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 1.2 使用方法

- **导入模块**：

```python
from api_clients.OtherMarketLists.OtherMarketLists import OtherMarketLists
```

- **仅获取数据（不落库）**：

```python
client = OtherMarketLists()
data = client.fetch_bj_index_list()
```

- **获取并存储到数据库**：

```python
client = OtherMarketLists()
count = client.fetch_and_save_bj_index_list()
```

---

### 2. 科创股票列表

- **接口名称**：科创股票列表
- **API 地址**：`http://api.mairuiapi.com/kc/list/all/您的licence`
- **接口说明**：获取基础的股票代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 16:20
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 2.1 表结构

- **表名**：`kc_stock_list`
- **模型类**：`KcStockList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(30)  | 股票代码，如：`688001.SH`                     | √    |
| mc        | String(200) | 股票名称，如：`华兴源创`                          |      |
| jys       | String(50)  | 交易所                                     |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 2.2 使用方法

- **导入模块**：

```python
from api_clients.OtherMarketLists.OtherMarketLists import OtherMarketLists
```

- **仅获取数据（不落库）**：

```python
client = OtherMarketLists()
data = client.fetch_kc_stock_list()
```

- **获取并存储到数据库**：

```python
client = OtherMarketLists()
count = client.fetch_and_save_kc_stock_list()
```

---

### 3. ETF 基金列表

- **接口名称**：ETF 基金列表
- **API 地址**：`http://api.mairuiapi.com/fd/list/etf/您的licence`
- **接口说明**：获取基础的基金代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 16:20
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 3.1 表结构

- **表名**：`etf_fund_list`
- **模型类**：`EtfFundList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(30)  | 基金代码，如：`159718.SZ`                     | √    |
| mc        | String(200) | 基金名称，如：`港股医药ETF`                      |      |
| jys       | String(50)  | 交易所，`sh` 表示上证，`sz` 表示深证              |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 3.2 使用方法

- **导入模块**：

```python
from api_clients.OtherMarketLists.OtherMarketLists import OtherMarketLists
```

- **仅获取数据（不落库）**：

```python
client = OtherMarketLists()
data = client.fetch_etf_fund_list()
```

- **获取并存储到数据库**：

```python
client = OtherMarketLists()
count = client.fetch_and_save_etf_fund_list()
```

---

### 4. 京市股票列表

- **接口名称**：京市股票列表
- **API 地址**：`http://api.mairuiapi.com/bj/list/all/您的licence`
- **接口说明**：获取基础的股票代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 16:20
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 4.1 表结构

- **表名**：`bj_stock_list`
- **模型类**：`BjStockList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(30)  | 股票代码，如：`430017.BJ`                     | √    |
| mc        | String(200) | 股票名称，如：`星昊医药`                          |      |
| jys       | String(50)  | 交易所                                     |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 4.2 使用方法

- **导入模块**：

```python
from api_clients.OtherMarketLists.OtherMarketLists import OtherMarketLists
```

- **仅获取数据（不落库）**：

```python
client = OtherMarketLists()
data = client.fetch_bj_stock_list()
```

- **获取并存储到数据库**：

```python
client = OtherMarketLists()
count = client.fetch_and_save_bj_stock_list()
```


