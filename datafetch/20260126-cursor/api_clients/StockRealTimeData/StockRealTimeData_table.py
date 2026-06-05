from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String

from config.database import Base


class KcStockRealTimeData(Base):
    """科创股票实时数据表模型。"""

    __tablename__ = "kc_stock_real_time_data"

    dm = Column(String(30), primary_key=True, comment="股票代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
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
    pe = Column(Float, comment="市盈率")
    tr = Column(Float, comment="换手率")
    pb_ratio = Column(Float, comment="市净率")
    tv = Column(Float, comment="成交量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "科创股票实时数据"},
    )


class HsIndexRealTimeData(Base):
    """实时交易数据（沪深指数）表模型。"""

    __tablename__ = "hs_index_real_time_data"

    dm = Column(String(30), primary_key=True, comment="指数代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
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
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "实时交易数据（沪深指数）"},
    )


class HfFundRealTimeData(Base):
    """实时数据（沪深基金）表模型。"""

    __tablename__ = "hf_fund_real_time_data"

    dm = Column(String(30), primary_key=True, comment="基金代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
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
    pe = Column(Float, comment="市盈率")
    tr = Column(Float, comment="换手率")
    pb_ratio = Column(Float, comment="市净率")
    tv = Column(Float, comment="成交量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "实时数据（沪深基金）"},
    )


class HkStockRealTimeData(Base):
    """香港股票实时数据表模型。"""

    __tablename__ = "hk_stock_real_time_data"

    dm = Column(String(30), primary_key=True, comment="股票代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
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
    pe = Column(Float, comment="市盈率")
    tr = Column(Float, comment="换手率")
    pb_ratio = Column(Float, comment="市净率")
    tv = Column(Float, comment="成交量")
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "香港股票实时数据"},
    )


class BjStockRealTimeData(Base):
    """京市股票实时数据表模型。"""

    __tablename__ = "bj_stock_real_time_data"

    dm = Column(String(30), primary_key=True, comment="股票代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
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
    pe = Column(Float, comment="市盈率")
    tr = Column(Float, comment="换手率")
    pb_ratio = Column(Float, comment="市净率")
    tv = Column(Float, comment="成交量")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "京市股票实时数据"},
    )


