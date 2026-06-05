import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// ==================== 环境自检 ====================
function getConnectionTarget(value?: string): string {
  if (!value) {
    return '未配置';
  }

  const target = value.includes('@') ? value.split('@').pop() : value.replace(/^[^:]+:\/\//, '');
  return target || '已配置';
}

function checkEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'MAIRUI_API_KEY',
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:');
    missing.forEach((envVar) => {
      console.error(`   - ${envVar}`);
    });
    console.error('\n📝 请在 .env 文件中配置这些变量');
    console.error('参考 .env.example 文件');
    process.exit(1);
  }

  console.log('✅ 后端环境变量检查通过');
  console.log(`   Database: ${getConnectionTarget(process.env.DATABASE_URL)}`);
  console.log(`   Redis: ${getConnectionTarget(process.env.REDIS_URL)}`);
  console.log(`   Port: ${process.env.PORT || 4000}`);

  if (process.env.NODE_ENV !== 'production') {
    console.log('📋 开发规则提醒:');
    console.log('   R1: Decimal/BigInt必须转换为number');
    console.log('   R9: 使用批量查询避免N+1');
    console.log('   R11: 统一响应格式 { code, message, data }');
    console.log('   R12: 登录权限拦截返回HTTP 200 + code:403');
    console.log('   R21: IDOR保护：验证resource.userId === currentUser.id');
    console.log('   R23: /admin/*写操作需记录审计日志');
  }
}

async function bootstrap() {
  // 运行环境自检
  checkEnvironment();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads',
  });

  // 全局路由前缀 /api/v1
  app.setGlobalPrefix('api/v1');

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((item) => item.trim())
    : true;
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  // Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('掘金股 API')
    .setDescription('牛散持仓跟踪、涨幅榜分析、财经资讯 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 4000);

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
