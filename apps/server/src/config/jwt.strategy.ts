/**
 * JwtStrategy - JWT 认证策略
 * 验证 JWT Token 并提取用户信息
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  /**
   * 验证 JWT Token
   * @param payload JWT payload
   * @returns 用户信息
   */
  async validate(payload: any) {
    if (!payload.id || !payload.phone) {
      throw new UnauthorizedException('无效的 Token');
    }

    return {
      id: payload.id,
      phone: payload.phone,
      role: payload.role,
      vipExpiresAt: payload.vipExpiresAt,
    };
  }
}
