"""
独立接口程序：获取并存储实时交易数据（沪深指数）。

本程序为 stock_real_time_data_sync.py 中实时交易数据（沪深指数）接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_hs_index_real_time_data
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
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.stock_real_time_data_fetch_and_save_hs_index_real_time_data")


def get_index_codes_from_stock_list(max_count: Optional[int] = None) -> List[str]:
    """
    从 `stock_list` 表获取指数代码（保持原样，不需要去掉后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 指数代码列表，例如 ["000001.SH"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return codes


def main() -> None:
    """
    主函数：按数据库列表批量同步实时交易数据（沪深指数）。

    API接口: fetch_and_save_hs_index_real_time_data
    """
    # 初始化数据库连接
    init_database()

    client = StockRealTimeData()

    # 从数据库获取指数代码列表
    index_codes = get_index_codes_from_stock_list(max_count=None)
    logger.info("从股票列表读取到指数代码数量: {}", len(index_codes))

    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_hs_index_real_time_data(index_code=code)
            logger.info("实时交易数据（沪深指数） - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("实时交易数据（沪深指数） - 指数 {} 处理失败: {}", code, exc)

    logger.info("实时交易数据（沪深指数）累计写入记录数: {}", total)


if __name__ == "__main__":
    main()

