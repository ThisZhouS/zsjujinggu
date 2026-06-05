/**
 * 创建牛散 DTO
 */

import { IsString, IsOptional, IsBoolean, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvestorDto {
  @ApiPropertyOptional({ description: '牛散姓名', example: '张三' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: '头像 URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ description: '个人简介', example: '知名牛散，擅长价值投资' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ description: '是否跟踪', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isTracked?: boolean;
}
