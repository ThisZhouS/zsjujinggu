## 指数实时数据（IndexRealTimeData）

本模块封装了“指数实时数据”接口，并提供存储到 PostgreSQL 的能力。

对应代码模块：
- `api_clients/IndexRealTimeData/IndexRealTimeData.py`
- `api_clients/IndexRealTimeData/IndexRealTimeData_table.py`

使用前请确保：
- 已在 `.env` 中正确配置 `API_LICENSE`
- 已完成数据库初始化与迁移

---

### 1. 指数实时数据（京市指数）

- **接口名称**：指数实时数据
- **API 地址**：`http://api.mairuiapi.com/bj/index/real/time/指数代码(如899050)/您的licence`
- **接口说明**：根据《京市指数列表》得到的指数代码获取实时交易数据（可理解为日线的最新数据），该接口为券商数据源。
- **数据更新**：盘中实时
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 1.1 表结构

- **表名**：`bj_index_real_time_data`
- **模型类**：`BjIndexRealTimeData`

| 字段名       | 类型        | 说明       | 主键 |
|------------|-----------|----------|------|
| dm         | String(30)| 指数代码     | √    |
| p          | Float     | 最新价      |      |
| o          | Float     | 开盘价      |      |
| h          | Float     | 最高价      |      |
| l          | Float     | 最低价      |      |
| yc         | Float     | 前收盘价     |      |
| cje        | Float     | 成交总额     |      |
| v          | Float     | 成交总量     |      |
| pv         | Float     | 原始成交总量   |      |
| ud         | Float     | 涨跌额      |      |
| pc         | Float     | 涨跌幅      |      |
| zf         | Float     | 振幅       |      |
| t          | String(50)| 更新时间     | √    |
| pe         | Float     | 市盈率      |      |
| tr         | Float     | 换手率      |      |
| pb_ratio   | Float     | 市净率      |      |
| tv         | Float     | 成交量      |      |
| created_at | DateTime  | 创建时间     |      |

#### 1.2 使用方法

- **导入模块**：

```python
from api_clients.IndexRealTimeData.IndexRealTimeData import IndexRealTimeData
```

- **仅获取数据（不落库）**：

```python
client = IndexRealTimeData()
data = client.fetch_index_real_time_data(index_code="899050")
```

- **获取并存储到数据库**：

```python
client = IndexRealTimeData()
count = client.fetch_and_save_index_real_time_data(index_code="899050")
```


