"""
示例脚本：根据数据库中的股票列表与沪深主要指数列表，批量获取并存储历史/最新分时交易数据。

根据 docx/HistoricalTradingData.md，本脚本覆盖你提出的四类任务：
- HS历史分时交易接口：股票代码来源于股票列表（保留后缀）
- 沪/深指数最新分时交易接口：指数代码来源于沪深指数列表（保留后缀）
- 沪/深历史分时交易接口：指数代码来源于沪深指数列表（保留后缀）
- 沪/深最新分时交易接口：股票代码来源于股票列表（保留后缀）

注意：HistoricalTradingData 客户端中对应方法命名为：
- fetch_and_save_hk_stock_history_trading（文档描述为 HK/hsstock/history）
- fetch_and_save_hs_stock_latest_trading
- fetch_and_save_hs_index_latest_trading
- fetch_and_save_hs_index_history_trading
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
from api_clients.MajorMarketLists.MajorMarketLists_table import HsMainIndexList, StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.historical_trading_data")


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


def get_index_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `hs_main_index_list` 表获取指数代码（原始 dm 字段，保留后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 指数代码列表，例如 ["000001.SH"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(HsMainIndexList.dm).order_by(HsMainIndexList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


def sync_hs_stock_latest_trading(
    client: HistoricalTradingData,
    stock_codes: List[str],
    level: str,
    adjust_type: str,
    latest: Optional[int] = None,
) -> int:
    """
    HS 股票最新分时交易：股票代码来源于股票列表（不去后缀）。

    API接口: fetch_and_save_hs_stock_latest_trading
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_hs_stock_latest_trading(
                stock_code=code,
                level=level,
                adjust_type=adjust_type,
                latest=latest,
            )
            logger.info("HS股票最新分时交易 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("HS股票最新分时交易 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_hs_index_latest_trading(
    client: HistoricalTradingData,
    index_codes: List[str],
    level: str,
) -> int:
    """
    HS 指数最新分时交易：指数代码来源于沪深指数列表（不去后缀）。

    API接口: fetch_and_save_hs_index_latest_trading
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_hs_index_latest_trading(
                index_code=code,
                level=level,
            )
            logger.info("HS指数最新分时交易 - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("HS指数最新分时交易 - 指数 {} 处理失败: {}", code, exc)
    return total


def sync_hs_index_history_trading(
    client: HistoricalTradingData,
    index_codes: List[str],
    level: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    HS 指数历史分时交易：指数代码来源于沪深指数列表（不去后缀）。

    API接口: fetch_and_save_hs_index_history_trading
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_hs_index_history_trading(
                index_code=code,
                level=level,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("HS指数历史分时交易 - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("HS指数历史分时交易 - 指数 {} 处理失败: {}", code, exc)
    return total


def sync_hs_stock_history_trading(
    client: HistoricalTradingData,
    stock_codes: List[str],
    level: str,
    adjust_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    HS 历史分时交易：股票代码来源于股票列表（不去后缀）。

    注意：当前客户端方法名为 fetch_and_save_hk_stock_history_trading。

    API接口: fetch_and_save_hk_stock_history_trading
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_hk_stock_history_trading(
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
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步历史/最新分时交易数据。

    API接口: HistoricalTradingData
    """
    # 初始化数据库连接
    init_database()

    client = HistoricalTradingData()

    stock_codes = get_stock_codes_from_db(max_count=None)
    index_codes = get_index_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(stock_codes))
    logger.info("从沪深主要指数列表读取到指数代码数量: {}", len(index_codes))

    codes_with_suffix_stock: List[str] = [code for code in stock_codes if code]
    codes_with_suffix_index: List[str] = [code for code in index_codes if code]

    # 统一示例参数
    level = "d"
    adjust_type = "n"

    # 1) HS历史分时交易：股票列表（不去后缀）
    total_stock_history = sync_hs_stock_history_trading(
        client,
        codes_with_suffix_stock,
        level=level,
        adjust_type=adjust_type,
        start_date=None,
        end_date=None,
        latest=None,
    )

    # 2) 沪/深指数最新分时交易：沪深指数列表（不去后缀）
    total_index_latest = sync_hs_index_latest_trading(
        client,
        codes_with_suffix_index,
        level=level,
    )

    # 3) 沪/深历史分时交易：沪深指数列表（不去后缀）
    total_index_history = sync_hs_index_history_trading(
        client,
        codes_with_suffix_index,
        level=level,
        start_date=None,
        end_date=None,
    )

    # 4) 沪/深最新分时交易：股票列表（不去后缀）
    total_stock_latest = sync_hs_stock_latest_trading(
        client,
        codes_with_suffix_stock,
        level=level,
        adjust_type=adjust_type,
        latest=None,
    )

    logger.info("HS历史分时交易累计写入记录数: {}", total_stock_history)
    logger.info("HS指数最新分时交易累计写入记录数: {}", total_index_latest)
    logger.info("HS指数历史分时交易累计写入记录数: {}", total_index_history)
    logger.info("HS股票最新分时交易累计写入记录数: {}", total_stock_latest)


if __name__ == "__main__":
    main()



