/**
 * Interceptor 样板
 * 职责：请求/响应拦截、日志记录、缓存、性能监控
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * 日志拦截器
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const now = Date.now();

    console.log(`[${method}] ${url} - ${ip}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        console.log(`[${method}] ${url} - ${response.statusCode} - ${duration}ms`);
      }),
    );
  }
}

/**
 * API使用统计拦截器
 */
@Injectable()
export class ApiUsageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, user } = request;

    return next.handle().pipe(
      tap(() => {
        // 记录API调用
        if (user) {
          this.logApiUsage(user.id, method, url);
        }
      }),
    );
  }

  private async logApiUsage(userId: number, method: string, url: string) {
    // 异步记录，不阻塞响应
    // await apiUsageRepository.create({ userId, method, url, timestamp: new Date() });
  }
}

/**
 * 缓存拦截器
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const cacheKey = this.getCacheKey(request);

    // 检查缓存
    return from(this.redisService.get(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(JSON.parse(cached));
        }
        return next.handle().pipe(
          tap((data) => {
            // 写入缓存
            this.redisService.set(cacheKey, JSON.stringify(data), 3600);
          }),
        );
      }),
    );
  }

  private getCacheKey(request: Request): string {
    return `cache:${request.method}:${request.url}`;
  }
}

/**
 * 转换拦截器
 * 统一响应格式
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // R11: 统一响应格式
        if (data && typeof data === 'object' && 'code' in data) {
          return data;
        }
        return {
          code: 200,
          message: 'success',
          data,
        };
      }),
    );
  }
}
