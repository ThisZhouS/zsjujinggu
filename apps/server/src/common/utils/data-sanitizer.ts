/**
 * 数据脱敏工具
 * R22: 敏感数据脱敏
 */

/**
 * 手机号脱敏：13812345678 -> 138****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) {
    return phone;
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * API Key 脱敏：仅返回前 8 位
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) {
    return key;
  }
  return key.substring(0, 8) + '...';
}

/**
 * 计数值清理：确保为非负整数
 */
export function sanitizeCount(value: number | bigint | null | undefined): number {
  if (value == null) {
    return 0;
  }
  const num = Number(value);
  if (num < 0) {
    return 0;
  }
  return Math.floor(num);
}

/**
 * 价格值清理：确保为非负数
 */
export function sanitizePrice(value: number | null | undefined): number | null {
  if (value == null || value < 0) {
    return null;
  }
  return value;
}
