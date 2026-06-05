/**
 * DataSyncServiceBase - 数据同步服务基类
 *
 * 定义所有数据同步模块的统一接口
 * 遵循 R1-R4 数据类型安全规范
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface SyncResult {
  success: boolean;
  recordCount: number;
  duration: number; // 执行时长 (ms)
  error?: string;
}

export interface SyncProgress {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  recordCount?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * 数据同步基类 - 定义通用接口和抽象方法
 */
@Injectable()
export abstract class DataSyncServiceBase {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取模块名称
   */
  abstract getModuleName(): string;

  /**
   * 获取单个实体的数据（对应 fetch_XXX 方法）
   * 不调用 API，仅格式转换
   * @param code 代码（股票代码/指数代码/基金代码）
   * @param params 同步参数
   * @returns 原始数据数组
   */
  abstract fetchData(code: string, params?: any): Promise<Record<string, any>[]>;

  /**
   * 获取并存储单个实体的数据（对应 fetch_and_save_XXX 方法）
   * @param code 代码
   * @param params 同步参数
   * @returns 成功存储的记录数
   */
  abstract fetchAndSave(code: string, params?: any): Promise<number>;

  /**
   * 批量获取并存储所有实体的数据（对应 fetch_and_save_XXX_for_all 方法）
   * 遍历股票列表批量同步
   * @param params 同步参数
   * @returns 成功存储的总记录数
   */
  abstract fetchAndSaveForAll(params?: any): Promise<number>;

  /**
   * 执行同步任务（带计时和错误处理）
   * @param code 代码（可选，为空则执行全量同步）
   * @param params 同步参数
   * @returns 同步结果
   */
  async executeSync(code?: string, params?: any): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      let recordCount: number;

      if (code) {
        this.logger.log(`开始同步 ${this.getModuleName()} - ${code}`);
        recordCount = await this.fetchAndSave(code, params);
      } else {
        this.logger.log(`开始全量同步 ${this.getModuleName()}`);
        recordCount = await this.fetchAndSaveForAll(params);
      }

      const duration = Date.now() - startTime;

      this.logger.log(
        `${this.getModuleName()} 同步完成 - ${recordCount}条记录，耗时 ${duration}ms`,
      );

      return {
        success: true,
        recordCount,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`${this.getModuleName()} 同步失败：${errorMessage}`);

      return {
        success: false,
        recordCount: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * 安全转换 Decimal 为 number（R1 规范）
   */
  protected toNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }

    // Prisma Decimal
    if (typeof value === 'object' && value.toNumber) {
      return value.toNumber();
    }

    return Number(value);
  }

  /**
   * 安全转换 BigInt 为 number（R1 规范）
   */
  protected toSafeNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }

    return Number(value);
  }

  /**
   * 处理 nullable 字段（R2 规范）
   */
  protected withDefault<T>(value: T | null | undefined, defaultValue: T): T {
    return value ?? defaultValue;
  }
}
