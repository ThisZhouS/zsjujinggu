"""
独立接口程序：获取并存储京市股票实时数据。

本程序为 stock_real_time_data_sync.py 中京市股票实时数据接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_bj_stock_real_time_data
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Optional


def add_project_root_to_sys_path(project_root: Path) -> None:
    """
    将项目根目录加入 sys.path，保证脚本可从任意工作目录运行。

    Args:
        project_root (Path): 项目根目录路径。

    API接口: 无
    """
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))


PROJECT_ROOT = Path(__file__).resolve().parent.parent
add_project_root_to_sys_path(PROJECT_ROOT)

from api_clients.StockRealTimeData.StockRealTimeData import StockRealTimeData  # noqa: E402
from api_clients.OtherMarketLists.OtherMarketLists_table import BjStockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.stock_real_time_data_fetch_and_save_bj_stock_real_time_data")


def remove_suffix(code: str) -> str:
    """
    去掉股票代码中的 . 及其后缀。

    Args:
        code (str): 原始股票代码，例如 "430017.BJ" 或 "430017"。

    Returns:
        str: 处理后的股票代码，例如 "430017"。

    API接口: 无
    """
    if "." in code:
        return code.split(".")[0]
    return code


def get_bj_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `bj_stock_list` 表获取京市股票代码（去掉 . 及其后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["430017"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(BjStockList.dm).order_by(BjStockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return [remove_suffix(code) for code in codes]


def main() -> None:
    """
    主函数：按数据库列表批量同步京市股票实时数据。

    API接口: fetch_and_save_bj_stock_real_time_data
    """
    # 初始化数据库连接
    init_database()

    client = StockRealTimeData()

    # 从数据库获取股票代码列表
    bj_stock_codes = get_bj_stock_codes_from_db(max_count=None)
    logger.info("从京市股票列表读取到股票代码数量: {}", len(bj_stock_codes))

    total = 0
    for code in bj_stock_codes:
        try:
            count = client.fetch_and_save_bj_stock_real_time_data(stock_code=code)
            logger.info("京市股票实时数据 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("京市股票实时数据 - 股票 {} 处理失败: {}", code, exc)

    logger.info("京市股票实时数据累计写入记录数: {}", total)


if __name__ == "__main__":
    main()

