/**
 * Service 样板
 * 职责：业务逻辑、数据计算、跨Repository聚合、调用Infrastructure
 * 禁止：直接使用Prisma Client（必须通过Repository）
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { XxxRepository } from './xxx.repository';
import { YyyRepository } from '../yyy/yyy.repository';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { MairuiService } from '@/infrastructure/external-api/mairui.service';
import { CreateXxxDto, UpdateXxxDto } from './dto/xxx.dto';

@Injectable()
export class XxxService {
  constructor(
    private readonly xxxRepository: XxxRepository,
    private readonly yyyRepository: YyyRepository,
    private readonly redisService: RedisService,
    private readonly mairuiService: MairuiService,
  ) {}

  /**
   * 获取分页列表
   */
  async findAll(page: number, pageSize: number, keyword?: string) {
    const offset = (page - 1) * pageSize;

    // R9: 批量查询避免N+1
    const [items, total] = await Promise.all([
      this.xxxRepository.findMany(offset, pageSize, keyword),
      this.xxxRepository.count(keyword),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取单个详情
   */
  async findOne(id: number) {
    return this.xxxRepository.findById(id);
  }

  /**
   * 创建
   */
  async create(userId: number, createDto: CreateXxxDto) {
    // 业务逻辑验证
    if (!this.validateInput(createDto)) {
      throw new BadRequestException('Invalid input');
    }

    const result = await this.xxxRepository.create({
      ...createDto,
      userId,
    });

    // 清除缓存
    await this.clearCache(userId);

    return result;
  }

  /**
   * 更新
   */
  async update(id: number, userId: number, updateDto: UpdateXxxDto) {
    // 检查资源是否存在
    const existing = await this.xxxRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    // R21: IDOR保护 - 验证资源归属
    if (existing.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const result = await this.xxxRepository.update(id, updateDto);

    // 清除缓存
    await this.clearCache(userId);

    return result;
  }

  /**
   * 删除
   */
  async delete(id: number, userId: number) {
    const existing = await this.xxxRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.xxxRepository.delete(id);

    await this.clearCache(userId);
  }

  /**
   * 跨Repository聚合业务逻辑
   */
  async getAggregateData(id: number) {
    // 批量查询避免N+1
    const [xxx, yyyList] = await Promise.all([
      this.xxxRepository.findById(id),
      this.yyyRepository.findByXxxId(id),
    ]);

    if (!xxx) {
      return null;
    }

    // R1: Decimal类型转换
    const totalValue = yyyList.reduce((sum, item) => {
      // 必须先转换为number再计算
      const value = Number(item.value ?? 0);
      return sum + value;
    }, 0);

    return {
      ...xxx,
      totalValue,
      items: yyyList,
    };
  }

  /**
   * 缓存读取
   */
  async getCachedData(key: string) {
    const cacheKey = `xxx:${key}`;

    // 先尝试从缓存读取
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 缓存未命中，从数据库查询
    const data = await this.xxxRepository.findByKey(key);

    // 写入缓存
    await this.redisService.set(cacheKey, JSON.stringify(data), 3600);

    return data;
  }

  /**
   * 调用外部API
   * R13: 外部API失败返回缓存数据或空数组，不抛出500
   */
  async fetchExternalData(code: string) {
    try {
      const data = await this.mairuiService.getStockInfo(code);
      return data;
    } catch (error) {
      // 返回缓存数据作为降级
      const cached = await this.redisService.get(`external:stock:${code}`);
      return cached ? JSON.parse(cached) : [];
    }
  }

  /**
   * VIP数据获取
   */
  async getVipData(userId: number) {
    // VIP可以获取完整数据
    const data = await this.xxxRepository.findFullData(userId);
    return data;
  }

  /**
   * 管理员操作
   * R23: 记录审计日志
   */
  async adminAction(adminId: number, adminDto: AdminXxxDto) {
    const result = await this.xxxRepository.adminOperation(adminDto);

    // 记录审计日志
    await this.logAudit(adminId, 'admin_action', 'xxx', result.id, adminDto.ip);

    return result;
  }

  /**
   * 清除缓存
   */
  private async clearCache(userId: number) {
    const pattern = `xxx:user:${userId}:*`;
    await this.redisService.delPattern(pattern);
  }

  /**
   * 输入验证
   */
  private validateInput(dto: CreateXxxDto): boolean {
    return true;
  }

  /**
   * 记录审计日志
   */
  private async logAudit(
    adminId: number,
A action: string,
    targetType: string,
    targetId: number,
    ip?: string,
  ) {
    await this.xxxRepository.createAuditLog({
      adminId,
      action,
      targetType,
      targetId,
      ip,
      timestamp: new Date(),
    });
  }
}
