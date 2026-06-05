export function compareText(left?: string | null, right?: string | null): number {
  return (left ?? '').localeCompare(right ?? '', 'zh-CN');
}

export function compareNumber(left?: number | null, right?: number | null): number {
  return Number(left ?? Number.NEGATIVE_INFINITY) - Number(right ?? Number.NEGATIVE_INFINITY);
}
