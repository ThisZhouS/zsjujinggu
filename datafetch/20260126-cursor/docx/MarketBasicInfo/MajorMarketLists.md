## 主要市场列表（MajorMarketLists）

本模块封装了市场基础信息中“主要市场列表”相关的 API 接口，并提供数据存储到 PostgreSQL 的能力。

对应代码模块：
- `api_clients/MajorMarketLists/MajorMarketLists.py`
- `api_clients/MajorMarketLists/MajorMarketLists_table.py`

使用前请确保：
- 已在 `.env` 中正确配置 `API_LICENSE`
- 已完成数据库初始化与迁移

---

### 1. 股票列表

- **接口名称**：股票列表
- **API 地址**：`http://api.mairuiapi.com/hslt/list/您的licence`
- **接口说明**：获取基础的股票代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 16:20
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 1.1 表结构

- **表名**：`stock_list`
- **模型类**：`StockList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(20)  | 股票代码，如：`000001`                      | √    |
| mc        | String(200) | 股票名称，如：`平安银行`                      |      |
| jys       | String(10)  | 交易所，`sh` 表示上证，`sz` 表示深证              |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 1.2 使用方法

- **导入模块**：

```python
from api_clients.MajorMarketLists.MajorMarketLists import MajorMarketLists
```

- **仅获取数据（不落库）**：

```python
client = MajorMarketLists()
data = client.fetch_stock_list()
```

- **获取并存储到数据库**：

```python
client = MajorMarketLists()
count = client.fetch_and_save_stock_list()
```

---

### 2. 沪深基金列表

- **接口名称**：沪深基金列表
- **API 地址**：`http://api.mairuiapi.com/fd/list/all/您的licence`
- **接口说明**：获取基础的基金代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 16:20
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 2.1 表结构

- **表名**：`hs_fund_list`
- **模型类**：`HsFundList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(30)  | 基金代码，如：`159001.SZ`                    | √    |
| mc        | String(200) | 基金名称，如：`货币ETF`                        |      |
| jys       | String(10)  | 交易所，`sh` 表示上证，`sz` 表示深证              |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 2.2 使用方法

- **导入模块**：

```python
from api_clients.MajorMarketLists.MajorMarketLists import MajorMarketLists
```

- **仅获取数据（不落库）**：

```python
client = MajorMarketLists()
data = client.fetch_hs_fund_list()
```

- **获取并存储到数据库**：

```python
client = MajorMarketLists()
count = client.fetch_and_save_hs_fund_list()
```

---

### 3. 沪深主要指数列表

- **接口名称**：沪深主要指数列表
- **API 地址**：`http://api.mairuiapi.com/hsindex/list/您的licence`
- **接口说明**：获取沪深两市主要的指数代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 0 点
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 3.1 表结构

- **表名**：`hs_main_index_list`
- **模型类**：`HsMainIndexList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(30)  | 指数代码，如：`000001.SH`                    | √    |
| mc        | String(200) | 指数名称，如：`上证指数`                        |      |
| jys       | String(10)  | 交易所，`sh` 表示上证，`sz` 表示深证              |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 3.2 使用方法

- **导入模块**：

```python
from api_clients.MajorMarketLists.MajorMarketLists import MajorMarketLists
```

- **仅获取数据（不落库）**：

```python
client = MajorMarketLists()
data = client.fetch_hs_main_index_list()
```

- **获取并存储到数据库**：

```python
client = MajorMarketLists()
count = client.fetch_and_save_hs_main_index_list()
```

---

### 4. 新股日历

- **接口名称**：新股日历
- **API 地址**：`http://api.mairuiapi.com/hslt/new/您的licence`
- **接口说明**：新股日历，按申购日期倒序。
- **数据更新**：每日 17:00
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 4.1 表结构

- **表名**：`new_stock_calendar`
- **模型类**：`NewStockCalendar`

字段定义（与官方文档字段一一对应）：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| zqdm      | String(30)  | 股票代码                                   | √    |
| zqjc      | String(200) | 股票简称                                   |      |
| sgdm      | String(30)  | 申购代码                                   |      |
| fxsl      | Float       | 发行总数（股）                               |      |
| swfxsl    | Float       | 网上发行（股）                               |      |
| sgsx      | Float       | 申购上限（股）                               |      |
| dgsz      | Float       | 顶格申购需配市值(元)                           |      |
| sgrq      | String(20)  | 申购日期                                   |      |
| fxjg      | Float       | 发行价格（元），null 为“未知”                   |      |
| zxj       | Float       | 最新价（元），null 为“未知”                    |      |
| srspj     | Float       | 首日收盘价（元），null 为“未知”                  |      |
| zqgbrq    | String(20)  | 中签号公布日，null 为未知                       |      |
| zqjkrq    | String(20)  | 中签缴款日，null 为未知                        |      |
| ssrq      | String(20)  | 上市日期，null 为未知                          |      |
| syl       | Float       | 发行市盈率，null 为“未知”                      |      |
| hysyl     | Float       | 行业市盈率                                  |      |
| wszql     | Float       | 中签率（%），null 为“未知”                     |      |
| yzbsl     | Float       | 连续一字板数量，null 为“未知”                  |      |
| zf        | Float       | 涨幅（%），null 为“未知”                       |      |
| yqhl      | Float       | 每中一签获利（元），null 为“未知”               |      |
| zyyw      | String(2000)| 主营业务                                   |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 4.2 使用方法

- **导入模块**：

```python
from api_clients.MajorMarketLists.MajorMarketLists import MajorMarketLists
```

- **仅获取数据（不落库）**：

```python
client = MajorMarketLists()
data = client.fetch_new_stock_calendar()
```

- **获取并存储到数据库**：

```python
client = MajorMarketLists()
count = client.fetch_and_save_new_stock_calendar()
```

---

### 5. 港股股票列表

- **接口名称**：港股股票列表
- **API 地址**：`http://api.mairuiapi.com/hk/list/all/您的licence`
- **接口说明**：获取港股基础的股票代码和名称，用于后续接口的参数传入。
- **数据更新**：每日 16:20
- **请求频率**：1 分钟 300 次 | 包年版 1 分钟 3000 次 | 钻石版 1 分钟 6000 次
- **返回格式**：标准 JSON 格式 `[{...}, {...}]`

#### 5.1 表结构

- **表名**：`hk_stock_list`
- **模型类**：`HkStockList`

字段定义：

| 字段名      | 类型        | 说明                                      | 主键 |
| --------- | ----------- | --------------------------------------- | ---- |
| dm        | String(30)  | 股票代码，如：`00001.HK`                      | √    |
| mc        | String(200) | 股票名称，如：`长和`                            |      |
| jys       | String(50)  | 交易所                                     |      |
| updated_at| DateTime    | 更新时间，写入时间                          |      |

#### 5.2 使用方法

- **导入模块**：

```python
from api_clients.MajorMarketLists.MajorMarketLists import MajorMarketLists
```

- **仅获取数据（不落库）**：

```python
client = MajorMarketLists()
data = client.fetch_hk_stock_list()
```

- **获取并存储到数据库**：

```python
client = MajorMarketLists()
count = client.fetch_and_save_hk_stock_list()
```


