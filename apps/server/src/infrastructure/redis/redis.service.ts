/**
 * RedisService - Redis 缓存服务
 * 提供缓存读写、键值操作
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private connected = false;

  constructor(redisUrl: string) {
    super(redisUrl, {
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    this.on('connect', () => {
      this.connected = true;
      this.logger.log('✅ Redis 连接成功');
    });

    this.on('ready', () => {
      this.connected = true;
    });

    this.on('close', () => {
      this.connected = false;
    });

    this.on('error', (error) => {
      this.connected = false;
      this.logger.warn(`Redis 连接失败，继续降级运行: ${error.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.connect();
    } catch (error) {
      this.connected = false;
      this.logger.warn(`⚠️ Redis 不可用，将降级为数据库查询: ${error instanceof Error ? error.message : error}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.status !== 'end') {
        await this.quit();
      }
    } catch {
      this.disconnect();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 安全获取缓存值，失败时返回 null
   */
  async safeGet(key: string): Promise<string | null> {
    try {
      if (!this.connected) {
        return null;
      }
      return await this.get(key);
    } catch (error) {
      this.logger.warn(`Redis GET 失败: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  /**
   * 安全设置缓存值，失败时不抛出异常
   */
  async safeSet(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.connected) {
        return false;
      }
      if (ttl) {
        await this.setex(key, ttl, value);
      } else {
        await this.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.warn(`Redis SET 失败: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }

  /**
   * 安全删除缓存
   */
  async safeDel(key: string): Promise<boolean> {
    try {
      if (!this.connected) {
        return false;
      }
      await this.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Redis DEL 失败: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }

  /**
   * 安全获取多个缓存值
   */
  async safeMGet(keys: string[]): Promise<(string | null)[]> {
    try {
      if (!this.connected) {
        return keys.map(() => null);
      }
      return await this.mget(keys);
    } catch (error) {
      this.logger.warn(`Redis MGET 失败: ${error instanceof Error ? error.message : error}`);
      return keys.map(() => null);
    }
  }
}
