"""
独立接口程序：获取并存储实时交易数据（全部 网络数据源）。

本程序为 realtime_trading_interfaces_sync.py 中实时交易数据（全部 网络数据源）接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_realtime_trading_all_network
"""

from __future__ import annotations

import sys
from pathlib import Path


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

from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces import (  # noqa: E402
    RealTimeTradingInterfaces,
)
from config.database import init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.realtime_trading_interfaces_fetch_and_save_realtime_trading_all_network")


def main() -> None:
    """
    主函数：调用实时交易数据（全部 网络数据源）接口获取并存储数据。

    API接口: fetch_and_save_realtime_trading_all_network
    """
    # 初始化数据库连接
    init_database()

    client = RealTimeTradingInterfaces()

    try:
        count = client.fetch_and_save_realtime_trading_all_network()
        logger.info("实时交易数据（全部 网络数据源）存储 {} 条记录", count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("实时交易数据（全部 网络数据源）处理失败: {}", exc)
        raise


if __name__ == "__main__":
    main()

