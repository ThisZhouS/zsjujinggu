"""
历史分时交易数据表模型定义。

该模块定义历史/最新分时交易相关的数据库表模型，包括：
- HS 指数历史分时交易（hsindex/history）
- HS 指数最新分时交易（hsindex/latest）
- HS 股票最新分时交易（hsstock/latest）
- HK（文档所述）股票历史分时交易（hsstock/history）
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, PrimaryKeyConstraint, String

from config.database import Base


class HsIndexHistoryTrading(Base):
    """HS 指数历史分时交易表模型。"""

    __tablename__ = "hs_index_history_trading"

    dm = Column(String(20), primary_key=True, comment="指数代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    o = Column(Float, comment="开盘价")
    h = Column(Float, comment="最高价")
    l = Column(Float, comment="最低价")
    c = Column(Float, comment="收盘价")
    v = Column(Float, comment="成交量")
    a = Column(Float, comment="成交额")
    pc = Column(Float, comment="前收盘价")
    st = Column(String(20), comment="开始时间")
    et = Column(String(20), comment="结束时间")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "HS指数历史分时交易"},
    )


class HsIndexLatestTrading(Base):
    """HS 指数最新分时交易表模型。"""

    __tablename__ = "hs_index_latest_trading"

    dm = Column(String(20), primary_key=True, comment="指数代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    o = Column(Float, comment="开盘价")
    h = Column(Float, comment="最高价")
    l = Column(Float, comment="最低价")
    c = Column(Float, comment="收盘价")
    v = Column(Float, comment="成交量")
    a = Column(Float, comment="成交额")
    pc = Column(Float, comment="前收盘价")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "HS指数最新分时交易"},
    )


class HsStockLatestTrading(Base):
    """HS 股票最新分时交易表模型。"""

    __tablename__ = "hs_stock_latest_trading"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    model = Column(String(10), comment="除权方式")
    o = Column(Float, comment="开盘价")
    h = Column(Float, comment="最高价")
    l = Column(Float, comment="最低价")
    c = Column(Float, comment="收盘价")
    v = Column(Float, comment="成交量")
    a = Column(Float, comment="成交额")
    pc = Column(Float, comment="前收盘价")
    sf = Column(Integer, comment="停牌 1停牌，0不停牌")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "HS股票最新分时交易"},
    )


class HsStockHistoryTrading(Base):
    """HS（文档所述）股票历史分时交易表模型。"""

    __tablename__ = "hs_stock_history_trading"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    t = Column(String(25), primary_key=True, comment="交易时间")
    model = Column(String(10), primary_key=True, comment="除权方式")
    o = Column(Float, comment="开盘价")
    h = Column(Float, comment="最高价")
    l = Column(Float, comment="最低价")
    c = Column(Float, comment="收盘价")
    v = Column(Float, comment="成交量")
    a = Column(Float, comment="成交额")
    pc = Column(Float, comment="前收盘价")
    sf = Column(Integer, comment="停牌 1停牌，0不停牌")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t", "model"),
        {"comment": "HS股票历史分时交易"},
    )

