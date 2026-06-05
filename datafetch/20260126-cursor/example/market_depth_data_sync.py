"""
示例脚本：根据数据库中的股票列表，批量获取并存储市场深度数据（买卖五档盘口）。

根据 docx/MarketDepthData/MarketDepthData.md，本脚本覆盖四类任务：
- 京市买卖五档盘口接口：股票代码来源于京市股票列表，需要去掉 . 及其后缀
- 港股买卖盘口接口：股票代码来源于港股股票列表，需要去掉 . 及其后缀
- 沪深指数买卖五档盘口接口：股票代码来源于股票列表，需要去掉 . 及其后缀
- 科创买卖五档盘口接口：股票代码来源于科创股票列表，需要去掉 . 及其后缀
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

from api_clients.MarketDepthData.MarketDepthData import MarketDepthData  # noqa: E402
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList, HkStockList  # noqa: E402
from api_clients.OtherMarketLists.OtherMarketLists_table import BjStockList, KcStockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.market_depth_data")


def remove_suffix(code: str) -> str:
    """
    去掉股票代码中的 . 及其后缀。

    Args:
        code (str): 原始股票代码，例如 "430017.BJ" 或 "000001"。

    Returns:
        str: 处理后的股票代码，例如 "430017" 或 "000001"。

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


def get_hk_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `hk_stock_list` 表获取港股股票代码（去掉 . 及其后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["00001"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(HkStockList.dm).order_by(HkStockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return [remove_suffix(code) for code in codes]


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


def get_kc_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `kc_stock_list` 表获取科创股票代码（去掉 . 及其后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["688001"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(KcStockList.dm).order_by(KcStockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return [remove_suffix(code) for code in codes]


def sync_bj_stock_real_five(
    client: MarketDepthData,
    stock_codes: List[str],
) -> int:
    """
    同步京市买卖五档盘口数据。

    Args:
        client (MarketDepthData): MarketDepthData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_bj_stock_real_five
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_bj_stock_real_five(stock_code=code)
            logger.info("京市买卖五档盘口 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("京市买卖五档盘口 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_hk_stock_real_five(
    client: MarketDepthData,
    stock_codes: List[str],
) -> int:
    """
    同步港股买卖五档盘口数据。

    Args:
        client (MarketDepthData): MarketDepthData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_hk_stock_real_five
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_hk_stock_real_five(stock_code=code)
            logger.info("港股买卖五档盘口 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("港股买卖五档盘口 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_hs_stock_real_five(
    client: MarketDepthData,
    stock_codes: List[str],
) -> int:
    """
    同步沪深买卖五档盘口数据。

    Args:
        client (MarketDepthData): MarketDepthData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_hs_stock_real_five
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_hs_stock_real_five(stock_code=code)
            logger.info("沪深买卖五档盘口 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("沪深买卖五档盘口 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_kc_stock_real_five(
    client: MarketDepthData,
    stock_codes: List[str],
) -> int:
    """
    同步科创买卖五档盘口数据。

    Args:
        client (MarketDepthData): MarketDepthData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_kc_stock_real_five
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_kc_stock_real_five(stock_code=code)
            logger.info("科创买卖五档盘口 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("科创买卖五档盘口 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步市场深度数据（买卖五档盘口）。

    API接口: MarketDepthData
    """
    # 初始化数据库连接
    init_database()

    client = MarketDepthData()

    # 从数据库获取股票代码列表
    bj_stock_codes = get_bj_stock_codes_from_db(max_count=None)
    hk_stock_codes = get_hk_stock_codes_from_db(max_count=None)
    stock_codes = get_stock_codes_from_db(max_count=None)
    kc_stock_codes = get_kc_stock_codes_from_db(max_count=None)

    logger.info("从京市股票列表读取到股票代码数量: {}", len(bj_stock_codes))
    logger.info("从港股股票列表读取到股票代码数量: {}", len(hk_stock_codes))
    logger.info("从股票列表读取到股票代码数量: {}", len(stock_codes))
    logger.info("从科创股票列表读取到股票代码数量: {}", len(kc_stock_codes))

    # 1) 京市买卖五档盘口接口：股票代码来源于京市股票列表
    total_bj = sync_bj_stock_real_five(client, bj_stock_codes)
    logger.info("京市买卖五档盘口累计写入记录数: {}", total_bj)

    # 2) 港股买卖盘口接口：股票代码来源于港股股票列表
    total_hk = sync_hk_stock_real_five(client, hk_stock_codes)
    logger.info("港股买卖五档盘口累计写入记录数: {}", total_hk)

    # 3) 沪深指数买卖五档盘口接口：股票代码来源于股票列表
    total_hs = sync_hs_stock_real_five(client, stock_codes)
    logger.info("沪深买卖五档盘口累计写入记录数: {}", total_hs)

    # 4) 科创买卖五档盘口接口：股票代码来源于科创股票列表
    total_kc = sync_kc_stock_real_five(client, kc_stock_codes)
    logger.info("科创买卖五档盘口累计写入记录数: {}", total_kc)


if __name__ == "__main__":
    main()

