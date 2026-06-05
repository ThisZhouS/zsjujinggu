/**
 * MairuiService - 迈瑞 API 数据服务
 * 封装股票列表、行情、股东数据 API
 * R13: 外部 API 失败返回缓存或空数组
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { RedisService } from '@/infrastructure/redis/redis.service';

@Injectable()
export class MairuiService {
  private readonly logger = new Logger(MairuiService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.apiKey = this.configService.get<string>('MAIRUI_API_KEY', '');

    this.client = axios.create({
      baseURL: 'https://api.mairui.club/hslt',
      timeout: 3000,
    });
  }

  private buildPath(path: string): string {
    const [pathname, queryString] = path.split('?', 2);
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const url = `${normalizedPath}/${this.apiKey}`;

    return queryString ? `${url}?${queryString}` : url;
  }

  private pickText(source: Record<string, any>, ...keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) {
        continue;
      }

      const text = String(value).trim();
      if (text) {
        return text;
      }
    }

    return undefined;
  }

  private normalizeMarket(value?: string, code?: string): 'A' | 'HK' | 'US' {
    if (value?.includes('HK') || value?.includes('港')) {
      return 'HK';
    }

    if (value?.includes('US') || value?.includes('美')) {
      return 'US';
    }

    if (code?.endsWith('.HK')) {
      return 'HK';
    }

    if (code?.endsWith('.US')) {
      return 'US';
    }

    return 'A';
  }

  private normalizeStockListItem(item: Record<string, any>): Record<string, any> | null {
    const code = this.pickText(item, 'code', 'dm', 'Dm', 'stock_code');
    if (!code) {
      return null;
    }

    const name = this.pickText(item, 'name', 'mc', 'Mc', 'stock_name') ?? code;
    const exchange = this.pickText(item, 'market', 'jys', 'Jys');
    const industry = this.pickText(item, 'industry', 'hy', 'Hy');
    const listingDate = this.pickText(item, 'listingDate', 'ssrq', 'Ssrq');

    return {
      ...item,
      code,
      name,
      dm: item.dm ?? item.Dm ?? code,
      mc: item.mc ?? item.Mc ?? name,
      jys: item.jys ?? item.Jys ?? exchange,
      market: this.normalizeMarket(exchange, code),
      industry: industry ?? null,
      listingDate: listingDate ?? null,
    };
  }

  /**
   * 获取股票列表
   */
  async getStockList(): Promise<any[]> {
    const cacheKey = 'mairui:stock_list';

    try {
      const response = await this.client.get(this.buildPath('/list'));
      const data = Array.isArray(response.data)
        ? response.data
            .map((item) =>
              this.normalizeStockListItem(item as Record<string, any>),
            )
            .filter((item): item is Record<string, any> => item !== null)
        : [];

      // 写入缓存
      await this.redisService.safeSet(cacheKey, JSON.stringify(data), 86400);

      return data;
    } catch (error) {
      this.logger.error('获取股票列表失败', error);

      // 降级：返回缓存
      const cached = await this.redisService.safeGet(cacheKey);
      if (cached) {
        this.logger.warn('使用缓存数据');
        return JSON.parse(cached);
      }

      return [];
    }
  }

  /**
   * 获取实时行情
   */
  async getRealtimeQuotes(codes: string[]): Promise<any[]> {
    const uniqueCodes = [...new Set(codes.map((code) => String(code || '').trim()).filter(Boolean))];
    const results: any[] = [];
    const failedCodes: string[] = [];
    const concurrency = Number(this.configService.get<string>('MAIRUI_REALTIME_CONCURRENCY', '8'));
    const batchSize = Number.isFinite(concurrency) && concurrency > 0 ? Math.min(concurrency, 20) : 8;

    for (let index = 0; index < uniqueCodes.length; index += batchSize) {
      const batch = uniqueCodes.slice(index, index + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (code) => {
          try {
            const response = await this.client.get(
              `https://api.mairui.club/hsstock/latest/${code}/d/n/${this.apiKey}?lt=1`,
              { timeout: 10000 },
            );
            const rows = Array.isArray(response.data) ? response.data : [];
            const latest = rows[rows.length - 1];
            if (!latest) {
              failedCodes.push(code);
              return null;
            }

            return {
              code,
              currentPrice: latest.c,
              totalMarketCap: latest.zsz ?? latest.tv ?? null,
              tradeTime: latest.t,
            };
          } catch {
            failedCodes.push(code);
            return null;
          }
        }),
      );

      results.push(...batchResults.filter((item): item is NonNullable<typeof item> => Boolean(item)));
    }

    if (failedCodes.length > 0) {
      this.logger.warn(
        `实时行情获取部分失败：failed=${failedCodes.length}/${uniqueCodes.length}, sample=${failedCodes.slice(0, 20).join(',')}`,
      );
    }

    return results;
  }

  /**
   * 获取十大股东数据
   */
  async getShareholders(code: string): Promise<any[]> {
    const cacheKey = `mairui:shareholders:${code}`;

    try {
      const response = await this.client.get(
        this.buildPath(`/shareholders/${code}`),
      );
      const data = response.data ?? [];

      await this.redisService.safeSet(cacheKey, JSON.stringify(data), 86400);

      return data;
    } catch (error) {
      this.logger.error(`获取 ${code} 十大股东失败`, error);

      const cached = await this.redisService.safeGet(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  }

  /**
   * 获取涨停板数据
   */
  async getLimitUp(): Promise<any[]> {
    const cacheKey = 'mairui:limit_up';

    try {
      const response = await this.client.get(this.buildPath('/limitup'));
      const data = response.data ?? [];

      await this.redisService.safeSet(cacheKey, JSON.stringify(data), 600);

      return data;
    } catch (error) {
      this.logger.error('获取涨停板数据失败', error);

      const cached = await this.redisService.safeGet(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  }

  /**
   * 获取 K 线数据
   */
  async getKline(code: string, period: string = 'daily'): Promise<any[]> {
    const cacheKey = `mairui:kline:${code}:${period}`;

    try {
      const response = await this.client.get(
        this.buildPath(`/kline/${code}/${period}`),
      );
      const data = response.data ?? [];

      await this.redisService.safeSet(cacheKey, JSON.stringify(data), 86400);

      return data;
    } catch (error) {
      this.logger.error(`获取 ${code} K线数据失败`, error);

      const cached = await this.redisService.safeGet(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  }

  /**
   * 获取分红数据
   */
  async getDividends(code: string): Promise<any[]> {
    const cacheKey = `mairui:dividends:${code}`;

    try {
      const response = await this.client.get(
        this.buildPath(`/dividends/${code}`),
      );
      const data = response.data ?? [];

      await this.redisService.safeSet(cacheKey, JSON.stringify(data), 86400);

      return data;
    } catch (error) {
      this.logger.error(`获取 ${code} 分红数据失败`, error);

      const cached = await this.redisService.safeGet(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  }

  /**
   * 获取高管交易数据
   */
  async getExecutiveTrades(code: string): Promise<any[]> {
    const cacheKey = `mairui:executive_trades:${code}`;

    try {
      const response = await this.client.get(
        this.buildPath(`/executive/${code}`),
      );
      const data = response.data ?? [];

      await this.redisService.safeSet(cacheKey, JSON.stringify(data), 86400);

      return data;
    } catch (error) {
      this.logger.error(`获取 ${code} 高管交易失败`, error);

      const cached = await this.redisService.safeGet(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  }

  /**
   * 获取高管交易数据（严格模式）
   *
   * 夜间业务同步需要区分“接口真实返回空”和“接口失败被降级为空”。
   * 因此严格模式不读取缓存、不吞异常，避免业务同步误判为成功。
   */
  async getExecutiveTradesStrict(code: string): Promise<any[]> {
    const cacheKey = `mairui:executive_trades:${code}`;
    const response = await this.client.get(
      this.buildPath(`/executive/${code}`),
    );
    const data = Array.isArray(response.data) ? response.data : [];

    await this.redisService.safeSet(cacheKey, JSON.stringify(data), 86400);
    return data;
  }
}
