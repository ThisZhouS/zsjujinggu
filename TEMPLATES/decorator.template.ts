/**
 * Decorator 样板
 * 职责：自定义装饰器用于元数据标记、路由配置等
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/shared/types';

/**
 * 角色装饰器
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

/**
 * 公开路由装饰器（跳过JWT验证）
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * VIP功能装饰器
 */
export const VipOnly = () => SetMetadata('isVipOnly', true);

/**
 * 缓存装饰器
 */
export const Cache = (ttl: number = 3600) => SetMetadata('cacheTTL', ttl);

/**
 * 限流装饰器
 */
export const RateLimit = (limit: number, window: number) =>
  SetMetadata('rateLimit', { limit, window });

/**
 * 请求日志装饰器
 */
export const LogRequest = (message?: string) => SetMetadata('logMessage', message);
