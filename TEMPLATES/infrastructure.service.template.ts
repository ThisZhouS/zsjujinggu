/**
 * Infrastructure Service 样板
 * 职责：外部API封装、缓存服务、日志服务、消息队列
 * 禁止：调用Service
 */

import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { RedisService } from '../redis/redis.service';

/**
 * 外部API服务样例（如mairuiapi）
 */
@Injectable()
export class MairuiService {
  private readonly baseUrl = process.env.MAIRUI_API_URL;
  private readonly apiKey = process.env.MAIRUI_API_KEY;
  private readonly timeout = 3000; // 3秒超时

  constructor(private readonly redisService: RedisService) {}

  /**
   * 获取股票信息
   * R13: 失败返回缓存数据或空数组
   */
  async getStockInfo(code: string) {
    const cacheKey = `mairui:stock:${code}`;

    try {
      const response = await axios.get(`${this.baseUrl}/stock/${code}`, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: this.timeout,
      });

      // 数据清洗
      const data = this.sanitizeData(response.data);

      // 更新缓存
      await this.redisService.set(cacheKey, JSON.stringify(data), 3600);

      return data;
    } catch (error) {
      // 返回缓存作为降级
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      throw new ExternalApiError('Failed to fetch stock info', []);
    }
  }

  /**
   * 批量获取数据
   */
  async getBatchStockInfo(codes: string[]) {
    const cacheKey = `mairui:stocks:${codes.join(',')}`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/stocks/batch`,
        { codes },
        {
          headers: { 'X-API-Key': this.apiKey },
          timeout: this.timeout,
        },
      );

      const data = this.sanitizeData(response.data);

      await this.redisService.set(cacheKey, JSON.stringify(data), 3600);

      return data;
    } catch (error) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      throw new ExternalApiError('Failed to fetch batch stocks', []);
    }
  }

  /**
   * 数据清洗
   */
  private sanitizeData(data: any): any {
    // 移除空值、转换类型等
    if (!data) return [];

    if (Array.isArray(data)) {
      return data.filter(Boolean).map((item) => this.sanitizeItem(item));
));
    }

    return this.sanitizeItem(data);
  }

  private sanitizeItem(item: any): any {
    return {
      ...item,
      // R1: Decimal/BigInt转换
      value: Number(item.value || 0),
      price: Number(item.price || 0),
    };
  }
}

/**
 * AI服务样例（如DeepSeek）
 */
@Injectable()
export class DeepSeekService {
  private readonly apiKey = process.env.DEEPSEEK_API_KEY;
  private readonly baseUrl = 'https://api.deepseek.com/v1';

  /**
   * 生成业务描述
   * 带重试逻辑
   */
  async generateDescription(prompt: string): Promise<string> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
          },
          {
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
            timeout: 10000,
          },
        );

        return response.data.choices[0].message.content;
      } catch (error) {
        retryCount++;

        if (retryCount >= maxRetries) {
          // 失败返回空字符串
          return '';
        }

        // 指数退避
        await this.sleep(Math.pow(2, retryCount) * 1000);
      }
    }

    return '';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Redis服务
 */
@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: any) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * 批量获取
   * R3: redis.mget()返回数组，使用索引访问
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    return this.client.mget(...keys);
  }

  /**
   * 批量设置
   */
  async mset(items: Record<string, string>): Promise<void> {
    await this.client.mset(items);
  }

  /**
   * 删除匹配模式的所有键
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * 哈希操作
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  /**
   * 有序集合操作
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrevrange(key, start, stop);
  }
}

/**
 * 日志服务
 */
@Injectable()
export class LogService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: any) {}

  async log(level: string, message: string, meta?: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    const key = `logs:${new Date().toISOString().split('T')[0]}`;
    await this.client.lpush(key, JSON.stringify(logEntry));
  }

  async getLogs(date: string, limit: number = 100): Promise<any[]> {
    const key = `logs:${date}`;
    const logs = await this.client.lrange(key, 0, limit - 1);
    return logs.map((log: string) => JSON.parse(log));
  }
}
