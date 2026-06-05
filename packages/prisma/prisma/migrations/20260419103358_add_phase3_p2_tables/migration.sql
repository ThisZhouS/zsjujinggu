-- CreateTable
CREATE TABLE "company_intros" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "ename" VARCHAR(200),
    "market" VARCHAR(50),
    "idea" TEXT,
    "ldate" VARCHAR(20),
    "sprice" VARCHAR(20),
    "principal" VARCHAR(100),
    "rdate" VARCHAR(20),
    "rprice" VARCHAR(20),
    "organ" VARCHAR(100),
    "secre" VARCHAR(50),
    "phone" VARCHAR(20),
    "fax" VARCHAR(20),
    "email" VARCHAR(100),
    "site" VARCHAR(200),
    "addr" TEXT,
    "desc" TEXT,
    "bscope" TEXT,
    "pe" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_intros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_capitals" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "zgb" DECIMAL(20,2),
    "ysltag" DECIMAL(20,2),
    "xsltgf" DECIMAL(20,2),
    "bdrq" VARCHAR(20),
    "plrq" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_capitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lift_restrictions" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "rdate" VARCHAR(20),
    "ramount" DECIMAL(20,2),
    "rprice" DECIMAL(10,2),
    "batch" VARCHAR(50),
    "pdate" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lift_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_shareholder_counts" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "plrq" VARCHAR(20),
    "jzrq" VARCHAR(20),
    "gdzs" INTEGER,
    "agdhs" INTEGER,
    "bgdhs" INTEGER,
    "hgdhs" INTEGER,
    "yltgdhs" INTEGER,
    "wltgdhs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_shareholder_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_top_holders" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "plrq" VARCHAR(20),
    "jzrq" VARCHAR(20),
    "gdmc" VARCHAR(200),
    "gdlx" VARCHAR(50),
    "cgsl" DECIMAL(20,2),
    "bdyy" TEXT,
    "cgbl" DECIMAL(5,2),
    "gfxz" VARCHAR(50),
    "cgpm" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_top_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_top_flow_holders" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "ggrq" VARCHAR(20),
    "jzrq" VARCHAR(20),
    "gdmc" VARCHAR(200),
    "gdlx" VARCHAR(50),
    "cgsl" DECIMAL(20,2),
    "bdyy" TEXT,
    "cgbl" DECIMAL(5,2),
    "gfxz" VARCHAR(50),
    "cgpm" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_top_flow_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kc_stock_real_time_data" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(10) NOT NULL,
    "p" DECIMAL(10,2),
    "o" DECIMAL(10,2),
    "h" DECIMAL(10,2),
    "l" DECIMAL(10,2),
    "yc" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "v" DECIMAL(20,2),
    "pv" DECIMAL(10,2),
    "ud" DECIMAL(10,2),
    "pc" DECIMAL(10,2),
    "zf" DECIMAL(10,2),
    "t" TIMESTAMP NOT NULL,
    "pe" DECIMAL(10,2),
    "tr" DECIMAL(10,2),
    "pbRatio" DECIMAL(10,2),
    "tv" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kc_stock_real_time_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hs_index_real_time_data" (
    "id" BIGSERIAL NOT NULL,
    "indexCode" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "o" DECIMAL(10,2),
    "h" DECIMAL(10,2),
    "l" DECIMAL(10,2),
    "yc" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "v" DECIMAL(20,2),
    "pv" DECIMAL(10,2),
    "ud" DECIMAL(10,2),
    "pc" DECIMAL(10,2),
    "zf" DECIMAL(10,2),
    "t" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hs_index_real_time_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hf_fund_real_time_data" (
    "id" BIGSERIAL NOT NULL,
    "fundCode" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "o" DECIMAL(10,2),
    "h" DECIMAL(10,2),
    "l" DECIMAL(10,2),
    "yc" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "v" DECIMAL(20,2),
    "pv" DECIMAL(10,2),
    "ud" DECIMAL(10,2),
    "pc" DECIMAL(10,2),
    "zf" DECIMAL(10,2),
    "t" TIMESTAMP NOT NULL,
    "pe" DECIMAL(10,2),
    "tr" DECIMAL(10,2),
    "pbRatio" DECIMAL(10,2),
    "tv" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hf_fund_real_time_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hk_stock_real_time_data" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "o" DECIMAL(10,2),
    "h" DECIMAL(10,2),
    "l" DECIMAL(10,2),
    "yc" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "v" DECIMAL(20,2),
    "pv" DECIMAL(10,2),
    "ud" DECIMAL(10,2),
    "pc" DECIMAL(10,2),
    "zf" DECIMAL(10,2),
    "t" TIMESTAMP NOT NULL,
    "pe" DECIMAL(10,2),
    "tr" DECIMAL(10,2),
    "pbRatio" DECIMAL(10,2),
    "tv" DECIMAL(20,2),
    "updatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hk_stock_real_time_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bj_stock_real_time_data" (
    "id" BIGSERIAL NOT NULL,
    "stockCode" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "o" DECIMAL(10,2),
    "h" DECIMAL(10,2),
    "l" DECIMAL(10,2),
    "yc" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "v" DECIMAL(20,2),
    "pv" DECIMAL(10,2),
    "ud" DECIMAL(10,2),
    "pc" DECIMAL(10,2),
    "zf" DECIMAL(10,2),
    "t" TIMESTAMP NOT NULL,
    "pe" DECIMAL(10,2),
    "tr" DECIMAL(10,2),
    "pbRatio" DECIMAL(10,2),
    "tv" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bj_stock_real_time_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hs_index_history_trading" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(25) NOT NULL,
    "o" DECIMAL(15,4),
    "h" DECIMAL(15,4),
    "l" DECIMAL(15,4),
    "c" DECIMAL(15,4),
    "v" DECIMAL(20,2),
    "a" DECIMAL(20,2),
    "pc" DECIMAL(15,4),
    "st" VARCHAR(20),
    "et" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hs_index_latest_trading" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(25) NOT NULL,
    "o" DECIMAL(15,4),
    "h" DECIMAL(15,4),
    "l" DECIMAL(15,4),
    "c" DECIMAL(15,4),
    "v" DECIMAL(20,2),
    "a" DECIMAL(20,2),
    "pc" DECIMAL(15,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hs_stock_latest_trading" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(25) NOT NULL,
    "model" VARCHAR(10),
    "o" DECIMAL(15,4),
    "h" DECIMAL(15,4),
    "l" DECIMAL(15,4),
    "c" DECIMAL(15,4),
    "v" DECIMAL(20,2),
    "a" DECIMAL(20,2),
    "pc" DECIMAL(15,4),
    "sf" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hs_stock_history_trading" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(25) NOT NULL,
    "model" VARCHAR(10) NOT NULL,
    "o" DECIMAL(15,4),
    "h" DECIMAL(15,4),
    "l" DECIMAL(15,4),
    "c" DECIMAL(15,4),
    "v" DECIMAL(20,2),
    "a" DECIMAL(20,2),
    "pc" DECIMAL(15,4),
    "sf" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "financial_main_indicators" (
    "id" BIGSERIAL NOT NULL,
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20),
    "mgjyhdxjl" DECIMAL(15,4),
    "mgjzc" DECIMAL(15,4),
    "jbmgsy" DECIMAL(15,4),
    "xsmgsy" DECIMAL(15,4),
    "mgwfplr" DECIMAL(15,4),
    "mgzbgjj" DECIMAL(15,4),
    "kfmgsy" DECIMAL(15,4),
    "jzcsyl" DECIMAL(15,4),
    "xsmlv" DECIMAL(15,4),
    "zyyrsrzz" DECIMAL(15,4),
    "jlrzz" DECIMAL(15,4),
    "gsmgsyzzdjlrzz" DECIMAL(15,4),
    "kfjlrzz" DECIMAL(15,4),
    "yyzsrgdhbzz" DECIMAL(15,4),
    "sljlrjqhbzz" DECIMAL(15,4),
    "kfjlrgdhbzz" DECIMAL(15,4),
    "jqjzcsyl" DECIMAL(15,4),
    "tbjzcsyl" DECIMAL(15,4),
    "tbzzcsyl" DECIMAL(15,4),
    "mlv" DECIMAL(15,4),
    "jlv" DECIMAL(15,4),
    "sjslv" DECIMAL(15,4),
    "yskyysr" DECIMAL(15,4),
    "xsxjlyysr" DECIMAL(15,4),
    "zcfzl" DECIMAL(15,4),
    "chzzl" DECIMAL(15,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_main_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_indicators" (
    "id" BIGSERIAL NOT NULL,
    "dm" VARCHAR(20) NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "tbmg" VARCHAR(50),
    "jqmg" VARCHAR(50),
    "mgsy" VARCHAR(50),
    "kfmg" VARCHAR(50),
    "mgjz" VARCHAR(50),
    "mgjzad" VARCHAR(50),
    "mgjy" VARCHAR(50),
    "mggjj" VARCHAR(50),
    "mgwly" VARCHAR(50),
    "zclr" VARCHAR(50),
    "zylr" VARCHAR(50),
    "zzlr" VARCHAR(50),
    "cblr" VARCHAR(50),
    "yylr" VARCHAR(50),
    "zycb" VARCHAR(50),
    "xsjl" VARCHAR(50),
    "gbbc" VARCHAR(50),
    "jzbc" VARCHAR(50),
    "zcbc" VARCHAR(50),
    "xsml" VARCHAR(50),
    "xxbz" VARCHAR(50),
    "fzy" VARCHAR(50),
    "zybz" VARCHAR(50),
    "gxff" VARCHAR(50),
    "tzsy" VARCHAR(50),
    "zyyw" VARCHAR(50),
    "jzsy" VARCHAR(50),
    "jqjz" VARCHAR(50),
    "kflr" VARCHAR(50),
    "zysr" VARCHAR(50),
    "jlzz" VARCHAR(50),
    "jzzz" VARCHAR(50),
    "zzzz" VARCHAR(50),
    "yszz" VARCHAR(50),
    "yszzt" VARCHAR(50),
    "chzz" VARCHAR(50),
    "chzzl" VARCHAR(50),
    "gzzz" VARCHAR(50),
    "zzzzl" VARCHAR(50),
    "zzzzt" VARCHAR(50),
    "ldzz" VARCHAR(50),
    "ldzzt" VARCHAR(50),
    "gdzz" VARCHAR(50),
    "ldbl" VARCHAR(50),
    "sdbl" VARCHAR(50),
    "xjbl" VARCHAR(50),
    "lxzf" VARCHAR(50),
    "zjbl" VARCHAR(50),
    "gdqy" VARCHAR(50),
    "cqfz" VARCHAR(50),
    "gdgd" VARCHAR(50),
    "fzqy" VARCHAR(50),
    "zczjbl" VARCHAR(50),
    "zblv" VARCHAR(50),
    "gdzcjz" VARCHAR(50),
    "zbgdh" VARCHAR(50),
    "cqbl" VARCHAR(50),
    "qxjzb" VARCHAR(50),
    "gdzcbz" VARCHAR(50),
    "zcfzl" VARCHAR(50),
    "zzc" VARCHAR(50),
    "jyxj" VARCHAR(50),
    "zcjyxj" VARCHAR(50),
    "jylrb" VARCHAR(50),
    "jyfzl" VARCHAR(50),
    "xjlbl" VARCHAR(50),
    "dqgptz" VARCHAR(50),
    "dqzctz" VARCHAR(50),
    "dqjytz" VARCHAR(50),
    "qcgptz" VARCHAR(50),
    "cqzqtz" VARCHAR(50),
    "cqjyxtz" VARCHAR(50),
    "yszk1" VARCHAR(50),
    "yszk12" VARCHAR(50),
    "yszk23" VARCHAR(50),
    "yszk3" VARCHAR(50),
    "yfhk1" VARCHAR(50),
    "yfhk12" VARCHAR(50),
    "yfhk23" VARCHAR(50),
    "yfhk3" VARCHAR(50),
    "ysk1" VARCHAR(50),
    "ysk12" VARCHAR(50),
    "ysk23" VARCHAR(50),
    "ysk3" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_forecast" (
    "id" BIGSERIAL NOT NULL,
    "dm" VARCHAR(20) NOT NULL,
    "pdate" VARCHAR(20) NOT NULL,
    "rdate" VARCHAR(20),
    "type" VARCHAR(100),
    "abs" VARCHAR(5000),
    "old" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limit_down_pool" (
    "dm" VARCHAR(20) NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "p" DECIMAL(15,4),
    "zf" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "lt" DECIMAL(20,2),
    "zsz" DECIMAL(20,2),
    "pe" DECIMAL(15,4),
    "hs" DECIMAL(10,2),
    "lbc" DECIMAL(5,2),
    "lbt" VARCHAR(20) NOT NULL,
    "zj" DECIMAL(20,2),
    "fba" DECIMAL(20,2),
    "zbc" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "strong_pool" (
    "dm" VARCHAR(20) NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "p" DECIMAL(15,4),
    "ztp" DECIMAL(15,4),
    "zf" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "lt" DECIMAL(20,2),
    "zsz" DECIMAL(20,2),
    "zs" DECIMAL(10,2),
    "nh" DECIMAL(5,2),
    "lb" DECIMAL(10,2),
    "hs" DECIMAL(10,2),
    "tj" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "limit_up_break_pool" (
    "dm" VARCHAR(20) NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "p" DECIMAL(15,4),
    "ztp" DECIMAL(15,4),
    "zf" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "lt" DECIMAL(20,2),
    "zsz" DECIMAL(20,2),
    "zs" DECIMAL(10,2),
    "hs" DECIMAL(10,2),
    "tj" VARCHAR(50),
    "fbt" VARCHAR(20) NOT NULL,
    "zbc" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "limit_up_pool" (
    "dm" VARCHAR(20) NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "p" DECIMAL(15,4),
    "zf" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "lt" DECIMAL(20,2),
    "zsz" DECIMAL(20,2),
    "hs" DECIMAL(10,2),
    "lbc" DECIMAL(5,2),
    "fbt" VARCHAR(20) NOT NULL,
    "lbt" VARCHAR(20) NOT NULL,
    "zj" DECIMAL(20,2),
    "zbc" DECIMAL(5,2),
    "tj" VARCHAR(50),
    "hy" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sub_new_pool" (
    "dm" VARCHAR(20) NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "p" DECIMAL(15,4),
    "ztp" DECIMAL(15,4),
    "zf" DECIMAL(10,2),
    "cje" DECIMAL(20,2),
    "lt" DECIMAL(20,2),
    "zsz" DECIMAL(20,2),
    "nh" DECIMAL(5,2),
    "hs" DECIMAL(10,2),
    "tj" VARCHAR(50),
    "kb" DECIMAL(5,2),
    "od" VARCHAR(20) NOT NULL,
    "ipod" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "stock_list" (
    "dm" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(10),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hs_fund_list" (
    "dm" VARCHAR(30) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(10),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hs_main_index_list" (
    "dm" VARCHAR(30) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(10),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "new_stock_calendar" (
    "zqdm" VARCHAR(30) NOT NULL,
    "zqjc" VARCHAR(200),
    "sgdm" VARCHAR(30),
    "fxsl" DECIMAL(20,2),
    "swfxsl" DECIMAL(20,2),
    "sgsx" DECIMAL(20,2),
    "dgsz" DECIMAL(20,2),
    "sgrq" VARCHAR(20),
    "fxjg" DECIMAL(15,4),
    "zxj" DECIMAL(15,4),
    "srspj" DECIMAL(15,4),
    "zqgbrq" VARCHAR(20),
    "zqjkrq" VARCHAR(20),
    "ssrq" VARCHAR(20),
    "syl" DECIMAL(15,4),
    "hysyl" DECIMAL(15,4),
    "wszql" DECIMAL(10,4),
    "yzbsl" DECIMAL(5,2),
    "zf" DECIMAL(10,2),
    "yqhl" DECIMAL(20,2),
    "zyyw" VARCHAR(2000),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hk_stock_list" (
    "dm" VARCHAR(30) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(50),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "income_statement" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20) NOT NULL,
    "yysr" DECIMAL(20,2),
    "yzbf" DECIMAL(20,2),
    "fdczssr" DECIMAL(20,2),
    "yyzcb" DECIMAL(20,2),
    "fdczscb" DECIMAL(20,2),
    "yffy" DECIMAL(20,2),
    "tbj" DECIMAL(20,2),
    "pczjje" DECIMAL(20,2),
    "tqbxhtzbjje" DECIMAL(20,2),
    "bdhlzc" DECIMAL(20,2),
    "fbfy" DECIMAL(20,2),
    "gyjzbdsy" DECIMAL(20,2),
    "qhsy" DECIMAL(20,2),
    "tgsy" DECIMAL(20,2),
    "btsr" DECIMAL(20,2),
    "qtywlr" DECIMAL(20,2),
    "bhbfzhbqsljlr" DECIMAL(20,2),
    "lxsr" DECIMAL(20,2),
    "sxfjyjsr" DECIMAL(20,2),
    "sxfjyjzc" DECIMAL(20,2),
    "qtywcb" DECIMAL(20,2),
    "hdsy" DECIMAL(20,2),
    "fldzcczsy" DECIMAL(20,2),
    "sdsfy" DECIMAL(20,2),
    "wqrtzss" DECIMAL(20,2),
    "gsmgsyzzdjlr" DECIMAL(20,2),
    "lxzc" DECIMAL(20,2),
    "qtywsr" DECIMAL(20,2),
    "yyzsr" DECIMAL(20,2),
    "yycb" DECIMAL(20,2),
    "yysjjfj" DECIMAL(20,2),
    "xsfy" DECIMAL(20,2),
    "glfy" DECIMAL(20,2),
    "cwfy" DECIMAL(20,2),
    "zcjzss" DECIMAL(20,2),
    "tzsy" DECIMAL(20,2),
    "lyqyhhhqydtzsy" DECIMAL(20,2),
    "yylr" DECIMAL(20,2),
    "ywsr" DECIMAL(20,2),
    "ywzc" DECIMAL(20,2),
    "lze" DECIMAL(20,2),
    "jlr" DECIMAL(20,2),
    "jlrhfcjcx" DECIMAL(20,2),
    "ssgdsy" DECIMAL(20,2),
    "jbmgsy" DECIMAL(10,4),
    "xsmgsy" DECIMAL(10,4),
    "zhsyz" DECIMAL(20,2),
    "gsssgdzhsyz" DECIMAL(20,2),
    "qtsy" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cashflow_statement" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20) NOT NULL,
    "sdydbxbfqdxj" DECIMAL(20,2),
    "sdzbxywxjjje" DECIMAL(20,2),
    "bhcjjtkkjzje" DECIMAL(20,2),
    "czjyxjrzcjzje" DECIMAL(20,2),
    "sqlxsxfjyjdxj" DECIMAL(20,2),
    "hgywzjjzje" DECIMAL(20,2),
    "zfybxhtpfkxdj" DECIMAL(20,2),
    "zfbdhldxj" DECIMAL(20,2),
    "czfzgsjqtsddxj" DECIMAL(20,2),
    "jszyhdqckssddxj" DECIMAL(20,2),
    "tzszfdxj" DECIMAL(20,2),
    "zydkjzje" DECIMAL(20,2),
    "qdfzgsjqtywdwzfdxjje" DECIMAL(20,2),
    "zjzyhdqckszfdxj" DECIMAL(20,2),
    "qzfzgsxrxj" DECIMAL(20,2),
    "qz_fzgszfgsssgdglr" DECIMAL(20,2),
    "ssgdsy" DECIMAL(20,2),
    "wqrdtzss" DECIMAL(20,2),
    "dysyzj_j_js" DECIMAL(20,2),
    "yjfz" DECIMAL(20,2),
    "jxyyfxmdzj" DECIMAL(20,2),
    "ywgwswjskdjs_j_zj" DECIMAL(20,2),
    "yjswgwgdjz_j_js" DECIMAL(20,2),
    "xssptglwsddxj" DECIMAL(20,2),
    "khckhtyckxkjzje" DECIMAL(20,2),
    "xzyhyhkjzje" DECIMAL(20,2),
    "xtjrgjqjcrzjjzje" DECIMAL(20,2),
    "sddsfyfh" DECIMAL(20,2),
    "tzzfdxj" DECIMAL(20,2),
    "sdqtyjyghdxj" DECIMAL(20,2),
    "jyhdxjlrxj" DECIMAL(20,2),
    "gmspjslwzfdxj" DECIMAL(20,2),
    "khdkjdknzje" DECIMAL(20,2),
    "cfzyxhytckxkjzje" DECIMAL(20,2),
    "zflxsxfjyjdxj" DECIMAL(20,2),
    "zfgzyjwzgzfdxj" DECIMAL(20,2),
    "zfdgxsf" DECIMAL(20,2),
    "zfqtyjyghdxj" DECIMAL(20,2),
    "jyhdxjlcxj" DECIMAL(20,2),
    "jyhdcsdxjlje" DECIMAL(20,2),
    "shtzssddxj" DECIMAL(20,2),
    "qdtzsysddxj" DECIMAL(20,2),
    "czgdzcwxzhqtqctzssddxj" DECIMAL(20,2),
    "sdqtytzghdxj" DECIMAL(20,2),
    "tzhdxjlrxj" DECIMAL(20,2),
    "gjgdzcwxzhqtqctzzfdxj" DECIMAL(20,2),
    "tzhdxjlcxj" DECIMAL(20,2),
    "tzhdcsdxjlxj" DECIMAL(20,2),
    "xstzsdj" DECIMAL(20,2),
    "qdjkjddxj" DECIMAL(20,2),
    "fxzjsddxj" DECIMAL(20,2),
    "sdqtczghdxj" DECIMAL(20,2),
    "czhdxjlrxj" DECIMAL(20,2),
    "chzwzfxj" DECIMAL(20,2),
    "fpglrlhcllxzfdxj" DECIMAL(20,2),
    "zfqtczdxj" DECIMAL(20,2),
    "czhdxjlcxj" DECIMAL(20,2),
    "czhdcsdxjlxj" DECIMAL(20,2),
    "hlbddxjdxy" DECIMAL(20,2),
    "xjxjdhwjzje" DECIMAL(20,2),
    "qcxjjxjdhwye" DECIMAL(20,2),
    "qmxjjxjdhwye" DECIMAL(20,2),
    "jlr" DECIMAL(20,2),
    "zcjzzb" DECIMAL(20,2),
    "gdzczjyqzcshscxwzczj" DECIMAL(20,2),
    "wxzctx" DECIMAL(20,2),
    "cqdtfytx" DECIMAL(20,2),
    "dtfydjs" DECIMAL(20,2),
    "ytfydzj" DECIMAL(20,2),
    "czgdzcwxzhqtqctzss" DECIMAL(20,2),
    "gdzcgbss" DECIMAL(20,2),
    "gyjzbds" DECIMAL(20,2),
    "cwfy" DECIMAL(20,2),
    "tzss" DECIMAL(20,2),
    "dysdszcjs" DECIMAL(20,2),
    "dysdsfzzj" DECIMAL(20,2),
    "chdjs" DECIMAL(20,2),
    "jxyysxmdjs" DECIMAL(20,2),
    "qt" DECIMAL(20,2),
    "jyhdcsdxjlxj" DECIMAL(20,2),
    "zwzwzb" DECIMAL(20,2),
    "ynndqdkzhgzq" DECIMAL(20,2),
    "rzrgdzc" DECIMAL(20,2),
    "xjdqmye" DECIMAL(20,2),
    "xjdqcye" DECIMAL(20,2),
    "xjdhwdqmye" DECIMAL(20,2),
    "xjdhwdqcye" DECIMAL(20,2),
    "xjxjdhwdjzje" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "balance_sheet" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20) NOT NULL,
    "nbysk" DECIMAL(20,2),
    "gdzcql" DECIMAL(20,2),
    "yffbzk" DECIMAL(20,2),
    "jsbfj" DECIMAL(20,2),
    "ysbf" DECIMAL(20,2),
    "ysfbzk" DECIMAL(20,2),
    "ysfbhtzbj" DECIMAL(20,2),
    "ysgl" DECIMAL(20,2),
    "ysckts" DECIMAL(20,2),
    "ysbtk" DECIMAL(20,2),
    "ysbzj" DECIMAL(20,2),
    "dfy" DECIMAL(20,2),
    "dclldzcsy" DECIMAL(20,2),
    "ynndqdfldzc" DECIMAL(20,2),
    "cqysk" DECIMAL(20,2),
    "qtcqtz" DECIMAL(20,2),
    "gdzcyz" DECIMAL(20,2),
    "gdzcjz" DECIMAL(20,2),
    "gdzcjzzbj" DECIMAL(20,2),
    "scxswzc" DECIMAL(20,2),
    "gyxswzc" DECIMAL(20,2),
    "yqzc" DECIMAL(20,2),
    "kfzc" DECIMAL(20,2),
    "gqfzltq" DECIMAL(20,2),
    "qtfldzc" DECIMAL(20,2),
    "yfsxfyj" DECIMAL(20,2),
    "qtjyk" DECIMAL(20,2),
    "yfbzj" DECIMAL(20,2),
    "nbyfk" DECIMAL(20,2),
    "ytfy" DECIMAL(20,2),
    "bxhtzbj" DECIMAL(20,2),
    "dlmmzqk" DECIMAL(20,2),
    "dlcxzqk" DECIMAL(20,2),
    "gjpjjs" DECIMAL(20,2),
    "gnpjjs" DECIMAL(20,2),
    "dysr" DECIMAL(20,2),
    "yfdqzq" DECIMAL(20,2),
    "cqdysr" DECIMAL(20,2),
    "wqddtzss" DECIMAL(20,2),
    "nfpxjgl" DECIMAL(20,2),
    "yjfz" DECIMAL(20,2),
    "xsckjtycf" DECIMAL(20,2),
    "yjldfz" DECIMAL(20,2),
    "j_kcg" DECIMAL(20,2),
    "hbzj" DECIMAL(20,2),
    "cczj" DECIMAL(20,2),
    "jyxjrzc" DECIMAL(20,2),
    "ysjrzc" DECIMAL(20,2),
    "yspj" DECIMAL(20,2),
    "yszk" DECIMAL(20,2),
    "yfkx" DECIMAL(20,2),
    "yslx" DECIMAL(20,2),
    "qtysk" DECIMAL(20,2),
    "mrfsjrzck" DECIMAL(20,2),
    "gyjzjzbdqjsrdq" DECIMAL(20,2),
    "ch" DECIMAL(20,2),
    "qtldzc" DECIMAL(20,2),
    "ldzchj" DECIMAL(20,2),
    "ffdkjjd" DECIMAL(20,2),
    "kkgsjrzc" DECIMAL(20,2),
    "cyzdqtz" DECIMAL(20,2),
    "cqgqtz" DECIMAL(20,2),
    "tzxfd" DECIMAL(20,2),
    "ljzj" DECIMAL(20,2),
    "gdzc" DECIMAL(20,2),
    "zjgc" DECIMAL(20,2),
    "gcwz" DECIMAL(20,2),
    "wxzc" DECIMAL(20,2),
    "sy" DECIMAL(20,2),
    "cqdtfy" DECIMAL(20,2),
    "dysdszc" DECIMAL(20,2),
    "fldzchj" DECIMAL(20,2),
    "zczj" DECIMAL(20,2),
    "dqjk" DECIMAL(20,2),
    "xzyhyhk" DECIMAL(20,2),
    "crzj" DECIMAL(20,2),
    "jyxjrfz" DECIMAL(20,2),
    "ysjrfz" DECIMAL(20,2),
    "yfpj" DECIMAL(20,2),
    "yfzk" DECIMAL(20,2),
    "ysk" DECIMAL(20,2),
    "mchgjrzck" DECIMAL(20,2),
    "yfgzxc" DECIMAL(20,2),
    "yjsf" DECIMAL(20,2),
    "yflx" DECIMAL(20,2),
    "yfgl" DECIMAL(20,2),
    "qtfzk" DECIMAL(20,2),
    "ynndqdfldfz" DECIMAL(20,2),
    "qtldfz" DECIMAL(20,2),
    "ldfzhj" DECIMAL(20,2),
    "cqjk" DECIMAL(20,2),
    "yfzq" DECIMAL(20,2),
    "cqyfk" DECIMAL(20,2),
    "zxyfk" DECIMAL(20,2),
    "dysdsfz" DECIMAL(20,2),
    "qtfldfz" DECIMAL(20,2),
    "fldfzhj" DECIMAL(20,2),
    "fzhj" DECIMAL(20,2),
    "sszb" DECIMAL(20,2),
    "zbgj" DECIMAL(20,2),
    "zxzb" DECIMAL(20,2),
    "ylgj" DECIMAL(20,2),
    "ybfxzb" DECIMAL(20,2),
    "wfplr" DECIMAL(20,2),
    "wbbzbzhc" DECIMAL(20,2),
    "gsmgdqsyhj" DECIMAL(20,2),
    "ssgdqy" DECIMAL(20,2),
    "syzqyhj" DECIMAL(20,2),
    "fzhgdqyzj" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "supervisory_board_member" (
    "dm" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "title" VARCHAR(200),
    "sdate" VARCHAR(20) NOT NULL,
    "edate" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "executive_member" (
    "dm" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "title" VARCHAR(200),
    "sdate" VARCHAR(20) NOT NULL,
    "edate" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "board_member" (
    "dm" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "title" VARCHAR(200),
    "sdate" VARCHAR(20) NOT NULL,
    "edate" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "shareholder_top10" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "ggrq" VARCHAR(20) NOT NULL,
    "gdsm" TEXT,
    "gdzs" DECIMAL(20,2),
    "pjcg" DECIMAL(20,2),
    "sdgdJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "shareholder_top10_float" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "ggrq" VARCHAR(20) NOT NULL,
    "sdgdJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "shareholder_change_trend" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "gdhs" VARCHAR(100),
    "bh" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fund_holdings" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "jjdm" VARCHAR(50) NOT NULL,
    "jjmc" VARCHAR(500),
    "ccsl" DECIMAL(20,2),
    "ltbl" DECIMAL(10,4),
    "cgsz" DECIMAL(20,2),
    "jzbl" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "recent_dividend" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20) NOT NULL,
    "fhx" VARCHAR(50),
    "fhjyr" VARCHAR(20),
    "fhjzr" VARCHAR(20),
    "hf" VARCHAR(50),
    "hfjyr" VARCHAR(20),
    "hfjzr" VARCHAR(20),
    "zf" VARCHAR(50),
    "zfjyr" VARCHAR(20),
    "zfjzr" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "recent_additional_issue" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20) NOT NULL,
    "zfx" VARCHAR(100),
    "zfrq" VARCHAR(20),
    "zfxz" VARCHAR(100),
    "zxj" DECIMAL(10,2),
    "zxr" DECIMAL(10,2),
    "zxsl" DECIMAL(20,2),
    "zje" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "quarterly_profit" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20) NOT NULL,
    "jlr" DECIMAL(20,2),
    "jlrzz" DECIMAL(10,2),
    "yysr" DECIMAL(20,2),
    "yysrzz" DECIMAL(10,2),
    "jlrhfe" DECIMAL(20,2),
    "yysrhfe" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "quarterly_cash_flow" (
    "dm" VARCHAR(20) NOT NULL,
    "jzrq" VARCHAR(20) NOT NULL,
    "plrq" VARCHAR(20) NOT NULL,
    "jydxjlr" DECIMAL(20,2),
    "tzdxjlr" DECIMAL(20,2),
    "czdxjlr" DECIMAL(20,2),
    "xjjze" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "money_flow" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "ljlr" DECIMAL(20,2),
    "ljlc" DECIMAL(20,2),
    "ddanl" DECIMAL(20,2),
    "ddbb" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "today_tick_trade" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "v" DECIMAL(20,2),
    "bv" DECIMAL(20,2),
    "sv" DECIMAL(20,2),
    "bs" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "stop_price_history" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "tp" VARCHAR(50),
    "sdrq" VARCHAR(20),
    "edrq" VARCHAR(20),
    "tpjc" VARCHAR(200),
    "lxrq" VARCHAR(20),
    "sdr" VARCHAR(20),
    "ed" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hs_stock_real_five" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "bj1p" DECIMAL(10,2),
    "bj1v" DECIMAL(20,2),
    "bj2p" DECIMAL(10,2),
    "bj2v" DECIMAL(20,2),
    "bj3p" DECIMAL(10,2),
    "bj3v" DECIMAL(20,2),
    "bj4p" DECIMAL(10,2),
    "bj4v" DECIMAL(20,2),
    "bj5p" DECIMAL(10,2),
    "bj5v" DECIMAL(20,2),
    "sj1p" DECIMAL(10,2),
    "sj1v" DECIMAL(20,2),
    "sj2p" DECIMAL(10,2),
    "sj2v" DECIMAL(20,2),
    "sj3p" DECIMAL(10,2),
    "sj3v" DECIMAL(20,2),
    "sj4p" DECIMAL(10,2),
    "sj4v" DECIMAL(20,2),
    "sj5p" DECIMAL(10,2),
    "sj5v" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "kc_stock_real_five" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "bj1p" DECIMAL(10,2),
    "bj1v" DECIMAL(20,2),
    "bj2p" DECIMAL(10,2),
    "bj2v" DECIMAL(20,2),
    "bj3p" DECIMAL(10,2),
    "bj3v" DECIMAL(20,2),
    "bj4p" DECIMAL(10,2),
    "bj4v" DECIMAL(20,2),
    "bj5p" DECIMAL(10,2),
    "bj5v" DECIMAL(20,2),
    "sj1p" DECIMAL(10,2),
    "sj1v" DECIMAL(20,2),
    "sj2p" DECIMAL(10,2),
    "sj2v" DECIMAL(20,2),
    "sj3p" DECIMAL(10,2),
    "sj3v" DECIMAL(20,2),
    "sj4p" DECIMAL(10,2),
    "sj4v" DECIMAL(20,2),
    "sj5p" DECIMAL(10,2),
    "sj5v" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bj_stock_real_five" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "bj1p" DECIMAL(10,2),
    "bj1v" DECIMAL(20,2),
    "bj2p" DECIMAL(10,2),
    "bj2v" DECIMAL(20,2),
    "bj3p" DECIMAL(10,2),
    "bj3v" DECIMAL(20,2),
    "bj4p" DECIMAL(10,2),
    "bj4v" DECIMAL(20,2),
    "bj5p" DECIMAL(10,2),
    "bj5v" DECIMAL(20,2),
    "sj1p" DECIMAL(10,2),
    "sj1v" DECIMAL(20,2),
    "sj2p" DECIMAL(10,2),
    "sj2v" DECIMAL(20,2),
    "sj3p" DECIMAL(10,2),
    "sj3v" DECIMAL(20,2),
    "sj4p" DECIMAL(10,2),
    "sj4v" DECIMAL(20,2),
    "sj5p" DECIMAL(10,2),
    "sj5v" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hk_stock_real_five" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "bj1p" DECIMAL(10,2),
    "bj1v" DECIMAL(20,2),
    "bj2p" DECIMAL(10,2),
    "bj2v" DECIMAL(20,2),
    "bj3p" DECIMAL(10,2),
    "bj3v" DECIMAL(20,2),
    "bj4p" DECIMAL(10,2),
    "bj4v" DECIMAL(20,2),
    "bj5p" DECIMAL(10,2),
    "bj5v" DECIMAL(20,2),
    "sj1p" DECIMAL(10,2),
    "sj1v" DECIMAL(20,2),
    "sj2p" DECIMAL(10,2),
    "sj2v" DECIMAL(20,2),
    "sj3p" DECIMAL(10,2),
    "sj3v" DECIMAL(20,2),
    "sj4p" DECIMAL(10,2),
    "sj4v" DECIMAL(20,2),
    "sj5p" DECIMAL(10,2),
    "sj5v" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "index_real_time_data" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "o" DECIMAL(10,2),
    "h" DECIMAL(10,2),
    "l" DECIMAL(10,2),
    "pc" DECIMAL(10,2),
    "v" DECIMAL(20,2),
    "a" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "history_ma" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "ma5" DECIMAL(10,4),
    "ma10" DECIMAL(10,4),
    "ma20" DECIMAL(10,4),
    "ma30" DECIMAL(10,4),
    "ma60" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "history_macd" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "dif" DECIMAL(10,4),
    "dea" DECIMAL(10,4),
    "macd" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "history_boll" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "up" DECIMAL(10,4),
    "mid" DECIMAL(10,4),
    "dn" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "history_kdj" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "k" DECIMAL(10,4),
    "d" DECIMAL(10,4),
    "j" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "market_indicator" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "zsl" DECIMAL(20,2),
    "zl" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "zg_tree" (
    "dm" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "parentId" VARCHAR(20),
    "level" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "related_code" (
    "dm" VARCHAR(20) NOT NULL,
    "zsdm" VARCHAR(20) NOT NULL,
    "zsmc" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "related_stock" (
    "zsdm" VARCHAR(20) NOT NULL,
    "zsmc" VARCHAR(200),
    "dm" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "belonging_index" (
    "dm" VARCHAR(20) NOT NULL,
    "zsdm" VARCHAR(20) NOT NULL,
    "zsmc" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "realtime_trading_broker" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "v" DECIMAL(20,2),
    "bs" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "realtime_trading_network" (
    "dm" VARCHAR(20) NOT NULL,
    "t" VARCHAR(20) NOT NULL,
    "p" DECIMAL(10,2),
    "v" DECIMAL(20,2),
    "bs" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "etf_fund_list" (
    "dm" VARCHAR(30) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(50),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bj_index_list" (
    "dm" VARCHAR(30) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(50),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bj_stock_list" (
    "dm" VARCHAR(30) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(50),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "kc_stock_list" (
    "dm" VARCHAR(30) NOT NULL,
    "mc" VARCHAR(200),
    "jys" VARCHAR(50),
    "updatedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "stock_basic_info" (
    "dm" VARCHAR(20) NOT NULL,
    "mc" VARCHAR(200),
    "ssrq" VARCHAR(20),
    "fxj" DECIMAL(10,2),
    "fxsl" DECIMAL(20,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "company_intros_stockCode_idx" ON "company_intros"("stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "company_intros_stockCode_key" ON "company_intros"("stockCode");

-- CreateIndex
CREATE INDEX "company_capitals_stockCode_idx" ON "company_capitals"("stockCode");

-- CreateIndex
CREATE INDEX "lift_restrictions_stockCode_idx" ON "lift_restrictions"("stockCode");

-- CreateIndex
CREATE INDEX "company_shareholder_counts_stockCode_idx" ON "company_shareholder_counts"("stockCode");

-- CreateIndex
CREATE INDEX "company_top_holders_stockCode_idx" ON "company_top_holders"("stockCode");

-- CreateIndex
CREATE INDEX "company_top_flow_holders_stockCode_idx" ON "company_top_flow_holders"("stockCode");

-- CreateIndex
CREATE INDEX "kc_stock_real_time_data_stockCode_idx" ON "kc_stock_real_time_data"("stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "kc_stock_real_time_data_stockCode_t_key" ON "kc_stock_real_time_data"("stockCode", "t");

-- CreateIndex
CREATE INDEX "hs_index_real_time_data_indexCode_idx" ON "hs_index_real_time_data"("indexCode");

-- CreateIndex
CREATE UNIQUE INDEX "hs_index_real_time_data_indexCode_t_key" ON "hs_index_real_time_data"("indexCode", "t");

-- CreateIndex
CREATE INDEX "hf_fund_real_time_data_fundCode_idx" ON "hf_fund_real_time_data"("fundCode");

-- CreateIndex
CREATE UNIQUE INDEX "hf_fund_real_time_data_fundCode_t_key" ON "hf_fund_real_time_data"("fundCode", "t");

-- CreateIndex
CREATE INDEX "hk_stock_real_time_data_stockCode_idx" ON "hk_stock_real_time_data"("stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "hk_stock_real_time_data_stockCode_t_key" ON "hk_stock_real_time_data"("stockCode", "t");

-- CreateIndex
CREATE INDEX "bj_stock_real_time_data_stockCode_idx" ON "bj_stock_real_time_data"("stockCode");

-- CreateIndex
CREATE UNIQUE INDEX "bj_stock_real_time_data_stockCode_t_key" ON "bj_stock_real_time_data"("stockCode", "t");

-- CreateIndex
CREATE INDEX "hs_index_history_trading_dm_idx" ON "hs_index_history_trading"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hs_index_history_trading_dm_t_key" ON "hs_index_history_trading"("dm", "t");

-- CreateIndex
CREATE INDEX "hs_index_latest_trading_dm_idx" ON "hs_index_latest_trading"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hs_index_latest_trading_dm_t_key" ON "hs_index_latest_trading"("dm", "t");

-- CreateIndex
CREATE INDEX "hs_stock_latest_trading_dm_idx" ON "hs_stock_latest_trading"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hs_stock_latest_trading_dm_t_key" ON "hs_stock_latest_trading"("dm", "t");

-- CreateIndex
CREATE INDEX "hs_stock_history_trading_dm_idx" ON "hs_stock_history_trading"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hs_stock_history_trading_dm_t_model_key" ON "hs_stock_history_trading"("dm", "t", "model");

-- CreateIndex
CREATE INDEX "financial_main_indicators_dm_idx" ON "financial_main_indicators"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "financial_main_indicators_dm_jzrq_key" ON "financial_main_indicators"("dm", "jzrq");

-- CreateIndex
CREATE INDEX "financial_indicators_dm_idx" ON "financial_indicators"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "financial_indicators_dm_date_key" ON "financial_indicators"("dm", "date");

-- CreateIndex
CREATE INDEX "performance_forecast_dm_idx" ON "performance_forecast"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "performance_forecast_dm_pdate_key" ON "performance_forecast"("dm", "pdate");

-- CreateIndex
CREATE INDEX "limit_down_pool_dm_idx" ON "limit_down_pool"("dm");

-- CreateIndex
CREATE INDEX "limit_down_pool_date_idx" ON "limit_down_pool"("date");

-- CreateIndex
CREATE UNIQUE INDEX "limit_down_pool_dm_date_lbt_key" ON "limit_down_pool"("dm", "date", "lbt");

-- CreateIndex
CREATE INDEX "strong_pool_dm_idx" ON "strong_pool"("dm");

-- CreateIndex
CREATE INDEX "strong_pool_date_idx" ON "strong_pool"("date");

-- CreateIndex
CREATE UNIQUE INDEX "strong_pool_dm_date_tj_key" ON "strong_pool"("dm", "date", "tj");

-- CreateIndex
CREATE INDEX "limit_up_break_pool_dm_idx" ON "limit_up_break_pool"("dm");

-- CreateIndex
CREATE INDEX "limit_up_break_pool_date_idx" ON "limit_up_break_pool"("date");

-- CreateIndex
CREATE UNIQUE INDEX "limit_up_break_pool_dm_date_fbt_key" ON "limit_up_break_pool"("dm", "date", "fbt");

-- CreateIndex
CREATE INDEX "limit_up_pool_dm_idx" ON "limit_up_pool"("dm");

-- CreateIndex
CREATE INDEX "limit_up_pool_date_idx" ON "limit_up_pool"("date");

-- CreateIndex
CREATE UNIQUE INDEX "limit_up_pool_dm_date_fbt_lbt_key" ON "limit_up_pool"("dm", "date", "fbt", "lbt");

-- CreateIndex
CREATE INDEX "sub_new_pool_dm_idx" ON "sub_new_pool"("dm");

-- CreateIndex
CREATE INDEX "sub_new_pool_date_idx" ON "sub_new_pool"("date");

-- CreateIndex
CREATE UNIQUE INDEX "sub_new_pool_dm_date_od_ipod_key" ON "sub_new_pool"("dm", "date", "od", "ipod");

-- CreateIndex
CREATE INDEX "stock_list_dm_idx" ON "stock_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "stock_list_dm_key" ON "stock_list"("dm");

-- CreateIndex
CREATE INDEX "hs_fund_list_dm_idx" ON "hs_fund_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hs_fund_list_dm_key" ON "hs_fund_list"("dm");

-- CreateIndex
CREATE INDEX "hs_main_index_list_dm_idx" ON "hs_main_index_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hs_main_index_list_dm_key" ON "hs_main_index_list"("dm");

-- CreateIndex
CREATE INDEX "new_stock_calendar_zqdm_idx" ON "new_stock_calendar"("zqdm");

-- CreateIndex
CREATE UNIQUE INDEX "new_stock_calendar_zqdm_key" ON "new_stock_calendar"("zqdm");

-- CreateIndex
CREATE INDEX "hk_stock_list_dm_idx" ON "hk_stock_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hk_stock_list_dm_key" ON "hk_stock_list"("dm");

-- CreateIndex
CREATE INDEX "income_statement_dm_idx" ON "income_statement"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "income_statement_dm_jzrq_plrq_key" ON "income_statement"("dm", "jzrq", "plrq");

-- CreateIndex
CREATE INDEX "cashflow_statement_dm_idx" ON "cashflow_statement"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "cashflow_statement_dm_jzrq_plrq_key" ON "cashflow_statement"("dm", "jzrq", "plrq");

-- CreateIndex
CREATE INDEX "balance_sheet_dm_idx" ON "balance_sheet"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "balance_sheet_dm_jzrq_plrq_key" ON "balance_sheet"("dm", "jzrq", "plrq");

-- CreateIndex
CREATE INDEX "supervisory_board_member_dm_idx" ON "supervisory_board_member"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "supervisory_board_member_dm_sdate_edate_key" ON "supervisory_board_member"("dm", "sdate", "edate");

-- CreateIndex
CREATE INDEX "executive_member_dm_idx" ON "executive_member"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "executive_member_dm_sdate_edate_key" ON "executive_member"("dm", "sdate", "edate");

-- CreateIndex
CREATE INDEX "board_member_dm_idx" ON "board_member"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "board_member_dm_sdate_edate_key" ON "board_member"("dm", "sdate", "edate");

-- CreateIndex
CREATE INDEX "shareholder_top10_dm_idx" ON "shareholder_top10"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "shareholder_top10_dm_jzrq_ggrq_key" ON "shareholder_top10"("dm", "jzrq", "ggrq");

-- CreateIndex
CREATE INDEX "shareholder_top10_float_dm_idx" ON "shareholder_top10_float"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "shareholder_top10_float_dm_jzrq_ggrq_key" ON "shareholder_top10_float"("dm", "jzrq", "ggrq");

-- CreateIndex
CREATE INDEX "shareholder_change_trend_dm_idx" ON "shareholder_change_trend"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "shareholder_change_trend_dm_jzrq_key" ON "shareholder_change_trend"("dm", "jzrq");

-- CreateIndex
CREATE INDEX "fund_holdings_dm_idx" ON "fund_holdings"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "fund_holdings_dm_jzrq_jjdm_key" ON "fund_holdings"("dm", "jzrq", "jjdm");

-- CreateIndex
CREATE INDEX "recent_dividend_dm_idx" ON "recent_dividend"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "recent_dividend_dm_jzrq_plrq_key" ON "recent_dividend"("dm", "jzrq", "plrq");

-- CreateIndex
CREATE INDEX "recent_additional_issue_dm_idx" ON "recent_additional_issue"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "recent_additional_issue_dm_jzrq_plrq_key" ON "recent_additional_issue"("dm", "jzrq", "plrq");

-- CreateIndex
CREATE INDEX "quarterly_profit_dm_idx" ON "quarterly_profit"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "quarterly_profit_dm_jzrq_plrq_key" ON "quarterly_profit"("dm", "jzrq", "plrq");

-- CreateIndex
CREATE INDEX "quarterly_cash_flow_dm_idx" ON "quarterly_cash_flow"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "quarterly_cash_flow_dm_jzrq_plrq_key" ON "quarterly_cash_flow"("dm", "jzrq", "plrq");

-- CreateIndex
CREATE INDEX "money_flow_dm_idx" ON "money_flow"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "money_flow_dm_t_key" ON "money_flow"("dm", "t");

-- CreateIndex
CREATE INDEX "today_tick_trade_dm_idx" ON "today_tick_trade"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "today_tick_trade_dm_t_key" ON "today_tick_trade"("dm", "t");

-- CreateIndex
CREATE INDEX "stop_price_history_dm_idx" ON "stop_price_history"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "stop_price_history_dm_t_key" ON "stop_price_history"("dm", "t");

-- CreateIndex
CREATE INDEX "hs_stock_real_five_dm_idx" ON "hs_stock_real_five"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hs_stock_real_five_dm_t_key" ON "hs_stock_real_five"("dm", "t");

-- CreateIndex
CREATE INDEX "kc_stock_real_five_dm_idx" ON "kc_stock_real_five"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "kc_stock_real_five_dm_t_key" ON "kc_stock_real_five"("dm", "t");

-- CreateIndex
CREATE INDEX "bj_stock_real_five_dm_idx" ON "bj_stock_real_five"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "bj_stock_real_five_dm_t_key" ON "bj_stock_real_five"("dm", "t");

-- CreateIndex
CREATE INDEX "hk_stock_real_five_dm_idx" ON "hk_stock_real_five"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "hk_stock_real_five_dm_t_key" ON "hk_stock_real_five"("dm", "t");

-- CreateIndex
CREATE INDEX "index_real_time_data_dm_idx" ON "index_real_time_data"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "index_real_time_data_dm_t_key" ON "index_real_time_data"("dm", "t");

-- CreateIndex
CREATE INDEX "history_ma_dm_idx" ON "history_ma"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "history_ma_dm_t_key" ON "history_ma"("dm", "t");

-- CreateIndex
CREATE INDEX "history_macd_dm_idx" ON "history_macd"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "history_macd_dm_t_key" ON "history_macd"("dm", "t");

-- CreateIndex
CREATE INDEX "history_boll_dm_idx" ON "history_boll"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "history_boll_dm_t_key" ON "history_boll"("dm", "t");

-- CreateIndex
CREATE INDEX "history_kdj_dm_idx" ON "history_kdj"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "history_kdj_dm_t_key" ON "history_kdj"("dm", "t");

-- CreateIndex
CREATE INDEX "market_indicator_dm_idx" ON "market_indicator"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "market_indicator_dm_t_key" ON "market_indicator"("dm", "t");

-- CreateIndex
CREATE INDEX "zg_tree_dm_idx" ON "zg_tree"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "zg_tree_dm_key" ON "zg_tree"("dm");

-- CreateIndex
CREATE INDEX "related_code_dm_idx" ON "related_code"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "related_code_dm_zsdm_key" ON "related_code"("dm", "zsdm");

-- CreateIndex
CREATE INDEX "related_stock_zsdm_idx" ON "related_stock"("zsdm");

-- CreateIndex
CREATE UNIQUE INDEX "related_stock_zsdm_dm_key" ON "related_stock"("zsdm", "dm");

-- CreateIndex
CREATE INDEX "belonging_index_dm_idx" ON "belonging_index"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "belonging_index_dm_zsdm_key" ON "belonging_index"("dm", "zsdm");

-- CreateIndex
CREATE INDEX "realtime_trading_broker_dm_idx" ON "realtime_trading_broker"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "realtime_trading_broker_dm_t_key" ON "realtime_trading_broker"("dm", "t");

-- CreateIndex
CREATE INDEX "realtime_trading_network_dm_idx" ON "realtime_trading_network"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "realtime_trading_network_dm_t_key" ON "realtime_trading_network"("dm", "t");

-- CreateIndex
CREATE INDEX "etf_fund_list_dm_idx" ON "etf_fund_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "etf_fund_list_dm_key" ON "etf_fund_list"("dm");

-- CreateIndex
CREATE INDEX "bj_index_list_dm_idx" ON "bj_index_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "bj_index_list_dm_key" ON "bj_index_list"("dm");

-- CreateIndex
CREATE INDEX "bj_stock_list_dm_idx" ON "bj_stock_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "bj_stock_list_dm_key" ON "bj_stock_list"("dm");

-- CreateIndex
CREATE INDEX "kc_stock_list_dm_idx" ON "kc_stock_list"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "kc_stock_list_dm_key" ON "kc_stock_list"("dm");

-- CreateIndex
CREATE INDEX "stock_basic_info_dm_idx" ON "stock_basic_info"("dm");

-- CreateIndex
CREATE UNIQUE INDEX "stock_basic_info_dm_key" ON "stock_basic_info"("dm");
