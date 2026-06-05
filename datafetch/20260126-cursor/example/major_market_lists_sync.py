"""
示例脚本：根据 MajorMarketLists 文档，批量获取并存储"主要市场列表"五个原始数据接口。

这几个接口均为原数据接口，不需要除 license 外的任何参数：
- 股票列表
- 沪深基金列表
- 沪深主要指数列表
- 新股日历
- 港股股票列表
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

from api_clients.MajorMarketLists.MajorMarketLists import MajorMarketLists  # noqa: E402
from config.database import init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.major_market_lists")


def main() -> None:
    """
    主函数：调用 MajorMarketLists 中的各 fetch_and_save_* 方法，同步五类基础列表数据。

    API接口: MajorMarketLists
    """
    # 初始化数据库连接
    init_database()

    client = MajorMarketLists()

    # 1. 股票列表
    try:
        stock_count = client.fetch_and_save_stock_list()
        logger.info("股票列表累计写入记录数: {}", stock_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("股票列表同步失败: {}", exc)

    # 2. 沪深基金列表
    try:
        fund_count = client.fetch_and_save_hs_fund_list()
        logger.info("沪深基金列表累计写入记录数: {}", fund_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("沪深基金列表同步失败: {}", exc)

    # 3. 沪深主要指数列表
    try:
        index_count = client.fetch_and_save_hs_main_index_list()
        logger.info("沪深主要指数列表累计写入记录数: {}", index_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("沪深主要指数列表同步失败: {}", exc)

    # 4. 新股日历
    try:
        new_stock_count = client.fetch_and_save_new_stock_calendar()
        logger.info("新股日历累计写入记录数: {}", new_stock_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("新股日历同步失败: {}", exc)

    # 5. 港股股票列表
    try:
        hk_stock_count = client.fetch_and_save_hk_stock_list()
        logger.info("港股股票列表累计写入记录数: {}", hk_stock_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("港股股票列表同步失败: {}", exc)


if __name__ == "__main__":
    main()



