"""
示例脚本：根据数据库中的各类列表，批量获取并存储证券/基金实时交易数据。

根据 docx/RealTimeTradingData/StockRealTimeData.md，本脚本覆盖五类任务：
- 科创股票实时数据接口：股票代码来源于科创股票列表，需要去掉 . 及其后缀
- 实时交易数据接口（沪深指数）：指数代码来源于股票列表，股票列表中的代码格式包含 . 和后缀，直接使用
- 实时数据接口（沪深基金）：基金代码来源于沪深基金列表，需要去掉 . 及其后缀
- 香港股票实时数据接口：股票代码来源于港股股票列表，需要去掉 . 及其后缀
- 京市股票实时数据接口：股票代码来源于京市股票列表，需要去掉 . 及其后缀
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
from api_clients.MajorMarketLists.MajorMarketLists_table import (  # noqa: E402
    HsFundList,
    StockList,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import HkStockList  # noqa: E402
from api_clients.OtherMarketLists.OtherMarketLists_table import (  # noqa: E402
    BjStockList,
    KcStockList,
)
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.stock_real_time_data")


def remove_suffix(code: str) -> str:
    """
    去掉代码中的 . 及其后缀。

    Args:
        code (str): 原始代码，例如 "430017.BJ" 或 "000001"。

    Returns:
        str: 处理后的代码，例如 "430017" 或 "000001"。

    API接口: 无
    """
    if "." in code:
        return code.split(".")[0]
    return code


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


def get_hs_fund_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `hs_fund_list` 表获取沪深基金代码（去掉 . 及其后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 基金代码列表，例如 ["159001"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(HsFundList.dm).order_by(HsFundList.dm)
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


def sync_kc_stock_real_time_data(
    client: StockRealTimeData,
    stock_codes: List[str],
) -> int:
    """
    同步科创股票实时数据。

    Args:
        client (StockRealTimeData): StockRealTimeData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_kc_stock_real_time_data
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_kc_stock_real_time_data(stock_code=code)
            logger.info("科创股票实时数据 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("科创股票实时数据 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_hs_index_real_time_data(
    client: StockRealTimeData,
    index_codes: List[str],
) -> int:
    """
    同步实时交易数据（沪深指数）。

    Args:
        client (StockRealTimeData): StockRealTimeData 客户端实例。
        index_codes (List[str]): 指数代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_hs_index_real_time_data
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_hs_index_real_time_data(index_code=code)
            logger.info("实时交易数据（沪深指数） - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("实时交易数据（沪深指数） - 指数 {} 处理失败: {}", code, exc)
    return total


def sync_hf_fund_real_time_data(
    client: StockRealTimeData,
    fund_codes: List[str],
) -> int:
    """
    同步实时数据（沪深基金）。

    Args:
        client (StockRealTimeData): StockRealTimeData 客户端实例。
        fund_codes (List[str]): 基金代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_hf_fund_real_time_data
    """
    total = 0
    for code in fund_codes:
        try:
            count = client.fetch_and_save_hf_fund_real_time_data(fund_code=code)
            logger.info("实时数据（沪深基金） - 基金 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("实时数据（沪深基金） - 基金 {} 处理失败: {}", code, exc)
    return total


def sync_hk_stock_real_time_data(
    client: StockRealTimeData,
    stock_codes: List[str],
) -> int:
    """
    同步香港股票实时数据。

    Args:
        client (StockRealTimeData): StockRealTimeData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_hk_stock_real_time_data
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_hk_stock_real_time_data(stock_code=code)
            logger.info("香港股票实时数据 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("香港股票实时数据 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_bj_stock_real_time_data(
    client: StockRealTimeData,
    stock_codes: List[str],
) -> int:
    """
    同步京市股票实时数据。

    Args:
        client (StockRealTimeData): StockRealTimeData 客户端实例。
        stock_codes (List[str]): 股票代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_bj_stock_real_time_data
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_bj_stock_real_time_data(stock_code=code)
            logger.info("京市股票实时数据 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("京市股票实时数据 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步证券/基金实时交易数据。

    API接口: StockRealTimeData
    """
    # 初始化数据库连接
    init_database()

    client = StockRealTimeData()

    # 从数据库获取各类代码列表
    kc_stock_codes = get_kc_stock_codes_from_db(max_count=None)
    index_codes = get_index_codes_from_stock_list(max_count=None)
    hs_fund_codes = get_hs_fund_codes_from_db(max_count=None)
    hk_stock_codes = get_hk_stock_codes_from_db(max_count=None)
    bj_stock_codes = get_bj_stock_codes_from_db(max_count=None)

    logger.info("从科创股票列表读取到股票代码数量: {}", len(kc_stock_codes))
    logger.info("从股票列表读取到指数代码数量: {}", len(index_codes))
    logger.info("从沪深基金列表读取到基金代码数量: {}", len(hs_fund_codes))
    logger.info("从港股股票列表读取到股票代码数量: {}", len(hk_stock_codes))
    logger.info("从京市股票列表读取到股票代码数量: {}", len(bj_stock_codes))

    # 1) 科创股票实时数据接口：股票代码来源于科创股票列表
    total_kc = sync_kc_stock_real_time_data(client, kc_stock_codes)
    logger.info("科创股票实时数据累计写入记录数: {}", total_kc)

    # 2) 实时交易数据接口（沪深指数）：指数代码来源于股票列表
    total_hs_index = sync_hs_index_real_time_data(client, index_codes)
    logger.info("实时交易数据（沪深指数）累计写入记录数: {}", total_hs_index)

    # 3) 实时数据接口（沪深基金）：基金代码来源于沪深基金列表
    total_hf_fund = sync_hf_fund_real_time_data(client, hs_fund_codes)
    logger.info("实时数据（沪深基金）累计写入记录数: {}", total_hf_fund)

    # 4) 香港股票实时数据接口：股票代码来源于港股股票列表
    total_hk = sync_hk_stock_real_time_data(client, hk_stock_codes)
    logger.info("香港股票实时数据累计写入记录数: {}", total_hk)

    # 5) 京市股票实时数据接口：股票代码来源于京市股票列表
    total_bj = sync_bj_stock_real_time_data(client, bj_stock_codes)
    logger.info("京市股票实时数据累计写入记录数: {}", total_bj)


if __name__ == "__main__":
    main()

