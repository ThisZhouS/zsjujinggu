"""
20260323一期公共工具模块。

提供：进度条显示、重试机制、结构化错误日志写入。
"""

from __future__ import annotations

import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Optional

from tqdm import tqdm  # type: ignore


# ------------------------------------------------------------------ #
# sys.path 保障（phase1_utils 可能被直接 import，需确保项目根可寻址）
# ------------------------------------------------------------------ #

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


# ------------------------------------------------------------------ #
# 配置读取
# ------------------------------------------------------------------ #

def get_retry_count() -> int:
    """
    从环境变量读取重试次数（由 .env 中 RETRY_COUNT 定义，默认 3）。

    Args:
        无 (None): 无参数。

    Returns:
        int: 重试次数。

    API接口: 无
    """
    return int(os.getenv("RETRY_COUNT", "3"))


# ------------------------------------------------------------------ #
# 进度条工厂
# ------------------------------------------------------------------ #

def make_progress_bar(iterable: list, desc: str) -> tqdm:
    """
    创建简洁进度条。

    Args:
        iterable (list): 待迭代列表。
        desc (str): 进度条描述文字。

    Returns:
        tqdm: 配置好的进度条对象。

    API接口: 无
    """
    return tqdm(
        iterable,
        desc=desc,
        unit="item",
        ncols=88,
        bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]",
        colour="cyan",
    )


# ------------------------------------------------------------------ #
# 重试执行
# ------------------------------------------------------------------ #

def call_with_retry(
    fn: Callable[[], Any],
    retry_count: int,
    retry_delay: float = 1.0,
) -> Any:
    """
    带重试的同步调用，重试成功不计入失败。

    Args:
        fn (Callable[[], Any]): 待执行的无参可调用对象（用 lambda 包装参数）。
        retry_count (int): 最大重试次数（首次 + retry_count 次）。
        retry_delay (float): 每次重试前等待秒数。

    Returns:
        Any: fn 的返回值。

    Raises:
        Exception: 所有重试均失败时抛出最后一次异常。

    API接口: 无
    """
    last_exc: Optional[Exception] = None
    for attempt in range(retry_count + 1):
        try:
            return fn()
        except Exception as exc:  # pylint: disable=broad-except
            last_exc = exc
            if attempt < retry_count:
                time.sleep(retry_delay)
    raise last_exc  # type: ignore[misc]


# ------------------------------------------------------------------ #
# 错误日志
# ------------------------------------------------------------------ #

def append_error_log(
    error_log_file: Path,
    script_filename: str,
    interface_name: str,
    param: str,
    reason: str,
) -> None:
    """
    追加写入结构化错误日志，格式：
        接口：参数，失败原因

    Args:
        error_log_file (Path): 错误日志文件路径。
        script_filename (str): 调用脚本文件名。
        interface_name (str): API 接口名称。
        param (str): 失败参数（如股票代码或日期）。
        reason (str): 失败原因描述。

    Returns:
        None: 无返回值。

    API接口: 无
    """
    error_log_file.parent.mkdir(parents=True, exist_ok=True)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{now}] [{script_filename}] {interface_name}：{param}，{reason}\n"
    with error_log_file.open("a", encoding="utf-8") as f:
        f.write(line)

