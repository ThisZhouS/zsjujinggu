"""
独立接口程序：获取并存储强势股池数据。

本程序为 stock_pool_classification_sync.py 中强势股池接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_strong_pool
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


logger = get_logger("format.stock_pool_classification_fetch_and_save_strong_pool")


def main(date: Optional[str] = None) -> None:
    """
    主函数：按日期同步强势股池数据。

    Args:
        date (Optional[str]): 日期，格式 yyyy-MM-dd。默认为 None（使用今天的日期）。

    API接口: fetch_and_save_strong_pool
    """
    # 初始化数据库连接
    init_database()

    client = StockPoolClassification()

    # 如果没有指定日期，使用今天的日期
    if date is None:
        today = get_today()
        date = date_to_str(today, format_str="%Y-%m-%d")

    logger.info("开始同步强势股池数据，日期: {}", date)

    try:
        count = client.fetch_and_save_strong_pool(date=date)
        logger.info("强势股池 - 日期 {} 存储 {} 条记录", date, count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("强势股池 - 日期 {} 处理失败: {}", date, exc)
        raise


if __name__ == "__main__":
    # 可以在这里指定日期，例如：main(date="2024-01-15")
    # 如果不指定，默认使用今天的日期
    main()

