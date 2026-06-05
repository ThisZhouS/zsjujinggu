/**
 * DTOs for Natural Person Holder queries
 */

import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryHoldingsDto {
  @IsOptional()
  @IsString()
  stockCode?: string;
}

export class QueryDividendsDto {
  @IsOptional()
  @IsString()
  stockCode?: string;
}

export class QueryShareholderListDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;
}
