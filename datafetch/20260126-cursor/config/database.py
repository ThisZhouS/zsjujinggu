"""
数据库配置模块。

该模块负责数据库连接的创建和管理，使用SQLAlchemy作为ORM框架。
"""

from __future__ import annotations

from contextlib import contextmanager
import importlib
from pathlib import Path
import time
from typing import Any, Generator, Optional

from sqlalchemy import create_engine, Engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import QueuePool

from config.settings import settings
from core.exceptions import DatabaseException

# 创建数据库引擎
engine: Optional[Engine] = None

# 创建会话工厂
SessionLocal: Optional[sessionmaker] = None

# 声明基类
Base = declarative_base()


def import_all_table_models(package_root: str = "api_clients") -> list[str]:
    """
    导入项目中所有 *_table.py 模型模块，确保它们注册到 Base.metadata。

    该函数会递归扫描 package_root 目录下的 *_table.py 文件，并按模块路径进行导入。

    Args:
        package_root (str): 模型模块所在的包根目录，默认为 "api_clients"。

    Returns:
        list[str]: 成功导入的模块路径列表。

    Raises:
        DatabaseException: 如果目录不存在或导入失败。

    API接口: 无
    """
    root_path = Path(__file__).resolve().parent.parent / package_root
    if not root_path.exists():
        raise DatabaseException(
            f"未找到模型目录: {root_path}",
            "MODEL_IMPORT_ROOT_NOT_FOUND",
        )

    # 说明：
    # 目前部分表模型同时使用了 primary_key=True 与 PrimaryKeyConstraint，
    # SQLAlchemy 会发出告警（SAWarning）。为保证建表/迁移工具输出更干净，这里仅屏蔽该类告警。
    import warnings
    from sqlalchemy.exc import SAWarning

    warnings.filterwarnings(
        "ignore",
        message=r"Table '.*' specifies columns '.*' as primary_key=True, not matching locally specified columns '.*'; .*",
        category=SAWarning,
    )

    imported_modules: list[str] = []
    for file_path in root_path.rglob("*_table.py"):
        if file_path.name.startswith("_"):
            continue

        relative_path = file_path.relative_to(root_path.parent)
        module_name = ".".join(relative_path.with_suffix("").parts)
        try:
            importlib.import_module(module_name)
            imported_modules.append(module_name)
        except Exception as e:
            raise DatabaseException(
                f"导入模型模块失败: {module_name}, error={str(e)}",
                "MODEL_IMPORT_ERROR",
            )

    return imported_modules


def init_database() -> None:
    """
    初始化数据库连接。

    创建数据库引擎和会话工厂。

    Raises:
        DatabaseException: 如果数据库连接失败。
    """
    global engine, SessionLocal

    try:
        engine = create_engine(
            settings.database_url,
            poolclass=QueuePool,
            pool_pre_ping=True,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_recycle=settings.DB_POOL_RECYCLE,
            connect_args={
                "connect_timeout": settings.DB_CONNECT_TIMEOUT,
                "application_name": settings.PROJECT_NAME,
                "options": f"-c client_encoding={settings.DB_CLIENT_ENCODING}",
            },
            echo=settings.DB_ECHO,
        )

        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
        )

        # 测试连接
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

    except Exception as e:
        # 提供更详细的错误信息，包括连接参数（不包含密码）
        host_warning = ""
        if settings.DB_HOST == "127.0.0.0":
            host_warning = (
                "\n⚠️  警告: 检测到无效的 host 配置 '127.0.0.0'，"
                "已自动修正为 '127.0.0.1'。请在 .env 文件中将 DB_HOST 设置为 '127.0.0.1' 或 'localhost'。\n"
            )
        
        error_msg = (
            f"数据库初始化失败: {str(e)}\n"
            f"{host_warning}"
            f"连接参数: host={settings.DB_HOST}, port={settings.DB_PORT}, "
            f"database={settings.DB_NAME}, user={settings.DB_USER}, "
            f"connect_timeout={settings.DB_CONNECT_TIMEOUT}s, "
            f"pool_timeout={settings.DB_POOL_TIMEOUT}s\n"
            f"请检查：\n"
            f"  1. 数据库服务是否正在运行\n"
            f"  2. 数据库连接参数是否正确（检查 .env 文件）\n"
            f"     - DB_HOST 应为 '127.0.0.1' 或 'localhost'（不是 '127.0.0.0'）\n"
            f"     - 如果连接超时，可增加 DB_CONNECT_TIMEOUT 的值（当前: {settings.DB_CONNECT_TIMEOUT}s）\n"
            f"  3. 网络连接是否正常\n"
            f"  4. 防火墙是否允许连接到数据库端口"
        )
        raise DatabaseException(
            error_msg,
            "DATABASE_INIT_ERROR",
        )


def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话生成器。

    Yields:
        Session: 数据库会话对象。

    Raises:
        RuntimeError: 如果数据库未初始化。
    """
    if SessionLocal is None:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Session:
    """
    获取数据库会话上下文管理器。

    Yields:
        Session: 数据库会话对象。

    Raises:
        RuntimeError: 如果数据库未初始化。
    """
    if SessionLocal is None:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """
    创建所有数据库表。

    Raises:
        RuntimeError: 如果数据库引擎未初始化。
        DatabaseException: 如果表创建失败。
    """
    if engine is None:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")

    try:
        import_all_table_models()
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        raise DatabaseException(
            f"创建数据库表失败: {str(e)}",
            "CREATE_TABLES_ERROR",
        )


def drop_tables() -> None:
    """
    删除所有数据库表。

    Raises:
        RuntimeError: 如果数据库引擎未初始化。
        DatabaseException: 如果表删除失败。
    """
    if engine is None:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")

    try:
        Base.metadata.drop_all(bind=engine)
    except Exception as e:
        raise DatabaseException(
            f"删除数据库表失败: {str(e)}",
            "DROP_TABLES_ERROR",
        )


def check_database_health() -> dict[str, Any]:
    """
    检查数据库健康状态。

    Returns:
        dict[str, Any]: 包含数据库健康信息的字典，包括：
            - status: 状态（"healthy" 或 "unhealthy"）
            - response_time: 响应时间（毫秒）
            - pool_size: 连接池大小
            - checked_in: 已签入连接数
            - checked_out: 已签出连接数
            - overflow: 溢出连接数

    Raises:
        RuntimeError: 如果数据库引擎未初始化。
    """
    if engine is None:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")

    start_time = time.time()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        response_time = (time.time() - start_time) * 1000

        pool = engine.pool
        pool_status = {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
        }
        return pool_status
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "response_time_ms": (time.time() - start_time) * 1000,
        }


def get_table_names() -> list[str]:
    """
    获取数据库中所有表名。

    Returns:
        list[str]: 表名列表。

    Raises:
        RuntimeError: 如果数据库引擎未初始化。
        DatabaseException: 如果获取表名失败。
    """
    if engine is None:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")

    try:
        inspector = inspect(engine)
        return inspector.get_table_names()
    except Exception as e:
        raise DatabaseException(
            f"获取表名失败: {str(e)}",
            "GET_TABLE_NAMES_ERROR",
        )


def table_exists(table_name: str) -> bool:
    """
    检查表是否存在。

    Args:
        table_name (str): 表名。

    Returns:
        bool: 如果表存在返回True，否则返回False。

    Raises:
        RuntimeError: 如果数据库引擎未初始化。
    """
    if engine is None:
        raise RuntimeError("数据库未初始化，请先调用 init_database()")

    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception:
        return False


def close_database() -> None:
    """
    关闭数据库连接。

    释放所有数据库连接和资源。
    """
    global engine, SessionLocal

    if engine is not None:
        engine.dispose()
        engine = None

    SessionLocal = None

