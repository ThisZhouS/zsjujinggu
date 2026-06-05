"""
独立接口程序：获取并存储实时数据（沪深基金）。

本程序为 stock_real_time_data_sync.py 中实时数据（沪深基金）接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_hf_fund_real_time_data
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
from api_clients.MajorMarketLists.MajorMarketLists_table import HsFundList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.stock_real_time_data_fetch_and_save_hf_fund_real_time_data")


def remove_suffix(code: str) -> str:
    """
    去掉基金代码中的 . 及其后缀。

    Args:
        code (str): 原始基金代码，例如 "159001.SZ" 或 "159001"。

    Returns:
        str: 处理后的基金代码，例如 "159001"。

    API接口: 无
    """
    if "." in code:
        return code.split(".")[0]
    return code


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


def main() -> None:
    """
    主函数：按数据库列表批量同步实时数据（沪深基金）。

    API接口: fetch_and_save_hf_fund_real_time_data
    """
    # 初始化数据库连接
    init_database()

    client = StockRealTimeData()

    # 从数据库获取基金代码列表
    hs_fund_codes = get_hs_fund_codes_from_db(max_count=None)
    logger.info("从沪深基金列表读取到基金代码数量: {}", len(hs_fund_codes))

    total = 0
    for code in hs_fund_codes:
        try:
            count = client.fetch_and_save_hf_fund_real_time_data(fund_code=code)
            logger.info("实时数据（沪深基金） - 基金 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("实时数据（沪深基金） - 基金 {} 处理失败: {}", code, exc)

    logger.info("实时数据（沪深基金）累计写入记录数: {}", total)


if __name__ == "__main__":
    main()

