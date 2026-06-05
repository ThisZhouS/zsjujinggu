"""
示例脚本：根据数据库中的股票列表，批量获取并存储公司历史数据相关接口的数据。

包括以下三个接口：
- 历届监事会成员
- 历届高管成员
- 历届董事会成员
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

from api_clients.CompanyHistoricalData.CompanyHistoricalData import CompanyHistoricalData  # noqa: E402
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.company_historical_data")


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `stock_list` 表中按要求获取股票代码（原始 dm 字段）。

    Args:
        max_count (Optional[int]): 限制返回的股票数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["000001", "000001.SZ"]，取决于表中存储格式。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


def sync_supervisory_board_member(
    client: CompanyHistoricalData,
    stock_codes: List[str],
) -> int:
    """
    使用历届监事会成员接口，为给定股票代码列表获取并存储数据。

    Args:
        client (CompanyHistoricalData): 公司历史数据 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码已去掉 "." 及其后缀，如 "000001"）。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_supervisory_board_member
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_supervisory_board_member(code)
            logger.info("历届监事会成员 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历届监事会成员 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_executive_member(
    client: CompanyHistoricalData,
    stock_codes: List[str],
) -> int:
    """
    使用历届高管成员接口，为给定股票代码列表获取并存储数据。

    Args:
        client (CompanyHistoricalData): 公司历史数据 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码已去掉 "." 及其后缀，如 "000001"）。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_executive_member
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_executive_member(code)
            logger.info("历届高管成员 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历届高管成员 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_board_member(
    client: CompanyHistoricalData,
    stock_codes: List[str],
) -> int:
    """
    使用历届董事会成员接口，为给定股票代码列表获取并存储数据。

    Args:
        client (CompanyHistoricalData): 公司历史数据 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码已去掉 "." 及其后缀，如 "000001"）。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_board_member
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_board_member(code)
            logger.info("历届董事会成员 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历届董事会成员 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：示例如何通过查询数据库股票列表，调用三个历史数据接口获取并存储数据。

    API接口: CompanyHistoricalData（历届监事会成员 / 历届高管成员 / 历届董事会成员）
    """
    # 初始化数据库连接
    init_database()

    client = CompanyHistoricalData()

    # 处理全部股票：不限制数量，直接从股票列表表中获取所有股票代码
    raw_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(raw_codes))

    # 所有历史数据接口均要求使用简单格式股票代码（去掉 "." 及其后缀）
    codes_without_suffix: List[str] = []
    for code in raw_codes:
        if not code:
            continue
        clean_code = code.split(".", maxsplit=1)[0]
        codes_without_suffix.append(clean_code)

    # 历届监事会成员接口：股票代码来源于股票列表，股票代码需要去掉 "." 及其后缀
    total_supervisory = sync_supervisory_board_member(client, codes_without_suffix)

    # 历届高管成员接口：股票代码来源于股票列表，股票代码需要去掉 "." 及其后缀
    total_executive = sync_executive_member(client, codes_without_suffix)

    # 历届董事会成员接口：股票代码来源于股票列表，股票代码需要去掉 "." 及其后缀
    total_board = sync_board_member(client, codes_without_suffix)

    logger.info("历届监事会成员累计写入记录数: {}", total_supervisory)
    logger.info("历届高管成员累计写入记录数: {}", total_executive)
    logger.info("历届董事会成员累计写入记录数: {}", total_board)


if __name__ == "__main__":
    main()



