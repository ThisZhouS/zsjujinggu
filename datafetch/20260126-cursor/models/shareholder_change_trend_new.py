"""
股东变化趋势新表模型定义。

该模块定义了股东变化趋势的新表模型，用于存储每个股票只保留第一条数据。
与 ShareholderChangeTrend 表相比，主键设计不同，只保留每个股票代码的第一条记录。
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text

from config.database import Base


class ShareholderChangeTrendNew(Base):
    """股东变化趋势新表模型（每个股票只保留第一条记录）。"""

    __tablename__ = "shareholder_change_trend_new"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), comment="截止日期yyyy-MM-dd")
    gdhs = Column(String(100), comment="股东户数")
    bh = Column(String(200), comment="比上期变化情况")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        {"comment": "股东变化趋势新表（每个股票只保留第一条记录）"},
    )
