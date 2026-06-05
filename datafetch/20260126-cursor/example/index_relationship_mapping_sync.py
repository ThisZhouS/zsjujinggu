"""
示例脚本：根据数据库中的股票列表和"指数、行业、概念树"数据，批量获取并存储指数关系映射相关数据。

覆盖 docx/IndexRelationshipMapping.md 中的四类接口场景：
- 指数、行业、概念树：原始数据接口，不需要股票参数
- 所属指数：股票代码来源于股票列表（去掉 "." 及其后缀）
- 根据股票找相关指数、行业、概念：股票代码来源于股票列表（去掉 "." 及其后缀）
- 根据指数、行业、概念找相关股票：code 来源于"指数、行业、概念树"表中 isleaf=1 的 Code
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
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList  # noqa: E402
from config.database import get_db_context, init_database  # noqa: E402
from utils.logger import get_logger  # noqa: E402


logger = get_logger("example.index_relationship_mapping")


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """
    从 `stock_list` 表获取股票代码（原始 dm 字段）。

    Args:
        max_count (Optional[int]): 限制数量，默认为 None（不限制）。

    Returns:
        List[str]: 股票代码列表，例如 ["000001", "000001.SZ"]。

    API接口: 无
    """
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    return [row.dm for row in rows if row.dm]


def get_leaf_codes_from_zg_tree(max_count: Optional[int] = None) -> List[str]:
    """
    从 `zg_tree` 表中获取 isleaf=1 的 Code，用于“根据指数/行业/概念找相关股票”接口。

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


def sync_zg_tree(client: IndexRelationshipMapping) -> int:
    """
    同步“指数、行业、概念树”数据（不需要股票参数）。

    API接口: fetch_and_save_zg_tree
    """
    try:
        count = client.fetch_and_save_zg_tree()
        logger.info("指数、行业、概念树 - 存储 {} 条记录", count)
        return count
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("指数、行业、概念树 - 处理失败: {}", exc)
        return 0


def sync_belonging_indices(
    client: IndexRelationshipMapping,
    stock_codes_without_suffix: List[str],
) -> int:
    """
    使用“所属指数”接口，为给定股票代码列表获取并存储数据。

    注意：接口要求不带后缀的股票代码（如 "000001"）。

    API接口: fetch_and_save_belonging_indices
    """
    total = 0
    for code in stock_codes_without_suffix:
        try:
            count = client.fetch_and_save_belonging_indices(code)
            logger.info("所属指数 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("所属指数 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_related_codes_by_stock(
    client: IndexRelationshipMapping,
    stock_codes_without_suffix: List[str],
) -> int:
    """
    使用“根据股票找相关指数、行业、概念”接口，为给定股票代码列表获取并存储数据。

    注意：接口要求不带后缀的股票代码（如 "000001"）。

    API接口: fetch_and_save_related_codes_by_stock
    """
    total = 0
    for code in stock_codes_without_suffix:
        try:
            count = client.fetch_and_save_related_codes_by_stock(code)
            logger.info("股票 -> 指数/行业/概念 - 股票 {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("股票 -> 指数/行业/概念 - 股票 {} 处理失败: {}", code, exc)
    return total


def sync_related_stocks_by_code(
    client: IndexRelationshipMapping,
    zg_codes: List[str],
) -> int:
    """
    使用“根据指数、行业、概念找相关股票”接口，为给定 code 列表获取并存储数据。

    注意：code 来源于 `zg_tree` 表中 isleaf=1 的 Code。

    API接口: fetch_and_save_related_stocks_by_code
    """
    total = 0
    for code in zg_codes:
        try:
            count = client.fetch_and_save_related_stocks_by_code(code)
            logger.info("指数/行业/概念 -> 股票 - code {} 存储 {} 条记录", code, count)
            total += count
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("指数/行业/概念 -> 股票 - code {} 处理失败: {}", code, exc)
    return total


def main() -> None:
    """
    主函数：按要求通过数据库参数批量同步指数关系映射相关数据。

    API接口: IndexRelationshipMapping
    """
    # 初始化数据库连接
    init_database()

    client = IndexRelationshipMapping()

    # 1) 指数、行业、概念树：原始数据接口（不依赖股票参数）
    tree_count = sync_zg_tree(client)

    # 2) 从股票列表表中获取所有股票代码
    raw_stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(raw_stock_codes))

    # 股票型接口需要不带后缀的股票代码（如 "000001"）
    stock_codes_without_suffix: List[str] = []
    for code in raw_stock_codes:
        if not code:
            continue
        clean_code = code.split(".", maxsplit=1)[0]
        stock_codes_without_suffix.append(clean_code)

    # 3) 从 zg_tree 中获取 isleaf=1 的 code，用于“code -> 股票”接口
    zg_leaf_codes = get_leaf_codes_from_zg_tree(max_count=None)
    logger.info("从 zg_tree 读取到叶子节点数量: {}", len(zg_leaf_codes))

    # 4) 所属指数：股票代码来源于股票列表（去掉 "." 及后缀）
    total_belonging = sync_belonging_indices(client, stock_codes_without_suffix)

    # 5) 根据股票找相关指数、行业、概念：股票代码来源于股票列表（去掉 "." 及后缀）
    total_stock_to_zg = sync_related_codes_by_stock(client, stock_codes_without_suffix)

    # 6) 根据指数、行业、概念找相关股票：code 来源于“指数、行业、概念树”的 Code
    total_zg_to_stock = sync_related_stocks_by_code(client, zg_leaf_codes)

    logger.info("指数、行业、概念树累计写入记录数: {}", tree_count)
    logger.info("所属指数累计写入记录数: {}", total_belonging)
    logger.info("股票 -> 指数/行业/概念 累计写入记录数: {}", total_stock_to_zg)
    logger.info("指数/行业/概念 -> 股票 累计写入记录数: {}", total_zg_to_stock)


if __name__ == "__main__":
    main()



