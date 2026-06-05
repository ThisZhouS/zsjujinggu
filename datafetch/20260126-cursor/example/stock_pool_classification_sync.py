"""
示例脚本：根据日期参数，批量获取并存储股票池分类接口。

根据 docx/StockPoolClassification.md，本脚本覆盖五类任务：
- 跌停股池：需要日期参数（格式 yyyy-MM-dd）
- 强势股池：需要日期参数（格式 yyyy-MM-dd）
- 炸板股池：需要日期参数（格式 yyyy-MM-dd）
- 涨停股池：需要日期参数（格式 yyyy-MM-dd）
- 次新股池：需要日期参数（格式 yyyy-MM-dd）

默认使用今天的日期，如需获取其他日期的数据，请修改 main() 函数中的 date 参数。
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional


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

from api_clients.StockPoolClassification.StockPoolClassification import (  # noqa: E402
    StockPoolClassification,
)
from config.database import init_database  # noqa: E402
from utils.date_utils import date_to_str, get_today  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.stock_pool_classification")


def sync_limit_down_pool(
    client: StockPoolClassification,
    date: str,
) -> int:
    """
    同步跌停股池数据。

    Args:
        client (StockPoolClassification): StockPoolClassification 客户端实例。
        date (str): 日期，格式 yyyy-MM-dd。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_limit_down_pool
    """
    try:
        count = client.fetch_and_save_limit_down_pool(date=date)
        logger.info("跌停股池 - 日期 {} 存储 {} 条记录", date, count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("跌停股池 - 日期 {} 处理失败: {}", date, exc)
        return 0


def sync_strong_pool(
    client: StockPoolClassification,
    date: str,
) -> int:
    """
    同步强势股池数据。

    Args:
        client (StockPoolClassification): StockPoolClassification 客户端实例。
        date (str): 日期，格式 yyyy-MM-dd。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_strong_pool
    """
    try:
        count = client.fetch_and_save_strong_pool(date=date)
        logger.info("强势股池 - 日期 {} 存储 {} 条记录", date, count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("强势股池 - 日期 {} 处理失败: {}", date, exc)
        return 0


def sync_limit_up_break_pool(
    client: StockPoolClassification,
    date: str,
) -> int:
    """
    同步炸板股池数据。

    Args:
        client (StockPoolClassification): StockPoolClassification 客户端实例。
        date (str): 日期，格式 yyyy-MM-dd。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_limit_up_break_pool
    """
    try:
        count = client.fetch_and_save_limit_up_break_pool(date=date)
        logger.info("炸板股池 - 日期 {} 存储 {} 条记录", date, count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("炸板股池 - 日期 {} 处理失败: {}", date, exc)
        return 0


def sync_limit_up_pool(
    client: StockPoolClassification,
    date: str,
) -> int:
    """
    同步涨停股池数据。

    Args:
        client (StockPoolClassification): StockPoolClassification 客户端实例。
        date (str): 日期，格式 yyyy-MM-dd。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_limit_up_pool
    """
    try:
        count = client.fetch_and_save_limit_up_pool(date=date)
        logger.info("涨停股池 - 日期 {} 存储 {} 条记录", date, count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("涨停股池 - 日期 {} 处理失败: {}", date, exc)
        return 0


def sync_sub_new_pool(
    client: StockPoolClassification,
    date: str,
) -> int:
    """
    同步次新股池数据。

    Args:
        client (StockPoolClassification): StockPoolClassification 客户端实例。
        date (str): 日期，格式 yyyy-MM-dd。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_sub_new_pool
    """
    try:
        count = client.fetch_and_save_sub_new_pool(date=date)
        logger.info("次新股池 - 日期 {} 存储 {} 条记录", date, count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("次新股池 - 日期 {} 处理失败: {}", date, exc)
        return 0


def main(date: Optional[str] = None) -> None:
    """
    主函数：按日期批量同步股票池分类接口。

    Args:
        date (Optional[str]): 日期，格式 yyyy-MM-dd。默认为 None（使用今天的日期）。

    API接口: StockPoolClassification
    """
    # 初始化数据库连接
    init_database()

    client = StockPoolClassification()

    # 如果没有指定日期，使用今天的日期
    if date is None:
        today = get_today()
        date = date_to_str(today, format_str="%Y-%m-{}")

    logger.info("开始同步股票池分类数据，日期: {}", date)

    # 1) 跌停股池接口
    total_limit_down = sync_limit_down_pool(client, date)
    logger.info("跌停股池累计写入记录数: {}", total_limit_down)

    # 2) 强势股池接口
    total_strong = sync_strong_pool(client, date)
    logger.info("强势股池累计写入记录数: {}", total_strong)

    # 3) 炸板股池接口
    total_limit_up_break = sync_limit_up_break_pool(client, date)
    logger.info("炸板股池累计写入记录数: {}", total_limit_up_break)

    # 4) 涨停股池接口
    total_limit_up = sync_limit_up_pool(client, date)
    logger.info("涨停股池累计写入记录数: {}", total_limit_up)

    # 5) 次新股池接口
    total_sub_new = sync_sub_new_pool(client, date)
    logger.info("次新股池累计写入记录数: {}", total_sub_new)


if __name__ == "__main__":
    # 可以在这里指定日期，例如：main(date="2024-01-15")
    # 如果不指定，默认使用今天的日期
    main()

