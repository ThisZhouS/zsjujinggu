"""
示例脚本：根据数据库中的股票列表，批量获取并存储实时交易数据接口。

根据 docx/RealTimeTradingInterfaces.md，本脚本覆盖五类任务：
- 实时交易数据（全部 券商数据源）接口：不需要除LICENSE外的参数
- 实时交易数据（全部 网络数据源）接口：不需要除LICENSE外的参数
- 实时交易数据（券商数据源）接口：股票代码来源于股票列表，需要去掉 . 及其后缀
- 实时交易数据（多股）接口：股票代码来源于股票列表，需要去掉 . 及其后缀，每次最多20个
- 实时交易数据（网络数据源）接口：股票代码来源于股票列表，需要去掉 . 及其后缀
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

from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces import (  # noqa: E402
    RealTimeTradingInterfaces,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.realtime_trading_interfaces")


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


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
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


def sync_realtime_trading_all_broker(client: RealTimeTradingInterfaces) -> int:
    """
    同步实时交易数据（全部 券商数据源）。

    Args:
        client (RealTimeTradingInterfaces): RealTimeTradingInterfaces 客户端实例。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_realtime_trading_all_broker
    """
    try:
        count = client.fetch_and_save_realtime_trading_all_broker()
        logger.info("实时交易数据（全部 券商数据源）存储 {} 条记录", count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("实时交易数据（全部 券商数据源）处理失败: {}", exc)
        return 0


def sync_realtime_trading_all_network(client: RealTimeTradingInterfaces) -> int:
    """
    同步实时交易数据（全部 网络数据源）。

    Args:
        client (RealTimeTradingInterfaces): RealTimeTradingInterfaces 客户端实例。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_realtime_trading_all_network
    """
    try:
        count = client.fetch_and_save_realtime_trading_all_network()
        logger.info("实时交易数据（全部 网络数据源）存储 {} 条记录", count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("实时交易数据（全部 网络数据源）处理失败: {}", exc)
        return 0


def sync_realtime_trading_broker(
    client: RealTimeTradingInterfaces,
    stock_codes: List[str],
) -> int:
    """
    同步实时交易数据（券商数据源）。

    Args:
        client (RealTimeTradingInterfaces): RealTimeTradingInterfaces 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_realtime_trading_broker
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_realtime_trading_broker(stock_code=code)
            logger.info("实时交易数据（券商数据源） - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("实时交易数据（券商数据源） - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_realtime_trading_multi_stock(
    client: RealTimeTradingInterfaces,
    stock_codes: List[str],
) -> int:
    """
    同步实时交易数据（多股）。

    Args:
        client (RealTimeTradingInterfaces): RealTimeTradingInterfaces 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_realtime_trading_multi_stock
    """
    total = 0
    batch_size = 20  # 每次最多20个股票代码
    for i in range(0, len(stock_codes), batch_size):
        batch = stock_codes[i : i + batch_size]
        try:
            count = client.fetch_and_save_realtime_trading_multi_stock(stock_codes=batch)
            logger.info(
                "实时交易数据（多股） - 批次 {}-{} 存储 {} 条记录",
                i + 1,
                min(i + batch_size, len(stock_codes)),
                count,
            )
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error(
                "实时交易数据（多股） - 批次 {}-{} 处理失败: {}",
                i + 1,
                min(i + batch_size, len(stock_codes)),
                exc,
            )
    return total


def sync_realtime_trading_network(
    client: RealTimeTradingInterfaces,
    stock_codes: List[str],
) -> int:
    """
    同步实时交易数据（网络数据源）。

    Args:
        client (RealTimeTradingInterfaces): RealTimeTradingInterfaces 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_realtime_trading_network
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_realtime_trading_network(stock_code=code)
            logger.info("实时交易数据（网络数据源） - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("实时交易数据（网络数据源） - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步实时交易数据接口。

    API接口: RealTimeTradingInterfaces
    """
    # 初始化数据库连接
    init_database()

    client = RealTimeTradingInterfaces()

    # 1) 实时交易数据（全部 券商数据源）接口：不需要除LICENSE外的参数
    total_all_broker = sync_realtime_trading_all_broker(client)
    logger.info("实时交易数据（全部 券商数据源）累计写入记录数: {}", total_all_broker)

    # 2) 实时交易数据（全部 网络数据源）接口：不需要除LICENSE外的参数
    total_all_network = sync_realtime_trading_all_network(client)
    logger.info("实时交易数据（全部 网络数据源）累计写入记录数: {}", total_all_network)

    # 从数据库获取股票代码列表
    stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(stock_codes))

    # 3) 实时交易数据（券商数据源）接口：股票代码来源于股票列表
    total_broker = sync_realtime_trading_broker(client, stock_codes)
    logger.info("实时交易数据（券商数据源）累计写入记录数: {}", total_broker)

    # 4) 实时交易数据（多股）接口：股票代码来源于股票列表，每次最多20个
    total_multi = sync_realtime_trading_multi_stock(client, stock_codes)
    logger.info("实时交易数据（多股）累计写入记录数: {}", total_multi)

    # 5) 实时交易数据（网络数据源）接口：股票代码来源于股票列表
    total_network = sync_realtime_trading_network(client, stock_codes)
    logger.info("实时交易数据（网络数据源）累计写入记录数: {}", total_network)


if __name__ == "__main__":
    main()

