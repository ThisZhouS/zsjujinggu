-- Code Introspection Database
-- 用于代码 introspection 的 SQLite 数据库
-- 包含：function_registry, variable_glossary, error_log

-- 1. Function Registry - 函数字典
CREATE TABLE IF NOT EXISTS function_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    func_name TEXT NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    purpose TEXT,
    input_spec TEXT,
    output_spec TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Variable Glossary - 变量 glossary
CREATE TABLE IF NOT EXISTS variable_glossary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    var_pattern TEXT NOT NULL UNIQUE,
    data_type TEXT,
    meaning TEXT,
    usage_context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Error Log - 错误日志
CREATE TABLE IF NOT EXISTS error_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,
    error_location TEXT,
    error_reason TEXT,
    solution TEXT,
    root_cause_model TEXT,
    root_cause_context TEXT,
    root_cause_interrupt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_func_name ON function_registry(func_name);
CREATE INDEX IF NOT EXISTS idx_func_path ON function_registry(file_path);
CREATE INDEX IF NOT EXISTS idx_var_pattern ON variable_glossary(var_pattern);
CREATE INDEX IF NOT EXISTS idx_error_type ON error_log(error_type);

-- Sample Data: Functions
INSERT OR IGNORE INTO function_registry (func_name, file_path, purpose, input_spec, output_spec) VALUES
-- Investor Module
('findMany', 'apps/server/src/domain/investor/investor.repository.ts', '分页查询牛散列表', '{ page, pageSize, keyword, sortBy }', 'Investor[]'),
('findById', 'apps/server/src/domain/investor/investor.repository.ts', '根据 ID 查找牛散', '{ id }', 'Investor | null'),
('getList', 'apps/server/src/domain/investor/investor.service.ts', '获取牛散列表（含统计）', '{ page, pageSize, keyword, sortBy }', '{ list, total }'),
('getDetail', 'apps/server/src/domain/investor/investor.service.ts', '获取牛散详情（VIP 完整持仓）', '{ id, isVip }', 'InvestorDetail'),
-- Stock Module
('findByCode', 'apps/server/src/domain/stock/stock.repository.ts', '根据代码查找股票', '{ code }', 'Stock | null'),
('getMarketOverview', 'apps/server/src/domain/stock/stock.service.ts', '获取市场概览（三大指数）', '{}', 'MarketOverview'),
-- Holding Module
('findIncrease', 'apps/server/src/domain/holding/holding.repository.ts', '查询增持记录', '{ page, pageSize, keyword, reportDate }', 'HoldingChangeRow[]'),
('findDecrease', 'apps/server/src/domain/holding/holding.repository.ts', '查询减持记录', '{ page, pageSize, keyword, reportDate }', 'HoldingChangeRow[]'),
('findNew', 'apps/server/src/domain/holding/holding.repository.ts', '查询新进记录', '{ page, pageSize, keyword, reportDate }', 'HoldingChangeRow[]'),
('findCommonHoldings', 'apps/server/src/domain/holding/holding.repository.ts', '查询共同持仓', '{ investorIds }', 'CommonHoldingRow[]'),
-- NaturalPersonHolder Module (牛散持仓分析)
('findNaturalPersonHolders', 'apps/server/src/domain/natural-person-holder/natural-person-holder.repository.ts', '查询自然人股东持仓数据', '{ shareholderName, stockCode }', 'RawHolderData[]'),
('findTradingData', 'apps/server/src/domain/natural-person-holder/natural-person-holder.repository.ts', '查询历史交易数据（价格匹配）', '{ stockCode, startDate, endDate }', 'TradingData[]'),
('findDividends', 'apps/server/src/domain/natural-person-holder/natural-person-holder.repository.ts', '查询分红数据', '{ stockCode }', 'DividendData[]'),
('getHoldingsHistory', 'apps/server/src/domain/natural-person-holder/natural-person-holder.service.ts', '获取牛散持仓历史（含成本收益计算）', '{ shareholderName }', 'HoldingsHistoryResult'),
('getDividendRecords', 'apps/server/src/domain/natural-person-holder/natural-person-holder.service.ts', '获取牛散分红记录', '{ shareholderName }', 'DividendRecordsResult'),
('getShareholderList', 'apps/server/src/domain/natural-person-holder/natural-person-holder.service.ts', '获取所有自然人股东列表', '{ keyword }', 'string[]'),
-- Infrastructure
('getStockList', 'apps/server/src/infrastructure/external-api/mairui.service.ts', '调用 mairuiapi 获取股票列表', '{}', 'any[]'),
('getRealtimeQuotes', 'apps/server/src/infrastructure/external-api/mairui.service.ts', '获取实时行情', '{ codes: string[] }', 'any[]'),
('generateBusinessDescription', 'apps/server/src/infrastructure/external-api/deepseek.service.ts', '生成主营业务描述', '{ stockName, industry }', 'string'),
-- Utils
('formatResponse', 'apps/server/src/common/utils/response.ts', '格式化统一响应', '{ data, message, code }', '{ code, message, data }'),
('maskPhone', 'apps/server/src/common/utils/data-sanitizer.ts', '手机号脱敏', '{ phone }', 'string (138****1234)'),
('sanitizeCount', 'apps/server/src/common/utils/data-sanitizer.ts', '计数值清理', '{ value }', 'number');

-- Sample Data: Variables
INSERT OR IGNORE INTO variable_glossary (var_pattern, data_type, meaning, usage_context) VALUES
('totalMarketValue', 'Decimal | null', '总市值', 'Investor 实体，持仓市值总和'),
('stockCount', 'Int | null', '持仓支数', 'Investor 实体，持有股票数量'),
('holdCount', 'BigInt', '持股数', 'Holding 实体，持有股数'),
('changePercent', 'Decimal | null', '涨跌幅', 'Stock/KlineDaily，价格变化百分比'),
('currentPrice', 'Decimal | null', '当前价', 'Stock 实体，最新价格'),
('closePricePeriod', 'Decimal | null', '报告期收盘价', 'NaturalPersonHolder，持仓历史匹配价格'),
('avgCostPerShare', 'Decimal | null', '每股平均成本', 'NaturalPersonHolder，加权平均成本'),
('totalInvestedCost', 'Decimal', '累计投入成本', 'NaturalPersonHolder，持仓周期总投入'),
('unrealizedGain', 'Decimal | null', '浮动盈亏', 'NaturalPersonHolder，未实现收益'),
('currentGainRate', 'Decimal | null', '当前涨幅', 'NaturalPersonHolder，相对成本涨幅百分比'),
('profitIfSellAll', 'Decimal | null', '清仓收益', 'NaturalPersonHolder，假设全部卖出盈亏'),
('dividendPerShare', 'Decimal', '每股分红', 'Dividend/RecentDividend，每股派息金额'),
('totalDividend', 'Decimal', '分红总额', 'NaturalPersonHolder，应得分红金额'),
('dividendYield', 'Decimal | null', '股息率', 'NaturalPersonHolder，分红收益率百分比');

-- Sample Data: Error Log
INSERT OR IGNORE INTO error_log (error_type, error_location, error_reason, solution, root_cause_model) VALUES
('Prisma Decimal Error', 'Service 层数学运算', 'Direct operation on Prisma Decimal causes TypeError', 'Use Number() to convert before math', '类型转换缺失'),
('Redis Connection Failed', 'RedisService', 'Redis 服务不可用导致应用启动失败', '实现降级逻辑，不阻塞启动', '外部依赖容错'),
('VIP Guard HTTP 403', 'common/guards/vip.guard.ts', 'VIP 拦截应返回 HTTP 200 + code:403 而非 HTTP 403', '手动设置 response.status(200).json()', '响应格式规范'),
('Date Format Mismatch', 'NaturalPersonHolder Service', '交易数据日期格式为 YYYY-MM-DD HH:mm:ss 但 Service 期望 YYYY-MM-DD', 'formatDate() 函数处理多种日期格式，同步脚本统一存储格式', '日期格式标准化'),
('API 404 Error', 'sync-trading-and-dividend-from-api.ts', '使用错误的 Mairui API 端点导致 404', '使用正确端点：/hsstock/history/{code}/d/n/{licence} 和 /hscp/jnfh/{code}/{licence}', 'API 端点验证'),
('Prisma createMany Decimal', 'sync-trading-dividend-fixed.ts', 'createMany 直接传入 number 而非 Decimal 对象导致类型错误', '使用 new Decimal() 包装数值再传入', 'Prisma 类型映射');
