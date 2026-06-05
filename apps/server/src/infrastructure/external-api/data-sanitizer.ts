/**
 * Data Sanitizer - 数据清洗工具
 * 提供敏感数据脱敏、数据格式化功能
 */

/**
 * 手机号脱敏
 * @param phone 手机号
 * @returns 脱敏后的手机号（138****1234）
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) {
    return phone;
  }
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 邮箱脱敏
 * @param email 邮箱地址
 * @returns 脱敏后的邮箱
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [username, domain] = email.split('@');
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
  return `${maskedUsername}@${domain}`;
}

/**
 * 格式化数字（带千分位）
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化金额（保留两位小数）
 * @param amount 金额
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

/**
 * 格式化百分比
 * @param value 值
 * @param decimals 小数位数
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 清理字符串（去除空白和特殊字符）
 * @param str 输入字符串
 * @returns 清理后的字符串
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
}
