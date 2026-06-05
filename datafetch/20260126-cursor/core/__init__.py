"""
核心模块。

提供基础API类、数据管理器和异常类。
"""

from core.exceptions import (
    FinancialDataPlatformException,
    APIException,
    DatabaseException,
    ConfigurationException,
    ValidationException,
    RateLimitException,
)

__all__ = [
    "FinancialDataPlatformException",
    "APIException",
    "DatabaseException",
    "ConfigurationException",
    "ValidationException",
    "RateLimitException",
]

