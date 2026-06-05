"""
沪深指数历史分时技术指标表模型定义。

该模块定义沪深指数历史分时技术指标相关的数据库表模型，包括：
- 历史分时BOLL
- 历史分时KDJ
- 历史分时MA
- 历史分时MACD
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String

from config.database import Base


class IndexHistoryBoll(Base):
    """指数历史分时BOLL表模型。"""

    __tablename__ = "index_history_boll"

    dm = Column(String(20), primary_key=True, comment="指数代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    u = Column(Float, comment="上轨")
    d = Column(Float, comment="下轨")
    m = Column(Float, comment="中轨")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "指数历史分时BOLL"},
    )


class IndexHistoryKdj(Base):
    """指数历史分时KDJ表模型。"""

    __tablename__ = "index_history_kdj"

    dm = Column(String(20), primary_key=True, comment="指数代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    k = Column(Float, comment="K值")
    d = Column(Float, comment="D值")
    j = Column(Float, comment="J值")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "指数历史分时KDJ"},
    )


class IndexHistoryMa(Base):
    """指数历史分时MA表模型。"""

    __tablename__ = "index_history_ma"

    dm = Column(String(20), primary_key=True, comment="指数代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
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
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "指数历史分时MA"},
    )


class IndexHistoryMacd(Base):
    """指数历史分时MACD表模型。"""

    __tablename__ = "index_history_macd"

    dm = Column(String(20), primary_key=True, comment="指数代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    diff = Column(Float, comment="DIFF值")
    dea = Column(Float, comment="DEA值")
    macd = Column(Float, comment="MACD值")
    ema12 = Column(Float, comment="EMA（12）值")
    ema26 = Column(Float, comment="EMA（26）值")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "指数历史分时MACD"},
    )

