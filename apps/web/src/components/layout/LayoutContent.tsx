'use client';

import { ConfigProvider } from 'antd';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppFooter } from '@/components/layout/AppFooter';

const RISK_NOTICE =
  '注意：信息和数据来源于当前上市公司公告、券商机构研报、行业公开调研及订单披露信息。以上内容仅作行业信息参考，不构成任何投资建议。市场有风险，投资需谨慎。';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-1 flex">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 overflow-hidden">
            <div className="page-shell">
              <div className="global-risk-notice" role="note">
                {RISK_NOTICE}
              </div>
              {children}
            </div>
          </main>
        </div>
        <AppFooter />
      </div>
    </ConfigProvider>
  );
}
