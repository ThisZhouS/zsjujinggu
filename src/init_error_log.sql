-- Error Log Database
-- 用于存储报错日志：错误类型、位置、原因、解决方法、根本原因分析

CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,
    error_location TEXT,
    error_reason TEXT,
    solution TEXT,
    root_cause_model TEXT,
    root_cause_context TEXT,
    root_cause_interrupt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_error_type ON errors(error_type);
CREATE INDEX IF NOT EXISTS idx_error_location ON errors(error_location);
CREATE INDEX IF NOT EXISTS idx_resolved ON errors(resolved);

-- 常见错误记录
INSERT OR IGNORE INTO errors (error_type, error_location, error_reason, solution, root_cause_model, root_cause_context, root_cause_interrupt) VALUES
('Decimal类型错误', 'Service/Repository', '直接对Prisma返回的Decimal进行数学运算', '使用Number()转换后再运算', '未理解Prisma类型系统', '缺少R1规则意识', '未遵循样板规范'),
('N+1查询问题', 'Service', '在循环中执行数据库查询', '使用批量查询+Map或Promise.all', '未考虑性能', '缺少R9规则意识', '未使用Promise.all'),
('IDOR漏洞', 'Controller/Service', '未验证资源归属直接操作', '在Service层验证resource.userId === currentUser.id', '安全意识不足', '缺少R21规则', '未读取CLAUDE.md'),
('可空字段错误', '全栈', '对nullable字段直接操作未做检查', '使用?? defaultValue或if (value != null)检查', '类型不严谨', '缺少R2规则', '未使用TypeScript严格模式'),
('月份索引错误', '全栈', '使用Date.getMonth()比较时+1', 'Date.getMonth()返回0-11，与实际值比较', 'API文档误解', '缺少R5规则', '未进行单元测试'),
('VIP拦截返回500', 'Controller', 'VIP功能返回HTTP 403', '返回HTTP 200 + { code: 403, message: "该功能需要VIP会员" }', '未阅读规范', '缺少R12规则', '未遵循样板'),
('Controller直接调用Repository', 'Controller', '在Controller中直接调用Repository', 'Controller只能调用Service', '架构理解偏差', '违反3层架构', '未遵循样板间'),
('外部API返回500', 'Service', '外部API失败抛出异常', '返回缓存数据或空数组，使用ExternalApiError', '缺乏降级设计', '缺少R13规则', '未实现错误处理');
