-- Function Registry Database
-- 用于存储函数字典：函数名称、文件路径、用途、输入输出规范

CREATE TABLE IF NOT EXISTS functions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    func_name TEXT NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    purpose TEXT,
    input_spec TEXT,
    output_spec TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_func_name ON functions(func_name);
CREATE INDEX IF NOT EXISTS idx_file_path ON functions(file_path);

-- 示例数据
INSERT OR IGNORE INTO functions (func_name, file_path, purpose, input_spec, output_spec) VALUES
('useXxxList', 'hooks/useXxx.ts', '获取XXX列表数据', '{ page, page_size, sort, keyword }', '{ code, message, data: { items, meta } }'),
('useXxxDetail', 'hooks/useXxx.ts', '获取XXX详情数据', '{ id }', '{ code, message, data }'),
('findAll', 'domain/xxx/xxx.service.ts', 'Service层：获取分页列表', '{ page, pageSize, keyword }', '{ items, meta }'),
('findById', 'domain/xxx/xxx.repository.ts', 'Repository层：根据ID查找', '{ id }', 'Entity or null'),
('sync', 'infrastructure/scheduler/xxx.task.ts', '定时同步任务', '{}', 'void');
