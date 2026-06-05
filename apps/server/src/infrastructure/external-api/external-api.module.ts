/**
 * ExternalApiModule - 外部 API 模块
 * 封装 mairuiapi、DeepSeek 等外部服务
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MairuiService } from './mairui.service';
import { DeepseekService } from './deepseek.service';
import { RedisModule } from '@/infrastructure/redis/redis.module';

@Global()
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [MairuiService, DeepseekService],
  exports: [MairuiService, DeepseekService],
})
export class ExternalApiModule {}
