/**
 * 登录 DTO
 */

import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SMS_CODE_PURPOSES = ['register', 'reset-password'] as const;
export type SmsCodePurpose = (typeof SMS_CODE_PURPOSES)[number];
export const EMAIL_CODE_PURPOSES = ['register'] as const;
export type EmailCodePurpose = (typeof EMAIL_CODE_PURPOSES)[number];

export class LoginDto {
  @ApiProperty({ description: '手机号', example: '13812345678' })
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  @MaxLength(11)
  phone: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  password: string;

  @ApiPropertyOptional({ description: '设备标识', example: 'iOS-17.0' })
  @IsOptional()
  @IsString()
  device?: string;
}

/**
 * 注册 DTO
 */
export class RegisterDto {
  @ApiProperty({ description: '手机号', example: '13812345678' })
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  @MaxLength(11)
  phone: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  password: string;

  @ApiProperty({ description: '邮箱', example: 'user@163.com' })
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiProperty({ description: '短信验证码', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: '短信验证码格式不正确' })
  @MinLength(6)
  @MaxLength(6)
  smsCode: string;

  @ApiProperty({ description: '邮箱验证码', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: '邮箱验证码格式不正确' })
  @MinLength(6)
  @MaxLength(6)
  emailCode: string;

  @ApiPropertyOptional({ description: '用户名', example: 'zhangsan' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ description: '昵称', example: '张三' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}

/**
 * 发送短信验证码 DTO
 */
export class SendSmsCodeDto {
  @ApiProperty({ description: '手机号', example: '13812345678' })
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  @MaxLength(11)
  phone: string;

  @ApiPropertyOptional({
    description: '验证码用途',
    enum: SMS_CODE_PURPOSES,
    default: 'register',
  })
  @IsOptional()
  @IsIn(SMS_CODE_PURPOSES)
  purpose?: SmsCodePurpose;
}

/**
 * 发送邮箱验证码 DTO
 */
export class SendEmailCodeDto {
  @ApiProperty({ description: '邮箱', example: 'user@163.com' })
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiPropertyOptional({
    description: '验证码用途',
    enum: EMAIL_CODE_PURPOSES,
    default: 'register',
  })
  @IsOptional()
  @IsIn(EMAIL_CODE_PURPOSES)
  purpose?: EmailCodePurpose;
}

/**
 * 重置密码 DTO
 */
export class ResetPasswordDto {
  @ApiProperty({ description: '手机号', example: '13812345678' })
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  @MaxLength(11)
  phone: string;

  @ApiProperty({ description: '短信验证码', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: '短信验证码格式不正确' })
  @MinLength(6)
  @MaxLength(6)
  smsCode: string;

  @ApiProperty({ description: '新密码', example: 'newPassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  newPassword: string;
}
