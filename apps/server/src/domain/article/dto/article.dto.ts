/**
 * 文章查询 DTO
 */

import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ArticleCategory {
  BUFFETT = 'buffett',
  ARKK = 'arkk',
  GENERAL = 'general',
}

export enum ArticleTopicType {
  GENERAL = 'general',
  INVESTOR = 'investor',
  EXECUTIVE = 'executive',
}

export enum AutomationProviderType {
  OPENCLAW = 'openclaw',
  HARNESS = 'harness',
}

const optionalTrim = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

class ArticleTargetFieldsDto {
  @ApiPropertyOptional({
    description: '文章主题类型',
    example: 'investor',
    enum: ['general', 'investor', 'executive'],
    default: 'general',
  })
  @IsOptional()
  @IsEnum(ArticleTopicType)
  topicType?: ArticleTopicType = ArticleTopicType.GENERAL;

  @ApiPropertyOptional({ description: '关联牛散 ID', example: 1078 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  relatedInvestorId?: number;

  @ApiPropertyOptional({ description: '关联股票代码', example: '300750' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(10)
  relatedStockCode?: string;

  @ApiPropertyOptional({ description: '关联高管姓名', example: '张三' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(100)
  relatedExecutiveName?: string;

  @ApiPropertyOptional({ description: '新闻原始来源链接', example: 'https://example.com/news/1' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @IsUrl({ require_protocol: true }, { message: '来源链接格式不正确' })
  @MaxLength(500)
  sourceUrl?: string;

  @ApiPropertyOptional({ description: '自动化来源附加元数据，建议传 JSON 字符串', example: '{"crawler":"openclaw"}' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(5000)
  sourceMetadata?: string;
}

export class QueryArticleDto {
  @ApiPropertyOptional({ description: '页码，从 1 开始', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量，默认 20，最大 100', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;

  @ApiPropertyOptional({ description: '文章分类', example: 'buffett', enum: ['buffett', 'arkk', 'general'] })
  @IsOptional()
  @IsEnum(ArticleCategory)
  category?: ArticleCategory;

  @ApiPropertyOptional({
    description: '文章主题类型',
    example: 'investor',
    enum: ['general', 'investor', 'executive'],
  })
  @IsOptional()
  @IsEnum(ArticleTopicType)
  topicType?: ArticleTopicType;

  @ApiPropertyOptional({ description: '搜索关键词（标题）', example: '巴菲特' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ description: '关联牛散 ID', example: 1078 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  relatedInvestorId?: number;

  @ApiPropertyOptional({ description: '关联股票代码', example: '300750' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(10)
  relatedStockCode?: string;

  @ApiPropertyOptional({ description: '关联高管姓名', example: '张三' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(100)
  relatedExecutiveName?: string;
}

/**
 * 创建文章 DTO
 */
export class CreateArticleDto extends ArticleTargetFieldsDto {
  @ApiPropertyOptional({ description: '文章标题', example: '巴菲特投资理念' })
  @Transform(optionalTrim)
  @IsString()
  @IsNotEmpty({ message: '文章标题不能为空' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '文章内容', example: '...' })
  @Transform(optionalTrim)
  @IsString()
  @IsNotEmpty({ message: '文章内容不能为空' })
  @MaxLength(20000)
  content: string;

  @ApiPropertyOptional({ description: '文章摘要', example: '巴菲特的核心价值投资理念' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ description: '封面图 URL', example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/articles\/).+/i, {
    message: '封面图必须是 http(s) URL 或 /uploads/articles/ 路径',
  })
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional({ description: '作者', example: '掘金股' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(50)
  author?: string;

  @ApiPropertyOptional({ description: '文章分类', example: 'buffett', enum: ['buffett', 'arkk', 'general'] })
  @IsOptional()
  @IsEnum(ArticleCategory)
  category?: ArticleCategory;

  @ApiPropertyOptional({ description: '发布日期', example: '2026-04-28' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @IsDateString({}, { message: '发布日期格式不正确' })
  publishDate?: string;

  @ApiPropertyOptional({ description: '是否置顶', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: '标签列表', example: ['价值投资', '巴菲特'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}

/**
 * 更新文章 DTO
 */
export class UpdateArticleDto extends ArticleTargetFieldsDto {
  @ApiPropertyOptional({ description: '文章标题', example: '巴菲特投资理念' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @IsNotEmpty({ message: '文章标题不能为空' })
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '文章内容', example: '...' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @IsNotEmpty({ message: '文章内容不能为空' })
  @MaxLength(20000)
  content?: string;

  @ApiPropertyOptional({ description: '文章摘要', example: '巴菲特的核心价值投资理念' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ description: '封面图 URL', example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/articles\/).+/i, {
    message: '封面图必须是 http(s) URL 或 /uploads/articles/ 路径',
  })
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional({ description: '作者', example: '掘金股' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(50)
  author?: string;

  @ApiPropertyOptional({ description: '文章分类', example: 'buffett', enum: ['buffett', 'arkk', 'general'] })
  @IsOptional()
  @IsEnum(ArticleCategory)
  category?: ArticleCategory;

  @ApiPropertyOptional({ description: '是否置顶', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: '发布日期', example: '2026-04-28' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @IsDateString({}, { message: '发布日期格式不正确' })
  publishDate?: string;

  @ApiPropertyOptional({ description: '标签列表', example: ['价值投资', '巴菲特'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];
}

export class AutomationNewsDto extends ArticleTargetFieldsDto {
  @ApiPropertyOptional({ description: '自动化新闻标题', example: '张三增持某股后继续加仓' })
  @Transform(optionalTrim)
  @IsString()
  @IsNotEmpty({ message: '自动化新闻标题不能为空' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '自动化新闻正文', example: '...' })
  @Transform(optionalTrim)
  @IsString()
  @IsNotEmpty({ message: '自动化新闻正文不能为空' })
  @MaxLength(20000)
  content: string;

  @ApiPropertyOptional({ description: '自动化新闻摘要', example: '摘要内容' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ description: '封面图 URL', example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/articles\/).+/i, {
    message: '封面图必须是 http(s) URL 或 /uploads/articles/ 路径',
  })
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional({ description: '作者', example: 'OpenClaw Bot' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @MaxLength(50)
  author?: string;

  @ApiPropertyOptional({ description: '文章分类', example: 'general', enum: ['buffett', 'arkk', 'general'] })
  @IsOptional()
  @IsEnum(ArticleCategory)
  category?: ArticleCategory;

  @ApiPropertyOptional({ description: '发布日期', example: '2026-05-08' })
  @IsOptional()
  @Transform(optionalTrim)
  @IsString()
  @IsDateString({}, { message: '发布日期格式不正确' })
  publishDate?: string;

  @ApiPropertyOptional({ description: '标签列表', example: ['牛散', '高管增持'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '外部唯一标识，用于幂等更新', example: 'openclaw-20260508-001' })
  @Transform(optionalTrim)
  @IsString()
  @IsNotEmpty({ message: '外部唯一标识不能为空' })
  @MaxLength(191)
  externalId: string;
}
