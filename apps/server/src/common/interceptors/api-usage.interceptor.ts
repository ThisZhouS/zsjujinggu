/**
 * ApiUsageInterceptor - API 使用拦截器
 * 记录 API Key 的使用情况
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiKeyService } from '@/domain/api-key/api-key.service';

@Injectable()
export class ApiUsageInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiUsageInterceptor.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordUsage(request, response.statusCode, startTime);
        },
        error: (error: unknown) => {
          const statusCode = error instanceof HttpException ? error.getStatus() : 500;
          this.recordUsage(request, statusCode, startTime);
        },
      }),
    );
  }

  private recordUsage(request: any, statusCode: number, startTime: number): void {
    const apiKey = request.apiKey as { apiKeyId?: number } | undefined;
    if (!apiKey?.apiKeyId) {
      return;
    }

    void this.apiKeyService.recordUsage(
      apiKey.apiKeyId,
      request.originalUrl || request.url,
      request.method,
      statusCode,
      Date.now() - startTime,
      request.ip,
    ).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`记录 API 使用日志失败: ${message}`);
    });
  }
}
