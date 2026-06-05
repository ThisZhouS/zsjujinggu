/**
 * AuthController - 认证路由控制层
 * 负责登录、注册、发送短信验证码
 */

import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ResetPasswordDto, SendEmailCodeDto, SendSmsCodeDto } from './dto/auth.dto';
import { formatResponse } from '@/common/utils/response';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.phone, dto.password);
    return formatResponse(result);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(
      dto.phone,
      dto.password,
      dto.email,
      dto.smsCode,
      dto.emailCode,
      dto.username,
      dto.nickname,
    );
    return formatResponse(result);
  }

  @Post('sms-code')
  @ApiOperation({ summary: '发送短信验证码' })
  async sendSmsCode(@Body() dto: SendSmsCodeDto) {
    const result = await this.authService.sendSmsCode(dto.phone, dto.purpose);
    return formatResponse(result);
  }

  @Post('email-code')
  @ApiOperation({ summary: '发送邮箱验证码' })
  async sendEmailCode(@Body() dto: SendEmailCodeDto) {
    const result = await this.authService.sendEmailCode(dto.email, dto.purpose);
    return formatResponse(result);
  }

  @Post('reset-password')
  @ApiOperation({ summary: '通过短信验证码重置密码' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto.phone, dto.smsCode, dto.newPassword);
    return formatResponse(result);
  }
}
