"""
index_relationship_mapping_fetch_and_save_belonging_indices

示例程序：在 PostgreSQL 中创建项目的全部表结构。

使用方法：
1) 在环境变量或 .env 中配置 DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD 等参数
2) 运行：python example/create_all_tables.py
"""

from __future__ import annotations

import sys
from pathlib import Path
import traceback


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

from config.database import create_tables, get_table_names, init_database, import_all_table_models  # noqa: E402
from core.exceptions import DatabaseException  # noqa: E402
from models import ShareholderChangeTrendNew  # noqa: E402


def _to_console_text(text: str) -> str:
    """
    将文本转换为当前控制台可输出的字符串，避免 UnicodeEncodeError。

    Args:
        text (str): 原始文本。

    Returns:
        str: 可安全输出到控制台的文本。

    API接口: 无
    """
    encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
    try:
        return text.encode(encoding, errors="replace").decode(encoding, errors="replace")
    except Exception:
        return text.encode("utf-8", errors="replace").decode("utf-8", errors="replace")


def safe_print(text: str) -> None:
    """
    安全打印，兼容 Windows 控制台编码。

    Args:
        text (str): 要打印的文本。

    API接口: 无
    """
    print(_to_console_text(text))


def create_all_tables() -> list[str]:
    """
    初始化数据库连接并创建全部表结构。

    Returns:
        list[str]: 当前数据库中的表名列表。

    Raises:
        DatabaseException: 如果数据库初始化或建表失败。

    API接口: 无
    """
    init_database()
    
    # 导入所有表模型（包括 api_clients 和 models 目录）
    import_all_table_models("api_clients")
    import_all_table_models("models")
    
    create_tables()
    return get_table_names()


def main() -> int:
    """
    主入口：创建全部表并输出结果。

    Returns:
        int: 进程退出码（0 表示成功）。

    API接口: 无
    """
    try:
        table_names = create_all_tables()
        safe_print(f"已创建/确认存在的表数量: {len(table_names)}")
        for name in sorted(table_names):
            safe_print(f"- {name}")
        return 0
    except DatabaseException as e:
        safe_print(f"建表失败: {e}")
        safe_print(traceback.format_exc())
        return 1
    except Exception as e:
        safe_print(f"发生未知错误: {e}")
        safe_print(traceback.format_exc())
        return 1


if __name__ == "__main__":
    raise SystemExit(main())


