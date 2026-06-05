/**
 * 查询股票 DTO
 */

import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryStockDto {
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

  @ApiPropertyOptional({ description: '搜索关键词（股票名称或代码）', example: '平安' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '市场', example: 'SH', enum: ['SH', 'SZ', 'BJ'] })
  @IsOptional()
  @IsEnum(['SH', 'SZ', 'BJ'])
  market?: string;

  @ApiPropertyOptional({ description: '排序字段', example: 'changePercent', enum: ['changePercent', 'latestPrice', 'volume', 'turnover'] })
  @IsOptional()
  @IsString()
  sort?: string = 'changePercent';
}
