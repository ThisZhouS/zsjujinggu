import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { InvestorCategory } from '@/common/utils/investor-name-filter';

export class QueryIndividualShareholderDto {
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

  @ApiPropertyOptional({
    description: '分类：personal=牛散单支持股，institution=机构单支持股',
    example: 'personal',
    default: 'personal',
  })
  @IsOptional()
  @IsString()
  @IsIn(['personal', 'institution'])
  category?: InvestorCategory = 'personal';

  @ApiPropertyOptional({ description: '搜索股东姓名 / 股票代码 / 股票名称', example: '300750' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
