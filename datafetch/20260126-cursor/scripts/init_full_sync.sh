#!/usr/bin/env bash
# =================================================================
# init_full_sync.sh — 全量初始化脚本（首次部署时执行一次）
#
# 执行顺序:
#   1. 启动 PostgreSQL
#   2. 建表
#   3. 按模块顺序全量抓取并写入数据库
#
# 用法:
#   bash scripts/init_full_sync.sh
#   bash scripts/init_full_sync.sh 2>&1 | tee log/init_full_sync.log
# =================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/log/init_full_sync_$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$PROJECT_DIR/log"
cd "$PROJECT_DIR"

echo "================================================================"
echo " Financial Data Platform — 全量初始化"
echo " 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo " 日志文件: $LOG_FILE"
echo "================================================================"

# 将 stdout/stderr 同时输出到终端和日志文件
exec > >(tee -a "$LOG_FILE") 2>&1

# ---------------------------------------------------------------
# 1. 启动数据库（等待健康检查通过）
# ---------------------------------------------------------------
echo "[1/3] 启动 PostgreSQL..."
docker compose up -d db
echo "      等待数据库就绪..."
docker compose run --rm app python -c "
from config.database import init_database, check_database_health
init_database()
health = check_database_health()
print(f'数据库状态: {health}')
assert health.get('status') == 'healthy', f'数据库不健康: {health}'
"

# ---------------------------------------------------------------
# 2. 建表
# ---------------------------------------------------------------
echo "[2/3] 创建所有表结构..."
docker compose run --rm app python example/create_all_tables.py

# ---------------------------------------------------------------
# 3. 全量数据同步（按依赖顺序排列）
# ---------------------------------------------------------------
echo "[3/3] 开始全量数据同步..."

SYNC_SCRIPTS=(
    # 基础信息（依赖少，优先跑）
    "example/major_market_lists_sync.py"
    "example/other_market_lists_sync.py"
    "example/index_relationship_mapping_sync.py"
    "example/company_basic_info_sync.py"
    "example/shareholder_basic_info_sync.py"
    "example/stock_pool_classification_sync.py"
    # 历史数据
    "example/company_historical_data_sync.py"
    "example/historical_trading_data_sync.py"
    "example/index_technical_indicators_sync.py"
    "example/shanghai_shenzhen_technical_indicators_sync.py"
    # 财务数据
    "example/financial_statements_sync.py"
    "example/financial_core_indicators_sync.py"
    "example/financial_quarters_events_sync.py"
    # 股东数据
    "example/shareholder_detailed_data_sync.py"
    # 交易相关
    "example/trading_details_special_data_sync.py"
    "example/market_depth_data_sync.py"
    "example/realtime_trading_interfaces_sync.py"
    # 实时数据（最后跑）
    "example/index_real_time_data_sync.py"
    "example/stock_real_time_data_sync.py"
)

TOTAL=${#SYNC_SCRIPTS[@]}
SUCCESS=0
FAIL=0
FAILED_SCRIPTS=()

for i in "${!SYNC_SCRIPTS[@]}"; do
    SCRIPT="${SYNC_SCRIPTS[$i]}"
    NUM=$((i + 1))
    echo ""
    echo "--- [$NUM/$TOTAL] 执行: $SCRIPT ---"
    if docker compose run --rm app python "$SCRIPT"; then
        SUCCESS=$((SUCCESS + 1))
        echo "    [OK] $SCRIPT"
    else
        FAIL=$((FAIL + 1))
        FAILED_SCRIPTS+=("$SCRIPT")
        echo "    [FAIL] $SCRIPT（跳过，继续下一个）"
    fi
done

# ---------------------------------------------------------------
# 汇总报告
# ---------------------------------------------------------------
echo ""
echo "================================================================"
echo " 全量初始化完成"
echo " 结束时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo " 成功: $SUCCESS / $TOTAL"
echo " 失败: $FAIL / $TOTAL"
if [ ${#FAILED_SCRIPTS[@]} -gt 0 ]; then
    echo " 失败脚本列表:"
    for s in "${FAILED_SCRIPTS[@]}"; do
        echo "   - $s"
    done
fi
echo " 日志文件: $LOG_FILE"
echo "================================================================"

[ $FAIL -eq 0 ] && exit 0 || exit 1






