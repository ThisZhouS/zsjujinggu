/**
 * Repository 样板
 * 职责：单表/简单关联数据访问、CRUD操作
 * 禁止：业务逻辑计算、调用Service
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class XxxRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 根据ID查找
   */
  async findById(id: number) {
    return this.prisma.xxx.findUnique({
      where: { id },
    });
  }

  /**
   * 根据唯一键查找
   */
  async findByUniqueKey(key: string) {
    return this.prisma.xxx.findUnique({
      where: { key },
    });
  }

  /**
   * 分页查询
   */
  async findMany(offset: number, limit: number, keyword?: string) {
    const where: Prisma.XxxWhereInput = {};
    if (keyword) {
      where.name = {
        contains: keyword,
        mode: 'insensitive',
      };
    }

    return this.prisma.xxx.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 统计数量
   */
  async count(keyword?: string) {
    const where: Prisma.XxxWhereInput = {};
    if (keyword) {
      where.name = { contains: keyword };
    }

    return this.prisma.xxx.count({ where });
  }

  /**
   * 创建
   */
  async create(data: Prisma.XxxCreateInput) {
    return this.prisma.xxx.create({
      data,
    });
  }

  /**
   * 更新
   */
  async update(id: number, data: Prisma.XxxUpdateInput) {
    return this.prisma.xxx.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除
   */
  async delete(id: number) {
    return this.prisma.xxx.delete({
      where: { id },
    });
  }

  /**
   * Upsert
   * R10: where必须是@@unique或@@id字段
   */
  async upsert(uniqueKey: string, data: Prisma.XxxCreateInput) {
    return this.prisma.xxx.upsert({
      where: { key: uniqueKey },
      create: data,
      update: data,
    });
  }

  /**
   * 批量创建
   */
  async createMany(data: Prisma.XxxCreateInput[]) {
    return this.prisma.xxx.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * 批量更新
   */
  async updateMany(where: Prisma.XxxWhereInput, data: Prisma.XxxUpdateInput) {
    return this.prisma.xxx.updateMany({
      where,
      data,
    });
  }

  /**
   * 包含关联查询
   * R8: JOIN字段必须在include中明确指定
   */
  async findByIdWithRelations(id: number) {
    return this.prisma.xxx.findUnique({
      where: { id },
      include: {
        relatedYyy: true,
      },
    });
  }

  /**
   * 事务操作
   */
  async transactionalUpdate(xxxId: number, yyyData: any[]) {
    return this.prisma.$transaction(async (tx) => {
      // 在事务内执行多个操作
      const xxx = await tx.xxx.update({
        where: { id: xxxId },
        data: { updatedAt: new Date() },
      });

      await tx.yyy.createMany({
        data: yyyData,
      });

      return xxx;
    });
  }

  /**
   * 原始查询（必要时使用）
   */
  async rawQuery(sql: string, params: any[]) {
    return this.prisma.$queryRawUnsafe(sql, ...params);
  }

  /**
   * 创建审计日志
   */
  async createAuditLog(data: AuditLogData) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
