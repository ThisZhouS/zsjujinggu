"""
示例脚本：根据数据库中的股票列表，批量获取并存储公司基本信息相关数据。

包括以下四个接口：
- 公司简介
- 公司股本表
- 股票基础信息
- 解禁限售
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

from api_clients.CompanyBasicInfo.CompanyBasicInfo import CompanyBasicInfo  # noqa: E402
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.company_basic_info")


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


def sync_company_intro(client: CompanyBasicInfo, stock_codes: List[str]) -> int:
    """
    使用公司简介接口，为给定股票代码列表获取并存储数据。

        Args:
            client (CompanyBasicInfo): 公司基本信息 API 客户端实例。
            stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码已去掉 "." 及其后缀，如 "000001"）。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_company_intro
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_company_intro(code)
            logger.info("公司简介 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("公司简介 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_company_capital(
    client: CompanyBasicInfo,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    使用公司股本表接口，为给定股票代码列表获取并存储数据。

    Args:
        client (CompanyBasicInfo): 公司基本信息 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，调用前已按需求处理后缀）。
        start_date (Optional[str]): 开始日期，格式 YYYYMMDD，如 "20240101"。
        end_date (Optional[str]): 结束日期，格式 YYYYMMDD，如 "20241231"。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_company_capital
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_company_capital(code, start_date, end_date)
            logger.info("公司股本表 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("公司股本表 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_stock_basic_info(
    client: CompanyBasicInfo,
    stock_codes: List[str],
) -> int:
    """
    使用股票基础信息接口，为给定股票代码列表获取并存储数据。

    Args:
        client (CompanyBasicInfo): 公司基本信息 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不去掉 “.” 及后缀，如 "000001.SZ"）。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_stock_basic_info
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_stock_basic_info(code)
            logger.info("股票基础信息 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("股票基础信息 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_lift_restriction(
    client: CompanyBasicInfo,
    stock_codes: List[str],
) -> int:
    """
    使用解禁限售接口，为给定股票代码列表获取并存储数据。

        Args:
            client (CompanyBasicInfo): 公司基本信息 API 客户端实例。
            stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码已去掉 "." 及其后缀，如 "000001"）。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_lift_restriction
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_lift_restriction(code)
            logger.info("解禁限售 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("解禁限售 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：示例如何通过查询数据库股票列表，调用四个接口获取并存储数据。

    API接口: CompanyBasicInfo（公司简介 / 公司股本表 / 股票基础信息 / 解禁限售）
    """
    # 初始化数据库连接
    init_database()

    client = CompanyBasicInfo()

    # 处理全部股票：不限制数量，直接从股票列表表中获取所有股票代码
    raw_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(raw_codes))

    # 准备两种格式的股票代码：
    # 1）去掉 "." 及其后缀的代码（如 "000001.SZ" -> "000001"）
    codes_without_suffix: List[str] = []
    for code in raw_codes:
        if not code:
            continue
        clean_code = code.split(".", maxsplit=1)[0]
        codes_without_suffix.append(clean_code)

    # 2）原始代码（可能已包含 ".SZ" / ".SH" 等后缀）
    codes_with_suffix: List[str] = [code for code in raw_codes if code]

    # 公司简介接口：股票代码来源于股票列表，股票代码需要去掉 "." 及其后缀
    total_intro = sync_company_intro(client, codes_without_suffix)

    # 公司股本表接口：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_capital = sync_company_capital(
        client,
        codes_with_suffix,
        start_date=None,
        end_date=None,
    )

    # 股票基础信息接口：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_basic = sync_stock_basic_info(client, codes_with_suffix)

    # 解禁限售接口：股票代码来源于股票列表，股票代码需要去掉 "." 及其后缀
    total_lift = sync_lift_restriction(client, codes_without_suffix)

    logger.info("公司简介累计写入记录数: {}", total_intro)
    logger.info("公司股本表累计写入记录数: {}", total_capital)
    logger.info("股票基础信息累计写入记录数: {}", total_basic)
    logger.info("解禁限售累计写入记录数: {}", total_lift)


if __name__ == "__main__":
    main()


