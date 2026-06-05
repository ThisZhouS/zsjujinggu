"""
应用配置文件。

该模块负责加载和管理应用的所有配置项，包括数据库配置、API配置等。
配置项优先从环境变量读取，其次从.env文件读取。
"""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from sqlalchemy.engine import URL

def _load_env_file() -> None:
    """
    加载 .env 文件（兼容 Windows 下常见的 UTF-8/GBK 编码）。

    API接口: 无
    """
    project_root = Path(__file__).resolve().parent.parent

    # 优先加载 UTF-8 版本（便于在 Windows 上通过另存/转换解决编码问题）
    candidates = [
        project_root / ".env.utf8",
        project_root / ".env.local",
        project_root / ".env",
    ]

    for env_path in candidates:
        if not env_path.exists():
            continue

        try:
            load_dotenv(dotenv_path=env_path, encoding="utf-8", override=True)
            return
        except UnicodeDecodeError:
            # 某些环境下 .env 可能是 GBK/ANSI 编码
            load_dotenv(dotenv_path=env_path, encoding="gbk", override=True)
            return


# 加载.env文件
_load_env_file()


class Settings:
    """应用配置类。"""

    # 数据库配置
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "financial_data")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_CLIENT_ENCODING: str = os.getenv("DB_CLIENT_ENCODING", "UTF8")

    # 数据库连接池配置
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))  # 1小时
    DB_ECHO: bool = os.getenv("DB_ECHO", "False").lower() == "true"
    DB_CONNECT_TIMEOUT: int = int(os.getenv("DB_CONNECT_TIMEOUT", "30"))  # 默认30秒

    # API配置
    API_LICENSE: Optional[str] = os.getenv("API_LICENSE", None)
    API_REQUEST_RATE_LIMIT: int = int(os.getenv("API_REQUEST_RATE_LIMIT", "60"))  # 每分钟请求次数

    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR: str = os.getenv("LOG_DIR", "log")

    # 项目配置
    PROJECT_NAME: str = "Financial Data Platform"
    PROJECT_VERSION: str = "1.0.0"

    def __init__(self) -> None:
        """
        初始化配置，验证并修正无效的配置值。

        API接口: 无
        """
        # 修正无效的本地回环地址
        if self.DB_HOST == "127.0.0.0":
            self.DB_HOST = "127.0.0.1"

    @property
    def database_url(self) -> str:
        """
        获取数据库连接URL。

        Returns:
            str: PostgreSQL数据库连接URL。
        """
        url = URL.create(
            drivername="postgresql+psycopg",
            username=self.DB_USER,
            password=self.DB_PASSWORD,
            host=self.DB_HOST,
            port=self.DB_PORT,
            database=self.DB_NAME,
        )
        return url.render_as_string(hide_password=False)

    @property
    def database_url_without_db(self) -> str:
        """
        获取不包含数据库名的连接URL（用于创建数据库）。

        Returns:
            str: PostgreSQL数据库连接URL（不包含数据库名）。
        """
        url = URL.create(
            drivername="postgresql+psycopg",
            username=self.DB_USER,
            password=self.DB_PASSWORD,
            host=self.DB_HOST,
            port=self.DB_PORT,
            database="postgres",
        )
        return url.render_as_string(hide_password=False)


# 全局配置实例
settings = Settings()

