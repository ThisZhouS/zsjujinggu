# example

本目录用于存放可直接运行的示例程序。

## create_all_tables.py

在 PostgreSQL 中创建项目的全部表结构（会自动发现并导入 `api_clients/**/_table.py`）。

### 1) 配置环境变量或 `.env`

需要至少配置以下参数：

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### 2) 运行

```bash
python example/create_all_tables.py
```


