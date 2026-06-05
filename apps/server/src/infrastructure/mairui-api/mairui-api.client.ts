/**
 * MairuiApiClient - 迈瑞 API 基础客户端
 *
 * 统一 HTTP 请求、错误处理、日志记录
 * 所有数据 fetch 客户端的基类
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ExternalApiError } from '@/common/filters/external-api.error';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T[];
  error?: string;
}

@Injectable()
export class MairuiApiClient {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly client: AxiosInstance;
  protected readonly apiKey: string;

  protected readonly BASE_URL = 'https://api.mairui.club';

  constructor(protected configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MAIRUI_API_KEY', '');

    if (!this.apiKey) {
      this.logger.warn('MAIRUI_API_KEY 未配置，部分接口可能无法使用');
    }

    this.client = axios.create({
      baseURL: this.BASE_URL,
      timeout: 30000, // 30 秒超时
    });
  }

  /**
   * 发送 GET 请求
   * @param url 完整 URL 路径（包含 licence）
   * @returns API 返回的数据数组
   */
  protected async getRequest<T = any>(url: string): Promise<T[]> {
    try {
      this.logger.debug(`发送 API 请求：${url}`);

      const response = await this.client.get<T | T[]>(url, {
        timeout: 30000,
      });

      // 处理响应数据格式
      let data: T[];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // 如果是对象，转为数组
        data = [response.data];
      } else {
        data = [];
      }

      this.logger.debug(`成功获取 ${data.length} 条数据`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status || 500;
      const errorMessage = axiosError.response?.statusText || axiosError.message;

      this.logger.error(
        `API 请求失败：HTTP ${statusCode} - ${errorMessage}`,
        axiosError.stack,
      );

      throw new ExternalApiError(
        `API 请求失败：${statusCode} - ${errorMessage}`,
        this.constructor.name,
        url,
      );
    }
  }

  /**
   * 构建将密钥直接拼接到路径中的 URL
   * @param path API 路径
   * @returns 完整 URL
   */
  protected buildUrl(path: string): string {
    const [pathname, queryString] = path.split('?', 2);
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const url = `${this.BASE_URL}${normalizedPath}/${this.apiKey}`;

    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * 字段转换工具：处理大小写不一致的字段
   * @param source 源数据对象
   * @param fieldNames 可能的字段名列表（按优先级）
   * @returns 字段值
   */
  protected getField<T = any>(source: Record<string, any>, ...fieldNames: string[]): T | undefined {
    for (const fieldName of fieldNames) {
      if (source[fieldName] !== undefined) {
        return source[fieldName] as T;
      }
    }
    return undefined;
  }

  /**
   * 解析日期字符串为 Date 对象
   * @param dateStr 日期字符串（YYYYMMDD 或 YYYY-MM-DD）
   * @returns Date 对象
   */
  protected parseDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;

    // 处理 YYYYMMDD 格式
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }

    // 处理 YYYY-MM-DD 格式
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr);
    }

    // 处理时间戳
    if (/^\d+$/.test(dateStr)) {
      return new Date(parseInt(dateStr, 10));
    }

    return null;
  }

  /**
   * 解析带时间的日期字符串
   * @param dateTimeStr 日期时间字符串
   * @returns Date 对象
   */
  protected parseDateTime(dateTimeStr?: string | null): Date | null {
    if (!dateTimeStr) return null;

    // 尝试直接解析
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  }

  /**
   * 安全转换值为 number（处理 Prisma Decimal、string、number）
   * @param value 要转换的值
   * @returns number 或 null
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

    // Prisma Decimal 对象
    if (typeof value === 'object' && value.toNumber) {
      return value.toNumber();
    }

    return Number(value);
  }
}
