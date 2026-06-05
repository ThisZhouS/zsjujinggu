"""
示例脚本：根据数据库中的股票列表，批量获取并存储交易明细特殊数据接口。

根据 docx/TradingDetailsSpecialData.md，本脚本覆盖三类任务：
- 历史涨跌停价格接口：股票代码来源于股票列表，不需要去掉 . 及其后缀
- 当天逐笔交易接口：股票代码来源于股票列表，需要去掉 . 及其后缀
- 资金流向数据接口：股票代码来源于股票列表，需要去掉 . 及其后缀
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

from api_clients.TradingDetailsSpecialData.TradingDetailsSpecialData import (  # noqa: E402
    TradingDetailsSpecialData,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.trading_details_special_data")


def remove_suffix(code: str) -> str:
    """
    去掉股票代码中的 . 及其后缀。

    Args:
        code (str): 原始股票代码，例如 "000001.SH" 或 "000001"。

    Returns:
        str: 处理后的股票代码，例如 "000001"。

    API接口: 无
    """
    if "." in code:
        return code.split(".")[0]
    return code


def get_stock_codes_with_suffix(max_count: Optional[int] = None) -> List[str]:
    """
    从 `stock_list` 表获取股票代码（保持原样，不需要去掉后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["000001.SH"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return codes


def get_stock_codes_without_suffix(max_count: Optional[int] = None) -> List[str]:
    """
    从 `stock_list` 表获取股票代码（去掉 . 及其后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["000001"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return [remove_suffix(code) for code in codes]


def sync_stop_price_history(
    client: TradingDetailsSpecialData,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    同步历史涨跌停价格数据。

    Args:
        client (TradingDetailsSpecialData): TradingDetailsSpecialData 客户端实例。
        stock_codes (List[str]): 股票代码列表（保持原样，不需要去掉后缀）。
        start_date (Optional[str]): 开始时间，格式 YYYYMMDD，默认为 None（全部数据）。
        end_date (Optional[str]): 结束时间，格式 YYYYMMDD，默认为 None（全部数据）。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_stop_price_history
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_stop_price_history(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("历史涨跌停价格 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历史涨跌停价格 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_today_tick_trade(
    client: TradingDetailsSpecialData,
    stock_codes: List[str],
) -> int:
    """
    同步当天逐笔交易数据。

    Args:
        client (TradingDetailsSpecialData): TradingDetailsSpecialData 客户端实例。
        stock_codes (List[str]): 股票代码列表（去掉后缀）。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_today_tick_trade
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_today_tick_trade(stock_code=code)
            logger.info("当天逐笔交易 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("当天逐笔交易 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_money_flow(
    client: TradingDetailsSpecialData,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: Optional[int] = None,
) -> int:
    """
    同步资金流向数据。

    Args:
        client (TradingDetailsSpecialData): TradingDetailsSpecialData 客户端实例。
        stock_codes (List[str]): 股票代码列表（去掉后缀）。
        start_date (Optional[str]): 开始时间，格式 YYYYMMDD，默认为 None（全部数据）。
        end_date (Optional[str]): 结束时间，格式 YYYYMMDD，默认为 None（全部数据）。
        limit (Optional[int]): 最新条数，默认为 None。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_money_flow
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_money_flow(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
                limit=limit,
            )
            logger.info("资金流向数据 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("资金流向数据 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步交易明细特殊数据接口。

    API接口: TradingDetailsSpecialData
    """
    # 初始化数据库连接
    init_database()

    client = TradingDetailsSpecialData()

    # 从数据库获取股票代码列表
    stock_codes_with_suffix = get_stock_codes_with_suffix(max_count=None)
    stock_codes_without_suffix = get_stock_codes_without_suffix(max_count=None)

    logger.info("从股票列表读取到股票代码数量（带后缀）: {}", len(stock_codes_with_suffix))
    logger.info("从股票列表读取到股票代码数量（不带后缀）: {}", len(stock_codes_without_suffix))

    # 不设置开始时间和结束时间，获取全部数据
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: Optional[int] = None

    # 1) 历史涨跌停价格接口：股票代码来源于股票列表，不需要去掉后缀
    total_stop_price = sync_stop_price_history(
        client, stock_codes_with_suffix, start_date=start_date, end_date=end_date
    )
    logger.info("历史涨跌停价格累计写入记录数: {}", total_stop_price)

    # 2) 当天逐笔交易接口：股票代码来源于股票列表，需要去掉后缀
    total_tick_trade = sync_today_tick_trade(client, stock_codes_without_suffix)
    logger.info("当天逐笔交易累计写入记录数: {}", total_tick_trade)

    # 3) 资金流向数据接口：股票代码来源于股票列表，需要去掉后缀
    total_money_flow = sync_money_flow(
        client,
        stock_codes_without_suffix,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )
    logger.info("资金流向数据累计写入记录数: {}", total_money_flow)


if __name__ == "__main__":
    main()

