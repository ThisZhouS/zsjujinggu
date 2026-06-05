"""
示例脚本：根据数据库中的股票列表，批量获取并存储股东基础信息接口。

根据 docx/ShareholderBasicInfo.md，本脚本覆盖三类任务：
- 公司十大流通股东接口：股票代码来源于股票列表，不需要去掉 . 及其后缀
- 公司十大股东接口：股票代码来源于股票列表，不需要去掉 . 及其后缀
- 公司股东数接口：股票代码来源于股票列表，不需要去掉 . 及其后缀
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

from api_clients.ShareholderBasicInfo.ShareholderBasicInfo import (  # noqa: E402
    ShareholderBasicInfo,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.shareholder_basic_info")


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
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


def sync_company_top_flow_holders(
    client: ShareholderBasicInfo,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    同步公司十大流通股东数据。

    Args:
        client (ShareholderBasicInfo): ShareholderBasicInfo 客户端实例。
        stock_codes (List[str]): 股票代码列表。
        start_date (Optional[str]): 开始时间，格式 YYYYMMDD，默认为 None（全部数据）。
        end_date (Optional[str]): 结束时间，格式 YYYYMMDD，默认为 None（全部数据）。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_company_top_flow_holders
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_company_top_flow_holders(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("公司十大流通股东 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("公司十大流通股东 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_company_top_holders(
    client: ShareholderBasicInfo,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    同步公司十大股东数据。

    Args:
        client (ShareholderBasicInfo): ShareholderBasicInfo 客户端实例。
        stock_codes (List[str]): 股票代码列表。
        start_date (Optional[str]): 开始时间，格式 YYYYMMDD，默认为 None（全部数据）。
        end_date (Optional[str]): 结束时间，格式 YYYYMMDD，默认为 None（全部数据）。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_company_top_holders
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_company_top_holders(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("公司十大股东 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("公司十大股东 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_company_shareholder_count(
    client: ShareholderBasicInfo,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    同步公司股东数数据。

    Args:
        client (ShareholderBasicInfo): ShareholderBasicInfo 客户端实例。
        stock_codes (List[str]): 股票代码列表。
        start_date (Optional[str]): 开始时间，格式 YYYYMMDD，默认为 None（全部数据）。
        end_date (Optional[str]): 结束时间，格式 YYYYMMDD，默认为 None（全部数据）。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_company_shareholder_count
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_company_shareholder_count(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("公司股东数 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("公司股东数 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步股东基础信息接口。

    API接口: ShareholderBasicInfo
    """
    # 初始化数据库连接
    init_database()

    client = ShareholderBasicInfo()

    # 从数据库获取股票代码列表（保持原样，不需要去掉后缀）
    stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(stock_codes))

    # 不设置开始时间和结束时间，获取全部数据
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    # 1) 公司十大流通股东接口：股票代码来源于股票列表
    total_top_flow = sync_company_top_flow_holders(
        client, stock_codes, start_date=start_date, end_date=end_date
    )
    logger.info("公司十大流通股东累计写入记录数: {}", total_top_flow)

    # 2) 公司十大股东接口：股票代码来源于股票列表
    total_top = sync_company_top_holders(
        client, stock_codes, start_date=start_date, end_date=end_date
    )
    logger.info("公司十大股东累计写入记录数: {}", total_top)

    # 3) 公司股东数接口：股票代码来源于股票列表
    total_count = sync_company_shareholder_count(
        client, stock_codes, start_date=start_date, end_date=end_date
    )
    logger.info("公司股东数累计写入记录数: {}", total_count)


if __name__ == "__main__":
    main()

