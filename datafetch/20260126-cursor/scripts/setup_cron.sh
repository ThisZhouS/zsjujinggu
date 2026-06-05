#!/usr/bin/env bash
# =================================================================
# setup_cron.sh — 在 Ubuntu 上一键配置定时增量同步任务
#
# 用法:
#   sudo bash scripts/setup_cron.sh
# =================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
INCR_SCRIPT="$PROJECT_DIR/scripts/run_incremental.sh"
CRON_LOG="/var/log/financial_incremental.log"

# 确保增量脚本有执行权限
chmod +x "$INCR_SCRIPT"
chmod +x "$PROJECT_DIR/scripts/init_full_sync.sh"

echo "================================================================"
echo " 配置定时增量同步任务"
echo " 脚本路径: $INCR_SCRIPT"
echo "================================================================"

# ---------------------------------------------------------------
# 询问调度频率
# ---------------------------------------------------------------
echo ""
echo "请选择增量同步频率:"
echo "  1) 每小时执行一次   (0 * * * *)"
echo "  2) 每天 02:00 执行  (0 2 * * *)"
echo "  3) 每天 02:00 和 14:00 各执行一次  (0 2,14 * * *)"
echo "  4) 自定义 cron 表达式"
echo ""
read -r -p "请输入选项 [1-4，默认2]: " CHOICE
CHOICE=${CHOICE:-2}

case "$CHOICE" in
    1) CRON_EXPR="0 * * * *" ;;
    2) CRON_EXPR="0 2 * * *" ;;
    3) CRON_EXPR="0 2,14 * * *" ;;
    4)
        read -r -p "请输入 cron 表达式（如 '30 3 * * *'）: " CRON_EXPR
        ;;
    *)
        echo "无效选项，使用默认: 每天 02:00"
        CRON_EXPR="0 2 * * *"
        ;;
esac

CRON_LINE="$CRON_EXPR $INCR_SCRIPT >> $CRON_LOG 2>&1"

# ---------------------------------------------------------------
# 写入 crontab（避免重复添加）
# ---------------------------------------------------------------
CURRENT_CRON=$(crontab -l 2>/dev/null || true)

if echo "$CURRENT_CRON" | grep -qF "$INCR_SCRIPT"; then
    echo "[跳过] crontab 中已存在该任务，不重复添加。"
    echo "       当前配置:"
    echo "$CURRENT_CRON" | grep "$INCR_SCRIPT"
else
    (echo "$CURRENT_CRON"; echo "$CRON_LINE") | crontab -
    echo "[OK] 定时任务已添加:"
    echo "     $CRON_LINE"
fi

# ---------------------------------------------------------------
# 创建日志文件并赋权
# ---------------------------------------------------------------
touch "$CRON_LOG"
chmod 666 "$CRON_LOG"

echo ""
echo "================================================================"
echo " 配置完成！"
echo ""
echo " 定时任务: $CRON_EXPR"
echo " 日志文件: $CRON_LOG"
echo ""
echo " 查看当前 crontab:  crontab -l"
echo " 实时查看日志:      tail -f $CRON_LOG"
echo " 手动触发增量同步:  bash $INCR_SCRIPT"
echo "================================================================"






