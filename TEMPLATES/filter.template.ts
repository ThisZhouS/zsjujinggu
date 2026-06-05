/**
 * Filter 样板
 * 职责：全局异常处理、错误格式化
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

/**
 * HTTP异常过滤器
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;

    // R11: 统一响应格式
    const responseBody = {
      code: status,
      message: message || 'An error occurred',
      data: null,
    };

    this.logger.error(`${status} - ${message}`);

    response.status(status).json(responseBody);
  }
}

/**
 * 外部API错误过滤器
 * R13: 外部API失败返回缓存数据或空数组
 */
@Catch(ExternalApiError)
export class ExternalApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExternalApiErrorFilter.name);

  catch(exception: ExternalApiError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.warn(`External API failed: ${exception.message}`);

    // 返回降级数据
    response.status(HttpStatus.OK).json({
      code: 200,
      message: 'success',
      data: exception.fallbackData || [],
    });
  }
}

/**
 * 全局异常过滤器
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // 记录错误堆栈
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      code: status,
      message,
      data: null,
    });
  }
}

/**
 * 外部API错误类
 */
export class ExternalApiError extends Error {
  constructor(
    message: string,
    public fallbackData?: any,
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}
