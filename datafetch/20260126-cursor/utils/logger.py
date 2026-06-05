"""
日志工具模块。

该模块提供统一的日志记录功能，支持不同模块的日志分离和文件输出。
"""

import os
import sys
from pathlib import Path
from typing import Optional
from loguru import logger

from config.settings import settings


def setup_logger(
    module_name: str,
    log_dir: Optional[str] = None,
    log_level: Optional[str] = None,
) -> None:
    """
    配置指定模块的日志记录器。

    Args:
        module_name (str): 模块名称，用于日志文件命名和目录结构。
        log_dir (Optional[str]): 日志目录路径，默认为配置中的LOG_DIR。
        log_level (Optional[str]): 日志级别，默认为配置中的LOG_LEVEL。

    API接口: 无
    """
    if log_dir is None:
        log_dir = settings.LOG_DIR

    if log_level is None:
        log_level = settings.LOG_LEVEL

    # 移除默认的日志处理器
    logger.remove()

    # 控制台输出格式
    console_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    # 添加控制台处理器
    logger.add(
        sys.stdout,
        format=console_format,
        level=log_level,
        colorize=True,
    )

    # 构建日志文件路径
    log_path = Path(log_dir) / module_name
    log_path.mkdir(parents=True, exist_ok=True)

    # 文件输出格式
    file_format = (
        "{time:YYYY-MM-DD HH:mm:ss} | "
        "{level: <8} | "
        "{name}:{function}:{line} | "
        "{message}"
    )

    # 添加文件处理器 - 按日期轮转
    log_file = log_path / "{time:YYYY-MM-DD}.log"
    logger.add(
        log_file,
        format=file_format,
        level=log_level,
        rotation="00:00",  # 每天午夜轮转
        retention="30 days",  # 保留30天
        compression="zip",  # 压缩旧日志
        encoding="utf-8",
    )

    # 添加错误日志文件
    error_log_file = log_path / "error_{time:YYYY-MM-DD}.log"
    logger.add(
        error_log_file,
        format=file_format,
        level="ERROR",
        rotation="00:00",
        retention="30 days",
        compression="zip",
        encoding="utf-8",
    )


def get_logger(module_name: str) -> logger:
    """
    获取指定模块的日志记录器。

    Args:
        module_name (str): 模块名称。

    Returns:
        logger: 日志记录器实例。

    API接口: 无
    """
    # 如果日志未配置，先进行配置
    if not logger._core.handlers:
        setup_logger(module_name)

    return logger.bind(name=module_name)

