"""
股票池分类表模型定义。

该模块定义了股票池分类相关的数据库表模型，包括：
- 跌停股池
- 强势股池
- 炸板股池
- 涨停股池
- 次新股池

说明：
- 这些接口均以“日期(yyyy-MM-dd)”作为请求参数，为保证历史数据可存储，表模型主键均包含 `date` 字段。
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String

from config.database import Base


class LimitDownPool(Base):
    """跌停股池表模型。"""

    __tablename__ = "limit_down_pool"

    dm = Column(String(20), primary_key=True, comment="代码")
    date = Column(String(20), primary_key=True, comment="日期参数")
    mc = Column(String(200), comment="名称")
    p = Column(Float, comment="价格（元）")
    zf = Column(Float, comment="跌幅（%）")
    cje = Column(Float, comment="成交额（元）")
    lt = Column(Float, comment="流通市值（元）")
    zsz = Column(Float, comment="总市值（元）")
    pe = Column(Float, comment="动态市盈率")
    hs = Column(Float, comment="换手率（%）")
    lbc = Column(Float, comment="连续跌停次数")
    lbt = Column(String(20), primary_key=True, comment="最后封板时间（HH:mm:ss）")
    zj = Column(Float, comment="封单资金（元）")
    fba = Column(Float, comment="板上成交额（元）")
    zbc = Column(Float, comment="开板次数")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date", "lbt"),
        {"comment": "跌停股池表"},
    )


class StrongPool(Base):
    """强势股池表模型。"""

    __tablename__ = "strong_pool"

    dm = Column(String(20), primary_key=True, comment="代码")
    date = Column(String(20), primary_key=True, comment="日期参数")
    mc = Column(String(200), comment="名称")
    p = Column(Float, comment="价格（元）")
    ztp = Column(Float, comment="涨停价（元）")
    zf = Column(Float, comment="涨幅（%）")
    cje = Column(Float, comment="成交额（元）")
    lt = Column(Float, comment="流通市值（元）")
    zsz = Column(Float, comment="总市值（元）")
    zs = Column(Float, comment="涨速（%）")
    nh = Column(Float, comment="是否新高（0：否，1：是）")
    lb = Column(Float, comment="量比")
    hs = Column(Float, comment="换手率（%）")
    tj = Column(String(50), primary_key=True, comment="涨停统计（x天/y板）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date", "tj"),
        {"comment": "强势股池表"},
    )


class LimitUpBreakPool(Base):
    """炸板股池表模型。"""

    __tablename__ = "limit_up_break_pool"

    dm = Column(String(20), primary_key=True, comment="代码")
    date = Column(String(20), primary_key=True, comment="日期参数")
    mc = Column(String(200), comment="名称")
    p = Column(Float, comment="价格（元）")
    ztp = Column(Float, comment="涨停价（元）")
    zf = Column(Float, comment="涨跌幅（%）")
    cje = Column(Float, comment="成交额（元）")
    lt = Column(Float, comment="流通市值（元）")
    zsz = Column(Float, comment="总市值（元）")
    zs = Column(Float, comment="涨速（%）")
    hs = Column(Float, comment="转手率（%）")
    tj = Column(String(50), comment="涨停统计（x天/y板）")
    fbt = Column(String(20), primary_key=True, comment="首次封板时间（HH:mm:ss）")
    zbc = Column(Float, comment="炸板次数")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date", "fbt"),
        {"comment": "炸板股池表"},
    )


class LimitUpPool(Base):
    """涨停股池表模型。"""

    __tablename__ = "limit_up_pool"

    dm = Column(String(20), primary_key=True, comment="代码")
    date = Column(String(20), primary_key=True, comment="日期参数")
    mc = Column(String(200), comment="名称")
    p = Column(Float, comment="价格（元）")
    zf = Column(Float, comment="涨幅（%）")
    cje = Column(Float, comment="成交额（元）")
    lt = Column(Float, comment="流通市值（元）")
    zsz = Column(Float, comment="总市值（元）")
    hs = Column(Float, comment="换手率（%）")
    lbc = Column(Float, comment="连板数")
    fbt = Column(String(20), primary_key=True, comment="首次封板时间（HH:mm:ss）")
    lbt = Column(String(20), primary_key=True, comment="最后封板时间（HH:mm:ss）")
    zj = Column(Float, comment="封板资金（元）")
    zbc = Column(Float, comment="炸板次数")
    tj = Column(String(50), comment="涨停统计（x天/y板）")
    hy = Column(String(200), comment="所属行业")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date", "fbt", "lbt"),
        {"comment": "涨停股池表"},
    )


class SubNewPool(Base):
    """次新股池表模型。"""

    __tablename__ = "sub_new_pool"

    dm = Column(String(20), primary_key=True, comment="代码")
    date = Column(String(20), primary_key=True, comment="日期参数")
    mc = Column(String(200), comment="名称")
    p = Column(Float, comment="价格（元）")
    ztp = Column(Float, comment="涨停价（元，无涨停价为null）")
    zf = Column(Float, comment="涨跌幅（%）")
    cje = Column(Float, comment="成交额（元）")
    lt = Column(Float, comment="流通市值（元）")
    zsz = Column(Float, comment="总市值（元）")
    nh = Column(Float, comment="是否新高（0：否，1：是）")
    hs = Column(Float, comment="转手率（%）")
    tj = Column(String(50), comment="涨停统计（x天/y板）")
    kb = Column(Float, comment="开板几日")
    od = Column(String(20), primary_key=True, comment="开板日期（yyyyMMdd）")
    ipod = Column(String(20), primary_key=True, comment="上市日期（yyyyMMdd）")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date", "od", "ipod"),
        {"comment": "次新股池表"},
    )


