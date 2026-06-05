"""
示例脚本：根据数据库中的股票列表，批量获取并存储股东明细数据接口。

根据 docx/ShareholderDetailedData.md，本脚本覆盖四类任务：
- 十大流通股东接口：股票代码来源于股票列表，需要去掉 . 及其后缀
- 十大股东接口：股票代码来源于股票列表，需要去掉 . 及其后缀
- 基金持股接口：股票代码来源于股票列表，需要去掉 . 及其后缀
- 股东变化趋势接口：股票代码来源于股票列表，需要去掉 . 及其后缀
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

from api_clients.ShareholderDetailedData.ShareholderDetailedData import (  # noqa: E402
    ShareholderDetailedData,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.shareholder_detailed_data")


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


def sync_top10_float_shareholders(
    client: ShareholderDetailedData,
    stock_codes: List[str],
) -> int:
    """
    同步十大流通股东数据。

    Args:
        client (ShareholderDetailedData): ShareholderDetailedData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_top10_float_shareholders
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_top10_float_shareholders(stock_code=code)
            logger.info("十大流通股东 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("十大流通股东 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_top10_shareholders(
    client: ShareholderDetailedData,
    stock_codes: List[str],
) -> int:
    """
    同步十大股东数据。

    Args:
        client (ShareholderDetailedData): ShareholderDetailedData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_top10_shareholders
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_top10_shareholders(stock_code=code)
            logger.info("十大股东 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("十大股东 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_fund_holdings(
    client: ShareholderDetailedData,
    stock_codes: List[str],
) -> int:
    """
    同步基金持股数据。

    Args:
        client (ShareholderDetailedData): ShareholderDetailedData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_fund_holdings
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_fund_holdings(stock_code=code)
            logger.info("基金持股 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("基金持股 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_shareholder_change_trend(
    client: ShareholderDetailedData,
    stock_codes: List[str],
) -> int:
    """
    同步股东变化趋势数据。

    Args:
        client (ShareholderDetailedData): ShareholderDetailedData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_shareholder_change_trend
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_shareholder_change_trend(stock_code=code)
            logger.info("股东变化趋势 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("股东变化趋势 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步股东明细数据接口。

    API接口: ShareholderDetailedData
    """
    # 初始化数据库连接
    init_database()

    client = ShareholderDetailedData()

    # 从数据库获取股票代码列表（去掉 . 及其后缀）
    stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(stock_codes))

    # 1) 十大流通股东接口：股票代码来源于股票列表
    total_top10_float = sync_top10_float_shareholders(client, stock_codes)
    logger.info("十大流通股东累计写入记录数: {}", total_top10_float)

    # 2) 十大股东接口：股票代码来源于股票列表
    total_top10 = sync_top10_shareholders(client, stock_codes)
    logger.info("十大股东累计写入记录数: {}", total_top10)

    # 3) 基金持股接口：股票代码来源于股票列表
    total_fund = sync_fund_holdings(client, stock_codes)
    logger.info("基金持股累计写入记录数: {}", total_fund)

    # 4) 股东变化趋势接口：股票代码来源于股票列表
    total_trend = sync_shareholder_change_trend(client, stock_codes)
    logger.info("股东变化趋势累计写入记录数: {}", total_trend)


if __name__ == "__main__":
    main()

