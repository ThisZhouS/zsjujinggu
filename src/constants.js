/**
 * 统一术语常量
 * 用于全项目端到端保持术语一致性
 */

// ==================== API响应 ====================
export const RESPONSE_CODE = {
  SUCCESS: 200,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  VIP_REQUIRED: 403, // R12: VIP拦截返回code:403，HTTP状态码仍为200
  INTERNAL_ERROR: 500,
  UNAUTHORIZED: 401,
};

export const RESPONSE_MESSAGE = {
  SUCCESS: 'success',
  NOT_FOUND: 'Not found',
  INVALID_INPUT: 'Invalid input',
  ACCESS_DENIED: 'Access denied',
  VIP_REQUIRED: '该功能需要VIP会员',
  INTERNAL_ERROR: 'Internal server error',
  EXTERNAL_API_FAILED: 'External API failed',
};

// ==================== 用户角色 ====================
export const USER_ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  VIP: 'VIP',
};

// ==================== 订单状态 ====================
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
};

// ==================== 支付状态 ====================
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

// ==================== 分页 ====================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// ==================== 缓存 ====================
export const CACHE = {
  DEFAULT_TTL: 3600, // 1小时
  SHORT_TTL: 300, // 5分钟
  LONG_TTL: 86400, // 24小时
};

// ==================== API超时 ====================
export const API_TIMEOUT = {
  EXTERNAL_API: 3000, // 3秒
  AI_API: 10000, // 10秒
  DEFAULT: 5000, // 5秒
};

// ==================== 数据库字段名 ====================
export const DB_FIELD = {
  // Prisma字段命名使用snake_case
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  USER_ID: 'user_id',
  TOTAL_MARKET_VALUE: 'totalMarketValue', // 前端使用camelCase
  STOCK_COUNT: 'stockCount',
};

// ==================== HTTP请求 ====================
export const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

// ==================== 前端UI ====================
export const UI = {
  TABLE_PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  LOADING_TEXT: '加载中...',
  EMPTY_TEXT: '暂无数据',
  ERROR_TEXT: '加载失败',
};

// ==================== 安全 ====================
export const SECURITY = {
  BCRYPT_ROUNDS: 10,
  JWT_EXPIRES_IN: '7d',
  API_KEY_PREFIX: 'sk_',
};

// ==================== 规则标记（用于开发检查）====================
export const RULE_TAG = {
  R1_DECIMAL: 'R1', // Decimal转换
  R2_NULLABLE: 'R2', // 可空字段处理
  R3_REDIS: 'R3', // Redis操作注意
  R4_TYPE_GUARD: 'R4', // 类型保护
  R5_DATE: 'R5', // 日期月份索引
  R8_JOIN: 'R8', // JOIN查询
  R9_BATCH: 'R9', // 批量查询避免N+1
  R11_RESPONSE: 'R11', // 统一响应格式
  R12_VIP: 'R12', // VIP拦截处理
  R13_EXTERNAL: 'R13', // 外部API降级
  R14_PAGINATION: 'R14', // 分页参数
  R15_CAMELCASE: 'R15', // 命名规范
  R16_ERROR: 'R16', // 错误处理
  R20_ADMIN: 'R20', // 管理员权限
  R21_IDOR: 'R21', // IDOR保护
  R22_DATA_MASK: 'R22', // 数据脱敏
};

// ==================== 路由路径 ====================
export const ROUTE_PATH = {
  API_PREFIX: '/api/v1',
  INVESTORS: '/investors',
  ARTICLES: '/articles',
  ACCOUNT: '/account',
  ADMIN: '/admin',
  WATCHLIST: '/watchlist',
  NOTIFICATIONS: '/notifications',
};

// ==================== 层级 ====================
export const LAYER = {
  CONTROLLER: 'Controller',
  SERVICE: 'Service',
  REPOSITORY: 'Repository',
  INFRASTRUCTURE: 'Infrastructure',
};

// ==================== 架构约束 ====================
export const ARCHITECTURE_CONSTRAINT = {
  // 禁止的调用关系
  FORBIDDEN_CALLS: {
    CONTROLLER_TO_REPOSITORY: 'Controller → Repository',
    CONTROLLER_TO_INFRASTRUCTURE: 'Controller → Infrastructure',
    SERVICE_TO_PRISMA: 'Service → Prisma Client',
    REPOSITORY_TO_SERVICE: 'Repository → Service',
  },

  // 正确的调用关系
  VALID_CALLS: {
    CONTROLLER_TO_SERVICE: 'Controller → Service',
    SERVICE_TO_REPOSITORY: 'Service → Repository',
    SERVICE_TO_INFRASTRUCTURE: 'Service → Infrastructure',
    REPOSITORY_TO_PRISMA: 'Repository → Prisma Client',
  },
};

export default {
  RESPONSE_CODE,
  RESPONSE_MESSAGE,
  USER_ROLE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAGINATION,
  CACHE,
  API_TIMEOUT,
  DB_FIELD,
  HTTP_METHOD,
  UI,
  SECURITY,
  RULE_TAG,
  ROUTE_PATH,
  LAYER,
  ARCHITECTURE_CONSTRAINT,
};
