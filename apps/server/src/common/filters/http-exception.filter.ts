/**
 * HttpExceptionFilter - 全局异常过滤器
 * 统一处理所有异常，返回标准格式响应
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ExternalApiError } from './external-api.error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 检查响应是否已经发送
    if (response.headersSent) {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let data = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        code = resp.code ?? status;
        message = resp.message ?? message;
        data = resp.data ?? null;
      } else {
        message = exceptionResponse as string;
      }

      // ExternalApiError 降级处理：返回 200 + fallbackData
      if (exception instanceof ExternalApiError) {
        status = HttpStatus.OK;
        code = HttpStatus.OK;
        data = (exception as ExternalApiError).fallbackData ?? null;
      }
    }

    const logPayload = {
      status,
      code,
      message,
      path: `${request.method} ${request.url}`,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logPayload, exception instanceof Error ? exception.stack : undefined);
    } else if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(logPayload);
    }

    response.status(status).json({
      code,
      message,
      data,
    });
  }
}
