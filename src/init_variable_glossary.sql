-- Variable Glossary Database
-- 用于存储变量术语表：变量模式、数据类型、含义

CREATE TABLE IF NOT EXISTS variables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    var_pattern TEXT NOT NULL UNIQUE,
    data_type TEXT,
    meaning TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_var_pattern ON variables(var_pattern);
CREATE INDEX IF NOT EXISTS idx_category ON variables(category);

-- 项目变量术语
INSERT OR IGNORE INTO variables (var_pattern, data_type, meaning, category) VALUES
('page', 'number', '页码，从1开始', '分页'),
('page_size', 'number', '每页数量，默认20，最大100', '分页'),
('meta', 'object', '分页元数据 { total, page, page_size, total_pages }', '分页'),
('code', 'number', 'HTTP状态码，200表示成功', 'API响应'),
('message', 'string', 'API响应消息', 'API响应'),
('data', 'any', 'API响应数据载荷', 'API响应'),
('userId', 'number', '用户ID，用于IDOR保护', '安全'),
('isVip', 'boolean', '是否VIP会员', '权限'),
('role', 'UserRole', '用户角色：USER|ADMIN|VIP', '权限'),
('req.user', 'object', 'JWT认证后的用户对象', '认证'),
('items', 'array', '列表项数组', '数据'),
('total', 'number', '总数', '分页'),
('offset', 'number', '查询偏移量 = (page - 1) * page_size', '分页');
