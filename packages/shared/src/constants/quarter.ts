/**
 * 季度计算相关常量和函数
 */

export type Quarter = 'Q1' | 'Q2' |'Q3' | 'Q4';

export interface QuarterDate {
  year: number;
  quarter: Quarter;
  endDate: Date;
}

/**
 * 获取当前季度
 */
export function getCurrentQuarter(): Quarter {
  const month = new Date().getMonth(); // 0-indexed (0=Jan, 11=Dec)
  if (month >= 0 && month <= 2) return 'Q1';
  if (month >= 3 && month <= 5) return 'Q2';
  if (month >= 6 && month <= 8) return 'Q3';
  return 'Q4';
}

/**
 * 获取当前季度的结束日期
 */
export function getQuarterEndDate(year: number, quarter: Quarter): Date {
  const endDates: Record<Quarter, string> = {
    Q1: `${year}-03-31`,
    Q2: `${year}-06-30`,
    Q3: `${year}-09-30`,
    Q4: `${year}-12-31`,
  };
  return new Date(endDates[quarter]);
}

/**
 * 获取季度报告期标识（YYYY-MM-DD 格式）
 */
export function getQuarterReportDate(year: number, quarter: Quarter): string {
  const endDate = getQuarterEndDate(year, quarter);
  return `${year}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
}

/**
 * 获取上期和再上期季度（用于持仓对比）
 */
export function getComparisonQuarters(currentQuarter: Quarter): {
  previous: { year: number; quarter: Quarter };
  previous2: { year: number; quarter: Quarter };
} {
  const year = new Date().getFullYear();
  const quarterOrder: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarterOrder.indexOf(currentQuarter);

  const prevIndex = currentIndex > 0 ? currentIndex - 1 : 3;
  const prev2Index = prevIndex > 0 ? prevIndex - 1 : 3;

  const prevYear = currentIndex > 0 ? year : year - 1;
  const prev2Year = prevIndex > 0 ? year : year - 1;

  return {
    previous: { year: prevYear, quarter: quarterOrder[prevIndex] },
    previous2: { year: prev2Year, quarter: quarterOrder[prev2Index] },
  };
}

/**
 * 财报披露规则
 * 每季度的财报披露截止日期
 */
export const DISCLOSURE_DEADLINES: Record<Quarter, string> = {
  Q1: '04-30', // 4月30日前披露一季度报
  Q2: '08-31', // 8月31日前披露中报
  Q3: '10-31', // 10月31日前披露三季报
  Q4: '04-30', // 次年4月30日前披露年报
};

/**
 * 判断当前是否在披露期内
 */
export function isInDisclosurePeriod(quarter: Quarter): boolean {
  const today = new Date();
  const deadline = new Date(today.getFullYear(), parseInt(DISCLOSURE_DEADLINES[quarter].split('-')[0]) - 1, parseInt(DISCLOSURE_DEADLINES[quarter].split('-')[1]));
  return today <= deadline;
}
