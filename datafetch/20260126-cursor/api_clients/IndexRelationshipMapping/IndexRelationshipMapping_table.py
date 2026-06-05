"""
指数关系映射表模型定义。

该模块定义指数/行业/概念与股票之间关系的数据库表模型，包括：
- 指数、行业、概念树（hszg/list）
- 根据股票找相关指数、行业、概念（hszg/zg）
- 根据指数、行业、概念找相关股票（hszg/gg）
- 所属指数（hscp/sszs）
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, PrimaryKeyConstraint, String

from config.database import Base


class ZgTree(Base):
    """指数、行业、概念树表模型。"""

    __tablename__ = "zg_tree"

    code = Column("Code", String(100), primary_key=True, comment="代码")
    name = Column(String(200), comment="名称")
    type1 = Column(Integer, comment="一级分类")
    type2 = Column(Integer, comment="二级分类")
    level = Column("Level", Integer, comment="层级，从0开始")
    pcode = Column(String(100), comment="父节点代码")
    pname = Column(String(200), comment="父节点名称")
    isleaf = Column(Integer, comment="是否为叶子节点，0：否，1：是")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = ({"comment": "指数、行业、概念树"},)


class StockToZgMapping(Base):
    """股票 -> 指数/行业/概念 映射表模型。"""

    __tablename__ = "stock_to_zg_mapping"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    code = Column("Code", String(100), primary_key=True, comment="指数、行业、概念代码")
    name = Column(String(500), comment="指数、行业、概念名称")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "Code"),
        {"comment": "根据股票找相关指数、行业、概念"},
    )


class ZgToStockMapping(Base):
    """指数/行业/概念 -> 股票 映射表模型。"""

    __tablename__ = "zg_to_stock_mapping"

    code = Column("Code", String(100), primary_key=True, comment="指数、行业、概念代码")
    dm = Column(String(20), primary_key=True, comment="代码（可能为A股股票代码或其他代码）")
    mc = Column(String(200), comment="名称")
    jys = Column(String(20), comment='交易所，"sh"/"sz"，非A股则可能为空')
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("Code", "dm"),
        {"comment": "根据指数、行业、概念找相关股票"},
    )


class StockBelongingIndices(Base):
    """所属指数表模型。"""

    __tablename__ = "stock_belonging_indices"

    stock_code = Column("dm", String(20), primary_key=True, comment="股票代码")
    index_code = Column(String(50), primary_key=True, comment="指数代码")
    mc = Column(String(200), comment="指数名称")
    ind = Column("Ind", String(20), primary_key=True, comment="进入日期yyyy-MM-dd")
    outd = Column(String(20), comment="退出日期yyyy-MM-dd")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "index_code", "Ind"),
        {"comment": "所属指数"},
    )

