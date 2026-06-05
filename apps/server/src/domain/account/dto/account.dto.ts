import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称', maxLength: 50 })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string | null;

  @ApiPropertyOptional({ description: '头像 URL', maxLength: 500 })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: '头像 URL 格式不正确' })
  @MaxLength(500)
  avatar?: string | null;
}
