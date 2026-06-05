/**
 * ExternalApiError - 外部 API 异常
 * 用于处理 mairuiapi、DeepSeek 等外部 API 调用失败
 */

import { HttpException, HttpStatus } from '@nestjs/common';

export class ExternalApiError extends HttpException {
  constructor(
    message: string,
    public readonly source: string,
    public readonly fallbackData?: any,
  ) {
    super(
      {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `外部 API 调用失败：${message}`,
        data: fallbackData ?? null,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
