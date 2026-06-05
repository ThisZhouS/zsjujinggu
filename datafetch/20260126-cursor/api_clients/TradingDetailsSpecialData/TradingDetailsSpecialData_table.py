"""
交易明细-特殊数据表模型定义。

该模块定义交易明细特殊数据相关的数据库表模型，包括：
- 资金流向数据（hsstock/history/transaction）
- 当天逐笔交易（hsrl/zbjy）
- 历史涨跌停价格（hsstock/stopprice/history）
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Float,
    Integer,
    PrimaryKeyConstraint,
    String,
)

from config.database import Base


class StockMoneyFlow(Base):
    """资金流向数据表模型。"""

    __tablename__ = "hs_stock_money_flow"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(BigInteger, primary_key=True, comment="交易时间")

    zmbzds = Column(Integer, comment="主买单总单数")
    zmszds = Column(Integer, comment="主卖单总单数")
    dddx = Column(Float, comment="大单动向")
    zddy = Column(Float, comment="涨跌动因")
    ddcf = Column(Float, comment="大单差分")
    zmbzdszl = Column(Integer, comment="主买单总单数增量")
    zmszdszl = Column(Integer, comment="主卖单总单数增量")
    cjbszl = Column(Integer, comment="成交笔数增量")
    zmbtdcje = Column(Float, comment="主买特大单成交额")
    zmbddcje = Column(Float, comment="主买大单成交额")
    zmbzdcje = Column(Float, comment="主买中单成交额")
    zmbxdcje = Column(Float, comment="主买小单成交额")
    zmbljcje = Column(Float, comment="主买累计成交额")
    zmstdcje = Column(Float, comment="主卖特大单成交额")
    zmsddcje = Column(Float, comment="主卖大单成交额")
    zmszdcje = Column(Float, comment="主卖中单成交额")
    zmsxdcje = Column(Float, comment="主卖小单成交额")
    zmsljcje = Column(Float, comment="主卖累计成交额")
    bdmbtdcje = Column(Float, comment="被动买特大单成交额")
    bdmbddcje = Column(Float, comment="被动买大单成交额")
    bdmbzdcje = Column(Float, comment="被动买中单成交额")
    bdmbxdcje = Column(Float, comment="被动买小单成交额")
    bdmbljcje = Column(Float, comment="被动买累计成交额")
    bdmstdcje = Column(Float, comment="被动卖特大单成交额")
    bdmsddcje = Column(Float, comment="被动卖大单成交额")
    bdmszdcje = Column(Float, comment="被动卖中单成交额")
    bdmsxdcje = Column(Float, comment="被动卖小单成交额")
    bdmsljcje = Column(Float, comment="被动卖累计成交额")
    jlrcdcje = Column(Float, comment="净流入超大单成交额")
    jlrddcje = Column(Float, comment="净流入大单成交额")
    jlrzdcje = Column(Float, comment="净流入中单成交额")
    jlrxdcje = Column(Float, comment="净流入小单成交额")
    zmbtdcjl = Column(Integer, comment="主买特大单成交量")
    zmbddcjl = Column(Integer, comment="主买大单成交量")
    zmbzdcjl = Column(Integer, comment="主买中单成交量")
    zmbxdcjl = Column(Integer, comment="主买小单成交量")
    zmbljcjl = Column(Integer, comment="主买累计成交量")
    zmstdcjl = Column(Integer, comment="主卖特大单成交量")
    zmsddcjl = Column(Integer, comment="主卖大单成交量")
    zmszdcjl = Column(Integer, comment="主卖中单成交量")
    zmsxdcjl = Column(Integer, comment="主卖小单成交量")
    zmsljcjl = Column(Integer, comment="主卖累计成交量")
    bdmbtdcjl = Column(Integer, comment="被动买特大单成交量")
    bdmbddcjl = Column(Integer, comment="被动买大单成交量")
    bdmbzdcjl = Column(Integer, comment="被动买中单成交量")
    bdmbxdcjl = Column(Integer, comment="被动买小单成交量")
    bdmbljcjl = Column(Integer, comment="被动买累计成交量")
    bdmstdcjl = Column(Integer, comment="被动卖特大单成交量")
    bdmsddcjl = Column(Integer, comment="被动卖大单成交量")
    bdmszdcjl = Column(Integer, comment="被动卖中单成交量")
    bdmsxdcjl = Column(Integer, comment="被动卖小单成交量")
    bdmsljcjl = Column(Integer, comment="被动卖累计成交量")
    jlrcdcjl = Column(Integer, comment="净流入超大单成交量")
    jlrddcjl = Column(Integer, comment="净流入大单成交量")
    jlrzdcjl = Column(Integer, comment="净流入中单成交量")
    jlrxdcjl = Column(Integer, comment="净流入小单成交量")
    zmbtdcjzl = Column(Float, comment="主买特大单成交额增量")
    zmbddcjzl = Column(Float, comment="主买大单成交额增量")
    zmbzdcjzl = Column(Float, comment="主买中单成交额增量")
    zmbxdcjzl = Column(Float, comment="主买小单成交额增量")
    zmbljcjzl = Column(Float, comment="主买累计成交额增量")
    zmstdcjzl = Column(Float, comment="主卖特大单成交额增量")
    zmsddcjzl = Column(Float, comment="主卖大单成交额增量")
    zmszdcjzl = Column(Float, comment="主卖中单成交额增量")
    zmsxdcjzl = Column(Float, comment="主卖小单成交额增量")
    zmsljcjzl = Column(Float, comment="主卖累计成交额增量")
    bdmbtdcjzl = Column(Float, comment="被动买特大单成交额增量")
    bdmbddcjzl = Column(Float, comment="被动买大单成交额增量")
    bdmbzdcjzl = Column(Float, comment="被动买中单成交额增量")
    bdmbxdcjzl = Column(Float, comment="被动买小单成交额增量")
    bdmbljcjzl = Column(Float, comment="被动买累计成交额增量")
    bdmstdcjzl = Column(Float, comment="被动卖特大单成交额增量")
    bdmsddcjzl = Column(Float, comment="被动卖大单成交额增量")
    bdmszdcjzl = Column(Float, comment="被动卖中单成交额增量")
    bdmsxdcjzl = Column(Float, comment="被动卖小单成交额增量")
    bdmsljcjzl = Column(Float, comment="被动卖累计成交额增量")
    jlrcdcjzl = Column(Float, comment="净流入超大单成交额增量")
    jlrddcjzl = Column(Float, comment="净流入大单成交额增量")
    jlrzdcjzl = Column(Float, comment="净流入中单成交额增量")
    jlrxdcjzl = Column(Float, comment="净流入小单成交额增量")
    zmbtdcjzlv = Column(Integer, comment="主买特大单成交量增量")
    zmbddcjzlv = Column(Integer, comment="主买大单成交量增量")
    zmbzdcjzlv = Column(Integer, comment="主买中单成交量增量")
    zmbxdcjzlv = Column(Integer, comment="主买小单成交量增量")
    zmbljcjzlv = Column(Integer, comment="主买累计成交量增量")
    zmstdcjzlv = Column(Integer, comment="主卖特大单成交量增量")
    zmsddcjzlv = Column(Integer, comment="主卖大单成交量增量")
    zmszdcjzlv = Column(Integer, comment="主卖中单成交量增量")
    zmsxdcjzlv = Column(Integer, comment="主卖小单成交量增量")
    zmsljcjzlv = Column(Integer, comment="主卖累计成交量增量")
    bdmbtdcjzlv = Column(Integer, comment="被动买特大单成交量增量")
    bdmbddcjzlv = Column(Integer, comment="被动买大单成交量增量")
    bdmbzdcjzlv = Column(Integer, comment="被动买中单成交量增量")
    bdmbxdcjzlv = Column(Integer, comment="被动买小单成交量增量")
    bdmbljcjzlv = Column(Integer, comment="被动买累计成交量增量")
    bdmstdcjzlv = Column(Integer, comment="被动卖特大单成交量增量")
    bdmsddcjzlv = Column(Integer, comment="被动卖大单成交量增量")
    bdmszdcjzlv = Column(Integer, comment="被动卖中单成交量增量")
    bdmsxdcjzlv = Column(Integer, comment="被动卖小单成交量增量")
    bdmsljcjzlv = Column(Integer, comment="被动卖累计成交量增量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "资金流向数据"},
    )


class TodayTickTrade(Base):
    """当天逐笔交易表模型。"""

    __tablename__ = "hs_stock_today_tick_trade"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    d = Column(String(20), primary_key=True, comment="数据归属日期（yyyy-MM-dd）")
    t = Column(String(20), primary_key=True, comment="时间（HH:mm:ss）")
    v = Column(BigInteger, comment="成交量（股）")
    p = Column(Float, comment="成交价")
    ts = Column(Integer, comment="交易方向（0：中性盘，1：买入，2：卖出）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "d", "t"),
        {"comment": "当天逐笔交易"},
    )


class StopPriceHistory(Base):
    """历史涨跌停价格表模型。"""

    __tablename__ = "hs_stock_stopprice_history"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(String(20), primary_key=True, comment="交易日期")
    h = Column(Float, comment="涨停价格")
    l = Column(Float, comment="跌停价格")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "历史涨跌停价格"},
    )

