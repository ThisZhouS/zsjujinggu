"""
辅助程序：在固定时间区间内获取并存储资产负债表数据。

本程序基于 `format.financial_statements_fetch_and_save_balance_sheet`，
仅修改时间参数为固定范围：
- 开始日期：2026-02-01（"20260201"）
- 结束日期：2026-02-26（"20260226"）

API接口: fetch_and_save_balance_sheet
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional


def add_project_root_to_sys_path(project_root: Path) -> None:
    """
    将项目根目录加入 sys.path，保证脚本可从任意工作目录运行。

    Args:
        project_root (Path): 项目根目录路径。

    Returns:
        None: 无返回值。

    API接口: 无
    """
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))


PROJECT_ROOT = Path(__file__).resolve().parent.parent
add_project_root_to_sys_path(PROJECT_ROOT)

from api_clients.FinancialStatements.FinancialStatements import (  # noqa: E402
    FinancialStatements,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402




def get_full_fetch_date_range() -> tuple[str, str]:
    """
    获取全量抓取使用的日期范围。

    优先从环境变量读取，未配置时回退到脚本原默认值。

    Returns:
        tuple[str, str]: 开始日期与结束日期，格式为 YYYYMMDD。

    API接口: 无
    """
    start_date = os.getenv("FULL_FETCH_START_DATE", "1991-01-01").replace("-", "")
    end_date = os.getenv("FULL_FETCH_END_DATE")
    if end_date:
        return start_date, end_date.replace("-", "")
    return start_date, datetime.now().strftime("%Y%m%d")


    """
    从 `stock_list` 表中按要求获取股票代码（原始 dm 字段）。

    Args:
        max_count (Optional[int]): 限制返回的股票数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["000001.SZ"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


def main() -> None:
    """
    主函数：通过查询数据库股票列表，在固定时间区间内调用资产负债表接口获取并存储数据。

    API接口: fetch_and_save_balance_sheet
    """
    # 初始化数据库连接
    init_database()

    client = FinancialStatements()

    raw_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(raw_codes))

    codes_with_suffix: List[str] = [code for code in raw_codes if code]

    start_date, end_date = get_full_fetch_date_range()

    total = 0
    for code in codes_with_suffix:
        try:
            count = client.fetch_and_save_balance_sheet(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("资产负债表 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("资产负债表 - 股票 {} 处理失败: {}", code, exc)

    logger.info("资产负债表累计写入记录数: {}", total)


if __name__ == "__main__":
    main()

