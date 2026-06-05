from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, PrimaryKeyConstraint

from config.database import Base


class StockList(Base):
    """股票列表表模型。"""

    __tablename__ = "stock_list"

    dm = Column(String(20), primary_key=True, comment="股票代码，如：000001")
    mc = Column(String(200), comment="股票名称，如：平安银行")
    jys = Column(String(10), comment='交易所，\"sh\"表示上证，\"sz\"表示深证')
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "股票列表"},
    )


class HsFundList(Base):
    """沪深基金列表表模型。"""

    __tablename__ = "hs_fund_list"

    dm = Column(String(30), primary_key=True, comment="基金代码，如：159001.SZ")
    mc = Column(String(200), comment="基金名称，如：货币ETF")
    jys = Column(String(10), comment='交易所，\"sh\"表示上证，\"sz\"表示深证')
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "沪深基金列表"},
    )


class HsMainIndexList(Base):
    """沪深主要指数列表表模型。"""

    __tablename__ = "hs_main_index_list"

    dm = Column(String(30), primary_key=True, comment="指数代码，如：000001.SH")
    mc = Column(String(200), comment="指数名称，如：上证指数")
    jys = Column(String(10), comment='交易所，\"sh\"表示上证，\"sz\"表示深证')
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "沪深主要指数列表"},
    )


class NewStockCalendar(Base):
    """新股日历表模型。"""

    __tablename__ = "new_stock_calendar"

    zqdm = Column(String(30), primary_key=True, comment="股票代码")
    zqjc = Column(String(200), comment="股票简称")
    sgdm = Column(String(30), comment="申购代码")
    fxsl = Column(Float, comment="发行总数（股）")
    swfxsl = Column(Float, comment="网上发行（股）")
    sgsx = Column(Float, comment="申购上限（股）")
    dgsz = Column(Float, comment="顶格申购需配市值(元)")
    sgrq = Column(String(20), comment="申购日期")
    fxjg = Column(Float, comment="发行价格（元），null为\"未知\"")
    zxj = Column(Float, comment="最新价（元），null为\"未知\"")
    srspj = Column(Float, comment="首日收盘价（元），null为\"未知\"")
    zqgbrq = Column(String(20), comment="中签号公布日，null为未知")
    zqjkrq = Column(String(20), comment="中签缴款日，null为未知")
    ssrq = Column(String(20), comment="上市日期，null为未知")
    syl = Column(Float, comment="发行市盈率，null为\"未知\"")
    hysyl = Column(Float, comment="行业市盈率")
    wszql = Column(Float, comment="中签率（%），null为\"未知\"")
    yzbsl = Column(Float, comment="连续一字板数量，null为\"未知\"")
    zf = Column(Float, comment="涨幅（%），null为\"未知\"")
    yqhl = Column(Float, comment="每中一签获利（元），null为\"未知\"")
    zyyw = Column(String(2000), comment="主营业务")
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("zqdm"),
        {"comment": "新股日历"},
    )


class HkStockList(Base):
    """港股股票列表表模型。"""

    __tablename__ = "hk_stock_list"

    dm = Column(String(30), primary_key=True, comment="股票代码，如：00001.HK")
    mc = Column(String(200), comment="股票名称，如：长和")
    jys = Column(String(50), comment="交易所")
    updated_at = Column(DateTime, default=datetime.now, comment="更新时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm"),
        {"comment": "港股股票列表"},
    )


