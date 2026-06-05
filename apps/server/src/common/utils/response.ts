/**
 * 统一响应格式工具
 * R11: { code, message, data }
 */

export function formatResponse<T>(data: T, message: string = 'success', code: number = 200) {
  return {
    code,
    message,
    data,
  };
}
