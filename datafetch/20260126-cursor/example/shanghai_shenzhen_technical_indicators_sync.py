"""
示例脚本：根据数据库中的沪深主要指数列表，批量获取并存储沪深指数历史分时技术指标数据。

包括以下四个接口：
- 历史分时BOLL
- 历史分时KDJ
- 历史分时MA
- 历史分时MACD
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

from api_clients.ShanghaiShenzhenTechnicalIndicators.ShanghaiShenzhenTechnicalIndicators import (  # noqa: E402
    ShanghaiShenzhenTechnicalIndicators,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import HsMainIndexList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.shanghai_shenzhen_technical_indicators")


def get_index_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `hs_main_index_list` 表中按要求获取指数代码（原始 dm 字段）。

    Args:
        max_count (Optional[int]): 限制返回的指数数量，默认为 None（不限制）。

    Returns:
        List[str]: 指数代码列表，例如 ["000001.SH"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(HsMainIndexList.dm).order_by(HsMainIndexList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


def sync_index_history_boll(
    client: ShanghaiShenzhenTechnicalIndicators,
    index_codes: List[str],
    level: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用指数历史分时BOLL接口，为给定指数代码列表获取并存储数据。

    Args:
        client (ShanghaiShenzhenTechnicalIndicators): 沪深指数技术指标 API 客户端实例。
        index_codes (List[str]): 指数代码列表（来自沪深主要指数列表，代码不需要去掉 "." 及其后缀，如 "000001.SH"）。
        level (str): 分时级别，如 "d"、"5" 等。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_boll
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_history_boll(
                index_code=code,
                level=level,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("指数历史分时BOLL - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("指数历史分时BOLL - 指数 {} 处理失败: {}", code, exc)
    return total


def sync_index_history_kdj(
    client: ShanghaiShenzhenTechnicalIndicators,
    index_codes: List[str],
    level: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用指数历史分时KDJ接口，为给定指数代码列表获取并存储数据。

    Args:
        client (ShanghaiShenzhenTechnicalIndicators): 沪深指数技术指标 API 客户端实例。
        index_codes (List[str]): 指数代码列表（来自沪深主要指数列表，代码不需要去掉 "." 及其后缀，如 "000001.SH"）。
        level (str): 分时级别。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_kdj
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_history_kdj(
                index_code=code,
                level=level,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("指数历史分时KDJ - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("指数历史分时KDJ - 指数 {} 处理失败: {}", code, exc)
    return total


def sync_index_history_ma(
    client: ShanghaiShenzhenTechnicalIndicators,
    index_codes: List[str],
    level: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用指数历史分时MA接口，为给定指数代码列表获取并存储数据。

    Args:
        client (ShanghaiShenzhenTechnicalIndicators): 沪深指数技术指标 API 客户端实例。
        index_codes (List[str]): 指数代码列表（来自沪深主要指数列表，代码不需要去掉 "." 及其后缀，如 "000001.SH"）。
        level (str): 分时级别。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_ma
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_history_ma(
                index_code=code,
                level=level,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("指数历史分时MA - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("指数历史分时MA - 指数 {} 处理失败: {}", code, exc)
    return total


def sync_index_history_macd(
    client: ShanghaiShenzhenTechnicalIndicators,
    index_codes: List[str],
    level: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    latest: Optional[int] = None,
) -> int:
    """
    使用指数历史分时MACD接口，为给定指数代码列表获取并存储数据。

    Args:
        client (ShanghaiShenzhenTechnicalIndicators): 沪深指数技术指标 API 客户端实例。
        index_codes (List[str]): 指数代码列表（来自沪深主要指数列表，代码不需要去掉 "." 及其后缀，如 "000001.SH"）。
        level (str): 分时级别。
        start_date (Optional[str]): 开始时间。
        end_date (Optional[str]): 结束时间。
        latest (Optional[int]): 最新条数。

    Returns:
        int: 成功存储的记录总数。

    API接口: fetch_and_save_history_macd
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_history_macd(
                index_code=code,
                level=level,
                start_date=start_date,
                end_date=end_date,
                latest=latest,
            )
            logger.info("指数历史分时MACD - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("指数历史分时MACD - 指数 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：示例如何通过查询数据库沪深主要指数列表，调用沪深指数历史分时技术指标接口获取并存储数据。

    API接口: ShanghaiShenzhenTechnicalIndicators（历史分时BOLL/KDJ/MA/MACD）
    """
    # 初始化数据库连接
    init_database()

    client = ShanghaiShenzhenTechnicalIndicators()

    # 处理全部指数：不限制数量，直接从沪深主要指数列表表中获取所有指数代码
    index_codes = get_index_codes_from_db(max_count=None)
    logger.info("从沪深主要指数列表读取到指数代码数量: {}", len(index_codes))

    # 本模块要求指数代码使用带后缀格式（如 "000001.SH"），
    # 因此直接使用数据库中的原始代码列表。
    codes_with_suffix: List[str] = [code for code in index_codes if code]

    # 统一示例参数：按日线(d)，不限制时间范围、不限制最新条数
    level = "d"
    start_date = None
    end_date = None
    latest = None

    # 历史分时BOLL：指数代码来源于沪深指数列表，代码不需要去掉 "." 及其后缀
    total_boll = sync_index_history_boll(
        client,
        codes_with_suffix,
        level=level,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    # 历史分时KDJ：指数代码来源于沪深指数列表，代码不需要去掉 "." 及其后缀
    total_kdj = sync_index_history_kdj(
        client,
        codes_with_suffix,
        level=level,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    # 历史分时MA：指数代码来源于沪深指数列表，代码不需要去掉 "." 及其后缀
    total_ma = sync_index_history_ma(
        client,
        codes_with_suffix,
        level=level,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    # 历史分时MACD：指数代码来源于沪深指数列表，代码不需要去掉 "." 及其后缀
    total_macd = sync_index_history_macd(
        client,
        codes_with_suffix,
        level=level,
        start_date=start_date,
        end_date=end_date,
        latest=latest,
    )

    logger.info("指数历史分时BOLL累计写入记录数: {}", total_boll)
    logger.info("指数历史分时KDJ累计写入记录数: {}", total_kdj)
    logger.info("指数历史分时MA累计写入记录数: {}", total_ma)
    logger.info("指数历史分时MACD累计写入记录数: {}", total_macd)


if __name__ == "__main__":
    main()



