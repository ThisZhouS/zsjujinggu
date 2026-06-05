/**
 * 查询持仓变动 DTO
 * 用于增持/减持/新进查询
 */

import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum HoldingChangeType {
  INCREASE = 'increase',
  DECREASE = 'decrease',
  NEW = 'new',
}

export enum HoldingNewViewMode {
  DETAIL = 'detail',
  STOCK = 'stock',
}

export class QueryHoldingChangeDto {
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

  @ApiPropertyOptional({ description: '搜索关键词（股票名称或牛散姓名）', example: '平安' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '报告期（YYYY-MM-DD）', example: '2025-12-31' })
  @IsOptional()
  @IsString()
  reportDate?: string;

  @ApiPropertyOptional({
    description: '新进榜展示模式',
    example: 'stock',
    enum: ['detail', 'stock'],
    default: 'detail',
  })
  @IsOptional()
  @IsEnum(HoldingNewViewMode)
  mode?: HoldingNewViewMode = HoldingNewViewMode.DETAIL;
}

export class QueryCommonHoldingDto {
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

  @ApiPropertyOptional({ description: '牛散 ID 列表（逗号分隔，至少 2 个）', example: '1,2,3' })
  @IsOptional()
  @IsString()
  investorIds?: string;
}
