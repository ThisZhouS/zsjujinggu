"""
股东基础信息表模型定义。

该模块定义了股东基础信息相关的数据库表模型，包括：
- 公司股东数
- 公司十大股东
- 公司十大流通股东
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, PrimaryKeyConstraint, String

from config.database import Base


class CompanyShareholderCount(Base):
    """公司股东数表模型。"""

    __tablename__ = "company_shareholder_count"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    plrq = Column(String(20), primary_key=True, comment="公告日期")
    jzrq = Column(String(20), primary_key=True, comment="截止日期")
    gdzs = Column(String(50), comment="股东总数")
    agdhs = Column(String(50), comment="A股东户数")
    bgdhs = Column(String(50), comment="B股东户数")
    hgdhs = Column(String(50), comment="H股东户数")
    yltgdhs = Column(String(50), comment="已流通股东户数")
    wltgdhs = Column(String(50), comment="未流通股东户数")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "plrq", "jzrq"),
        {"comment": "公司股东数表"},
    )


class CompanyTopHolders(Base):
    """公司十大股东表模型。"""

    __tablename__ = "company_top_holders"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    plrq = Column(String(20), primary_key=True, comment="公告日期")
    jzrq = Column(String(20), primary_key=True, comment="截止日期")
    gdmc = Column(String(500), comment="股东名称")
    gdlx = Column(String(100), comment="股东类型")
    cgsl = Column(String(100), comment="持股数量")
    bdyy = Column(String(500), comment="变动原因")
    cgbl = Column(String(100), comment="持股比例")
    gfxz = Column(String(200), comment="股份性质")
    cgpm = Column(String(50), comment="持股排名")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "plrq", "jzrq", "cgpm"),
        {"comment": "公司十大股东表"},
    )


class CompanyTopFlowHolders(Base):
    """公司十大流通股东表模型。"""

    __tablename__ = "company_top_flow_holders"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    ggrq = Column(String(20), primary_key=True, comment="公告日期")
    jzrq = Column(String(20), primary_key=True, comment="截止日期")
    gdmc = Column(String(500), comment="股东名称")
    gdlx = Column(String(100), comment="股东类型")
    cgsl = Column(String(100), comment="持股数量")
    bdyy = Column(String(500), comment="变动原因")
    cgbl = Column(String(100), comment="持股比例")
    gfxz = Column(String(200), comment="股份性质")
    cgpm = Column(String(50), comment="持股排名")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "ggrq", "jzrq", "cgpm"),
        {"comment": "公司十大流通股东表"},
    )


