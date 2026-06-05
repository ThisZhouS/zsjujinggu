/**
 * 数字格式化相关常量和函数
 */

/**
 * 格式化数字（千分位分隔）
 */
export function formatNumber(num: number | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined) return '—';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}%`;
}

/**
 * 格式化金额（自动选择单位：亿/万/元）
 */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';

  if (amount >= 100000000) {
    return `${formatNumber(amount / 100000000, 2)}亿`;
  } else if (amount >= 10000) {
    return `${formatNumber(amount / 10000, 2)}万`;
  } else {
    return formatNumber(amount, 2);
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为 YYYY年MM月DD日
 */
export function formatDateCN(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化持仓数量（万手/手）
 */
export function formatHoldCount(count: number | null | undefined): string {
  if (count === null || count === undefined) return '—';
  if (count >= 10000) {
    return `${formatNumber(count / 10000, 2)}万手`;
  }
  return `${formatNumber(count, 0)}手`;
}

/**
 * 脱敏手机号
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * 脱敏 API Key（仅显示前8位）
 */
export function maskApiKey(apiKey: string | null | undefined): string {
  if (!apiKey) return '—';
  return `${apiKey.slice(0, 8)}...`;
}

/**
 * 市值格式化（亿）
 */
export function formatMarketCap(cap: number | null | undefined): string {
  if (cap === null || cap === undefined) return '—';
  return `${formatNumber(cap / 100000000, 2)}亿`;
}
