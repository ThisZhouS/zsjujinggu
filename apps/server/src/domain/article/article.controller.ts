/**
 * Article Controller - 文章路由控制层
 * 负责路由定义、参数验证、调用 Service、格式化响应
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'node:crypto';
import { ArticleService } from './article.service';
import {
  ArticleTopicType,
  AutomationProviderType,
  CreateArticleDto,
  QueryArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ArticleUploadGuard } from '@/common/guards/article-upload.guard';
import { formatResponse } from '@/common/utils/response';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { diskStorage } = require('multer');

const articleUploadDir = join(process.cwd(), 'uploads', 'articles');

interface ArticleJwtRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: string;
    canUploadArticles?: boolean;
  };
}

function ensureArticleUploadDir() {
  if (!existsSync(articleUploadDir)) {
    mkdirSync(articleUploadDir, { recursive: true });
  }
}

@ApiTags('文章管理')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  private parseAutomationProvider(provider: string): AutomationProviderType {
    const normalized = String(provider ?? '').trim().toLowerCase();
    switch (normalized) {
      case 'openclaw':
      case 'open_claw':
        return AutomationProviderType.OPENCLAW;
      case 'harness':
        return AutomationProviderType.HARNESS;
      default:
        throw new BadRequestException(`不支持的自动化新闻来源: ${provider}`);
    }
  }

  private ensureAutomationIngestKey(req: Request) {
    const expectedKey = process.env.NEWS_AUTOMATION_KEY?.trim();
    if (!expectedKey) {
      throw new ForbiddenException('NEWS_AUTOMATION_KEY 未配置，自动化新闻接口暂不可用');
    }

    const providedKey = String(req.headers['x-news-ingest-key'] ?? '').trim();
    if (!providedKey || providedKey !== expectedKey) {
      throw new ForbiddenException('自动化新闻上传密钥无效');
    }
  }

  private async ingestAutomationNews(
    provider: AutomationProviderType,
    req: Request,
    payload: unknown,
  ) {
    this.ensureAutomationIngestKey(req);
    const result = await this.articleService.upsertAutomationNewsBatch(provider, payload);

    if (result.total === 1) {
      return formatResponse(result.list[0]);
    }

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        created: result.created,
        updated: result.updated,
      },
    });
  }

  @Get()
  @ApiOperation({ summary: '获取文章列表' })
  async getList(@Query() query: QueryArticleDto) {
    const {
      page,
      page_size,
      category,
      topicType,
      keyword,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    } = query;
    const result = await this.articleService.getList({
      page: page!,
      pageSize: page_size!,
      category,
      topicType,
      keyword,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page: page,
        page_size: page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户发布的文章列表' })
  async getMine(
    @Req() req: ArticleJwtRequest,
    @Query() query: QueryArticleDto,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('未登录');
    }

    const {
      page,
      page_size,
      category,
      topicType,
      keyword,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    } = query;
    const result = await this.articleService.getMine(userId, {
      page: page!,
      pageSize: page_size!,
      category,
      topicType,
      keyword,
      relatedInvestorId,
      relatedStockCode,
      relatedExecutiveName,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page,
        page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }

  @Get('investor/:investorId/news')
  @ApiOperation({ summary: '获取牛散相关新闻列表' })
  async getInvestorNews(
    @Param('investorId', ParseIntPipe) investorId: number,
    @Query() query: QueryArticleDto,
  ) {
    const { page, page_size, keyword } = query;
    const result = await this.articleService.getList({
      page: page!,
      pageSize: page_size!,
      topicType: ArticleTopicType.INVESTOR,
      keyword,
      relatedInvestorId: investorId,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page,
        page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }

  @Get('executive/news')
  @ApiOperation({ summary: '获取高管相关新闻列表' })
  async getExecutiveNews(@Query() query: QueryArticleDto) {
    const { page, page_size, keyword, relatedStockCode, relatedExecutiveName } = query;
    const result = await this.articleService.getList({
      page: page!,
      pageSize: page_size!,
      topicType: ArticleTopicType.EXECUTIVE,
      keyword,
      relatedStockCode,
      relatedExecutiveName,
    });

    return formatResponse({
      list: result.list,
      meta: {
        total: result.total,
        page,
        page_size,
        total_pages: Math.ceil(result.total / (page_size ?? 20)),
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    const article = await this.articleService.getDetail(id);
    return formatResponse(article);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ArticleUploadGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建文章（管理员/授权用户）' })
  async create(@Req() req: ArticleJwtRequest, @Body() dto: CreateArticleDto) {
    if (!req.user) {
      throw new BadRequestException('未登录');
    }

    const article = await this.articleService.create(dto, req.user);
    return formatResponse(article);
  }

  @Post('automation/openclaw/news')
  @ApiOperation({ summary: 'OpenClaw 自动化上传新闻（兼容单条/批量与别名字段）' })
  async ingestOpenClawNews(@Req() req: Request, @Body() payload: unknown) {
    return this.ingestAutomationNews(
      AutomationProviderType.OPENCLAW,
      req,
      payload,
    );
  }

  @Post('automation/harness/news')
  @ApiOperation({ summary: 'Harness 自动化上传新闻（兼容单条/批量与别名字段）' })
  async ingestHarnessNews(@Req() req: Request, @Body() payload: unknown) {
    return this.ingestAutomationNews(
      AutomationProviderType.HARNESS,
      req,
      payload,
    );
  }

  @Post('automation/:provider/news')
  @ApiOperation({ summary: '按 provider 自动化上传新闻（兼容 OpenClaw/Harness）' })
  async ingestProviderNews(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Body() payload: unknown,
  ) {
    return this.ingestAutomationNews(this.parseAutomationProvider(provider), req, payload);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, ArticleUploadGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureArticleUploadDir();
          callback(null, articleUploadDir);
        },
        filename: (_req, file, callback) => {
          const extension = extname(file.originalname).toLowerCase() || '.jpg';
          const safeExtension = extension.length <= 10 ? extension : '.jpg';
          callback(
            null,
            `article-${Date.now()}-${randomUUID()}${safeExtension}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('仅支持上传图片文件'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: '上传文章封面图（管理员/授权用户）' })
  async uploadCover(@UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    return formatResponse({
      url: `/uploads/articles/${file.filename}`,
      filename: file.filename,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新文章（管理员/作者）' })
  async update(
    @Req() req: ArticleJwtRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleDto,
  ) {
    if (!req.user) {
      throw new BadRequestException('未登录');
    }

    const article = await this.articleService.update(id, dto, req.user);
    return formatResponse(article);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除文章（管理员/作者）' })
  async delete(
    @Req() req: ArticleJwtRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!req.user) {
      throw new BadRequestException('未登录');
    }

    await this.articleService.delete(id, req.user);
    return formatResponse(null);
  }
}
