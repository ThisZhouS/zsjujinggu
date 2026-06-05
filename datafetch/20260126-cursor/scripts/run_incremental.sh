#!/usr/bin/env bash
# =================================================================
# run_incremental.sh — 增量同步脚本（定时任务调用）
#
# 每次运行只拉取最新窗口的数据（当天或近 N 天），
# 各同步脚本内部应根据 --since / --date 等参数或数据库最新记录
# 自动确定增量范围。
#
# 定时调用示例（每天 02:00 执行）:
#   0 2 * * * /opt/financial/scripts/run_incremental.sh
#
# 用法:
#   bash scripts/run_incremental.sh
#   bash scripts/run_incremental.sh 2>&1 | tee log/incremental_$(date +\%Y\%m\%d).log
# =================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATE_TAG=$(date +%Y%m%d)
LOG_FILE="$PROJECT_DIR/log/incremental_${DATE_TAG}.log"

mkdir -p "$PROJECT_DIR/log"
cd "$PROJECT_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "================================================================"
echo " Financial Data Platform — 增量同步"
echo " 执行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo " 日志文件: $LOG_FILE"
echo "================================================================"

# ---------------------------------------------------------------
# 确保数据库正在运行
# ---------------------------------------------------------------
echo "[检查] 确保 PostgreSQL 运行中..."
docker compose up -d db

# ---------------------------------------------------------------
# 增量同步脚本列表
# 说明：实时/高频数据优先，历史数据次之
# ---------------------------------------------------------------
INCR_SCRIPTS=(
    # 实时 / 高频（每次必跑）
    "example/index_real_time_data_sync.py"
    "example/stock_real_time_data_sync.py"
    "example/market_depth_data_sync.py"
    "example/realtime_trading_interfaces_sync.py"
    # 日频交易数据
    "example/historical_trading_data_sync.py"
    "example/trading_details_special_data_sync.py"
    # 技术指标（依赖交易数据，稍后跑）
    "example/index_technical_indicators_sync.py"
    "example/shanghai_shenzhen_technical_indicators_sync.py"
    # 基本面（低频，按需保留）
    "example/company_basic_info_sync.py"
    "example/shareholder_basic_info_sync.py"
    "example/shareholder_detailed_data_sync.py"
    "example/financial_statements_sync.py"
    "example/financial_core_indicators_sync.py"
    "example/financial_quarters_events_sync.py"
)

TOTAL=${#INCR_SCRIPTS[@]}
SUCCESS=0
FAIL=0
FAILED_SCRIPTS=()

for i in "${!INCR_SCRIPTS[@]}"; do
    SCRIPT="${INCR_SCRIPTS[$i]}"
    NUM=$((i + 1))
    echo ""
    echo "--- [$NUM/$TOTAL] $SCRIPT"
    if docker compose run --rm app python "$SCRIPT"; then
        SUCCESS=$((SUCCESS + 1))
        echo "    [OK]"
    else
        FAIL=$((FAIL + 1))
        FAILED_SCRIPTS+=("$SCRIPT")
        echo "    [FAIL] 已记录，继续执行剩余任务"
    fi
done

echo ""
echo "================================================================"
echo " 增量同步完成: $(date '+%Y-%m-%d %H:%M:%S')"
echo " 成功: $SUCCESS / $TOTAL   失败: $FAIL / $TOTAL"
if [ ${#FAILED_SCRIPTS[@]} -gt 0 ]; then
    echo " 失败脚本:"
    for s in "${FAILED_SCRIPTS[@]}"; do echo "   - $s"; done
fi
echo "================================================================"

[ $FAIL -eq 0 ] && exit 0 || exit 1






