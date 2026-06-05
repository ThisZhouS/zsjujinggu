"""
示例脚本：根据数据库中的股票列表，批量获取并存储指数技术指标相关数据。

包括以下五个接口：
- 历史分时BOLL
- 历史分时KDJ
- 历史分时MA
- 历史分时MACD
- 行情指标
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

from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators import (  # noqa: E402
    IndexTechnicalIndicators,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.index_technical_indicators")


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


def sync_history_boll(
    client: IndexTechnicalIndicators,
    stock_codes: List[str],
    level: str,
    adjust_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用历史分时BOLL接口，为给定股票代码列表获取并存储数据。

    Args:
        client (IndexTechnicalIndicators): 指数技术指标 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        level (str): 分时级别，如 "d"、"5" 等。
        adjust_type (str): 除权类型，如 "n"、"f" 等。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_boll
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_history_boll(
                stock_code=code,
                level=level,
                adjust_type=adjust_type,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("历史分时BOLL - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历史分时BOLL - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_history_kdj(
    client: IndexTechnicalIndicators,
    stock_codes: List[str],
    level: str,
    adjust_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用历史分时KDJ接口，为给定股票代码列表获取并存储数据。

    Args:
        client (IndexTechnicalIndicators): 指数技术指标 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        level (str): 分时级别。
        adjust_type (str): 除权类型。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_kdj
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_history_kdj(
                stock_code=code,
                level=level,
                adjust_type=adjust_type,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("历史分时KDJ - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历史分时KDJ - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_history_ma(
    client: IndexTechnicalIndicators,
    stock_codes: List[str],
    level: str,
    adjust_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用历史分时MA接口，为给定股票代码列表获取并存储数据。

    Args:
        client (IndexTechnicalIndicators): 指数技术指标 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        level (str): 分时级别。
        adjust_type (str): 除权类型。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_ma
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_history_ma(
                stock_code=code,
                level=level,
                adjust_type=adjust_type,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("历史分时MA - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历史分时MA - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_history_macd(
    client: IndexTechnicalIndicators,
    stock_codes: List[str],
    level: str,
    adjust_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用历史分时MACD接口，为给定股票代码列表获取并存储数据。

    Args:
        client (IndexTechnicalIndicators): 指数技术指标 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        level (str): 分时级别。
        adjust_type (str): 除权类型。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_macd
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_history_macd(
                stock_code=code,
                level=level,
                adjust_type=adjust_type,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("历史分时MACD - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("历史分时MACD - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_market_indicators(
    client: IndexTechnicalIndicators,
    stock_codes: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> int:
    """
    使用行情指标接口，为给定股票代码列表获取并存储数据。

    Args:
        client (IndexTechnicalIndicators): 指数技术指标 API 客户端实例。
        stock_codes (List[str]): 股票代码列表（来自股票列表，股票代码不需要去掉 "." 及其后缀，如 "000001.SZ"）。
        start_date (Optional[str]): 开始时间 YYYYMMDD。
        end_date (Optional[str]): 结束时间 YYYYMMDD。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_market_indicators
    """
    total = 0
    for code in stock_codes:
        try:
            count = client.fetch_and_save_market_indicators(
                stock_code=code,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info("行情指标 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("行情指标 - 股票 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：示例如何通过查询数据库股票列表，调用指数技术指标相关接口获取并存储数据。

    API接口: IndexTechnicalIndicators（历史分时BOLL/KDJ/MA/MACD + 行情指标）
    """
    # 初始化数据库连接
    init_database()

    client = IndexTechnicalIndicators()

    # 处理全部股票：不限制数量，直接从股票列表表中获取所有股票代码
    raw_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(raw_codes))

    # 本模块所有接口都使用带后缀的股票代码（如 "000001.SZ"），
    # 因此直接使用数据库中的原始代码列表。
    codes_with_suffix: List[str] = [code for code in raw_codes if code]

    # 统一示例参数：按日线(d)、不复权(n)、不限制时间范围、不限制最新条数
    level = "d"
    adjust_type = "n"
    start_date = None
    end_date = None
    latest = None

    # 历史分时BOLL：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_boll = sync_history_boll(
        client,
        codes_with_suffix,
        level=level,
        adjust_type=adjust_type,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    # 历史分时KDJ：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_kdj = sync_history_kdj(
        client,
        codes_with_suffix,
        level=level,
        adjust_type=adjust_type,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    # 历史分时MA：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_ma = sync_history_ma(
        client,
        codes_with_suffix,
        level=level,
        adjust_type=adjust_type,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    # 历史分时MACD：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_macd = sync_history_macd(
        client,
        codes_with_suffix,
        level=level,
        adjust_type=adjust_type,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    # 行情指标：股票代码来源于股票列表，股票代码不需要去掉 "." 及其后缀
    total_market = sync_market_indicators(
        client,
        codes_with_suffix,
        start_date=None,
        end_date=None,
    )

    logger.info("历史分时BOLL累计写入记录数: {}", total_boll)
    logger.info("历史分时KDJ累计写入记录数: {}", total_kdj)
    logger.info("历史分时MA累计写入记录数: {}", total_ma)
    logger.info("历史分时MACD累计写入记录数: {}", total_macd)
    logger.info("行情指标累计写入记录数: {}", total_market)


if __name__ == "__main__":
    main()



