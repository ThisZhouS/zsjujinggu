"""
独立接口程序：获取并存储根据指数、行业、概念找相关股票数据。

本程序为 index_relationship_mapping_sync.py 中根据指数、行业、概念找相关股票接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_related_stocks_by_code
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

from api_clients.IndexRelationshipMapping.IndexRelationshipMapping import (  # noqa: E402
    IndexRelationshipMapping,
)
from api_clients.IndexRelationshipMapping.IndexRelationshipMapping_table import ZgTree  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.index_relationship_mapping_fetch_and_save_related_stocks_by_code")


def get_leaf_codes_from_zg_tree(max_count: Optional[int] = None) -> List[str]:
    """
    从 `zg_tree` 表中获取 isleaf=1 的 Code，用于"根据指数/行业/概念找相关股票"接口。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 叶子节点 Code 列表。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(ZgTree.code).filter(ZgTree.isleaf == 1).order_by(ZgTree.code)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.code for row in rows if row.code]


def main() -> None:
    """
    主函数：通过查询数据库 zg_tree 表，调用根据指数、行业、概念找相关股票接口获取并存储数据。

    API接口: fetch_and_save_related_stocks_by_code
    """
    # 初始化数据库连接
    init_database()

    client = IndexRelationshipMapping()

    # 从 zg_tree 中获取 isleaf=1 的 code，用于"code -> 股票"接口
    zg_leaf_codes = get_leaf_codes_from_zg_tree(max_count=None)
    logger.info("从 zg_tree 读取到叶子节点数量: {}", len(zg_leaf_codes))

    total = 0
    for code in zg_leaf_codes:
        try:
            count = client.fetch_and_save_related_stocks_by_code(code)
            logger.info("指数/行业/概念 -> 股票 - code {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("指数/行业/概念 -> 股票 - code {} 处理失败: {}", code, exc)

    logger.info("指数/行业/概念 -> 股票 累计写入记录数: {}", total)


if __name__ == "__main__":
    main()

