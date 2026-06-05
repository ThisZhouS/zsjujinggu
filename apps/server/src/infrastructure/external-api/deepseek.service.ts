/**
 * DeepseekService - DeepSeek AI 服务
 * 封装主营业务生成 API
 * R13: 外部 API 失败返回空字符串
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class DeepseekService {
  private readonly logger = new Logger(DeepseekService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY', '');

    this.client = axios.create({
      baseURL: 'https://api.deepseek.com/v1',
      timeout: 5000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 生成主营业务描述
   * @param stockName 股票名称
   * @param industry 所属行业
   */
  async generateBusinessDescription(stockName: string, industry?: string): Promise<string> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的金融分析师，擅长用简洁准确的语言描述公司的主营业务。请用中文回答，不超过 100 字。',
          },
          {
            role: 'user',
            content: `请描述${stockName}${industry ? `（${industry}）` : ''}的主营业务。`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.data.choices?.[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error('调用 DeepSeek API 失败', error);
      // R13: 降级返回空字符串
      return '';
    }
  }

  /**
   * 批量生成主营业务描述
   */
  async batchGenerateDescriptions(
    stocks: Array<{ name: string; industry?: string }>,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // 限流：最多并发 5 个请求
    const batchSize = 5;
    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize);
      const promises = batch.map(async (stock) => {
        const description = await this.generateBusinessDescription(stock.name, stock.industry);
        results.set(stock.name, description);
      });

      await Promise.all(promises);

      // 避免触发 API 限流
      if (i + batchSize < stocks.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}
