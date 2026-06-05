/**
 * Article Module - 文章模块
 * 负责依赖注入、模块导出
 */

import { Module } from '@nestjs/common';
import { ArticleUploadGuard } from '@/common/guards/article-upload.guard';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { ArticleRepository } from './article.repository';

@Module({
  controllers: [ArticleController],
  providers: [ArticleService, ArticleRepository, ArticleUploadGuard],
  exports: [ArticleService, ArticleRepository],
})
export class ArticleModule {}
