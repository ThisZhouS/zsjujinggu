"""
公司基本信息表模型定义。

该模块定义了公司基本信息相关的数据库表模型，包括：
- 公司简介表
- 公司股本表
- 股票基础信息表
- 解禁限售表
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import NUMERIC

from config.database import Base


class CompanyIntro(Base):
    """公司简介表模型。"""

    __tablename__ = "company_intro"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    name = Column(String(200), comment="公司名称")
    ename = Column(String(500), comment="公司英文名称")
    market = Column(String(50), comment="上市市场")
    idea = Column(String(1000), comment="概念及板块，多个概念由英文逗号分隔")
    ldate = Column(String(20), primary_key=True, comment="上市日期，格式yyyy-MM-dd")
    sprice = Column(String(50), comment="发行价格（元）")
    principal = Column(String(200), comment="主承销商")
    rdate = Column(String(50), comment="成立日期")
    rprice = Column(String(50), comment="注册资本")
    instype = Column(String(100), comment="机构类型")
    organ = Column(String(100), comment="组织形式")
    secre = Column(String(100), comment="董事会秘书")
    phone = Column(String(50), comment="公司电话")
    sphone = Column(String(50), comment="董秘电话")
    fax = Column(String(50), comment="公司传真")
    sfax = Column(String(50), comment="董秘传真")
    email = Column(String(200), comment="公司电子邮箱")
    semail = Column(String(200), comment="董秘电子邮箱")
    site = Column(String(500), comment="公司网站")
    post = Column(String(20), comment="邮政编码")
    infosite = Column(String(500), comment="信息披露网址")
    oname = Column(String(500), comment="证券简称更名历史")
    addr = Column(String(1000), comment="注册地址")
    oaddr = Column(String(1000), comment="办公地址")
    desc = Column(String(5000), comment="公司简介")
    bscope = Column(String(5000), comment="经营范围")
    printype = Column(String(100), comment="承销方式")
    referrer = Column(String(200), comment="上市推荐人")
    putype = Column(String(100), comment="发行方式")
    pe = Column(String(50), comment="发行市盈率（按发行后总股本）")
    firgu = Column(String(50), comment="首发前总股本（万股）")
    lastgu = Column(String(50), comment="首发后总股本（万股）")
    realgu = Column(String(50), comment="实际发行量（万股）")
    planm = Column(String(50), comment="预计募集资金（万元）")
    realm = Column(String(50), comment="实际募集资金合计（万元）")
    pubfee = Column(String(50), comment="发行费用总额（万元）")
    collect = Column(String(50), comment="募集资金净额（万元）")
    signfee = Column(String(50), comment="承销费用（万元）")
    pdate = Column(String(50), comment="招股公告日")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "ldate"),
        {"comment": "公司简介表"},
    )


class CompanyCapital(Base):
    """公司股本表模型。"""

    __tablename__ = "company_capital"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    zgb = Column(Float, comment="总股本")
    ysltag = Column(Float, comment="已上市流通A股")
    xsltgf = Column(Float, comment="限售流通股份")
    bdrq = Column(String(20), primary_key=True, comment="变动日期")
    plrq = Column(String(20), primary_key=True, comment="公告日")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "bdrq", "plrq"),
        {"comment": "公司股本表"},
    )


class StockBasicInfo(Base):
    """股票基础信息表模型。"""

    __tablename__ = "stock_basic_info"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    ei = Column(String(20), comment="市场代码")
    ii = Column(String(20), comment="股票代码")
    name = Column(String(200), comment="股票名称")
    od = Column(String(20), primary_key=True, comment="上市日期(股票IPO日期)")
    pc = Column(Float, comment="前收盘价格")
    up = Column(Float, comment="当日涨停价")
    dp = Column(Float, comment="当日跌停价")
    fv = Column(Float, comment="流通股本")
    tv = Column(Float, comment="总股本")
    pk = Column(Float, comment="最小价格变动单位")
    is_stop = Column(Integer, comment="股票停牌状态(<=0:正常交易（-1:复牌）;>=1停牌天数;)")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "od"),
        {"comment": "股票基础信息表"},
    )


class LiftRestriction(Base):
    """解禁限售表模型。"""

    __tablename__ = "lift_restriction"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    rdate = Column(String(20), primary_key=True, comment="解禁日期yyyy-MM-dd")
    ramount = Column(NUMERIC(20, 4), comment="解禁数量(万股)")
    rprice = Column(NUMERIC(20, 4), comment="解禁股流通市值(亿元)")
    batch = Column(Integer, comment="上市批次")
    pdate = Column(String(20), primary_key=True, comment="公告日期yyyy-MM-dd")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "rdate", "pdate"),
        {"comment": "解禁限售表"},
    )

