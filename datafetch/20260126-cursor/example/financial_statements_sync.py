"""
示例脚本：根据数据库中的股票列表，批量获取并存储财务报表相关数据。

包括以下三个接口：
- 利润表
- 现金流量表
- 资产负债表
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

from api_clients.FinancialStatements.FinancialStatements import FinancialStatements  # noqa: E402
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.financial_statements")


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `stock_list` 表中按要求获取股票代码（原始 dm 字段）。

    Args:
        max_count (Optional[int]): 限制返回的股票数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["000001.SZ"]，取决于表中存储格式。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


def sync_income_statement(
    client: FinancialStatements,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    使用利润表接口，为给定股票代码列表获取并存储数据。

    Args:
        client (FinancialStatements): 财务报表 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        start_date (Optional[str]): 开始时间，格式YYYYMMDD，如 "20240101"。
        end_date (Optional[str]): 结束时间，格式YYYYMMDD，如 "20241231"。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_income_statement
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_income_statement(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("利润表 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("利润表 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_cashflow_statement(
    client: FinancialStatements,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    使用现金流量表接口，为给定股票代码列表获取并存储数据。

    Args:
        client (FinancialStatements): 财务报表 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        start_date (Optional[str]): 开始时间，格式YYYYMMDD，如 "20240101"。
        end_date (Optional[str]): 结束时间，格式YYYYMMDD，如 "20241231"。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_cashflow_statement
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_cashflow_statement(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("现金流量表 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("现金流量表 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_balance_sheet(
    client: FinancialStatements,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    使用资产负债表接口，为给定股票代码列表获取并存储数据。

    Args:
        client (FinancialStatements): 财务报表 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        start_date (Optional[str]): 开始时间，格式YYYYMMDD，如 "20240101"。
        end_date (Optional[str]): 结束时间，格式YYYYMMDD，如 "20241231"。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_balance_sheet
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_balance_sheet(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("资产负债表 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("资产负债表 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：示例如何通过查询数据库股票列表，调用三个财务报表接口获取并存储数据。

    API接口: FinancialStatements（利润表 / 现金流量表 / 资产负债表）
    """
    # 初始化数据库连接
    init_database()

    client = FinancialStatements()

    # 处理全部股票：不限制数量，直接从股票列表表中获取所有股票代码
    raw_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(raw_codes))

    # 本模块三个接口均要求使用带后缀的股票代码（如 "000001.SZ"），
    # 因此直接使用数据库中的原始代码列表。
    codes_with_suffix: List[str] = [code for code in raw_codes if code]

    # 利润表接口：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_income = sync_income_statement(
        client,
        codes_with_suffix,
        start_date=None,
        end_date=None,
    )

    # 现金流量表接口：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_cashflow = sync_cashflow_statement(
        client,
        codes_with_suffix,
        start_date=None,
        end_date=None,
    )

    # 资产负债表接口：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_balance = sync_balance_sheet(
        client,
        codes_with_suffix,
        start_date=None,
        end_date=None,
    )

    logger.info("利润表累计写入记录数: {}", total_income)
    logger.info("现金流量表累计写入记录数: {}", total_cashflow)
    logger.info("资产负债表累计写入记录数: {}", total_balance)


if __name__ == "__main__":
    main()



