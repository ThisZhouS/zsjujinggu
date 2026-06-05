/**
 * 查询牛散 DTO
 */

import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { InvestorCategory } from '@/common/utils/investor-name-filter';

export class QueryInvestorDto {
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

  @ApiPropertyOptional({ description: '搜索关键词（牛散姓名）', example: '张' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '排序字段；牛散列表支持 totalMarketValue/stockCount/name；同姓分组额外支持 surname/memberCount',
    example: 'totalMarketValue',
    enum: ['totalMarketValue', 'stockCount', 'name', 'surname', 'memberCount'],
  })
  @IsOptional()
  @IsString()
  sort?: string = 'totalMarketValue';

  @ApiPropertyOptional({ description: '排序方向', example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: '股东类别',
    example: 'personal',
    enum: ['personal', 'institution'],
    default: 'personal',
  })
  @IsOptional()
  @IsIn(['personal', 'institution'])
  category?: InvestorCategory = 'personal';
}
