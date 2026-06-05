/**
 * AccountRepository - 用户账户数据访问层
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { maskPhone } from '@/common/utils/data-sanitizer';

export interface AccountProfile {
  id: number;
  phone: string;
  phoneMasked: string;
  email?: string | null;
  emailVerifiedAt?: Date | null;
  username?: string | null;
  nickname?: string | null;
  role: string;
  canUploadArticles: boolean;
  canAccessVideos: boolean;
  vipExpiresAt?: Date | null;
  avatar?: string | null;
  createdAt: Date;
}

@Injectable()
export class AccountRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据用户 ID 获取账户信息
   */
  async findById(userId: number): Promise<AccountProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: Number(user.id),
      phone: user.phone,
      phoneMasked: maskPhone(user.phone),
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      canUploadArticles: user.canUploadArticles,
      canAccessVideos: user.canAccessVideos,
      vipExpiresAt: user.vipExpiresAt,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  /**
   * 更新用户资料
   */
  async updateProfile(
    userId: number,
    data: {
      nickname?: string | null;
      avatar?: string | null;
    },
  ): Promise<AccountProfile> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: Number(user.id),
      phone: user.phone,
      phoneMasked: maskPhone(user.phone),
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      canUploadArticles: user.canUploadArticles,
      canAccessVideos: user.canAccessVideos,
      vipExpiresAt: user.vipExpiresAt,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  /**
   * 修改密码
   */
  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }
}
