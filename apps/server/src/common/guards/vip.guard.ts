/**
 * VipGuard - 历史命名保留，当前按“登录用户可访问”处理。
 * 注意：业务拦截返回 HTTP 200 + code:403，而非 HTTP 403。
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Injectable()
export class VipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      this.throwLoginRequired();
    }

    const freshUser = await this.prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      select: {
        id: true,
      },
    });

    if (!freshUser) {
      this.throwLoginRequired();
    }

    return true;
  }

  private throwLoginRequired(): never {
    throw new HttpException(
      {
        code: 403,
        message: '该功能需要登录后访问',
        data: {
          requiredPlan: 'user',
        },
      },
      200,
    );
  }
}
