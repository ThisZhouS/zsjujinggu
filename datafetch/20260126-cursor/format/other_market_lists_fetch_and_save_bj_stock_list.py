"""
独立接口程序：获取并存储京市股票列表数据。

本程序为 other_market_lists_sync.py 中京市股票列表接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_bj_stock_list
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

from api_clients.OtherMarketLists.OtherMarketLists import OtherMarketLists  # noqa: E402
from config.database import init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.other_market_lists_fetch_and_save_bj_stock_list")


def main() -> None:
    """
    主函数：调用京市股票列表接口获取并存储数据。

    API接口: fetch_and_save_bj_stock_list
    """
    # 初始化数据库连接
    init_database()

    client = OtherMarketLists()

    try:
        bj_stock_count = client.fetch_and_save_bj_stock_list()
        logger.info("京市股票列表累计写入记录数: {}", bj_stock_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("京市股票列表同步失败: {}", exc)
        raise


if __name__ == "__main__":
    main()


