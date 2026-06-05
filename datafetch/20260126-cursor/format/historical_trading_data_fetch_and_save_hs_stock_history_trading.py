"""
独立接口程序：获取并存储HS历史分时交易数据。

本程序为 historical_trading_data_sync.py 中HS历史分时交易接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

注意：当前客户端方法名为 fetch_and_save_hk_stock_history_trading。

API接口: fetch_and_save_hk_stock_history_trading
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

from api_clients.HistoricalTradingData.HistoricalTradingData import HistoricalTradingData  # noqa: E402
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.historical_trading_data_fetch_and_save_hk_stock_history_trading")


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `stock_list` 表获取股票代码（原始 dm 字段，保留后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

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
    主函数：按数据库列表批量同步HS历史分时交易数据。

    API接口: fetch_and_save_hk_stock_history_trading
    """
    # 初始化数据库连接
    init_database()

    client = HistoricalTradingData()

    stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(stock_codes))

    codes_with_suffix_stock: List[str] = [code for code in stock_codes if code]

    # 统一示例参数
    level = "d"
    adjust_type = "n"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    latest: Optional[int] = None

    total = 0
    for code in codes_with_suffix_stock:
        try:
            count = client.fetch_and_save_hs_stock_history_trading(
                stock_code=code,
                level=level,
                adjust_type=adjust_type,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("HS历史分时交易(hsstock/history) - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("HS历史分时交易(hsstock/history) - 股票 {} 处理失败: {}", code, exc)

    logger.info("HS历史分时交易累计写入记录数: {}", total)


if __name__ == "__main__":
    main()

