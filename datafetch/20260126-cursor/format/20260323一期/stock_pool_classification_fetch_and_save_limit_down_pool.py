"""
独立接口程序：获取并存储跌停股池数据（20260323一期）。

支持两种模式：
- full：日期参数从 1997-01-01 遍历到今天。
- incremental：仅处理指定日期（默认当天）。

API接口: fetch_and_save_limit_down_pool
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import date, datetime
from pathlib import Path
from typing import List


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPT_FILENAME = Path(__file__).name
ERROR_LOG_FILE = PROJECT_ROOT / "log" / "20260323一期_error.log"
INTERFACE_NAME = "fetch_and_save_limit_down_pool"


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


add_project_root_to_sys_path(PROJECT_ROOT)

from api_clients.StockPoolClassification.StockPoolClassification import (  # noqa: E402
    StockPoolClassification,
)
from config.database import init_database  # noqa: E402
from format.phase1_utils import (  # noqa: E402
    append_error_log,
    call_with_retry,
    get_retry_count,
    make_progress_bar,
)
from utils.date_utils import date_to_str, get_date_range, get_today  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.20260323一期.stock_pool_classification_limit_down_pool")


def parse_args() -> argparse.Namespace:
    """
    解析命令行参数。

    Args:
        无 (None): 无参数。

    Returns:
        argparse.Namespace: 解析后的参数对象。

    API接口: 无
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["full", "incremental"], default="full")
    parser.add_argument("--date", default=None, help="增量日期，格式 YYYY-MM-DD")
    return parser.parse_args()


def resolve_target_dates(mode: str, date_str: str | None) -> List[str]:
    """
    解析目标日期列表。

    Args:
        mode (str): 运行模式，full 或 incremental。
        date_str (str | None): 指定日期。

    Returns:
        List[str]: 日期字符串列表（YYYY-MM-DD）。

    API接口: 无
    """
    if mode == "incremental":
        target = date_str or date_to_str(get_today())
        return [target]

    start_day = date(1997, 1, 1)
    end_day = get_today()
    return [date_to_str(item) for item in get_date_range(start_day, end_day)]


async def process_one_date(
    client: StockPoolClassification,
    target_date: str,
    semaphore: asyncio.Semaphore,
    retry_count: int,
) -> int:
    """
    异步处理单日跌停股池数据获取和存储（含重试）。

    Args:
        client (StockPoolClassification): API 客户端。
        target_date (str): 目标日期。
        semaphore (asyncio.Semaphore): 并发控制信号量。
        retry_count (int): 失败后最大重试次数。

    Returns:
        int: 存储记录数（失败返回 0）。

    API接口: fetch_and_save_limit_down_pool
    """
    async with semaphore:
        try:
            count = await asyncio.to_thread(
                call_with_retry,
                lambda: client.fetch_and_save_limit_down_pool(target_date),
                retry_count,
            )
            return count
        except Exception as exc:  # pylint: disable=broad-except
            reason = str(exc)
            logger.error("跌停股池 - 日期 {} 失败（已重试 {} 次）: {}", target_date, retry_count, reason)
            append_error_log(ERROR_LOG_FILE, SCRIPT_FILENAME, INTERFACE_NAME, target_date, reason)
            return 0


async def main() -> None:
    """
    主函数：单线程异步按日期同步跌停股池数据，附进度条。

    Args:
        无 (None): 无参数。

    Returns:
        None: 无返回值。

    API接口: fetch_and_save_limit_down_pool
    """
    args = parse_args()
    init_database()
    retry_count = get_retry_count()

    client = StockPoolClassification()
    target_dates = resolve_target_dates(args.mode, args.date)
    logger.info("模式={}，日期数量={}，重试次数={}", args.mode, len(target_dates), retry_count)

    total = 0
    semaphore = asyncio.Semaphore(1)
    with make_progress_bar(target_dates, desc="跌停股池") as pbar:
        for target_date in pbar:
            pbar.set_postfix_str(target_date)
            total += await process_one_date(client, target_date, semaphore, retry_count)

    logger.info("跌停股池累计写入记录数: {}", total)


if __name__ == "__main__":
    asyncio.run(main())
