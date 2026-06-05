"""
财务核心指标表模型定义。

该模块定义了财务核心指标相关的数据库表模型，包括：
- 财务主要指标表
- 财务指标表
- 近年业绩预告表
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import NUMERIC

from config.database import Base


class FinancialMainIndicators(Base):
    """财务主要指标表模型。"""

    __tablename__ = "financial_main_indicators"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期")
    plrq = Column(String(20), comment="披露日期")
    mgjyhdxjl = Column(Float, comment="每股经营活动现金流量")
    mgjzc = Column(Float, comment="每股净资产")
    jbmgsy = Column(Float, comment="基本每股收益")
    xsmgsy = Column(Float, comment="稀释每股收益")
    mgwfplr = Column(Float, comment="每股未分配利润")
    mgzbgjj = Column(Float, comment="每股资本公积金")
    kfmgsy = Column(Float, comment="扣非每股收益")
    jzcsyl = Column(Float, comment="净资产收益率")
    xsmlv = Column(Float, comment="销售毛利率")
    zyyrsrzz = Column(Float, comment="主营收入同比增长")
    jlrzz = Column(Float, comment="净利润同比增长")
    gsmgsyzzdjlrzz = Column(Float, comment="归属于母公司所有者的净利润同比增长")
    kfjlrzz = Column(Float, comment="扣非净利润同比增长")
    yyzsrgdhbzz = Column(Float, comment="营业总收入滚动环比增长")
    sljlrjqhbzz = Column(Float, comment="归属净利润滚动环比增长")
    kfjlrgdhbzz = Column(Float, comment="扣非净利润滚动环比增长")
    jqjzcsyl = Column(Float, comment="加权净资产收益率")
    tbjzcsyl = Column(Float, comment="摊薄净资产收益率")
    tbzzcsyl = Column(Float, comment="摊薄总资产收益率")
    mlv = Column(Float, comment="毛利率")
    jlv = Column(Float, comment="净利率")
    sjslv = Column(Float, comment="实际税率")
    yskyysr = Column(Float, comment="预收款营业收入")
    xsxjlyysr = Column(Float, comment="销售现金流营业收入")
    zcfzl = Column(Float, comment="资产负债比率")
    chzzl = Column(Float, comment="存货周转率")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq"),
        {"comment": "财务主要指标表"},
    )


class FinancialIndicators(Base):
    """财务指标表模型。"""

    __tablename__ = "financial_indicators"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    date = Column(String(20), primary_key=True, comment="报告日期yyyy-MM-dd")
    tbmg = Column(String(50), comment="摊薄每股收益(元)")
    jqmg = Column(String(50), comment="加权每股收益(元)")
    mgsy = Column(String(50), comment="每股收益_调整后(元)")
    kfmg = Column(String(50), comment="扣除非经常性损益后的每股收益(元)")
    mgjz = Column(String(50), comment="每股净资产_调整前(元)")
    mgjzad = Column(String(50), comment="每股净资产_调整后(元)")
    mgjy = Column(String(50), comment="每股经营性现金流(元)")
    mggjj = Column(String(50), comment="每股资本公积金(元)")
    mgwly = Column(String(50), comment="每股未分配利润(元)")
    zclr = Column(String(50), comment="总资产利润率(%)")
    zylr = Column(String(50), comment="主营业务利润率(%)")
    zzlr = Column(String(50), comment="总资产净利润率(%)")
    cblr = Column(String(50), comment="成本费用利润率(%)")
    yylr = Column(String(50), comment="营业利润率(%)")
    zycb = Column(String(50), comment="主营业务成本率(%)")
    xsjl = Column(String(50), comment="销售净利率(%)")
    gbbc = Column(String(50), comment="股本报酬率(%)")
    jzbc = Column(String(50), comment="净资产报酬率(%)")
    zcbc = Column(String(50), comment="资产报酬率(%)")
    xsml = Column(String(50), comment="销售毛利率(%)")
    xxbz = Column(String(50), comment="三项费用比重")
    fzy = Column(String(50), comment="非主营比重")
    zybz = Column(String(50), comment="主营利润比重")
    gxff = Column(String(50), comment="股息发放率(%)")
    tzsy = Column(String(50), comment="投资收益率(%)")
    zyyw = Column(String(50), comment="主营业务利润(元)")
    jzsy = Column(String(50), comment="净资产收益率(%)")
    jqjz = Column(String(50), comment="加权净资产收益率(%)")
    kflr = Column(String(50), comment="扣除非经常性损益后的净利润(元)")
    zysr = Column(String(50), comment="主营业务收入增长率(%)")
    jlzz = Column(String(50), comment="净利润增长率(%)")
    jzzz = Column(String(50), comment="净资产增长率(%)")
    zzzz = Column(String(50), comment="总资产增长率(%)")
    yszz = Column(String(50), comment="应收账款周转率(次)")
    yszzt = Column(String(50), comment="应收账款周转天数(天)")
    chzz = Column(String(50), comment="存货周转天数(天)")
    chzzl = Column(String(50), comment="存货周转率(次)")
    gzzz = Column(String(50), comment="固定资产周转率(次)")
    zzzzl = Column(String(50), comment="总资产周转率(次)")
    zzzzt = Column(String(50), comment="总资产周转天数(天)")
    ldzz = Column(String(50), comment="流动资产周转率(次)")
    ldzzt = Column(String(50), comment="流动资产周转天数(天)")
    gdzz = Column(String(50), comment="股东权益周转率(次)")
    ldbl = Column(String(50), comment="流动比率")
    sdbl = Column(String(50), comment="速动比率")
    xjbl = Column(String(50), comment="现金比率(%)")
    lxzf = Column(String(50), comment="利息支付倍数")
    zjbl = Column(String(50), comment="长期债务与营运资金比率(%)")
    gdqy = Column(String(50), comment="股东权益比率(%)")
    cqfz = Column(String(50), comment="长期负债比率(%)")
    gdgd = Column(String(50), comment="股东权益与固定资产比率(%)")
    fzqy = Column(String(50), comment="负债与所有者权益比率(%)")
    zczjbl = Column(String(50), comment="长期资产与长期资金比率(%)")
    zblv = Column(String(50), comment="资本化比率(%)")
    gdzcjz = Column(String(50), comment="固定资产净值率(%)")
    zbgdh = Column(String(50), comment="资本固定化比率(%)")
    cqbl = Column(String(50), comment="产权比率(%)")
    qxjzb = Column(String(50), comment="清算价值比率(%)")
    gdzcbz = Column(String(50), comment="固定资产比重(%)")
    zcfzl = Column(String(50), comment="资产负债率(%)")
    zzc = Column(String(50), comment="总资产(元)")
    jyxj = Column(String(50), comment="经营现金净流量对销售收入比率(%)")
    zcjyxj = Column(String(50), comment="资产的经营现金流量回报率(%)")
    jylrb = Column(String(50), comment="经营现金净流量与净利润的比率(%)")
    jyfzl = Column(String(50), comment="经营现金净流量对负债比率(%)")
    xjlbl = Column(String(50), comment="现金流量比率(%)")
    dqgptz = Column(String(50), comment="短期股票投资(元)")
    dqzctz = Column(String(50), comment="短期债券投资(元)")
    dqjytz = Column(String(50), comment="短期其它经营性投资(元)")
    qcgptz = Column(String(50), comment="长期股票投资(元)")
    cqzqtz = Column(String(50), comment="长期债券投资(元)")
    cqjyxtz = Column(String(50), comment="长期其它经营性投资(元)")
    yszk1 = Column(String(50), comment="1年以内应收帐款(元)")
    yszk12 = Column(String(50), comment="1-2年以内应收帐款(元)")
    yszk23 = Column(String(50), comment="2-3年以内应收帐款(元)")
    yszk3 = Column(String(50), comment="3年以内应收帐款(元)")
    yfhk1 = Column(String(50), comment="1年以内预付货款(元)")
    yfhk12 = Column(String(50), comment="1-2年以内预付货款(元)")
    yfhk23 = Column(String(50), comment="2-3年以内预付货款(元)")
    yfhk3 = Column(String(50), comment="3年以内预付货款(元)")
    ysk1 = Column(String(50), comment="1年以内其它应收款(元)")
    ysk12 = Column(String(50), comment="1-2年以内其它应收款(元)")
    ysk23 = Column(String(50), comment="2-3年以内其它应收款(元)")
    ysk3 = Column(String(50), comment="3年以内其它应收款(元)")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "date"),
        {"comment": "财务指标表"},
    )


class PerformanceForecast(Base):
    """近年业绩预告表模型。"""

    __tablename__ = "performance_forecast"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    pdate = Column(String(20), primary_key=True, comment="公告日期yyyy-MM-dd")
    rdate = Column(String(20), comment="报告期yyyy-MM-dd")
    type = Column(String(100), comment="类型")
    abs = Column(String(5000), comment="业绩预告摘要")
    old = Column(String(50), comment="上年同期每股收益(元)")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "pdate"),
        {"comment": "近年业绩预告表"},
    )

