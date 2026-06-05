/**
 * 搜索查询 DTO
 */

import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchDto {
  @ApiPropertyOptional({ description: '搜索关键词', example: '000001' })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: '每页数量，默认 10', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 10;
}
