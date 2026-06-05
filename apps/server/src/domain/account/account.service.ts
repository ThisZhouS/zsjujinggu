/**
 * AccountService - 用户账户业务逻辑层
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AccountService {
  constructor(private accountRepository: AccountRepository) {}

  /**
   * 获取账户信息
   */
  async getProfile(userId: number) {
    const profile = await this.accountRepository.findById(userId);
    if (!profile) {
      throw new BadRequestException('用户不存在');
    }
    return profile;
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
  ) {
    return this.accountRepository.updateProfile(userId, data);
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.accountRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 验证旧密码（需要从数据库获取 password hash）
    const prisma = this.accountRepository['prisma'];
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      throw new BadRequestException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, dbUser.password);
    if (!isPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    // R18: bcrypt.hash 需要 saltRounds 参数
    const newHash = await bcrypt.hash(newPassword, 10);
    await this.accountRepository.updatePassword(userId, newHash);
  }
}
