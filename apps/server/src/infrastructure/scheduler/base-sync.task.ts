/**
 * BaseSyncTask - 同步任务基类
 * 提供日志记录、状态更新、异常处理
 */

import { Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

export interface SyncTaskResult {
  success: boolean;
  recordCount?: number;
  message?: string;
}

export abstract class BaseSyncTask {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly runningTasks = new Set<string>();

  constructor(protected prisma: PrismaService) {}

  /**
   * 创建同步日志
   */
  protected async createLog(taskName: string, startTime: Date) {
    return this.prisma.syncLog.create({
      data: {
        taskName,
        status: 'RUNNING',
        startTime,
      },
    });
  }

  /**
   * 更新同步日志为成功
   */
  protected async updateLogSuccess(logId: number, endTime: Date, recordCount?: number) {
    await this.prisma.syncLog.update({
      where: { id: logId },
      data: {
        status: 'SUCCESS',
        endTime,
        recordCount: recordCount ?? null,
      },
    });
  }

  /**
   * 更新同步日志为失败
   */
  protected async updateLogFailure(logId: number, endTime: Date, message: string) {
    await this.prisma.syncLog.update({
      where: { id: logId },
      data: {
        status: 'FAILED',
        endTime,
        message,
      },
    });
  }

  /**
   * 执行同步任务（模板方法）
   */
  async execute(taskName: string, syncFn: () => Promise<number>): Promise<SyncTaskResult> {
    if (this.runningTasks.has(taskName)) {
      const message = `同步任务正在执行，跳过重复触发：${taskName}`;
      this.logger.warn(message);
      return {
        success: false,
        message,
      };
    }

    this.runningTasks.add(taskName);
    const startTime = new Date();
    let logId: number | null = null;

    try {
      const log = await this.createLog(taskName, startTime);
      logId = Number(log.id);
      this.logger.log(`开始执行同步任务：${taskName}`);

      const recordCount = await syncFn();

      await this.updateLogSuccess(logId, new Date(), recordCount);
      this.logger.log(`同步任务完成：${taskName}, 记录数=${recordCount}`);

      return {
        success: true,
        recordCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`同步任务失败：${taskName}`, error);

      if (logId) {
        await this.updateLogFailure(logId, new Date(), errorMessage);
      }

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      this.runningTasks.delete(taskName);
    }
  }
}
