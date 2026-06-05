/**
 * ArticleUploadGuard - 文章上传权限守卫
 * 允许管理员或已授权用户上传/发布文章
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Injectable()
export class ArticleUploadGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('未登录');
    }

    const freshUser = await this.prisma.user.findUnique({
      where: { id: BigInt(user.id) },
      select: {
        role: true,
        canUploadArticles: true,
      },
    });

    if (!freshUser) {
      throw new ForbiddenException('未登录');
    }

    if (String(freshUser.role).toUpperCase() === 'ADMIN') {
      return true;
    }

    if (Boolean(freshUser.canUploadArticles)) {
      return true;
    }

    throw new ForbiddenException('未获得文章上传权限');
  }
}
