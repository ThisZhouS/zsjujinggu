"""
辅助程序：从 2026-02-01 起按日遍历获取并存储涨停股池数据。

本程序基于 `format.stock_pool_classification_fetch_and_save_limit_up_pool`，
通过日期遍历的方式多次调用原始接口程序。

遍历范围：
- 开始日期：2026-02-01
- 结束日期：今天（运行当天）

API接口: fetch_and_save_limit_up_pool
"""

from __future__ import annotations

import os
import sys
from pathlib import Path


def add_project_root_to_sys_path(project_root: Path) -> None:
    """
    将项目根目录加入 sys.path，保证脚本可从任意工作目录运行。

    Args:
        project_root (Path): 项目根目录路径。

    Returns:
        None: 无返回值。

    API接口: 无
    """
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))


PROJECT_ROOT = Path(__file__).resolve().parent.parent
add_project_root_to_sys_path(PROJECT_ROOT)

from datetime import date as _date  # noqa: E402

from format.stock_pool_classification_fetch_and_save_limit_up_pool import (  # noqa: E402
    main as run_once_for_date,
)
from utils.date_utils import date_to_str, get_date_range, get_today  # noqa: E402
from utils.logger import get_logger  # noqa: E402




def get_full_fetch_date_range() -> tuple[str, str]:
    """
    获取全量抓取使用的日期范围。

    优先从环境变量读取，未配置时回退到脚本原默认值。

    Returns:
        tuple[str, str]: 开始日期与结束日期，格式为 YYYY-MM-DD。

    API接口: 无
    """
    start_date = os.getenv("FULL_FETCH_START_DATE", "2026-02-01")
    end_date = os.getenv("FULL_FETCH_END_DATE") or date_to_str(get_today(), format_str="%Y-%m-%d")
    return start_date, end_date


    """
    主函数：从 2026-02-01 起按日遍历同步涨停股池数据，一直遍历到今天。

    API接口: fetch_and_save_limit_up_pool
    """
    start_date_str, end_date_str = get_full_fetch_date_range()

    logger.info("开始遍历涨停股池数据，日期范围: {} 至 {}", start_date_str, end_date_str)

    for current_date in get_date_range(start_date_str, end_date_str, format_str="%Y-%m-%d"):
        date_str = date_to_str(current_date, format_str="%Y-%m-%d")
        try:
            logger.info("开始处理涨停股池数据，日期: {}", date_str)
            run_once_for_date(date=date_str)
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("涨停股池 - 日期 {} 处理失败: {}", date_str, exc)

    logger.info("涨停股池数据遍历完成。")


if __name__ == "__main__":
    main()

