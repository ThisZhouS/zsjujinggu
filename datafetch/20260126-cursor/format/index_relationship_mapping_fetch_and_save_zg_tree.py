"""
独立接口程序：获取并存储指数、行业、概念树数据。

本程序为 index_relationship_mapping_sync.py 中指数、行业、概念树接口的独立版本，可独立运行。
支持与其他接口程序并发运行。

API接口: fetch_and_save_zg_tree
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

from api_clients.IndexRelationshipMapping.IndexRelationshipMapping import (  # noqa: E402
    IndexRelationshipMapping,
)
from config.database import init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("format.index_relationship_mapping_fetch_and_save_zg_tree")


def main() -> None:
    """
    主函数：调用指数、行业、概念树接口获取并存储数据。

    API接口: fetch_and_save_zg_tree
    """
    # 初始化数据库连接
    init_database()

    client = IndexRelationshipMapping()

    try:
        count = client.fetch_and_save_zg_tree()
        logger.info("指数、行业、概念树 - 存储 {} 条记录", count)
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("指数、行业、概念树 - 处理失败: {}", exc)
        raise


if __name__ == "__main__":
    main()

