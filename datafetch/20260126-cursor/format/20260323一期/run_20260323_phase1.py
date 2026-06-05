"""
20260323一期统一调度程序（5+2模式）。

调度规则：
1. 首次执行：7个脚本按最大并发5个分批运行。
2. 首次完成后：每天02:00执行全部7个脚本增量更新，传入当天日期参数。

API接口: 无
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime
from pathlib import Path
from typing import List


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPT_FILENAME = Path(__file__).name
ERROR_LOG_FILE = PROJECT_ROOT / "log" / "20260323一期_error.log"


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

from tqdm import tqdm  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.20260323一期.run_20260323_phase1")

SCRIPTS: List[str] = [
    "shareholder_basic_info_fetch_and_save_company_top_flow_holders.py",
    "stock_pool_classification_fetch_and_save_limit_down_pool.py",
    "stock_pool_classification_fetch_and_save_limit_up_pool.py",
    "company_basic_info_fetch_and_save_stock_basic_info.py",
    "historical_trading_data_fetch_and_save_hs_stock_history_trading.py",
    "shareholder_basic_info_fetch_and_save_company_shareholder_count.py",
    "company_basic_info_fetch_and_save_company_capital.py",
]

SCRIPT_DIR = PROJECT_ROOT / "format" / "20260323一期"
MAX_CONCURRENCY = 5


async def run_one_script(script_name: str, mode: str, date_str: str | None, pbar: tqdm) -> int:
    """
    运行单个脚本进程，完成后更新进度条。

    Args:
        script_name (str): 脚本文件名。
        mode (str): 运行模式。
        date_str (str | None): 日期参数。
        pbar (tqdm): 外层进度条实例。

    Returns:
        int: 进程返回码。

    API接口: 无
    """
    script_path = SCRIPT_DIR / script_name
    command = [sys.executable, str(script_path), "--mode", mode]
    if date_str:
        command.extend(["--date", date_str])

    short_name = script_name.replace(".py", "")
    pbar.set_postfix_str(short_name, refresh=True)
    logger.info("启动脚本: {}，mode={}，date={}", script_name, mode, date_str)

    process = await asyncio.create_subprocess_exec(*command, cwd=str(PROJECT_ROOT))
    return_code = await process.wait()

    pbar.update(1)
    if return_code != 0:
        pbar.write(f"[FAIL] {short_name}  exit={return_code}")
        logger.error("脚本执行失败，文件={}，exit={}", script_name, return_code)
    else:
        pbar.write(f"[OK]   {short_name}")
        logger.info("脚本执行成功: {}", script_name)

    return return_code


async def run_scripts_in_batches(mode: str, date_str: str | None) -> None:
    """
    按最大并发数分批执行全部脚本，显示整体进度条。

    Args:
        mode (str): 运行模式。
        date_str (str | None): 日期参数。

    Returns:
        None: 无返回值。

    API接口: 无
    """
    total = len(SCRIPTS)
    label = f"[{mode}] 20260323一期"
    with tqdm(
        total=total,
        desc=label,
        unit="script",
        ncols=88,
        bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]",
        colour="green",
    ) as pbar:
        for start in range(0, total, MAX_CONCURRENCY):
            batch = SCRIPTS[start: start + MAX_CONCURRENCY]
            tasks = [
                run_one_script(name, mode, date_str, pbar)
                for name in batch
            ]
            await asyncio.gather(*tasks)


async def sleep_until_next_two_am() -> None:
    """
    休眠至下一个凌晨2点。

    Args:
        无 (None): 无参数。

    Returns:
        None: 无返回值。

    API接口: 无
    """
    from datetime import timedelta

    now = datetime.now()
    next_run = now.replace(hour=2, minute=0, second=0, microsecond=0)
    if now >= next_run:
        next_run = next_run + timedelta(days=1)
    seconds = (next_run - now).total_seconds()
    logger.info(
        "等待至下次执行时间: {}，剩余 {:.0f} 秒",
        next_run.strftime("%Y-%m-%d %H:%M:%S"),
        seconds,
    )
    await asyncio.sleep(seconds)


async def main() -> None:
    """
    主函数：先执行一次全量，再每天02:00执行增量更新。

    Args:
        无 (None): 无参数。

    Returns:
        None: 无返回值。

    API接口: 无
    """
    logger.info("开始首次全量执行（5+2模式，最大并发={}）", MAX_CONCURRENCY)
    await run_scripts_in_batches(mode="full", date_str=None)
    logger.info("首次全量执行完成")

    while True:
        await sleep_until_next_two_am()
        today = datetime.now().strftime("%Y-%m-%d")
        logger.info("开始每日增量执行，日期={}", today)
        await run_scripts_in_batches(mode="incremental", date_str=today)
        logger.info("每日增量执行完成，日期={}", today)


if __name__ == "__main__":
    asyncio.run(main())
