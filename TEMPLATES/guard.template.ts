/**
 * Guard 样板
 * 职责：路由权限验证、请求拦截
 */

import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/domain/user/user.service';

/**
 * JWT认证守卫
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        return false;
      }

      // 将用户信息挂载到request上
      request['user'] = user;
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}

/**
 * VIP会员守卫
 * R12: VIP拦截返回HTTP 200 + code:403
 */
@Injectable()
export class VipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user || !user.isVip) {
      // 设置响应状态码为200，但在body中返回code:403
      const response = context.switchToHttp().getResponse();
      response.status(HttpStatus.OK);

      throw {
        response: {
          code: 403,
          message: '该功能需要VIP会员',
          data: null,
        },
      };
    }

    return true;
  }
}

/**
 * 管理员守卫
 * R20: /admin/*路由需要 JwtAuthGuard + AdminGuard
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user || user.role !== 'ADMIN') {
      return false;
    }

    return true;
  }
}

/**
 * 角色守卫
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
