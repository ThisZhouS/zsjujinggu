import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsString, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryWatchlistDto {
  @ApiPropertyOptional({ description: '页码，从 1 开始', example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: '每页数量，最大 100', example: 20, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size: number = 20;
}

export class AddWatchlistDto {
  @ApiProperty({ description: '股票代码', example: '300750.SZ' })
  @IsString()
  @Matches(/^\d{6}(\.(SH|SZ|BJ))?$/i, { message: '股票代码格式不正确' })
  stockCode: string;
}

export class ReorderWatchlistDto {
  @ApiProperty({ description: '排序后的股票代码列表', example: ['300750.SZ', '600519.SH'] })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @Matches(/^\d{6}(\.(SH|SZ|BJ))?$/i, {
    each: true,
    message: '股票代码格式不正确',
  })
  stockCodes: string[];
}
