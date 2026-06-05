# 全量获取脚本配置说明

本说明文档介绍了如何为 `run_useful_full_fetch.py` 配置文件。

## 配置文件位置

默认配置文件路径：`config/fetch_config.yaml`

可通过以下方式指定配置文件：
```bash
python scripts/run_useful_full_fetch.py --config /path/to/custom_config.yaml
```

## 配置选项说明

### 执行控制

| 配置项 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `resume` | boolean | false | 是否启用断点续跑 |
| `dry_run` | boolean | false | 测试模式，只显示任务列表不实际执行 |
| `verbose` | boolean | false | 是否启用详细日志输出 |

### 日期配置

| 配置项 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `full_start_date` | string | "1991-01-01" | 全量获取起始日期，格式：YYYY-MM-DD |
| `full_end_date` | string | 今天 | 全量获取结束日期，格式：YYYY-MM-DD，留空使用今天 |
| `single_date_mode` | boolean | false | 单日模式，只执行指定日期的任务 |
| `single_date` | string | null | 单日模式下的具体日期 |

### 并发和重试

| 配置项 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `currency` | int | 5 | 异步并发任务数 |
| `retry_times` | int | 3 | 每个任务失败后的最大重试次数 |
| `retry_delay_seconds` | int | 10 | 非断网失败时的重试等待秒数 |
| `pause_seconds` | int | 30 | 检测到断网后的暂停秒数 |
| `global_qps` | int | 5 | 限制总接口请求速率为每秒多少次 |

### 脚本选择

| 配置项 | 类型 | 默认值 | 说明 |
| | | | | |
| `scripts` | list | [] | 指定要执行的脚本文件名列表，留空表示执行所有脚本 |

示例：
```yaml
scripts:
  - major_market_lists_fetch_and_save_stock_list.py
  - financial_core_indicators_fetch_and_save_financial_main_indicators.py
```

### 路径配置

| 配置项 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `useful_dir` | string | PROJECT_ROOT/useful | useful 目录路径 |
| `log_dir` | string | PROJECT_ROOT/log/full_fetch | 日志目录路径 |
| `state_dir` | string | PROJECT_ROOT/log/full_fetch_state | 状态文件目录路径 |

## 配置优先级

配置值按照以下优先级应用（从高到低）：

1. 命令行参数（`--param`）
2. 配置文件中的值
3. 代码中的默认值

例如，如果命令行指定了 `--concurrency 10`，则该值会覆盖配置文件中的 `currency: 5`。

## 配置文件示例

### 示例 1：快速测试配置

```yaml
# 快速测试配置（少量脚本，高并发）
resume: false
dry_run: true
currency: 10
retry_times: 1
global_qps: 20
scripts:
  - major_market_lists_fetch_and_save_stock_list.py
  - company_basic_info_fetch_and_save_company_intro.py
```

### 示例 2：生产环境配置

```yaml
# 生产环境配置
resume: true
currency: 5
retry_times: 3
pause_seconds: 30
global_qps: 5
verbose: false
# scripts: []  # 执行所有脚本
```

### 示例 3：指定日期范围

```yaml
# 指定日期范围
resume: false
full_start_date: "2024-01-01"
full_end_date: "2024-03-31"
currency: 5
global_qps: 10
```

### 示例 4：单日模式

```yaml
# 单日模式 - 只获取指定日期的数据
single_date_mode: true
single_date: "2024-01-15"
currency: 10
global_qps: 20
```

## 命令行参数

所有配置项都可以通过命令行参数覆盖：

```bash
# 基本用法
python scripts/run_useful_full_fetch.py

# 指定配置文件
python scripts/run_useful_full_fetch.py --config /path/to/config.yaml

# 指定脚本
python scripts/run_useful_full_fetch.py --scripts script1.py script2.py

# 调整并发数
python scripts/run_useful_full_fetch.py --concurrency 10

# 调整 QPS 限制
python scripts/run_useful_full_fetch.py --global-qps 10

# 指定日期范围
python scripts/run_useful_full_fetch.py --full-start-date 2024-01-01 --full-end-date 2024-03-31

# 启用断点续跑
python scripts/run_useful_full_fetch.py --resume

# 禁用断点续跑
python scripts/run_useful_full_fetch.py --no-resume

# 详细日志
python scripts/run_useful_full_fetch.py --verbose

# 测试模式（dry run）
python scripts/run_useful_full_fetch.py --dry-run

# 组合使用
python scripts/run_useful_full_fetch.py --config custom.yaml --concurrency 10 --verbose
```

## 使用建议

### 1. 首次全量获取

使用测试模式预览任务：
```bash
python scripts/run_useful_full_fetch.py --dry-run
```

确认任务列表无误后，执行实际获取：
```bash
python scripts/run_useful_full_fetch.py
```

### 2. 网络环境优化

如果网络带宽有限，降低 QPS 和并发数：
```yaml
# config/fetch_config.yaml
global_qps: 2
currency: 3
```

如果网络快速，可以提高并发和 QPS：
```yaml
global_qps: 10
currency: 10
```

### 3. 断点续跑

启用 `resume: true`，中断后可以从上次成功的位置继续：
```bash
# 通过配置文件启用
python scripts/run_useful_full_fetch.py

# 临时启用
python scripts/run_useful_full_fetch.py --resume
```

### 4. 错误恢复

增加重试次数和暂停时间，提高容错能力：
```yaml
retry_times: 5
retry_delay_seconds: 20
pause_seconds: 60
```

### 5. 监控和调试

启用详细日志以便调试问题：
```yaml
verbose: true
```

或使用命令行：
```bash
python scripts/run_useful_full_fetch.py --verbose
```

## 配置验证

脚本会自动验证配置值，确保：

- `retry_times` >= 1
- `retry_delay_seconds` >= 1
- `pause_seconds` >= 1
- `global_qps` >= 1
- `concurrency` >= 1
- 日期格式正确（YYYY-MM-DD）

## 常见问题

### Q1: 配置文件找不到

**问题**：提示 "配置文件不存在"

**解决**：
1. 确认配置文件路径正确
2. 使用 `--config` 参数指定完整路径
3. 或将配置文件放在默认位置

### Q2: 脚本文件未找到

**问题**：提示 "未找到可执行的 useful 脚本"

**解决**：
1. 确认 useful 目录存在
2. 确认脚本名称拼写正确
3. 检查脚本是否有 `.py` 扩展名

### Q3: 编码问题

**问题**：配置文件中的中文显示乱码

**解决**：确保配置文件使用 UTF-8 编码保存

### Q4: 日期格式错误

**问题**：提示日期解析失败

**解决**：确保日期格式为 YYYY-MM-DD（如 2024-01-15）

---

**最后更新**: 2026-04-09
