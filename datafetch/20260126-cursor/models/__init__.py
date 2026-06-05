"""
模型模块，集中管理所有数据模型。
包括API客户端的表模型和业务相关的表模型。
"""
from config.database import Base
from .shareholder_change_trend_new import ShareholderChangeTrendNew

__all__ = ["Base", "ShareholderChangeTrendNew"]
