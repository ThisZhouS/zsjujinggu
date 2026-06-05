"""
财务报表表模型定义。

该模块定义了财务报表相关的数据库表模型，包括：
- 利润表
- 现金流量表
- 资产负债表
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, PrimaryKeyConstraint, String

from config.database import Base


class IncomeStatement(Base):
    """利润表表模型。"""

    __tablename__ = "income_statement"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期")
    plrq = Column(String(20), primary_key=True, comment="披露日期")

    yysr = Column(Float, comment="营业收入")
    yzbf = Column(Float, comment="已赚保费")
    fdczssr = Column(Float, comment="房地产销售收入")
    yyzcb = Column(Float, comment="营业总成本")
    fdczscb = Column(Float, comment="房地产销售成本")
    yffy = Column(Float, comment="研发费用")
    tbj = Column(Float, comment="退保金")
    pczjje = Column(Float, comment="赔付支出净额")
    tqbxhtzbjje = Column(Float, comment="提取保险合同准备金净额")
    bdhlzc = Column(Float, comment="保单红利支出")
    fbfy = Column(Float, comment="分保费用")
    gyjzbdsy = Column(Float, comment="公允价值变动收益")
    qhsy = Column(Float, comment="期货损益")
    tgsy = Column(Float, comment="托管收益")
    btsr = Column(Float, comment="补贴收入")
    qtywlr = Column(Float, comment="其他业务利润")
    bhbfzhbqsljlr = Column(Float, comment="被合并方在合并前实现净利润")
    lxsr = Column(Float, comment="利息收入")
    sxfjyjsr = Column(Float, comment="手续费及佣金收入")
    sxfjyjzc = Column(Float, comment="手续费及佣金支出")
    qtywcb = Column(Float, comment="其他业务成本")
    hdsy = Column(Float, comment="汇兑收益")
    fldzcczsy = Column(Float, comment="非流动资产处置收益")
    sdsfy = Column(Float, comment="所得税费用")
    wqrtzss = Column(Float, comment="未确认投资损失")
    gsmgsyzzdjlr = Column(Float, comment="归属于母公司所有者的净利润")
    lxzc = Column(Float, comment="利息支出")
    qtywsr = Column(Float, comment="其他业务收入")

    yyzsr = Column(Float, comment="营业总收入")
    yycb = Column(Float, comment="营业成本")
    yysjjfj = Column(Float, comment="营业税金及附加")
    xsfy = Column(Float, comment="销售费用")
    glfy = Column(Float, comment="管理费用")
    cwfy = Column(Float, comment="财务费用")
    zcjzss = Column(Float, comment="资产减值损失")
    tzsy = Column(Float, comment="投资收益")
    lyqyhhhqydtzsy = Column(Float, comment="联营企业和合营企业的投资收益")
    yylr = Column(Float, comment="营业利润")
    ywsr = Column(Float, comment="营业外收入")
    ywzc = Column(Float, comment="营业外支出")
    lze = Column(Float, comment="利润总额")
    jlr = Column(Float, comment="净利润")
    jlrhfcjcx = Column(Float, comment="净利润(扣除非经常性损益后)")
    ssgdsy = Column(Float, comment="少数股东损益")
    jbmgsy = Column(Float, comment="基本每股收益")
    xsmgsy = Column(Float, comment="稀释每股收益")
    zhsyz = Column(Float, comment="综合收益总额")
    gsssgdzhsyz = Column(Float, comment="归属于少数股东的综合收益总额")
    qtsy = Column(Float, comment="其他收益")

    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq", "plrq"),
        {"comment": "利润表"},
    )


class CashFlowStatement(Base):
    """现金流量表表模型。"""

    __tablename__ = "cashflow_statement"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期")
    plrq = Column(String(20), primary_key=True, comment="披露日期")

    sdydbxbfqdxj = Column(Float, comment="收到原保险合同保费取得的现金")
    sdzbxywxjjje = Column(Float, comment="收到再保险业务现金净额")
    bhcjjtkkjzje = Column(Float, comment="保户储金及投资款净增加额")
    czjyxjrzcjzje = Column(Float, comment="处置交易性金融资产净增加额")
    sqlxsxfjyjdxj = Column(Float, comment="收取利息、手续费及佣金的现金")
    hgywzjjzje = Column(Float, comment="回购业务资金净增加额")
    zfybxhtpfkxdj = Column(Float, comment="支付原保险合同赔付款项的现金")
    zfbdhldxj = Column(Float, comment="支付保单红利的现金")
    czfzgsjqtsddxj = Column(Float, comment="处置子公司及其他收到的现金")
    jszyhdqckssddxj = Column(Float, comment="减少质押和定期存款所收到的现金")
    tzszfdxj = Column(Float, comment="投资所支付的现金")
    zydkjzje = Column(Float, comment="质押贷款净增加额")
    qdfzgsjqtywdwzfdxjje = Column(
        Float,
        comment="取得子公司及其他营业单位支付的现金净额",
    )
    zjzyhdqckszfdxj = Column(Float, comment="增加质押和定期存款所支付的现金")
    qzfzgsxrxj = Column("Qzfzgsxrxj", Float, comment="其中子公司吸收现金")
    qz_fzgszfgsssgdglr = Column(
        "qz:fzgszfgsssgdglr",
        Float,
        comment="其中:子公司支付给少数股东的股利、利润",
    )
    ssgdsy = Column(Float, comment="少数股东损益")
    wqrdtzss = Column(Float, comment="未确认的投资损失")
    dysyzj_j_js = Column("dysyzj(j:js)", Float, comment="递延收益增加(减:减少)")
    yjfz = Column(Float, comment="预计负债")
    jxyyfxmdzj = Column(Float, comment="经营性应付项目的增加")
    ywgwswjskdjs_j_zj = Column(
        "ywgwswjskdjs(j:zj)",
        Float,
        comment="已完工尚未结算款的减少(减:增加)",
    )
    yjswgwgdjz_j_js = Column(
        "yjswgwgdjz(j:js)",
        Float,
        comment="已结算尚未完工款的增加(减:减少)",
    )

    xssptglwsddxj = Column(Float, comment="销售商品、提供劳务收到的现金")
    khckhtyckxkjzje = Column(Float, comment="客户存款和同业存放款项净增加额")
    xzyhyhkjzje = Column(Float, comment="向中央银行借款净增加额(万元)")
    xtjrgjqjcrzjjzje = Column(Float, comment="向其他金融机构拆入资金净增加额")
    sddsfyfh = Column(Float, comment="收到的税费与返还")
    tzzfdxj = Column(Float, comment="投资支付的现金")
    sdqtyjyghdxj = Column(Float, comment="收到的其他与经营活动有关的现金")
    jyhdxjlrxj = Column(Float, comment="经营活动现金流入小计")

    gmspjslwzfdxj = Column(Float, comment="购买商品、接受劳务支付的现金")
    khdkjdknzje = Column(Float, comment="客户贷款及垫款净增加额")
    cfzyxhytckxkjzje = Column(Float, comment="存放中央银行和同业款项净增加额")
    zflxsxfjyjdxj = Column(Float, comment="支付利息、手续费及佣金的现金")
    zfgzyjwzgzfdxj = Column(Float, comment="支付给职工以及为职工支付的现金")
    zfdgxsf = Column(Float, comment="支付的各项税费")
    zfqtyjyghdxj = Column(Float, comment="支付其他与经营活动有关的现金")
    jyhdxjlcxj = Column(Float, comment="经营活动现金流出小计")
    jyhdcsdxjlje = Column(Float, comment="经营活动产生的现金流量净额")

    shtzssddxj = Column(Float, comment="收回投资所收到的现金")
    qdtzsysddxj = Column(Float, comment="取得投资收益所收到的现金")
    czgdzcwxzhqtqctzssddxj = Column(
        Float,
        comment="处置固定资产、无形资产和其他长期投资收到的现金",
    )
    sdqtytzghdxj = Column(Float, comment="收到的其他与投资活动有关的现金")
    tzhdxjlrxj = Column(Float, comment="投资活动现金流入小计")
    gjgdzcwxzhqtqctzzfdxj = Column(
        Float,
        comment="购建固定资产、无形资产和其他长期投资支付的现金",
    )
    tzhdxjlcxj = Column(Float, comment="投资活动现金流出小计")
    tzhdcsdxjlxj = Column(Float, comment="投资活动产生的现金流量净额")

    xstzsdj = Column(Float, comment="吸收投资收到的现金")
    qdjkjddxj = Column("Qdjkjddxj", Float, comment="取得借款收到的现金")
    fxzjsddxj = Column(Float, comment="发行债券收到的现金")
    sdqtczghdxj = Column(Float, comment="收到其他与筹资活动有关的现金")
    czhdxjlrxj = Column("Czhdxjlrxj", Float, comment="筹资活动现金流入小计")
    chzwzfxj = Column(Float, comment="偿还债务支付现金")
    fpglrlhcllxzfdxj = Column(Float, comment="分配股利、利润或偿付利息支付的现金")
    zfqtczdxj = Column(Float, comment="支付其他与筹资的现金")
    czhdxjlcxj = Column("Czhdxjlcxj", Float, comment="筹资活动现金流出小计")
    czhdcsdxjlxj = Column(Float, comment="筹资活动产生的现金流量净额")

    hlbddxjdxy = Column(Float, comment="汇率变动对现金的影响")
    xjxjdhwjzje = Column(Float, comment="现金及现金等价物净增加额")
    qcxjjxjdhwye = Column(Float, comment="期初现金及现金等价物余额")
    qmxjjxjdhwye = Column(Float, comment="期末现金及现金等价物余额")

    jlr = Column(Float, comment="净利润")
    zcjzzb = Column(Float, comment="资产减值准备")
    gdzczjyqzcshscxwzczj = Column(
        Float,
        comment="固定资产折旧、油气资产折耗、生产性物资折旧",
    )
    wxzctx = Column(Float, comment="无形资产摊销")
    cqdtfytx = Column(Float, comment="长期待摊费用摊销")
    dtfydjs = Column(Float, comment="待摊费用的减少")
    ytfydzj = Column(Float, comment="预提费用的增加")
    czgdzcwxzhqtqctzss = Column(
        Float,
        comment="处置固定资产、无形资产和其他长期资产的损失",
    )
    gdzcgbss = Column(Float, comment="固定资产报废损失")
    gyjzbds = Column(Float, comment="公允价值变动损失")
    cwfy = Column("Cwfy", Float, comment="财务费用")
    tzss = Column("Tzss", Float, comment="投资损失")
    dysdszcjs = Column(Float, comment="递延所得税资产减少")
    dysdsfzzj = Column(Float, comment="递延所得税负债增加")
    chdjs = Column(Float, comment="存货的减少")
    jxyysxmdjs = Column(Float, comment="经营性应收项目的减少")
    qt = Column(Float, comment="其他")
    jyhdcsdxjlxj = Column(Float, comment="经营活动产生现金流量净额")

    zwzwzb = Column(Float, comment="债务转为资本")
    ynndqdkzhgzq = Column(Float, comment="一年内到期的可转换公司债券")
    rzrgdzc = Column(Float, comment="融资租入固定资产")

    xjdqmye = Column(Float, comment="现金的期末余额")
    xjdqcye = Column(Float, comment="现金的期初余额")
    xjdhwdqmye = Column(Float, comment="现金等价物的期末余额")
    xjdhwdqcye = Column(Float, comment="现金等价物的期初余额")
    xjxjdhwdjzje = Column(Float, comment="现金及现金等价物的净增加额")

    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq", "plrq"),
        {"comment": "现金流量表"},
    )


class BalanceSheet(Base):
    """资产负债表表模型。"""

    __tablename__ = "balance_sheet"

    dm = Column(String(20), primary_key=True, comment="股票代码")
    jzrq = Column(String(20), primary_key=True, comment="截止日期")
    plrq = Column(String(20), primary_key=True, comment="披露日期")

    nbysk = Column(Float, comment="内部应收款")
    gdzcql = Column(Float, comment="固定资产清理")
    yffbzk = Column(Float, comment="应付分保账款")
    jsbfj = Column(Float, comment="结算备付金")
    ysbf = Column(Float, comment="应收保费")
    ysfbzk = Column(Float, comment="应收分保账款")
    ysfbhtzbj = Column("Ysfbhtzbj", Float, comment="应收分保合同准备金")
    ysgl = Column("Ysgl", Float, comment="应收股利")
    ysckts = Column(Float, comment="应收出口退税")
    ysbtk = Column(Float, comment="应收补贴款")
    ysbzj = Column(Float, comment="应收保证金")
    dfy = Column(Float, comment="待摊费用")
    dclldzcsy = Column(Float, comment="待处理流动资产损益")
    ynndqdfldzc = Column(Float, comment="一年内到期的非流动资产")
    cqysk = Column(Float, comment="长期应收款")
    qtcqtz = Column(Float, comment="其他长期投资")
    gdzcyz = Column(Float, comment="固定资产原值")
    gdzcjz = Column(Float, comment="固定资产净值")
    gdzcjzzbj = Column(Float, comment="固定资产减值准备")
    scxswzc = Column(Float, comment="生产性生物资产")
    gyxswzc = Column(Float, comment="公益性生物资产")
    yqzc = Column(Float, comment="油气资产")
    kfzc = Column(Float, comment="开发支出")
    gqfzltq = Column(Float, comment="股权分置流通权")
    qtfldzc = Column(Float, comment="其他非流动资产")
    yfsxfyj = Column(Float, comment="应付手续费及佣金")
    qtjyk = Column(Float, comment="其他应交款")
    yfbzj = Column(Float, comment="应付保证金")
    nbyfk = Column(Float, comment="内部应付款")
    ytfy = Column(Float, comment="预提费用")
    bxhtzbj = Column(Float, comment="保险合同准备金")
    dlmmzqk = Column(Float, comment="代理买卖证券款")
    dlcxzqk = Column(Float, comment="代理承销证券款")
    gjpjjs = Column(Float, comment="国际票证结算")
    gnpjjs = Column(Float, comment="国内票证结算")
    dysr = Column(Float, comment="递延收益")
    yfdqzq = Column(Float, comment="应付短期债券")
    cqdysr = Column(Float, comment="长期递延收益")
    wqddtzss = Column(Float, comment="未确定的投资损失")
    nfpxjgl = Column(Float, comment="拟分配现金股利")
    yjfz = Column(Float, comment="预计负债")
    xsckjtycf = Column(Float, comment="吸收存款及同业存放")
    yjldfz = Column(Float, comment="预计流动负债")
    j_kcg = Column("j_kcg", Float, comment="减:库存股")

    hbzj = Column("Hbzj", Float, comment="货币资金")
    cczj = Column(Float, comment="拆出资金")
    jyxjrzc = Column(Float, comment="交易性金融资产")
    ysjrzc = Column(Float, comment="衍生金融资产")
    yspj = Column(Float, comment="应收票据")
    yszk = Column(Float, comment="应收账款")
    yfkx = Column(Float, comment="预付款项")
    yslx = Column(Float, comment="应收利息")
    qtysk = Column(Float, comment="其他应收款")
    mrfsjrzck = Column("Mrfsjrzck", Float, comment="买入返售金融资产款")
    gyjzjzbdqjsrdq = Column(
        "gyjzjzbdqjsrdq",
        Float,
        comment="以公允价值计量且其变动计入当期损益的金融资产",
    )
    ch = Column(Float, comment="存货")
    qtldzc = Column(Float, comment="其他流动资产")
    ldzchj = Column(Float, comment="流动资产合计")
    ffdkjjd = Column(Float, comment="发放贷款及垫款")
    kkgsjrzc = Column(Float, comment="可供出售金融资产")
    cyzdqtz = Column(Float, comment="持有至到期投资")
    cqgqtz = Column(Float, comment="长期股权投资")
    tzxfd = Column("Tzxfd", Float, comment="投资性房地产")
    ljzj = Column(Float, comment="累计折旧")
    gdzc = Column("Gdzc", Float, comment="固定资产")
    zjgc = Column(Float, comment="在建工程")
    gcwz = Column("Gcwz", Float, comment="工程物资")
    wxzc = Column(Float, comment="无形资产")
    sy = Column(Float, comment="商誉")
    cqdtfy = Column(Float, comment="长期待摊费用")
    dysdszc = Column(Float, comment="递延所得税资产")
    fldzchj = Column(Float, comment="非流动资产合计")
    zczj = Column(Float, comment="资产总计")

    dqjk = Column(Float, comment="短期借款")
    xzyhyhk = Column(Float, comment="向中央银行借款")
    crzj = Column(Float, comment="拆入资金")
    jyxjrfz = Column(Float, comment="交易性金融负债")
    ysjrfz = Column(Float, comment="衍生金融负债")
    yfpj = Column(Float, comment="应付票据")
    yfzk = Column(Float, comment="应付账款")
    ysk = Column("Ysk", Float, comment="预收账款")
    mchgjrzck = Column("mchgjrzck", Float, comment="卖出回购金融资产款")
    yfgzxc = Column(Float, comment="应付职工薪酬")
    yjsf = Column(Float, comment="应交税费")
    yflx = Column(Float, comment="应付利息")
    yfgl = Column(Float, comment="应付股利")
    qtfzk = Column(Float, comment="其他应付款")
    ynndqdfldfz = Column(Float, comment="一年内到期的非流动负债")
    qtldfz = Column(Float, comment="其他流动负债")
    ldfzhj = Column(Float, comment="流动负债合计")
    cqjk = Column(Float, comment="长期借款")
    yfzq = Column(Float, comment="应付债券")
    cqyfk = Column(Float, comment="长期应付款")
    zxyfk = Column(Float, comment="专项应付款")
    dysdsfz = Column(Float, comment="递延所得税负债")
    qtfldfz = Column(Float, comment="其他非流动负债")
    fldfzhj = Column(Float, comment="非流动负债合计")
    fzhj = Column(Float, comment="负债合计")

    sszb = Column(Float, comment="实收资本(或股本)")
    zbgj = Column(Float, comment="资本公积")
    zxzb = Column("Zxzb", Float, comment="专项储备")
    ylgj = Column(Float, comment="盈余公积")
    ybfxzb = Column(Float, comment="一般风险准备")
    wfplr = Column(Float, comment="未分配利润")
    wbbzbzhc = Column(Float, comment="外币报表折算差额")
    gsmgdqsyhj = Column(Float, comment="归属于母公司股东权益合计")
    ssgdqy = Column(Float, comment="少数股东权益")
    syzqyhj = Column(Float, comment="所有者权益合计")
    fzhgdqyzj = Column(Float, comment="负债和股东权益总计")

    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("dm", "jzrq", "plrq"),
        {"comment": "资产负债表"},
    )

