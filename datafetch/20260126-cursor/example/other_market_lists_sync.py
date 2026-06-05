"""
示例脚本：根据 OtherMarketLists 文档，批量获取并存储"其他市场列表"四个原始数据接口。

这几个接口均为原数据接口，不需要除 license 外的任何参数：
- 京市指数列表
- 科创股票列表
- ETF 基金列表
- 京市股票列表
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


logger = get_logger("example.other_market_lists")


def main() -> None:
    """
    主函数：调用 OtherMarketLists 中的各 fetch_and_save_* 方法，同步四类"其他市场列表"数据。

    API接口: OtherMarketLists
    """
    # 初始化数据库连接
    init_database()

    client = OtherMarketLists()

    # 1. 京市指数列表
    try:
        bj_index_count = client.fetch_and_save_bj_index_list()
        logger.info("京市指数列表累计写入记录数: {}", bj_index_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("京市指数列表同步失败: {}", exc)

    # 2. 科创股票列表
    try:
        kc_stock_count = client.fetch_and_save_kc_stock_list()
        logger.info("科创股票列表累计写入记录数: {}", kc_stock_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("科创股票列表同步失败: {}", exc)

    # 3. ETF 基金列表
    try:
        etf_fund_count = client.fetch_and_save_etf_fund_list()
        logger.info("ETF 基金列表累计写入记录数: {}", etf_fund_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("ETF 基金列表同步失败: {}", exc)

    # 4. 京市股票列表
    try:
        bj_stock_count = client.fetch_and_save_bj_stock_list()
        logger.info("京市股票列表累计写入记录数: {}", bj_stock_count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("京市股票列表同步失败: {}", exc)


if __name__ == "__main__":
    main()



