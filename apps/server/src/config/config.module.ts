/**
 * ConfigModule - 配置模块
 * 导入和导出 ConfigModule
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
