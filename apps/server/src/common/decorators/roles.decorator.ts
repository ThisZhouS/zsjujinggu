/**
 * Roles Decorator - 角色装饰器
 * 用于标记路由需要的用户角色
 */

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 * @param roles 允许访问的角色列表
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
