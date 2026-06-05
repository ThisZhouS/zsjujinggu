/**
 * DataApi Module - 对外数据 API 模块
 */

import { Module } from '@nestjs/common';
import { DataApiController } from './data-api.controller';
import { DataApiService } from './data-api.service';
import { ApiKeyModule } from '@/domain/api-key/api-key.module';
import { ApiUsageInterceptor } from '@/common/interceptors/api-usage.interceptor';

@Module({
  imports: [ApiKeyModule],
  controllers: [DataApiController],
  providers: [DataApiService, ApiUsageInterceptor],
  exports: [DataApiService],
})
export class DataApiModule {}
