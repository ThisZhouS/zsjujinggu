"""
公司历史数据表模型定义。

该模块定义了公司历史数据相关的数据库表模型，包括：
- 历届监事会成员表
- 历届高管成员表
- 历届董事会成员表
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, PrimaryKeyConstraint

from config.database import Base


class SupervisoryBoardMember(Base):
    """历届监事会成员表模型。"""

    __tablename__ = "supervisory_board_member"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    name = Column(String(100), comment="姓名")
    title = Column(String(200), comment="职务")
    sdate = Column(String(20), primary_key=True, comment="起始日期yyyy-MM-dd")
    edate = Column(String(20), primary_key=True, comment="终止日期yyyy-MM-dd")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "sdate", "edate"),
        {"comment": "历届监事会成员表"},
    )


class ExecutiveMember(Base):
    """历届高管成员表模型。"""

    __tablename__ = "executive_member"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    name = Column(String(100), comment="姓名")
    title = Column(String(200), comment="职务")
    sdate = Column(String(20), primary_key=True, comment="起始日期yyyy-MM-dd")
    edate = Column(String(20), primary_key=True, comment="终止日期yyyy-MM-dd")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "sdate", "edate"),
        {"comment": "历届高管成员表"},
    )


class BoardMember(Base):
    """历届董事会成员表模型。"""

    __tablename__ = "board_member"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    name = Column(String(100), comment="姓名")
    title = Column(String(200), comment="职务")
    sdate = Column(String(20), primary_key=True, comment="起始日期yyyy-MM-dd")
    edate = Column(String(20), primary_key=True, comment="终止日期yyyy-MM-dd")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "sdate", "edate"),
        {"comment": "历届董事会成员表"},
    )

