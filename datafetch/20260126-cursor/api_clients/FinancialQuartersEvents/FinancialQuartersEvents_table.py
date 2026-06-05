"""
财务季度事件表模型定义。

该模块定义了财务季度事件相关的数据库表模型，包括：
- 近年分红表
- 近年增发表
- 近一年各季度利润表
- 近一年各季度现金流表
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, PrimaryKeyConstraint

from config.database import Base


class RecentDividend(Base):
    """近年分红表模型。"""

    __tablename__ = "recent_dividend"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    sdate = Column(String(20), primary_key=True, comment="公告日期yyyy-MM-dd")
    give = Column(String(50), comment="每10股送股(单位：股)")
    change = Column(String(50), comment="每10股转增(单位：股)")
    send = Column(String(50), comment="每10股派息(税前，单位：元)")
    line = Column(String(100), comment="进度")
    cdate = Column(String(20), comment="除权除息日yyyy-MM-dd")
    edate = Column(String(20), comment="股权登记日yyyy-MM-dd")
    hdate = Column(String(20), comment="红股上市日yyyy-MM-dd")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "sdate"),
        {"comment": "近年分红表"},
    )


class RecentAdditionalIssue(Base):
    """近年增发表模型。"""

    __tablename__ = "recent_additional_issue"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    sdate = Column(String(20), primary_key=True, comment="公告日期yyyy-MM-dd")
    type = Column(String(100), comment="发行方式")
    price = Column(String(50), comment="发行价格")
    tprice = Column(String(50), comment="实际公司募集资金总额")
    fprice = Column(String(50), comment="发行费用总额")
    amount = Column(String(50), comment="实际发行数量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "sdate"),
        {"comment": "近年增发表"},
    )


class QuarterlyProfit(Base):
    """近一年各季度利润表模型。"""

    __tablename__ = "quarterly_profit"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    date = Column(String(20), primary_key=True, comment="截止日期yyyy-MM-dd")
    income = Column(String(50), comment="营业收入（万元）")
    expend = Column(String(50), comment="营业支出（万元）")
    profit = Column(String(50), comment="营业利润（万元）")
    totalp = Column(String(50), comment="利润总额（万元）")
    reprofit = Column(String(50), comment="净利润（万元）")
    basege = Column(String(50), comment="基本每股收益(元/股)")
    ettege = Column(String(50), comment="稀释每股收益(元/股)")
    otherp = Column(String(50), comment="其他综合收益（万元）")
    totalcp = Column(String(50), comment="综合收益总额（万元）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date"),
        {"comment": "近一年各季度利润表"},
    )


class QuarterlyCashFlow(Base):
    """近一年各季度现金流表模型。"""

    __tablename__ = "quarterly_cash_flow"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    date = Column(String(20), primary_key=True, comment="截止日期yyyy-MM-dd")
    jyin = Column(String(50), comment="经营活动现金流入小计（万元）")
    jyout = Column(String(50), comment="经营活动现金流出小计（万元）")
    jyfinal = Column(String(50), comment="经营活动产生的现金流量净额（万元）")
    tzin = Column(String(50), comment="投资活动现金流入小计（万元）")
    tzout = Column(String(50), comment="投资活动现金流出小计（万元）")
    tzfinal = Column(String(50), comment="投资活动产生的现金流量净额（万元）")
    czin = Column(String(50), comment="筹资活动现金流入小计（万元）")
    czout = Column(String(50), comment="筹资活动现金流出小计（万元）")
    czfinal = Column(String(50), comment="筹资活动产生的现金流量净额（万元）")
    hl = Column(String(50), comment="汇率变动对现金及现金等价物的影响（万元）")
    cashinc = Column(String(50), comment="现金及现金等价物净增加额（万元）")
    cashs = Column(String(50), comment="期初现金及现金等价物余额（万元）")
    cashe = Column(String(50), comment="期末现金及现金等价物余额（万元）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date"),
        {"comment": "近一年各季度现金流表"},
    )

