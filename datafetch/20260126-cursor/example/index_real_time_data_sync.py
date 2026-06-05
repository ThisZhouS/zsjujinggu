"""
示例脚本：根据数据库中的京市指数列表，批量获取并存储指数实时数据。

根据 docx/RealTimeTradingData/IndexRealTimeData.md，本脚本覆盖：
- 指数实时数据接口：指数代码来源于京市指数列表，需要去掉 . 及其后缀
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Optional


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

from api_clients.IndexRealTimeData.IndexRealTimeData import IndexRealTimeData  # noqa: E402
from api_clients.OtherMarketLists.OtherMarketLists_table import BjIndexList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.index_real_time_data")


def remove_suffix(code: str) -> str:
    """
    去掉指数代码中的 . 及其后缀。

    Args:
        code (str): 原始指数代码，例如 "899050.BJ" 或 "899050"。

    Returns:
        str: 处理后的指数代码，例如 "899050"。

    API接口: 无
    """
    if "." in code:
        return code.split(".")[0]
    return code


def get_bj_index_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `bj_index_list` 表获取京市指数代码（去掉 . 及其后缀）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 指数代码列表，例如 ["899050"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(BjIndexList.dm).order_by(BjIndexList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return [remove_suffix(code) for code in codes]


def sync_index_real_time_data(
    client: IndexRealTimeData,
    index_codes: List[str],
) -> int:
    """
    同步指数实时数据。

    Args:
        client (IndexRealTimeData): IndexRealTimeData 客户端实例。
        index_codes (List[str]): 指数代码列表。

    Returns:
        int: 累计存储的记录数。

    API接口: fetch_and_save_index_real_time_data
    """
    total = 0
    for code in index_codes:
        try:
            count = client.fetch_and_save_index_real_time_data(index_code=code)
            logger.info("指数实时数据 - 指数 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("指数实时数据 - 指数 {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按数据库列表批量同步指数实时数据。

    API接口: IndexRealTimeData
    """
    # 初始化数据库连接
    init_database()

    client = IndexRealTimeData()

    # 从数据库获取指数代码列表
    index_codes = get_bj_index_codes_from_db(max_count=None)

    logger.info("从京市指数列表读取到指数代码数量: {}", len(index_codes))

    # 指数实时数据接口：指数代码来源于京市指数列表
    total = sync_index_real_time_data(client, index_codes)
    logger.info("指数实时数据累计写入记录数: {}", total)


if __name__ == "__main__":
    main()

