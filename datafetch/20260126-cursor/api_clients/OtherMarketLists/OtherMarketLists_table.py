from datetime import datetime

from sqlalchemy import Column, String, DateTime, PrimaryKeyConstraint

from config.database import Base


class BjIndexList(Base):
    """京市指数列表表模型。"""

    __tablename__ = "bj_index_list"

    dm = Column(String(30), primary_key=True, comment="指数代码，如：899050.BJ")
    mc = Column(String(200), comment="指数名称，如：北证50")
    jys = Column(String(50), comment="交易所")
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "京市指数列表"},
    )


class KcStockList(Base):
    """科创股票列表表模型。"""

    __tablename__ = "kc_stock_list"

    dm = Column(String(30), primary_key=True, comment="股票代码，如：688001.SH")
    mc = Column(String(200), comment="股票名称，如：华兴源创")
    jys = Column(String(50), comment="交易所")
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "科创股票列表"},
    )


class EtfFundList(Base):
    """ETF 基金列表表模型。"""

    __tablename__ = "etf_fund_list"

    dm = Column(String(30), primary_key=True, comment="基金代码，如：159718.SZ")
    mc = Column(String(200), comment="基金名称，如：港股医药ETF")
    jys = Column(String(50), comment='交易所，"sh"表示上证，"sz"表示深证')
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "ETF 基金列表"},
    )


class BjStockList(Base):
    """京市股票列表表模型。"""

    __tablename__ = "bj_stock_list"

    dm = Column(String(30), primary_key=True, comment="股票代码，如：430017.BJ")
    mc = Column(String(200), comment="股票名称，如：星昊医药")
    jys = Column(String(50), comment="交易所")
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "京市股票列表"},
    )


