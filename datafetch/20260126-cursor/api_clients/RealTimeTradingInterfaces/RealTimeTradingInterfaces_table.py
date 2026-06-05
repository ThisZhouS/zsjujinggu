"""
实时交易接口表模型定义。

该模块定义了实时交易相关的数据库表模型，包括：
- 实时交易数据（券商数据源）
- 实时交易数据（多股）
- 实时交易数据（全部 券商数据源）
- 实时交易数据（网络数据源）
- 实时交易数据（全部 网络数据源）
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String

from config.database import Base


class RealTimeTradingBroker(Base):
    """实时交易数据（券商数据源）表模型。"""

    __tablename__ = "realtime_trading_broker"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    p = Column(Float, comment="最新价")
    o = Column(Float, comment="开盘价")
    h = Column(Float, comment="最高价")
    l = Column(Float, comment="最低价")
    yc = Column(Float, comment="前收盘价")
    cje = Column(Float, comment="成交总额")
    v = Column(Float, comment="成交总量")
    pv = Column(Float, comment="原始成交总量")
    ud = Column(Float, comment="涨跌额")
    pc = Column(Float, comment="涨跌幅")
    zf = Column(Float, comment="振幅")
    t = Column(String(30), primary_key=True, comment="更新时间")
    pe = Column(Float, comment="市盈率")
    tr = Column(Float, comment="换手率")
    pb_ratio = Column(Float, comment="市净率")
    tv = Column(Float, comment="成交量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "实时交易数据（券商数据源）表"},
    )


class RealTimeTradingMultiStock(Base):
    """实时交易数据（多股）表模型。"""

    __tablename__ = "realtime_trading_multi_stock"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    p = Column(Float, comment="最新价")
    o = Column(Float, comment="开盘价")
    h = Column(Float, comment="最高价")
    l = Column(Float, comment="最低价")
    yc = Column(Float, comment="前收盘价")
    cje = Column(Float, comment="成交总额")
    v = Column(Float, comment="成交总量")
    pv = Column(Float, comment="原始成交总量")
    ud = Column(Float, comment="涨跌额")
    pc = Column(Float, comment="涨跌幅")
    zf = Column(Float, comment="振幅")
    t = Column(String(30), primary_key=True, comment="更新时间")
    pe = Column(Float, comment="市盈率")
    tr = Column(Float, comment="换手率")
    pb_ratio = Column(Float, comment="市净率")
    tv = Column(Float, comment="成交量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "实时交易数据（多股）表"},
    )


class RealTimeTradingAllBroker(Base):
    """实时交易数据（全部 券商数据源）表模型。"""

    __tablename__ = "realtime_trading_all_broker"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    p = Column(Float, comment="最新价")
    o = Column(Float, comment="开盘价")
    h = Column(Float, comment="最高价")
    l = Column(Float, comment="最低价")
    yc = Column(Float, comment="前收盘价")
    cje = Column(Float, comment="成交总额")
    v = Column(Float, comment="成交总量")
    pv = Column(Float, comment="原始成交总量")
    ud = Column(Float, comment="涨跌额")
    pc = Column(Float, comment="涨跌幅")
    zf = Column(Float, comment="振幅")
    t = Column(String(30), primary_key=True, comment="更新时间")
    pe = Column(Float, comment="市盈率")
    tr = Column(Float, comment="换手率")
    pb_ratio = Column(Float, comment="市净率")
    tv = Column(Float, comment="成交量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "实时交易数据（全部 券商数据源）表"},
    )


class RealTimeTradingNetwork(Base):
    """实时交易数据（网络数据源）表模型。"""

    __tablename__ = "realtime_trading_network"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    fm = Column(Float, comment="五分钟涨跌幅（%）")
    h = Column(Float, comment="最高价（元）")
    hs = Column(Float, comment="换手（%）")
    lb = Column(Float, comment="量比（%）")
    l = Column(Float, comment="最低价（元）")
    lt = Column(Float, comment="流通市值（元）")
    o = Column(Float, comment="开盘价（元）")
    pe = Column(Float, comment="市盈率（动态）")
    pc = Column(Float, comment="涨跌幅（%）")
    p = Column(Float, comment="当前价格（元）")
    sz = Column(Float, comment="总市值（元）")
    cje = Column(Float, comment="成交额（元）")
    ud = Column(Float, comment="涨跌额（元）")
    v = Column(Float, comment="成交量（手）")
    yc = Column(Float, comment="昨日收盘价（元）")
    zf = Column(Float, comment="振幅（%）")
    zs = Column(Float, comment="涨速（%）")
    sjl = Column(Float, comment="市净率")
    zdf60 = Column(Float, comment="60日涨跌幅（%）")
    zdfnc = Column(Float, comment="年初至今涨跌幅（%）")
    t = Column(String(30), primary_key=True, comment="更新时间yyyy-MM-ddHH:mm:ss")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "实时交易数据（网络数据源）表"},
    )


class RealTimeTradingAllNetwork(Base):
    """实时交易数据（全部 网络数据源）表模型。"""

    __tablename__ = "realtime_trading_all_network"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    fm = Column(Float, comment="五分钟涨跌幅（%）")
    h = Column(Float, comment="最高价（元）")
    hs = Column(Float, comment="换手（%）")
    lb = Column(Float, comment="量比（%）")
    l = Column(Float, comment="最低价（元）")
    lt = Column(Float, comment="流通市值（元）")
    o = Column(Float, comment="开盘价（元）")
    pe = Column(Float, comment="市盈率（动态）")
    pc = Column(Float, comment="涨跌幅（%）")
    p = Column(Float, comment="当前价格（元）")
    sz = Column(Float, comment="总市值（元）")
    cje = Column(Float, comment="成交额（元）")
    ud = Column(Float, comment="涨跌额（元）")
    v = Column(Float, comment="成交量（手）")
    yc = Column(Float, comment="昨日收盘价（元）")
    zf = Column(Float, comment="振幅（%）")
    zs = Column(Float, comment="涨速（%）")
    sjl = Column(Float, comment="市净率")
    zdf60 = Column(Float, comment="60日涨跌幅（%）")
    zdfnc = Column(Float, comment="年初至今涨跌幅（%）")
    t = Column(String(30), primary_key=True, comment="更新时间yyyy-MM-ddHH:mm:ss")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "实时交易数据（全部 网络数据源）表"},
    )


