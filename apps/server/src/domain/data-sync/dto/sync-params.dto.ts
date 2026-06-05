/**
 * 数据同步参数 DTO
 */

import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SyncParamsDto {
  @ApiPropertyOptional({
    description: '股票代码',
    example: '688001',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9]{6,10}$/, {
    message: '股票代码格式不正确',
  })
  stockCode?: string;

  @ApiPropertyOptional({
    description: '开始日期（YYYYMMDD 格式）',
    example: '20240101',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, {
    message: '开始日期格式不正确，应为 YYYYMMDD',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期（YYYYMMDD 格式）',
    example: '20241231',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, {
    message: '结束日期格式不正确，应为 YYYYMMDD',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: '指数代码（用于指数数据）',
    example: '000001.SH',
  })
  @IsOptional()
  @IsString()
  indexCode?: string;

  @ApiPropertyOptional({
    description: '基金代码（用于基金数据）',
    example: '159001',
  })
  @IsOptional()
  @IsString()
  fundCode?: string;

  @ApiPropertyOptional({
    description: '分时级别（5/15/30/60/d/w/m/y）',
    example: 'd',
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({
    description: '除权方式（n/f/b/fr/br）',
    example: 'n',
  })
  @IsOptional()
  @IsString()
  adjustType?: string;

  @ApiPropertyOptional({
    description: '最新条数（用于限制返回数量）',
    example: 100,
  })
  @IsOptional()
  latest?: number;

  @ApiPropertyOptional({
    description: '日期（用于股票池数据，格式 yyyy-MM-dd）',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsString()
  date?: string;
}

export class SyncRequestDto {
  @ApiPropertyOptional({
    description: '模块名称',
    enum: [
      'company_basic_info',
      'shareholder_info',
      'stock_realtime',
      'historical_trading',
      'financial_indicators',
      'limit_down_pool',
      'strong_pool',
      'limit_up_break_pool',
      'limit_up_pool',
      'sub_new_pool',
    ],
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description: '同步参数',
  })
  @IsOptional()
  params?: SyncParamsDto;
}
