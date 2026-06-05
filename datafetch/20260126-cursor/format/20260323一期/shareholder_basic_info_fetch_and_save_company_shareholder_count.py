"""
独立接口程序：获取并存储公司股东数数据（20260323一期）。

支持两种模式：
- full：全量，不设时间参数。
- incremental：使用当天日期作为开始和结束时间。

API接口: fetch_and_save_company_shareholder_count
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
INTERFACE_NAME = "fetch_and_save_company_shareholder_count"


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

from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from api_clients.ShareholderBasicInfo.ShareholderBasicInfo import (  # noqa: E402
    ShareholderBasicInfo,
)
from config.database import get_db_context, init_database  # noqa: E402
from format.phase1_utils import (  # noqa: E402
    append_error_log,
    call_with_retry,
    get_retry_count,
    make_progress_bar,
)
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.20260323一期.shareholder_basic_info_shareholder_count")


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


def resolve_dates(mode: str, date_str: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """
    根据模式解析开始和结束日期。

    Args:
        mode (str): 运行模式。
        date_str (Optional[str]): 日期字符串。

    Returns:
        tuple[Optional[str], Optional[str]]: 开始和结束日期（YYYYMMDD）。

    API接口: 无
    """
    if mode == "full":
        return None, None
    target = date_str or datetime.now().strftime("%Y-%m-%d")
    yyyymmdd = datetime.strptime(target, "%Y-%m-%d").strftime("%Y%m%d")
    return yyyymmdd, yyyymmdd


async def process_one_stock(
    client: ShareholderBasicInfo,
    stock_code: str,
    start_date: Optional[str],
    end_date: Optional[str],
    semaphore: asyncio.Semaphore,
    retry_count: int,
) -> int:
    """
    异步处理单只股票的股东数数据获取和存储（含重试）。

    Args:
        client (ShareholderBasicInfo): API 客户端。
        stock_code (str): 股票代码。
        start_date (Optional[str]): 开始日期。
        end_date (Optional[str]): 结束日期。
        semaphore (asyncio.Semaphore): 并发控制信号量。
        retry_count (int): 失败后最大重试次数。

    Returns:
        int: 存储记录数（失败返回 0）。

    API接口: fetch_and_save_company_shareholder_count
    """
    async with semaphore:
        try:
            count = await asyncio.to_thread(
                call_with_retry,
                lambda: client.fetch_and_save_company_shareholder_count(
                    stock_code, start_date, end_date
                ),
                retry_count,
            )
            return count
        except Exception as exc:  # pylint: disable=broad-except
            reason = str(exc)
            logger.error("公司股东数 - 股票 {} 失败（已重试 {} 次）: {}", stock_code, retry_count, reason)
            append_error_log(ERROR_LOG_FILE, SCRIPT_FILENAME, INTERFACE_NAME, stock_code, reason)
            return 0


async def main() -> None:
    """
    主函数：单线程异步批量同步公司股东数数据，附进度条。

    Args:
        无 (None): 无参数。

    Returns:
        None: 无返回值。

    API接口: fetch_and_save_company_shareholder_count
    """
    args = parse_args()
    init_database()
    retry_count = get_retry_count()

    start_date, end_date = resolve_dates(args.mode, args.date)
    client = ShareholderBasicInfo()
    stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("模式={}，股票数量={}，重试次数={}", args.mode, len(stock_codes), retry_count)

    total = 0
    semaphore = asyncio.Semaphore(1)
    with make_progress_bar(stock_codes, desc="公司股东数") as pbar:
        for code in pbar:
            pbar.set_postfix_str(code)
            total += await process_one_stock(client, code, start_date, end_date, semaphore, retry_count)

    logger.info("公司股东数累计写入记录数: {}", total)


if __name__ == "__main__":
    asyncio.run(main())
