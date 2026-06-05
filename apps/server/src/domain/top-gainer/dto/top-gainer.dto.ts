/**
 * 涨幅榜查询 DTO
 */

import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum GainerPeriod {
  ONE_WEEK = '1w',
  TWO_WEEKS = '2w',
  THREE_WEEKS = '3w',
  ONE_MONTH = '1m',
  TWO_MONTHS = '2m',
  THREE_MONTHS = '3m',
  FOUR_MONTHS = '4m',
  SIX_MONTHS = '6m',
  ONE_YEAR = '12m',
}

export class QueryTopGainersDto {
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

  @ApiPropertyOptional({ description: '周期', example: '1w', enum: ['1w', '2w', '3w', '1m', '2m', '3m', '4m', '6m', '12m'] })
  @IsOptional()
  @IsEnum(GainerPeriod)
  period?: GainerPeriod;

  @ApiPropertyOptional({ description: '搜索关键词（股票名称或代码）', example: '平安' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
