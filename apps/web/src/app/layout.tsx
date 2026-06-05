import type { Metadata } from 'next';
import { LayoutContent } from '@/components/layout/LayoutContent';
import './globals.css';

// ==================== 前端环境自检 ====================
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn('⚠️ 前端缺少环境变量:');
    missing.forEach((envVar) => {
      console.warn(`   - ${envVar}`);
    });
    console.warn('   请在 .env.local 文件中配置');
  } else {
    console.log('✅ 前端环境变量检查通过');
    console.log(`   API URL: ${process.env.NEXT_PUBLIC_API_URL}`);
  }

  // 开发规则提醒
  console.log('📋 前端开发规则提醒:');
  console.log('   R15: 所有字段名使用camelCase');
  console.log('   R16: SWR hooks必须配置onError回调');
  console.log('   R17: 前端env变量必须以NEXT_PUBLIC_开头');
}

export const metadata: Metadata = {
  title: '掘金股',
  description: '牛散持仓跟踪、涨幅榜分析、财经资讯',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
