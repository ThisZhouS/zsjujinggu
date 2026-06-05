"""
指数/行情技术指标表模型定义。

该模块定义了指数/行情技术指标相关的数据库表模型，包括：
- 历史分时 BOLL
- 历史分时 KDJ
- 历史分时 MA
- 历史分时 MACD
- 行情指标
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String

from config.database import Base


class HistoryBoll(Base):
    """历史分时BOLL表模型。"""

    __tablename__ = "history_boll"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    model = Column(String(10), primary_key=True, comment="除权方式")
    u = Column(Float, comment="上轨")
    d = Column(Float, comment="下轨")
    m = Column(Float, comment="中轨")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t", "model"),
        {"comment": "历史分时BOLL"},
    )


class HistoryKdj(Base):
    """历史分时KDJ表模型。"""

    __tablename__ = "history_kdj"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    model = Column(String(10), primary_key=True, comment="除权方式")
    k = Column(Float, comment="K值")
    d = Column(Float, comment="D值")
    j = Column(Float, comment="J值")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t", "model"),
        {"comment": "历史分时KDJ"},
    )


class HistoryMa(Base):
    """历史分时MA表模型。"""

    __tablename__ = "history_ma"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    model = Column(String(10), primary_key=True, comment="除权方式")
    ma3 = Column(Float, comment="MA3，没有则为null")
    ma5 = Column(Float, comment="MA5，没有则为null")
    ma10 = Column(Float, comment="MA10，没有则为null")
    ma15 = Column(Float, comment="MA15，没有则为null")
    ma20 = Column(Float, comment="MA20，没有则为null")
    ma30 = Column(Float, comment="MA30，没有则为null")
    ma60 = Column(Float, comment="MA60，没有则为null")
    ma120 = Column(Float, comment="MA120，没有则为null")
    ma200 = Column(Float, comment="MA200，没有则为null")
    ma250 = Column(Float, comment="MA250，没有则为null")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t", "model"),
        {"comment": "历史分时MA"},
    )


class HistoryMacd(Base):
    """历史分时MACD表模型。"""

    __tablename__ = "history_macd"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    model = Column(String(10), primary_key=True, comment="除权方式")
    diff = Column(Float, comment="DIFF值")
    dea = Column(Float, comment="DEA值")
    macd = Column(Float, comment="MACD值")
    ema12 = Column(Float, comment="EMA（12）值")
    ema26 = Column(Float, comment="EMA（26）值")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t", "model"),
        {"comment": "历史分时MACD"},
    )


class MarketIndicators(Base):
    """行情指标表模型。"""

    __tablename__ = "market_indicators"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    time = Column(String(25), primary_key=True, comment="更新时间")
    lb = Column(Float, comment="量比")
    om = Column(Float, comment="1分钟涨速(%)")
    fm = Column(Float, comment="5分钟涨速(%)")
    d3 = Column("3d", Float, comment="3日涨幅(%)")
    d5 = Column("5d", Float, comment="5日涨幅(%)")
    d10 = Column("10d", Float, comment="10日涨幅(%)")
    t3 = Column("3t", Float, comment="3日换手(%)")
    t5 = Column("5t", Float, comment="5日换手(%)")
    t10 = Column("10t", Float, comment="10日换手(%)")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "time"),
        {"comment": "行情指标"},
    )

