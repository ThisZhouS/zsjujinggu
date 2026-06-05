"""
股东明细数据表模型定义。

该模块定义了股东明细相关的数据库表模型，包括：
- 十大股东
- 十大流通股东
- 股东变化趋势
- 基金持股

说明：
- 十大股东/十大流通股东接口返回字段包含 `sdgd`（数组/嵌套对象），本项目将其序列化为JSON字符串存储在 `sdgd_json` 字段中。
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String, Text

from config.database import Base


class ShareholderTop10(Base):
    """十大股东表模型。"""

    __tablename__ = "shareholder_top10"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期yyyy-MM-dd")
    ggrq = Column(String(20), primary_key=True, comment="公告日期yyyy-MM-dd")
    gdsm = Column(Text, comment="股东说明")
    gdzs = Column(Float, comment="股东总数")
    pjcg = Column(Float, comment="平均持股(单位：股，按总股本计算)")
    sdgd_json = Column(Text, comment="十大股东明细（JSON字符串）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq", "ggrq"),
        {"comment": "十大股东表"},
    )


class ShareholderTop10Float(Base):
    """十大流通股东表模型。"""

    __tablename__ = "shareholder_top10_float"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期yyyy-MM-dd")
    ggrq = Column(String(20), primary_key=True, comment="公告日期yyyy-MM-dd")
    sdgd_json = Column(Text, comment="十大流通股东明细（JSON字符串）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq", "ggrq"),
        {"comment": "十大流通股东表"},
    )


class ShareholderChangeTrend(Base):
    """股东变化趋势表模型。"""

    __tablename__ = "shareholder_change_trend"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期yyyy-MM-dd")
    gdhs = Column(String(100), comment="股东户数")
    bh = Column(String(200), comment="比上期变化情况")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq"),
        {"comment": "股东变化趋势表"},
    )


class FundHoldings(Base):
    """基金持股表模型。"""

    __tablename__ = "fund_holdings"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期yyyy-MM-dd")
    jjdm = Column(String(50), primary_key=True, comment="基金代码")
    jjmc = Column(String(500), comment="基金名称")
    ccsl = Column(Float, comment="持仓数量(股)")
    ltbl = Column(Float, comment="占流通股比例(%)")
    cgsz = Column(Float, comment="持股市值（元）")
    jzbl = Column(Float, comment="占净值比例（%）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq", "jjdm"),
        {"comment": "基金持股表"},
    )


