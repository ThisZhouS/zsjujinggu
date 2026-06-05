/**
 * AdminGuard - 管理员权限守卫
 * 验证用户角色是否为 ADMIN
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未登录');
    }

    if (String(user.role).toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}
