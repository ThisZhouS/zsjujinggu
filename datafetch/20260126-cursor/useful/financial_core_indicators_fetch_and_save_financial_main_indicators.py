"""
辅助程序：在固定时间区间内获取并存储财务主要指标数据。

本程序基于 `format.financial_core_indicators_fetch_and_save_financial_main_indicators`，
仅修改时间参数为固定范围：
- 开始日期：2026-02-01（"20260201"）
- 结束日期：2026-02-26（"20260226"）

API接口: fetch_and_save_financial_main_indicators
"""

from __future__ import annotations

from pathlib import Path
from typing import List

PROJECT_ROOT = Path(__file__).resolve().parent.parent

from utils.script_base import (  # noqa: E402
    add_project_root_to_sys_path,
    get_stock_codes_from_db,
    get_full_fetch_date_range,
)

add_project_root_to_sys_path(PROJECT_ROOT)

from api_clients.FinancialCoreIndicators.FinancialCoreIndicators import (  # noqa: E402
    FinancialCoreIndicators,
)
from config.database import init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402

logger = get_logger("useful.financial_core_indicators_fetch_and_save_financial_main_indicators")


def main() -> None:
    """
    主函数：通过查询数据库股票列表，在固定时间区间内调用财务主要指标接口获取并存储数据。

    API接口: fetch_and_save_financial_main_indicators
    """
    # 初始化数据库连接
    init_database()

    client = FinancialCoreIndicators()

    raw_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(raw_codes))

    codes_with_suffix: List[str] = [code for code in raw_codes if code]

    start_date, end_date = get_full_fetch_date_range()

    total = 0
    for code in codes_with_suffix:
        try:
            count = client.fetch_and_save_financial_main_indicators(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("财务主要指标 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("财务主要指标 - 股票 {} 处理失败: {}", code, exc)

    logger.info("财务主要指标累计写入记录数: {}", total)


if __name__ == "__main__":
    main()
