import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): object {
    return {
      message: '掘金股 API',
      version: '1.0.0',
      docs: '/api/docs',
    };
  }

  @Get('health')
  healthCheck(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
