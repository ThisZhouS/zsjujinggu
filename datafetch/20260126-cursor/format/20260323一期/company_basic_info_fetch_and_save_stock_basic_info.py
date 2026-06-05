"""
独立接口程序：获取并存储股票基础信息数据（20260323一期）。

支持两种模式：
- full：全量遍历股票列表。
- incremental：仅更新指定日期（参数仅用于调度标识，接口本身不接收日期）。

API接口: fetch_and_save_stock_basic_info
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPT_FILENAME = Path(__file__).name
ERROR_LOG_FILE = PROJECT_ROOT / "log" / "20260323一期_error.log"
INTERFACE_NAME = "fetch_and_save_stock_basic_info"


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

from api_clients.CompanyBasicInfo.CompanyBasicInfo import CompanyBasicInfo  # noqa: E402
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from format.phase1_utils import (  # noqa: E402
    append_error_log,
    call_with_retry,
    get_retry_count,
    make_progress_bar,
)
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.20260323一期.company_basic_info_stock_basic_info")


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 stock_list 表获取股票代码。

    Args:
        max_count (Optional[int]): 限制返回数量，None 表示不限制。

    Returns:
        List[str]: 股票代码列表。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


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


async def process_one_stock(
    client: CompanyBasicInfo,
    stock_code: str,
    schedule_date: Optional[str],
    semaphore: asyncio.Semaphore,
    retry_count: int,
) -> int:
    """
    异步处理单只股票的基础信息获取和存储（含重试）。

    Args:
        client (CompanyBasicInfo): API 客户端。
        stock_code (str): 股票代码。
        schedule_date (Optional[str]): 调度日期。
        semaphore (asyncio.Semaphore): 并发控制信号量。
        retry_count (int): 失败后最大重试次数。

    Returns:
        int: 存储记录数（失败返回 0）。

    API接口: fetch_and_save_stock_basic_info
    """
    async with semaphore:
        try:
            count = await asyncio.to_thread(
                call_with_retry,
                lambda: client.fetch_and_save_stock_basic_info(stock_code),
                retry_count,
            )
            return count
        except Exception as exc:  # pylint: disable=broad-except
            reason = str(exc)
            logger.error("股票基础信息 - 股票 {} 失败（已重试 {} 次）: {}", stock_code, retry_count, reason)
            append_error_log(ERROR_LOG_FILE, SCRIPT_FILENAME, INTERFACE_NAME, stock_code, reason)
            return 0


async def main() -> None:
    """
    主函数：单线程异步批量同步股票基础信息数据，附进度条。

    Args:
        无 (None): 无参数。

    Returns:
        None: 无返回值。

    API接口: fetch_and_save_stock_basic_info
    """
    args = parse_args()
    init_database()
    retry_count = get_retry_count()

    schedule_date = args.date or datetime.now().strftime("%Y-%m-%d")
    client = CompanyBasicInfo()
    stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("模式={}，股票数量={}，调度日期={}，重试次数={}", args.mode, len(stock_codes), schedule_date, retry_count)

    total = 0
    semaphore = asyncio.Semaphore(1)
    with make_progress_bar(stock_codes, desc="股票基础信息") as pbar:
        for code in pbar:
            pbar.set_postfix_str(code)
            total += await process_one_stock(client, code, schedule_date, semaphore, retry_count)

    logger.info("股票基础信息累计写入记录数: {}", total)


if __name__ == "__main__":
    asyncio.run(main())
