"""
数据同步脚本基类和通用工具函数。

该模块提供了在 useful/ 和 example/ 目录中脚本常用的公共函数，
用于减少代码重复，提升可维护性。
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional


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


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 stock_list 表中按要求获取股票代码（原始 dm 字段）。

    Args:
        max_count (Optional[int]): 限制返回的股票数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["000001", "000001.SZ"]。

    API接口: 无
    """
    # 延迟导入以避免循环依赖
    from config.database import get_db_context
    from api_clients.MajorMarketLists.MajorMarketLists_table import StockList

    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


def get_full_fetch_date_range() -> tuple[str, str]:
    """
    获取全量抓取使用的日期范围。

    优先从环境变量读取，未配置时回退到脚本原默认值。

    Returns:
        tuple[str, str]: 开始日期与结束日期，格式为 YYYYMMDD。

    API接口: 无
    """
    start_date = os.getenv("FULL_FETCH_START_DATE", "1991-01-01").replace("-", "")
    end_date = os.getenv("FULL_FETCH_END_DATE")
    if end_date:
        return start_date, end_date.replace("-", "")
    return start_date, datetime.now().strftime("%Y%m%d")


def get_single_fetch_date() -> Optional[str]:
    """
    获取单日抓取使用的日期（用于 FULL_FETCH_SINGLE_DATE 环境变量）。

    Returns:
        Optional[str]: 单日日期字符串，格式为 YYYY-MM-DD 或 None。

    API接口: 无
    """
    date_str = os.getenv("FULL_FETCH_SINGLE_DATE")
    return date_str if date_str else None


def is_single_date_mode() -> bool:
    """
    检查是否处于单日抓取模式。

    Returns:
        bool: 如果是单日模式返回 True，否则返回 False。

    API接口: 无
    """
    return os.getenv("FULL_FETCH_MODE") == "single_date"
