#!/usr/bin/env bash
# 20260323一期 5+2 调度启动脚本
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"
python "format/20260323一期/run_20260323_phase1.py"

