from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String
from sqlalchemy.dialects.postgresql import ARRAY

from config.database import Base


class HsStockRealFive(Base):
    """沪深买卖五档盘口表模型。"""

    __tablename__ = "hs_stock_real_five"

    dm = Column(String(30), primary_key=True, comment="股票代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
    ps = Column(ARRAY(Float), comment="委卖价（五档）")
    pb = Column(ARRAY(Float), comment="委买价（五档）")
    vs = Column(ARRAY(Float), comment="委卖量（五档）")
    vb = Column(ARRAY(Float), comment="委买量（五档）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "沪深买卖五档盘口"},
    )


class KcStockRealFive(Base):
    """科创买卖五档盘口表模型。"""

    __tablename__ = "kc_stock_real_five"

    dm = Column(String(30), primary_key=True, comment="股票代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
    ps = Column(ARRAY(Float), comment="委卖价（五档）")
    pb = Column(ARRAY(Float), comment="委买价（五档）")
    vs = Column(ARRAY(Float), comment="委卖量（五档）")
    vb = Column(ARRAY(Float), comment="委买量（五档）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "科创买卖五档盘口"},
    )


class BjStockRealFive(Base):
    """京市买卖五档盘口表模型。"""

    __tablename__ = "bj_stock_real_five"

    dm = Column(String(30), primary_key=True, comment="股票代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
    ps = Column(ARRAY(Float), comment="委卖价（五档）")
    pb = Column(ARRAY(Float), comment="委买价（五档）")
    vs = Column(ARRAY(Float), comment="委卖量（五档）")
    vb = Column(ARRAY(Float), comment="委买量（五档）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "京市买卖五档盘口"},
    )


class HkStockRealFive(Base):
    """港股买卖五档盘口表模型。"""

    __tablename__ = "hk_stock_real_five"

    dm = Column(String(30), primary_key=True, comment="股票代码")
    t = Column(String(50), primary_key=True, comment="更新时间")
    ps = Column(ARRAY(Float), comment="委卖价（五档）")
    pb = Column(ARRAY(Float), comment="委买价（五档）")
    vs = Column(ARRAY(Float), comment="委卖量（五档）")
    vb = Column(ARRAY(Float), comment="委买量（五档）")
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "t"),
        {"comment": "港股买卖五档盘口"},
    )


