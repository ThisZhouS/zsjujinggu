/**
 * LoggingInterceptor - 全局日志拦截器
 * 记录请求耗时、请求参数、响应状态
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        console.log(
          `[${new Date().toISOString()}] ${request.method} ${request.url}`,
          {
            status: response.statusCode,
            duration: `${duration}ms`,
          },
        );
      }),
    );
  }
}
